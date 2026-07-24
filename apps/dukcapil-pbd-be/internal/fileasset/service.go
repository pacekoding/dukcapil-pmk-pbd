package fileasset

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"path"
	"path/filepath"
	"strings"
	"unicode"
	"unicode/utf8"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/storage"
)

var (
	ErrMissing      = errors.New("file wajib diunggah")
	ErrEmpty        = errors.New("file tidak boleh kosong")
	ErrTooLarge     = errors.New("ukuran file melebihi batas")
	ErrUnsupported  = errors.New("format file tidak didukung")
	ErrMimeMismatch = errors.New("tipe isi file tidak sesuai dengan nama atau MIME")
)

type Kind string

const (
	KindImage Kind = "image"
	KindPDF   Kind = "pdf"
	KindAny   Kind = "any"
)

type SaveRequest struct {
	Header            *multipart.FileHeader
	Kind              Kind
	Visibility        model.FileVisibility
	StorageVisibility model.FileVisibility
	Module            string
	RelatedType       string
	Category          string
	StorageCategory   string
	Year              string
	UploadedBy        *int64
}

type Service struct {
	storage  storage.Service
	maxBytes int64
}

func New(service storage.Service, maxBytes int64) (*Service, error) {
	if service == nil {
		return nil, fmt.Errorf("storage service is required")
	}
	if maxBytes <= 0 {
		return nil, fmt.Errorf("maximum upload size must be positive")
	}
	return &Service{storage: service, maxBytes: maxBytes}, nil
}

func (s *Service) Save(ctx context.Context, request SaveRequest) (model.StoredFileInput, error) {
	if s == nil || s.storage == nil {
		return model.StoredFileInput{}, fmt.Errorf("file service is not initialized")
	}
	if request.Header == nil {
		return model.StoredFileInput{}, ErrMissing
	}
	if request.Header.Size == 0 {
		return model.StoredFileInput{}, ErrEmpty
	}
	if request.Header.Size > s.maxBytes {
		return model.StoredFileInput{}, ErrTooLarge
	}

	originalName := SanitizeFilename(request.Header.Filename)
	extension := strings.ToLower(filepath.Ext(originalName))
	detectedMime, err := inspectUpload(request.Header)
	if err != nil {
		return model.StoredFileInput{}, err
	}
	canonicalExtension, err := validateType(request.Kind, extension, detectedMime, request.Header.Header.Get("Content-Type"))
	if err != nil {
		return model.StoredFileInput{}, err
	}

	source, err := request.Header.Open()
	if err != nil {
		return model.StoredFileInput{}, fmt.Errorf("file upload tidak dapat dibuka: %w", err)
	}
	defer source.Close()

	storageVisibility := request.StorageVisibility
	if storageVisibility == "" {
		storageVisibility = request.Visibility
	}
	storageCategory := strings.TrimSpace(request.StorageCategory)
	if storageCategory == "" {
		storageCategory = request.Category
	}
	object, err := s.storage.Save(ctx, storage.SaveRequest{
		Visibility: string(storageVisibility),
		Module:     request.Module,
		Category:   storageCategory,
		Year:       request.Year,
		Extension:  canonicalExtension,
		Reader:     source,
		MaxBytes:   s.maxBytes,
	})
	if err != nil {
		switch {
		case errors.Is(err, storage.ErrEmpty):
			return model.StoredFileInput{}, ErrEmpty
		case errors.Is(err, storage.ErrTooLarge):
			return model.StoredFileInput{}, ErrTooLarge
		default:
			return model.StoredFileInput{}, fmt.Errorf("file gagal disimpan: %w", err)
		}
	}

	return model.StoredFileInput{
		Module:           request.Module,
		RelatedType:      request.RelatedType,
		Category:         request.Category,
		OriginalFilename: originalName,
		StoredFilename:   object.StoredFilename,
		StorageKey:       object.Key,
		MimeType:         detectedMime,
		FileSize:         object.Size,
		ChecksumSHA256:   object.ChecksumSHA256,
		Visibility:       request.Visibility,
		UploadedBy:       request.UploadedBy,
	}, nil
}

