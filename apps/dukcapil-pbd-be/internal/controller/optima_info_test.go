package controller

import (
	"bytes"
	"context"
	"errors"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"
	"dukcapil-pbd-be/internal/storage"

	"github.com/labstack/echo"
)

type optimaInfoStoreStub struct {
	detailCalls  int
	publishCalls int
	detail       model.OptimaInfoDetail
	createErr    error
}

func (s *optimaInfoStoreStub) ListAdmin(_ context.Context, _ model.OptimaInfoAdminListParams) (model.OptimaInfoAdminListResponse, error) {
	return model.OptimaInfoAdminListResponse{}, nil
}

func (s *optimaInfoStoreStub) Detail(_ context.Context, id int64) (model.OptimaInfoDetail, bool, error) {
	_ = id
	s.detailCalls++
	return s.detail, true, nil
}

func (s *optimaInfoStoreStub) Create(_ context.Context, _ model.OptimaInfoMutation) (model.OptimaInfoDetail, error) {
	return model.OptimaInfoDetail{}, s.createErr
}

func (s *optimaInfoStoreStub) Update(_ context.Context, _ int64, _ model.OptimaInfoMutation) (model.OptimaInfoDetail, bool, error) {
	return model.OptimaInfoDetail{}, false, nil
}

func (s *optimaInfoStoreStub) Delete(_ context.Context, _ int64) (model.OptimaInfoDetail, bool, error) {
	return model.OptimaInfoDetail{}, false, nil
}

func (s *optimaInfoStoreStub) Publish(_ context.Context, _ int64, _ *int64, _ string) (model.OptimaInfoDetail, bool, error) {
	s.publishCalls++
	return s.detail, true, nil
}

func (s *optimaInfoStoreStub) Unpublish(_ context.Context, _ int64) (model.OptimaInfoDetail, bool, error) {
	return s.detail, true, nil
}

func (s *optimaInfoStoreStub) Archive(_ context.Context, _ int64) (model.OptimaInfoDetail, bool, error) {
	return s.detail, true, nil
}

func (s *optimaInfoStoreStub) PublicList(_ context.Context, _ model.OptimaInfoPublicListParams) (model.OptimaInfoPublicListResponse, error) {
	return model.OptimaInfoPublicListResponse{}, nil
}

func (s *optimaInfoStoreStub) PublicDetailBySlug(_ context.Context, _ string) (model.OptimaInfoDetail, bool, error) {
	return s.detail, true, nil
}

func (s *optimaInfoStoreStub) CreateContentImage(_ context.Context, _ int64, _ model.StoredFileInput) (model.StoredFile, bool, error) {
	return model.StoredFile{}, true, nil
}

func (s *optimaInfoStoreStub) DeleteContentImage(_ context.Context, _ int64, _ int64) (model.StoredFile, bool, error) {
	return model.StoredFile{}, true, nil
}

func TestSanitizeOptimaInfoHTML(t *testing.T) {
	input := `<p onclick="alert(1)">Aman</p><script>alert(1)</script><a href="javascript:alert(1)">klik</a>`
	got := sanitizeOptimaInfoHTML(input)

	if got == "" {
		t.Fatalf("sanitizeOptimaInfoHTML() returned empty string")
	}
	if got == input {
		t.Fatalf("sanitizeOptimaInfoHTML() did not change dangerous HTML")
	}
	if stripOptimaInfoHTML(got) != "Aman klik" {
		t.Fatalf("stripOptimaInfoHTML() = %q, want %q", stripOptimaInfoHTML(got), "Aman klik")
	}
}

func TestSlugifyOptimaInfo(t *testing.T) {
	got := slugifyOptimaInfo("Sosialisasi Adminduk Go Digital 2026!")
	want := "sosialisasi-adminduk-go-digital-2026"
	if got != want {
		t.Fatalf("slugifyOptimaInfo() = %q, want %q", got, want)
	}
}

