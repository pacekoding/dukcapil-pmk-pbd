package storage

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	storageSegmentPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	storageYearPattern    = regexp.MustCompile(`^\d{4}$`)
	storageExtension      = regexp.MustCompile(`^[a-z0-9]+$`)
)

type Local struct {
	root string
}

func NewLocal(root string) (*Local, error) {
	trimmed := strings.TrimSpace(root)
	if trimmed == "" {
		return nil, fmt.Errorf("STORAGE_ROOT wajib diisi")
	}

	absoluteRoot, err := filepath.Abs(trimmed)
	if err != nil {
		return nil, fmt.Errorf("normalisasi STORAGE_ROOT gagal: %w", err)
	}
	if err := os.MkdirAll(absoluteRoot, 0o750); err != nil {
		return nil, fmt.Errorf("membuat STORAGE_ROOT %q gagal: %w", absoluteRoot, err)
	}
	info, err := os.Stat(absoluteRoot)
	if err != nil {
		return nil, fmt.Errorf("membaca STORAGE_ROOT %q gagal: %w", absoluteRoot, err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("STORAGE_ROOT %q bukan direktori", absoluteRoot)
	}
	if err := verifyReadableWritable(absoluteRoot); err != nil {
		return nil, fmt.Errorf("STORAGE_ROOT %q tidak dapat digunakan: %w", absoluteRoot, err)
	}

	return &Local{root: absoluteRoot}, nil
}

func (l *Local) Save(ctx context.Context, request SaveRequest) (Object, error) {
	if err := ctx.Err(); err != nil {
		return Object{}, err
	}
	if request.Reader == nil {
		return Object{}, ErrEmpty
	}
	if request.MaxBytes <= 0 {
		return Object{}, fmt.Errorf("maximum object size must be positive")
	}

	visibility, err := normalizeSegment(request.Visibility)
	if err != nil || (visibility != "public" && visibility != "private") {
		return Object{}, ErrInvalidKey
	}
	module, err := normalizeSegment(request.Module)
	if err != nil {
		return Object{}, ErrInvalidKey
	}
	category, err := normalizeSegment(request.Category)
	if err != nil {
		return Object{}, ErrInvalidKey
	}
	year := strings.TrimSpace(request.Year)
	if !storageYearPattern.MatchString(year) {
		return Object{}, ErrInvalidKey
	}
	extension := strings.TrimPrefix(strings.ToLower(strings.TrimSpace(request.Extension)), ".")
	if !storageExtension.MatchString(extension) {
		return Object{}, ErrInvalidKey
	}

	directoryKey := filepath.ToSlash(filepath.Join(visibility, module, category, year))
	directoryPath, err := l.resolve(directoryKey)
	if err != nil {
		return Object{}, err
	}
	if err := os.MkdirAll(directoryPath, 0o750); err != nil {
		return Object{}, fmt.Errorf("create object directory: %w", err)
	}

	fileID, err := randomUUID()
	if err != nil {
		return Object{}, fmt.Errorf("generate object UUID: %w", err)
	}
	storedFilename := fileID + "." + extension
	key := directoryKey + "/" + storedFilename
	targetPath, err := l.resolve(key)
	if err != nil {
		return Object{}, err
	}

	return writeAtomic(ctx, request.Reader, request.MaxBytes, key, storedFilename, directoryPath, targetPath)
}

func (l *Local) Open(ctx context.Context, key string) (ReadSeekCloser, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	path, err := l.resolve(key)
	if err != nil {
		return nil, err
	}
	file, err := os.Open(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("open stored object: %w", err)
	}
	return file, nil
}

func (l *Local) Delete(ctx context.Context, key string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	path, err := l.resolve(key)
	if err != nil {
		return err
	}
	err = os.Remove(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("delete stored object: %w", err)
	}
	return nil
}

func (l *Local) Exists(ctx context.Context, key string) (bool, error) {
	_, err := l.GetMetadata(ctx, key)
	if errors.Is(err, ErrNotFound) {
		return false, nil
	}
	return err == nil, err
}

func (l *Local) GetMetadata(ctx context.Context, key string) (Metadata, error) {
	if err := ctx.Err(); err != nil {
		return Metadata{}, err
	}
	path, err := l.resolve(key)
	if err != nil {
		return Metadata{}, err
	}
	info, err := os.Stat(path)
	if errors.Is(err, os.ErrNotExist) {
		return Metadata{}, ErrNotFound
	}
	if err != nil {
		return Metadata{}, fmt.Errorf("stat stored object: %w", err)
	}
	if info.IsDir() {
		return Metadata{}, ErrNotFound
	}
	return Metadata{
		Key:      filepath.ToSlash(filepath.Clean(key)),
		Size:     info.Size(),
		Modified: info.ModTime(),
	}, nil
}

func (l *Local) resolve(key string) (string, error) {
	if l == nil || strings.TrimSpace(l.root) == "" {
		return "", fmt.Errorf("storage service is not initialized")
	}
	trimmed := strings.TrimSpace(key)
	if trimmed == "" || filepath.IsAbs(trimmed) || strings.ContainsRune(trimmed, '\x00') {
		return "", ErrInvalidKey
	}
	cleanKey := filepath.Clean(filepath.FromSlash(trimmed))
	if cleanKey == "." || cleanKey == ".." || strings.HasPrefix(cleanKey, ".."+string(os.PathSeparator)) {
		return "", ErrInvalidKey
	}
	target := filepath.Join(l.root, cleanKey)
	relative, err := filepath.Rel(l.root, target)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(os.PathSeparator)) {
		return "", ErrInvalidKey
	}
	return target, nil
}

