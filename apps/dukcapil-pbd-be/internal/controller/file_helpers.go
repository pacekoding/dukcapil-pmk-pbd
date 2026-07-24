package controller

import (
	"errors"
	"mime"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/fileasset"
	"dukcapil-pbd-be/internal/storage"

	"github.com/labstack/echo"
)

func managedUploadHTTPError(err error) error {
	switch {
	case errors.Is(err, fileasset.ErrMissing):
		return echo.NewHTTPError(http.StatusBadRequest, "file wajib diunggah")
	case errors.Is(err, fileasset.ErrEmpty):
		return echo.NewHTTPError(http.StatusBadRequest, "file tidak boleh kosong")
	case errors.Is(err, fileasset.ErrTooLarge):
		return echo.NewHTTPError(http.StatusRequestEntityTooLarge, "ukuran file melebihi batas upload")
	case errors.Is(err, fileasset.ErrUnsupported):
		return echo.NewHTTPError(http.StatusBadRequest, "format file tidak didukung")
	case errors.Is(err, fileasset.ErrMimeMismatch):
		return echo.NewHTTPError(http.StatusBadRequest, "tipe isi file tidak sesuai dengan nama atau MIME file")
	default:
		return echo.NewHTTPError(http.StatusInternalServerError, "file gagal disimpan")
	}
}

func deleteManagedStoredFile(c echo.Context, files *fileasset.Service, storageKey string) {
	if files == nil || strings.TrimSpace(storageKey) == "" {
		return
	}
	key, err := normalizeManagedStorageKey(storageKey)
	if err != nil {
		c.Logger().Warnf("skip delete stored file: %v", err)
		return
	}
	if err := files.Delete(c.Request().Context(), key); err != nil {
		c.Logger().Warnf("delete stored file failed: %v", err)
	}
}

func serveManagedStoredFile(
	c echo.Context,
	files *fileasset.Service,
	storageKey string,
	mimeType string,
	originalName string,
	disposition string,
	public bool,
) error {
	if files == nil || files.Storage() == nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}
	key, err := normalizeManagedStorageKey(storageKey)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "file tidak ditemukan")
	}
	reader, err := files.Storage().Open(c.Request().Context(), key)
	if errors.Is(err, storage.ErrNotFound) || errors.Is(err, storage.ErrInvalidKey) {
		return echo.NewHTTPError(http.StatusNotFound, "file tidak ditemukan")
	}
	if err != nil {
		c.Logger().Errorf("open stored file failed: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "file gagal dibuka")
	}
	defer reader.Close()

	metadata, err := files.Storage().GetMetadata(c.Request().Context(), key)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "metadata file gagal dibaca")
	}
	resolvedMime := strings.TrimSpace(mimeType)
	if resolvedMime == "" || strings.EqualFold(resolvedMime, "application/octet-stream") {
		resolvedMime = mime.TypeByExtension(strings.ToLower(filepath.Ext(originalName)))
	}
	if resolvedMime == "" {
		resolvedMime = "application/octet-stream"
	}

	response := c.Response()
	response.Header().Set(echo.HeaderContentType, resolvedMime)
	response.Header().Set(echo.HeaderContentDisposition, documentContentDisposition(disposition, originalName))
	response.Header().Set("X-Content-Type-Options", "nosniff")
	response.Header().Set("Accept-Ranges", "bytes")
	if public {
		response.Header().Set("Cache-Control", "public, max-age=0, must-revalidate")
	} else {
		response.Header().Set("Cache-Control", "private, no-store")
	}
	modified := metadata.Modified
	if modified.IsZero() {
		modified = time.Unix(0, 0)
	}
	http.ServeContent(response, c.Request(), originalName, modified, reader)
	return nil
}

func normalizeManagedStorageKey(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	switch {
	case strings.HasPrefix(trimmed, "/uploads/"):
		trimmed = strings.TrimPrefix(trimmed, "/uploads/")
	case strings.HasPrefix(trimmed, "uploads/"):
		trimmed = strings.TrimPrefix(trimmed, "uploads/")
	case strings.HasPrefix(trimmed, "/"):
		return "", storage.ErrInvalidKey
	}
	clean := filepath.ToSlash(filepath.Clean(filepath.FromSlash(trimmed)))
	if clean == "." || clean == ".." || strings.HasPrefix(clean, "../") {
		return "", storage.ErrInvalidKey
	}
	return clean, nil
}