func TestValidateOptimaInfoPublishable(t *testing.T) {
	article := model.OptimaInfoDetail{
		Title:    "Info Dukcapil",
		Category: "Layanan",
		Content:  "<p>Isi konten</p>",
	}
	if err := validateOptimaInfoPublishable(model.OptimaInfoArticlePayload{}, article); err != nil {
		t.Fatalf("validateOptimaInfoPublishable() error = %v", err)
	}

	err := validateOptimaInfoPublishable(model.OptimaInfoArticlePayload{}, model.OptimaInfoDetail{})
	assertHTTPErrorCode(t, err, http.StatusBadRequest)
}

func TestOptimaInfoPreviewDoesNotPublish(t *testing.T) {
	store := &optimaInfoStoreStub{
		detail: model.OptimaInfoDetail{
			ID:        99,
			Title:     "Draft Informasi",
			Status:    model.OptimaInfoStatusDraft,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Category:  "Pengumuman",
			Content:   "<p>Contoh</p>",
		},
	}
	controller := NewOptimaInfoController(store)
	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/optima-info/99/preview", nil)
	recorder := httptest.NewRecorder()
	context := e.NewContext(request, recorder)
	context.SetPath("/api/v1/optima-info/:id/preview")
	context.SetParamNames("id")
	context.SetParamValues("99")
	context.Set(authmiddleware.ClaimsContextKey, security.Claims{
		UserID: 1,
		Name:   "Super Admin",
		Role:   model.RoleSuperAdmin,
	})

	if err := controller.Preview(context); err != nil {
		t.Fatalf("Preview() error = %v", err)
	}
	if recorder.Code != http.StatusOK {
		t.Fatalf("Preview() status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if store.publishCalls != 0 {
		t.Fatalf("Preview() unexpectedly called Publish() %d time(s)", store.publishCalls)
	}
	if store.detailCalls != 1 {
		t.Fatalf("Preview() detail calls = %d, want 1", store.detailCalls)
	}
}

func TestParseOptimaInfoMutationRemoveFiles(t *testing.T) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fields := map[string]string{
		"title":            "Info Dukcapil",
		"slug":             "info-dukcapil",
		"category":         "Pengumuman",
		"summary":          "Ringkasan",
		"content":          "<p>Konten</p>",
		"removeThumbnail":  "true",
		"removeAttachment": "true",
		"intent":           "save",
	}
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatalf("WriteField(%q) error = %v", key, err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("writer.Close() error = %v", err)
	}

	e := echo.New()
	request := httptest.NewRequest(http.MethodPut, "/api/v1/optima-info/7", body)
	request.Header.Set(echo.HeaderContentType, writer.FormDataContentType())
	context := e.NewContext(request, httptest.NewRecorder())

	current := model.OptimaInfoDetail{
		ThumbnailStorageURL:    "/uploads/optima-info/thumbnail/old-thumb.jpg",
		ThumbnailOriginalName:  "old-thumb.jpg",
		ThumbnailMimeType:      "image/jpeg",
		ThumbnailSize:          1024,
		AttachmentStorageURL:   "/uploads/optima-info/attachment/old-file.pdf",
		AttachmentOriginalName: "old-file.pdf",
		AttachmentMimeType:     "application/pdf",
		AttachmentSize:         2048,
	}

	payload, mutation, cleanup, err := parseOptimaInfoMutation(context, &current, security.Claims{
		UserID: 11,
		Name:   "Super Admin",
		Role:   model.RoleSuperAdmin,
	}, nil)
	if err != nil {
		t.Fatalf("parseOptimaInfoMutation() error = %v", err)
	}
	if cleanup == nil {
		t.Fatalf("parseOptimaInfoMutation() cleanup is nil")
	}
	if !payload.RemoveThumbnail || !payload.RemoveAttachment {
		t.Fatalf("remove flags = (%t, %t), want both true", payload.RemoveThumbnail, payload.RemoveAttachment)
	}
	if strings.TrimSpace(mutation.ThumbnailURL) != "" || strings.TrimSpace(mutation.ThumbnailOriginalName) != "" {
		t.Fatalf("thumbnail mutation was not cleared: %+v", mutation)
	}
	if strings.TrimSpace(mutation.AttachmentURL) != "" || strings.TrimSpace(mutation.AttachmentOriginalName) != "" {
		t.Fatalf("attachment mutation was not cleared: %+v", mutation)
	}
	if mutation.ThumbnailSize != 0 || mutation.AttachmentSize != 0 {
		t.Fatalf("file sizes = (%d, %d), want both 0", mutation.ThumbnailSize, mutation.AttachmentSize)
	}
}

