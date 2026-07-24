package storage

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"strings"
	"testing"
)

func TestLocalSavePersistsChecksumAndDoesNotOverwrite(t *testing.T) {
	root := t.TempDir()
	local, err := NewLocal(root)
	if err != nil {
		t.Fatalf("NewLocal() error = %v", err)
	}
	content := []byte("%PDF-1.4\npersistent")

	first, err := local.Save(context.Background(), SaveRequest{
		Visibility: "private",
		Module:     "maceku-pkk",
		Category:   "lkpj",
		Year:       "2026",
		Extension:  "pdf",
		Reader:     bytes.NewReader(content),
		MaxBytes:   1024,
	})
	if err != nil {
		t.Fatalf("Save(first) error = %v", err)
	}
	second, err := local.Save(context.Background(), SaveRequest{
		Visibility: "private",
		Module:     "maceku-pkk",
		Category:   "lkpj",
		Year:       "2026",
		Extension:  "pdf",
		Reader:     bytes.NewReader(content),
		MaxBytes:   1024,
	})
	if err != nil {
		t.Fatalf("Save(second) error = %v", err)
	}
	if first.Key == second.Key {
		t.Fatalf("storage keys collided: %q", first.Key)
	}
	if !strings.HasPrefix(first.Key, "private/maceku-pkk/lkpj/2026/") {
		t.Fatalf("storage key = %q", first.Key)
	}
	checksum := sha256.Sum256(content)
	if first.ChecksumSHA256 != hex.EncodeToString(checksum[:]) {
		t.Fatalf("checksum = %q", first.ChecksumSHA256)
	}

	reopened, err := NewLocal(root)
	if err != nil {
		t.Fatalf("NewLocal(reopen) error = %v", err)
	}
	reader, err := reopened.Open(context.Background(), first.Key)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	defer reader.Close()
	got, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("ReadAll() error = %v", err)
	}
	if !bytes.Equal(got, content) {
		t.Fatalf("stored content = %q", got)
	}
}

func TestLocalRejectsTraversalAndAbsoluteKeys(t *testing.T) {
	local, err := NewLocal(t.TempDir())
	if err != nil {
		t.Fatalf("NewLocal() error = %v", err)
	}

	for _, key := range []string{"../secret.pdf", "private/../../secret.pdf", "/etc/passwd"} {
		if _, err := local.Open(context.Background(), key); !errors.Is(err, ErrInvalidKey) {
			t.Fatalf("Open(%q) error = %v, want ErrInvalidKey", key, err)
		}
		if err := local.Delete(context.Background(), key); !errors.Is(err, ErrInvalidKey) {
			t.Fatalf("Delete(%q) error = %v, want ErrInvalidKey", key, err)
		}
	}
}

func TestLocalRejectsEmptyAndOversizedObjects(t *testing.T) {
	local, err := NewLocal(t.TempDir())
	if err != nil {
		t.Fatalf("NewLocal() error = %v", err)
	}
	base := SaveRequest{
		Visibility: "private",
		Module:     "arsip",
		Category:   "dokumen",
		Year:       "2026",
		Extension:  "pdf",
		MaxBytes:   4,
	}

	base.Reader = bytes.NewReader(nil)
	if _, err := local.Save(context.Background(), base); !errors.Is(err, ErrEmpty) {
		t.Fatalf("Save(empty) error = %v, want ErrEmpty", err)
	}
	base.Reader = bytes.NewReader([]byte("12345"))
	if _, err := local.Save(context.Background(), base); !errors.Is(err, ErrTooLarge) {
		t.Fatalf("Save(large) error = %v, want ErrTooLarge", err)
	}
}

func TestLocalConfiguredIntegrationRoot(t *testing.T) {
	root := strings.TrimSpace(os.Getenv("STORAGE_INTEGRATION_ROOT"))
	if root == "" {
		t.Skip("STORAGE_INTEGRATION_ROOT is not configured")
	}

	local, err := NewLocal(root)
	if err != nil {
		t.Fatalf("NewLocal() error = %v", err)
	}
	content := []byte("%PDF-1.4\nstorage integration probe")
	object, err := local.Save(context.Background(), SaveRequest{
		Visibility: "private",
		Module:     "storage-probe",
		Category:   "documents",
		Year:       "2026",
		Extension:  "pdf",
		Reader:     bytes.NewReader(content),
		MaxBytes:   1024,
	})
	if err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	t.Cleanup(func() {
		if err := local.Delete(context.Background(), object.Key); err != nil {
			t.Errorf("Delete() error = %v", err)
		}
	})

	reader, err := local.Open(context.Background(), object.Key)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	got, readErr := io.ReadAll(reader)
	closeErr := reader.Close()
	if readErr != nil {
		t.Fatalf("ReadAll() error = %v", readErr)
	}
	if closeErr != nil {
		t.Fatalf("Close() error = %v", closeErr)
	}
	if !bytes.Equal(got, content) {
		t.Fatalf("stored content = %q", got)
	}
}
