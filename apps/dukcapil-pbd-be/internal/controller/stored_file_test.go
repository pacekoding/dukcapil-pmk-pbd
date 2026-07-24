package controller

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"
	"dukcapil-pbd-be/internal/storage"

	"github.com/labstack/echo"
)

type storedFileStoreStub struct {
	file            model.StoredFile
	authorizedFound bool
	publicFound     bool
}

func (s storedFileStoreStub) AuthorizedByID(
	_ context.Context,
	_ int64,
	_ security.Claims,
) (model.StoredFile, bool, error) {
	return s.file, s.authorizedFound, nil
}

func (s storedFileStoreStub) PublicByID(_ context.Context, _ int64) (model.StoredFile, bool, error) {
	return s.file, s.publicFound, nil
}

func TestStoredFilePreviewRequiresAuthentication(t *testing.T) {
	local, err := storage.NewLocal(t.TempDir())
	if err != nil {
		t.Fatalf("storage.NewLocal() error = %v", err)
	}
	controller := NewStoredFileController(storedFileStoreStub{}, local)
	context := storedFileTestContext(http.MethodGet)

	err = controller.Preview(context)
	assertHTTPErrorCode(t, err, http.StatusUnauthorized)
}

func TestStoredFilePublicPreviewRejectsUnavailableParent(t *testing.T) {
	local, err := storage.NewLocal(t.TempDir())
	if err != nil {
		t.Fatalf("storage.NewLocal() error = %v", err)
	}
	controller := NewStoredFileController(storedFileStoreStub{publicFound: false}, local)
	context := storedFileTestContext(http.MethodGet)

	err = controller.PublicPreview(context)
	assertHTTPErrorCode(t, err, http.StatusNotFound)
}

func TestStoredFileServesPrivatePDFWithSecureHeaders(t *testing.T) {
	local, err := storage.NewLocal(t.TempDir())
	if err != nil {
		t.Fatalf("storage.NewLocal() error = %v", err)
	}
	content := []byte("%PDF-1.4\nprivate")
	object, err := local.Save(context.Background(), storage.SaveRequest{
		Visibility: "private",
		Module:     "maceku-pkk",
		Category:   "lkpj",
		Year:       "2026",
		Extension:  "pdf",
		Reader:     bytes.NewReader(content),
		MaxBytes:   1024,
	})
	if err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	file := model.StoredFile{
		ID:               7,
		StorageKey:       object.Key,
		OriginalFilename: "LKPJ 2026.pdf",
		MimeType:         "application/pdf",
		FileSize:         object.Size,
		ChecksumSHA256:   object.ChecksumSHA256,
		Visibility:       model.FileVisibilityPrivate,
	}
	controller := NewStoredFileController(storedFileStoreStub{
		file:            file,
		authorizedFound: true,
	}, local)
	context := storedFileTestContext(http.MethodGet)
	context.Set(authmiddleware.ClaimsContextKey, security.Claims{
		UserID: 1,
		Role:   model.RoleSuperAdmin,
	})

	if err := controller.Preview(context); err != nil {
		t.Fatalf("Preview() error = %v", err)
	}
	response := context.Response()
	if response.Status != http.StatusOK {
		t.Fatalf("status = %d", response.Status)
	}
	if got := response.Header().Get("Cache-Control"); got != "private, no-store" {
		t.Fatalf("Cache-Control = %q", got)
	}
	if got := response.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Fatalf("X-Content-Type-Options = %q", got)
	}
	if got := response.Header().Get(echo.HeaderContentDisposition); !strings.HasPrefix(got, "inline;") {
		t.Fatalf("Content-Disposition = %q", got)
	}
	if got := response.Header().Get(echo.HeaderContentType); !strings.HasPrefix(got, "application/pdf") {
		t.Fatalf("Content-Type = %q", got)
	}
}

func storedFileTestContext(method string) echo.Context {
	e := echo.New()
	request := httptest.NewRequest(method, "/api/v1/files/7/preview", nil)
	recorder := httptest.NewRecorder()
	context := e.NewContext(request, recorder)
	context.SetPath("/api/v1/files/:file_id/preview")
	context.SetParamNames("file_id")
	context.SetParamValues("7")
	return context
}