func TestOptimaInfoCreateRemovesStoredFileWhenDatabaseWriteFails(t *testing.T) {
	root := t.TempDir()
	files := newControllerTestFileService(t, root)
	store := &optimaInfoStoreStub{createErr: errors.New("database unavailable")}
	controller := NewOptimaInfoController(store, files)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	for key, value := range map[string]string{
		"title":    "Informasi Uji",
		"slug":     "informasi-uji",
		"category": "Pengumuman",
		"content":  "<p>Konten uji</p>",
	} {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatalf("WriteField(%q) error = %v", key, err)
		}
	}
	part, err := writer.CreateFormFile("thumbnail", "Gambar Uji.png")
	if err != nil {
		t.Fatalf("CreateFormFile() error = %v", err)
	}
	png := append([]byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}, []byte("data")...)
	if _, err := part.Write(png); err != nil {
		t.Fatalf("part.Write() error = %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("writer.Close() error = %v", err)
	}

	e := echo.New()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/optima-info", body)
	request.Header.Set(echo.HeaderContentType, writer.FormDataContentType())
	context := e.NewContext(request, httptest.NewRecorder())
	context.Set(authmiddleware.ClaimsContextKey, security.Claims{
		UserID: 1,
		Name:   "Super Admin",
		Role:   model.RoleSuperAdmin,
	})

	err = controller.Create(context)
	assertHTTPErrorCode(t, err, http.StatusInternalServerError)

	var storedFiles int
	if walkErr := filepath.Walk(root, func(_ string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if info.Mode().IsRegular() {
			storedFiles++
		}
		return nil
	}); walkErr != nil {
		t.Fatalf("Walk() error = %v", walkErr)
	}
	if storedFiles != 0 {
		t.Fatalf("stored regular files after rollback = %d, want 0", storedFiles)
	}
}

func TestOptimaInfoCreateKeepsStoredFileAfterSuccessfulWrite(t *testing.T) {
	root := t.TempDir()
	files := newControllerTestFileService(t, root)
	controller := NewOptimaInfoController(&optimaInfoStoreStub{}, files)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	for key, value := range map[string]string{
		"title":    "Informasi Tersimpan",
		"slug":     "informasi-tersimpan",
		"category": "Pengumuman",
		"content":  "<p>Konten uji</p>",
	} {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatalf("WriteField(%q) error = %v", key, err)
		}
	}
	part, err := writer.CreateFormFile("thumbnail", "thumbnail.png")
	if err != nil {
		t.Fatalf("CreateFormFile() error = %v", err)
	}
	png := append([]byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}, []byte("data")...)
	if _, err := part.Write(png); err != nil {
		t.Fatalf("part.Write() error = %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("writer.Close() error = %v", err)
	}

	e := echo.New()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/optima-info", body)
	request.Header.Set(echo.HeaderContentType, writer.FormDataContentType())
	recorder := httptest.NewRecorder()
	context := e.NewContext(request, recorder)
	context.Set(authmiddleware.ClaimsContextKey, security.Claims{
		UserID: 1,
		Name:   "Super Admin",
		Role:   model.RoleSuperAdmin,
	})

	if err := controller.Create(context); err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if recorder.Code != http.StatusCreated {
		t.Fatalf("Create() status = %d, want %d", recorder.Code, http.StatusCreated)
	}
	if storedFiles := countControllerTestFiles(t, root); storedFiles != 1 {
		t.Fatalf("stored regular files after success = %d, want 1", storedFiles)
	}
}