func (s *Service) Delete(ctx context.Context, key string) error {
	if s == nil || s.storage == nil || strings.TrimSpace(key) == "" {
		return nil
	}
	return s.storage.Delete(ctx, key)
}

func (s *Service) Storage() storage.Service {
	if s == nil {
		return nil
	}
	return s.storage
}

func (s *Service) MaxBytes() int64 {
	if s == nil {
		return 0
	}
	return s.maxBytes
}

func SanitizeFilename(value string) string {
	normalized := strings.ReplaceAll(value, `\`, "/")
	name := strings.TrimSpace(path.Base(normalized))
	var builder strings.Builder
	for _, character := range name {
		if unicode.IsControl(character) {
			continue
		}
		builder.WriteRune(character)
	}
	name = strings.TrimSpace(builder.String())
	if name == "" || name == "." {
		name = "file"
	}
	for len(name) > 240 {
		_, size := utf8.DecodeLastRuneInString(name)
		if size <= 0 {
			break
		}
		name = name[:len(name)-size]
	}
	return name
}

func inspectUpload(header *multipart.FileHeader) (string, error) {
	source, err := header.Open()
	if err != nil {
		return "", fmt.Errorf("file upload tidak dapat dibuka: %w", err)
	}
	defer source.Close()

	buffer := make([]byte, 512)
	read, err := io.ReadFull(source, buffer)
	if errors.Is(err, io.EOF) && read == 0 {
		return "", ErrEmpty
	}
	if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, io.ErrUnexpectedEOF) {
		return "", fmt.Errorf("isi file gagal dibaca: %w", err)
	}
	buffer = buffer[:read]

	switch {
	case isPDF(buffer):
		return "application/pdf", nil
	case isJPEG(buffer):
		return "image/jpeg", nil
	case isPNG(buffer):
		return "image/png", nil
	case isWebP(buffer):
		return "image/webp", nil
	default:
		return "", ErrUnsupported
	}
}

func validateType(kind Kind, extension string, detectedMime string, declaredMime string) (string, error) {
	allowed := map[string]struct {
		mime       string
		extensions map[string]bool
		canonical  string
	}{
		"application/pdf": {
			mime:       "application/pdf",
			extensions: map[string]bool{".pdf": true},
			canonical:  "pdf",
		},
		"image/jpeg": {
			mime:       "image/jpeg",
			extensions: map[string]bool{".jpg": true, ".jpeg": true},
			canonical:  strings.TrimPrefix(extension, "."),
		},
		"image/png": {
			mime:       "image/png",
			extensions: map[string]bool{".png": true},
			canonical:  "png",
		},
		"image/webp": {
			mime:       "image/webp",
			extensions: map[string]bool{".webp": true},
			canonical:  "webp",
		},
	}
	rule, ok := allowed[detectedMime]
	if !ok || !rule.extensions[extension] {
		return "", ErrMimeMismatch
	}
	switch kind {
	case KindImage:
		if !strings.HasPrefix(detectedMime, "image/") {
			return "", ErrUnsupported
		}
	case KindPDF:
		if detectedMime != "application/pdf" {
			return "", ErrUnsupported
		}
	case KindAny:
	default:
		return "", ErrUnsupported
	}

	declared := strings.ToLower(strings.TrimSpace(strings.Split(declaredMime, ";")[0]))
	if declared != "" && declared != "application/octet-stream" && declared != rule.mime {
		return "", ErrMimeMismatch
	}
	return rule.canonical, nil
}

func isPDF(value []byte) bool {
	return len(value) >= 5 && string(value[:5]) == "%PDF-"
}

func isJPEG(value []byte) bool {
	return len(value) >= 3 && value[0] == 0xff && value[1] == 0xd8 && value[2] == 0xff
}

func isPNG(value []byte) bool {
	signature := []byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}
	return len(value) >= len(signature) && string(value[:len(signature)]) == string(signature)
}

func isWebP(value []byte) bool {
	return len(value) >= 12 && string(value[:4]) == "RIFF" && string(value[8:12]) == "WEBP"
}