func writeAtomic(
	ctx context.Context,
	reader io.Reader,
	maxBytes int64,
	key string,
	storedFilename string,
	directoryPath string,
	targetPath string,
) (object Object, returnedErr error) {
	temp, err := os.CreateTemp(directoryPath, ".upload-*.tmp")
	if err != nil {
		return Object{}, fmt.Errorf("create temporary object: %w", err)
	}
	tempPath := temp.Name()
	defer func() {
		_ = temp.Close()
		_ = os.Remove(tempPath)
	}()

	hasher := sha256.New()
	limited := &io.LimitedReader{R: reader, N: maxBytes + 1}
	written, err := copyWithContext(ctx, io.MultiWriter(temp, hasher), limited)
	if err != nil {
		return Object{}, fmt.Errorf("write temporary object: %w", err)
	}
	if written == 0 {
		return Object{}, ErrEmpty
	}
	if written > maxBytes {
		return Object{}, ErrTooLarge
	}
	if err := temp.Sync(); err != nil {
		return Object{}, fmt.Errorf("sync temporary object: %w", err)
	}
	if err := temp.Chmod(0o640); err != nil {
		return Object{}, fmt.Errorf("set object permissions: %w", err)
	}
	if err := temp.Close(); err != nil {
		return Object{}, fmt.Errorf("close temporary object: %w", err)
	}

	if err := os.Link(tempPath, targetPath); err != nil {
		if errors.Is(err, os.ErrExist) {
			return Object{}, ErrCollision
		}
		return Object{}, fmt.Errorf("publish stored object atomically: %w", err)
	}
	defer func() {
		if returnedErr != nil {
			_ = os.Remove(targetPath)
		}
	}()
	directory, err := os.Open(directoryPath)
	if err != nil {
		return Object{}, fmt.Errorf("open object directory for sync: %w", err)
	}
	syncErr := directory.Sync()
	closeErr := directory.Close()
	if syncErr != nil {
		return Object{}, fmt.Errorf("sync object directory: %w", syncErr)
	}
	if closeErr != nil {
		return Object{}, fmt.Errorf("close object directory: %w", closeErr)
	}

	return Object{
		Key:            key,
		StoredFilename: storedFilename,
		Size:           written,
		ChecksumSHA256: hex.EncodeToString(hasher.Sum(nil)),
	}, nil
}

func copyWithContext(ctx context.Context, destination io.Writer, source io.Reader) (int64, error) {
	buffer := make([]byte, 32*1024)
	var total int64
	for {
		if err := ctx.Err(); err != nil {
			return total, err
		}
		read, readErr := source.Read(buffer)
		if read > 0 {
			written, writeErr := destination.Write(buffer[:read])
			total += int64(written)
			if writeErr != nil {
				return total, writeErr
			}
			if written != read {
				return total, io.ErrShortWrite
			}
		}
		if errors.Is(readErr, io.EOF) {
			return total, nil
		}
		if readErr != nil {
			return total, readErr
		}
	}
}

func normalizeSegment(value string) (string, error) {
	segment := strings.ToLower(strings.TrimSpace(value))
	if !storageSegmentPattern.MatchString(segment) {
		return "", ErrInvalidKey
	}
	return segment, nil
}

func randomUUID() (string, error) {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	value[6] = (value[6] & 0x0f) | 0x40
	value[8] = (value[8] & 0x3f) | 0x80
	return fmt.Sprintf(
		"%x-%x-%x-%x-%x",
		value[0:4],
		value[4:6],
		value[6:8],
		value[8:10],
		value[10:16],
	), nil
}

func verifyReadableWritable(root string) error {
	temp, err := os.CreateTemp(root, ".storage-check-*")
	if err != nil {
		return fmt.Errorf("uji tulis gagal: %w", err)
	}
	path := temp.Name()
	defer os.Remove(path)

	const probe = "storage-ready"
	if _, err := temp.WriteString(probe); err != nil {
		_ = temp.Close()
		return fmt.Errorf("uji tulis gagal: %w", err)
	}
	if err := temp.Sync(); err != nil {
		_ = temp.Close()
		return fmt.Errorf("uji sinkronisasi gagal: %w", err)
	}
	if err := temp.Close(); err != nil {
		return fmt.Errorf("uji tutup file gagal: %w", err)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("uji baca gagal: %w", err)
	}
	if string(content) != probe {
		return fmt.Errorf("hasil uji baca tidak sesuai")
	}
	return nil
}
