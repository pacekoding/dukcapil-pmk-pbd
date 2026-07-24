package fileasset

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/storage"
)

func TestSaveAcceptsPDFJPEGPNGAndWebP(t *testing.T) {
	tests := []struct {
		name     string
		filename string
		mimeType string
		content  []byte
		kind     Kind
	}{
		{name: "pdf", filename: "Laporan 2026.pdf", mimeType: "application/pdf", content: []byte("%PDF-1.4\nfile"), kind: KindPDF},
		{name: "jpeg", filename: "Foto Kegiatan.jpeg", mimeType: "image/jpeg", content: []byte{0xff, 0xd8, 0xff, 0xe0, 0x01}, kind: KindImage},
		{name: "png", filename: "Gambar.png", mimeType: "image/png", content: append([]byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}, []byte("data")...), kind: KindImage},
		{name: "webp", filename: "Gambar.webp", mimeType: "image/webp", content: append([]byte("RIFF1234WEBP"), []byte("data")...), kind: KindImage},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := newTestService(t, 1024)
			file, err := service.Save(context.Background(), SaveRequest{
				Header:      multipartHeader(t, test.filename, test.mimeType, test.content),
				Kind:        test.kind,
				Visibility:  model.FileVisibilityPrivate,
				Module:      "test-module",
				RelatedType: "test_entity",
				Category:    "test-category",
				Year:        "2026",
			})
			if err != nil {
				t.Fatalf("Save() error = %v", err)
			}
			if file.FileSize != int64(len(test.content)) {
				t.Fatalf("FileSize = %d", file.FileSize)
			}
			if file.ChecksumSHA256 == "" {
				t.Fatalf("ChecksumSHA256 is empty")
			}
			if strings.Contains(file.StorageKey, test.filename) {
				t.Fatalf("storage key contains original filename: %q", file.StorageKey)
			}
		})
	}
}

func TestSaveRejectsInvalidEmptyOversizedAndFakeMime(t *testing.T) {
	png := append([]byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}, []byte("data")...)
	tests := []struct {
		name     string
		maxBytes int64
		filename string
		mimeType string
		content  []byte
		kind     Kind
		want     error
	}{
		{name: "empty", maxBytes: 32, filename: "empty.pdf", mimeType: "application/pdf", content: nil, kind: KindPDF, want: ErrEmpty},
		{name: "oversized", maxBytes: 4, filename: "large.pdf", mimeType: "application/pdf", content: []byte("%PDF-1.4"), kind: KindPDF, want: ErrTooLarge},
		{name: "unsupported", maxBytes: 32, filename: "script.svg", mimeType: "image/svg+xml", content: []byte("<svg></svg>"), kind: KindImage, want: ErrUnsupported},
		{name: "fake extension", maxBytes: 32, filename: "fake.pdf", mimeType: "application/pdf", content: png, kind: KindPDF, want: ErrMimeMismatch},
		{name: "fake declared mime", maxBytes: 32, filename: "photo.jpg", mimeType: "image/png", content: []byte{0xff, 0xd8, 0xff, 0xe0}, kind: KindImage, want: ErrMimeMismatch},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := newTestService(t, test.maxBytes)
			_, err := service.Save(context.Background(), SaveRequest{
				Header:      multipartHeader(t, test.filename, test.mimeType, test.content),
				Kind:        test.kind,
				Visibility:  model.FileVisibilityPrivate,
				Module:      "test-module",
				RelatedType: "test_entity",
				Category:    "test-category",
				Year:        "2026",
			})
			if !errors.Is(err, test.want) {
				t.Fatalf("Save() error = %v, want %v", err, test.want)
			}
		})
	}
}

func TestSaveGeneratesUniqueUUIDFilenames(t *testing.T) {
	service := newTestService(t, 1024)
	seen := map[string]bool{}
	for index := 0; index < 100; index++ {
		file, err := service.Save(context.Background(), SaveRequest{
			Header:      multipartHeader(t, fmt.Sprintf("laporan-%d.pdf", index), "application/pdf", []byte("%PDF-1.4\n")),
			Kind:        KindPDF,
			Visibility:  model.FileVisibilityPrivate,
			Module:      "test-module",
			RelatedType: "test_entity",
			Category:    "test-category",
			Year:        "2026",
		})
		if err != nil {
			t.Fatalf("Save(%d) error = %v", index, err)
		}
		if seen[file.StoredFilename] {
			t.Fatalf("duplicate filename %q", file.StoredFilename)
		}
		seen[file.StoredFilename] = true
	}
}

func TestSanitizeFilenamePreservesUnicodeAndRemovesPaths(t *testing.T) {
	got := SanitizeFilename(`../folder\Laporan Kegiatan Papua 2026.pdf`)
	if got != "Laporan Kegiatan Papua 2026.pdf" {
		t.Fatalf("SanitizeFilename() = %q", got)
	}
}

func newTestService(t *testing.T, maxBytes int64) *Service {
	t.Helper()
	local, err := storage.NewLocal(t.TempDir())
	if err != nil {
		t.Fatalf("storage.NewLocal() error = %v", err)
	}
	service, err := New(local, maxBytes)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	return service
}

func multipartHeader(
	t *testing.T,
	filename string,
	mimeType string,
	content []byte,
) *multipart.FileHeader {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	headers := make(textproto.MIMEHeader)
	headers.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, filename))
	headers.Set("Content-Type", mimeType)
	part, err := writer.CreatePart(headers)
	if err != nil {
		t.Fatalf("CreatePart() error = %v", err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatalf("part.Write() error = %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("writer.Close() error = %v", err)
	}

	request := httptest.NewRequest(http.MethodPost, "/", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	if err := request.ParseMultipartForm(1024 * 1024); err != nil {
		t.Fatalf("ParseMultipartForm() error = %v", err)
	}
	t.Cleanup(func() {
		if request.MultipartForm != nil {
			_ = request.MultipartForm.RemoveAll()
		}
	})
	return request.MultipartForm.File["file"][0]
}