func TestParseOptimaInfoMutationCleansThumbnailWhenAttachmentIsInvalid(t *testing.T) {
	root := t.TempDir()
	files := newControllerTestFileService(t, root)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	for key, value := range map[string]string{
		"title":    "Informasi Uji",
		"slug":     "informasi-uji",
		"category": "Pengumuman",
		"content":  "<p>Konten</p>",
	} {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatalf("WriteField(%q) error = %v", key, err)
		}
	}
	thumbnail, err := writer.CreateFormFile("thumbnail", "thumbnail.png")
	if err != nil {
		t.Fatalf("CreateFormFile(thumbnail) error = %v", err)
	}
	if _, err := thumbnail.Write(append([]byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}, []byte("data")...)); err != nil {
		t.Fatalf("thumbnail.Write() error = %v", err)
	}
	attachment, err := writer.CreateFormFile("attachment", "attachment.pdf")
	if err != nil {
		t.Fatalf("CreateFormFile(attachment) error = %v", err)
	}
	if _, err := attachment.Write([]byte("not-a-pdf")); err != nil {
		t.Fatalf("attachment.Write() error = %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("writer.Close() error = %v", err)
	}

	e := echo.New()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/optima-info", body)
	request.Header.Set(echo.HeaderContentType, writer.FormDataContentType())
	context := e.NewContext(request, httptest.NewRecorder())

	_, _, _, err = parseOptimaInfoMutation(context, nil, security.Claims{UserID: 1}, files)
	assertHTTPErrorCode(t, err, http.StatusBadRequest)
	if storedFiles := countControllerTestFiles(t, root); storedFiles != 0 {
		t.Fatalf("stored regular files after parse failure = %d, want 0", storedFiles)
	}
}

func TestServeOptimaInfoStoredFileInlinePdf(t *testing.T) {
	tempDir := t.TempDir()
	filePath := filepath.Join(tempDir, "optima-info", "attachment", "test.pdf")
	if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.WriteFile(filePath, []byte("%PDF-1.4\n"), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/file?disposition=inline", nil)
	recorder := httptest.NewRecorder()
	context := e.NewContext(request, recorder)
	files := newControllerTestFileService(t, tempDir)

	err := serveManagedStoredFile(
		context,
		files,
		"optima-info/attachment/test.pdf",
		"application/octet-stream",
		"test.pdf",
		documentRequestDisposition(context, "attachment"),
		false,
	)
	if err != nil {
		t.Fatalf("serveOptimaInfoStoredFile() error = %v", err)
	}
	if recorder.Code != http.StatusOK {
		t.Fatalf("serveOptimaInfoStoredFile() status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if got := recorder.Header().Get(echo.HeaderContentDisposition); !strings.HasPrefix(got, "inline;") {
		t.Fatalf("Content-Disposition = %q, want inline", got)
	}
	if got := recorder.Header().Get(echo.HeaderContentType); !strings.HasPrefix(got, "application/pdf") {
		t.Fatalf("Content-Type = %q, want application/pdf", got)
	}
}

func TestServeOptimaInfoStoredFileLegacyOpInfoPath(t *testing.T) {
	tempDir := t.TempDir()
	filePath := filepath.Join(tempDir, "op_info", "attachment", "legacy.pdf")
	if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.WriteFile(filePath, []byte("%PDF-1.4\n"), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/file?disposition=inline", nil)
	recorder := httptest.NewRecorder()
	context := e.NewContext(request, recorder)
	files := newControllerTestFileService(t, tempDir)

	err := serveManagedStoredFile(
		context,
		files,
		"/uploads/op_info/attachment/legacy.pdf",
		"application/octet-stream",
		"legacy.pdf",
		documentRequestDisposition(context, "attachment"),
		false,
	)
	if err != nil {
		t.Fatalf("serveOptimaInfoStoredFile() error = %v", err)
	}
	if recorder.Code != http.StatusOK {
		t.Fatalf("serveOptimaInfoStoredFile() status = %d, want %d", recorder.Code, http.StatusOK)
	}
}

func newControllerTestFileService(t *testing.T, root string) *fileasset.Service {
	t.Helper()
	local, err := storage.NewLocal(root)
	if err != nil {
		t.Fatalf("storage.NewLocal() error = %v", err)
	}
	service, err := fileasset.New(local, 20*1024*1024)
	if err != nil {
		t.Fatalf("fileasset.New() error = %v", err)
	}
	return service
}

func countControllerTestFiles(t *testing.T, root string) int {
	t.Helper()
	var count int
	if err := filepath.Walk(root, func(_ string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if info.Mode().IsRegular() {
			count++
		}
		return nil
	}); err != nil {
		t.Fatalf("Walk() error = %v", err)
	}
	return count
}
