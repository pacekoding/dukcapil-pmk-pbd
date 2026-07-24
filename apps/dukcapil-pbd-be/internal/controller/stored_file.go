package controller

import (
	"context"
	"errors"
	"fmt"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"
	"dukcapil-pbd-be/internal/storage"

	"github.com/labstack/echo"
)

type StoredFileStore interface {
	AuthorizedByID(ctx context.Context, id int64, claims security.Claims) (model.StoredFile, bool, error)
	PublicByID(ctx context.Context, id int64) (model.StoredFile, bool, error)
}

type StoredFileController struct {
	files   StoredFileStore
	storage storage.Service
}

func NewStoredFileController(files StoredFileStore, service storage.Service) *StoredFileController {
	return &StoredFileController{files: files, storage: service}
}

func (s *StoredFileController) Preview(c echo.Context) error {
	return s.serveProtected(c, "inline")
}

func (s *StoredFileController) Download(c echo.Context) error {
	return s.serveProtected(c, "attachment")
}

func (s *StoredFileController) PublicPreview(c echo.Context) error {
	return s.servePublic(c, "inline")
}

func (s *StoredFileController) PublicDownload(c echo.Context) error {
	return s.servePublic(c, "attachment")
}

func (s *StoredFileController) serveProtected(c echo.Context, disposition string) error {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}
	id, err := storedFileID(c)
	if err != nil {
		return err
	}
	file, found, err := s.files.AuthorizedByID(c.Request().Context(), id, claims)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "file gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "file tidak ditemukan")
	}
	return s.serve(c, file, disposition, false)
}

func (s *StoredFileController) servePublic(c echo.Context, disposition string) error {
	id, err := storedFileID(c)
	if err != nil {
		return err
	}
	file, found, err := s.files.PublicByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "file publik gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "file tidak ditemukan")
	}
	return s.serve(c, file, disposition, true)
}

func (s *StoredFileController) serve(c echo.Context, file model.StoredFile, disposition string, public bool) error {
	if s == nil || s.storage == nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}
	reader, err := s.storage.Open(c.Request().Context(), file.StorageKey)
	if errors.Is(err, storage.ErrNotFound) || errors.Is(err, storage.ErrInvalidKey) {
		return echo.NewHTTPError(http.StatusNotFound, "file tidak ditemukan")
	}
	if err != nil {
		c.Logger().Errorf("open stored file %d failed: %v", file.ID, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "file gagal dibuka")
	}
	defer reader.Close()

	metadata, err := s.storage.GetMetadata(c.Request().Context(), file.StorageKey)
	if err != nil {
		c.Logger().Errorf("read stored file metadata %d failed: %v", file.ID, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "metadata file gagal dibaca")
	}

	contentType := strings.TrimSpace(file.MimeType)
	if contentType == "" || strings.EqualFold(contentType, "application/octet-stream") {
		contentType = mime.TypeByExtension(strings.ToLower(filepath.Ext(file.OriginalFilename)))
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	response := c.Response()
	response.Header().Set(echo.HeaderContentType, contentType)
	response.Header().Set(echo.HeaderContentDisposition, documentContentDisposition(disposition, file.OriginalFilename))
	response.Header().Set("X-Content-Type-Options", "nosniff")
	response.Header().Set("Accept-Ranges", "bytes")
	if file.ChecksumSHA256 != "" {
		response.Header().Set("ETag", fmt.Sprintf(`"sha256-%s"`, file.ChecksumSHA256))
	}
	if public {
		response.Header().Set("Cache-Control", "public, max-age=0, must-revalidate")
	} else {
		response.Header().Set("Cache-Control", "private, no-store")
	}

	modified := metadata.Modified
	if modified.IsZero() {
		modified = time.Unix(0, 0)
	}
	http.ServeContent(response, c.Request(), file.OriginalFilename, modified, reader)
	return nil
}

func storedFileID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("file_id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter file tidak valid")
	}
	return id, nil
}
