package controller

import (
	"mime/multipart"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

const (
	maxKelompokBinaanNamaCapaianLength      = 200
	maxKelompokBinaanDeskripsiCapaianLength = 5000
	maxKelompokBinaanKendalaLength          = 5000
	maxKelompokBinaanDokumentasiURLs        = 3
	maxKelompokBinaanDokumentasiURLLength   = 2048
)

var kelompokBinaanInternalDocumentationURLPattern = regexp.MustCompile(`^/api/backend/files/[1-9]\d*/(?:preview|download)(?:\?.*)?$`)

func (s *KelompokBinaanController) ListCapaianKendala(c echo.Context) error {
	response, err := s.kelompokBinaan.ListCapaianKendala(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *KelompokBinaanController) CreateCapaianKendala(c echo.Context) error {
	payload, photoHeaders, err := parseCapaianKendalaRequest(c)
	if err != nil {
		return err
	}
	payload.DokumentasiURLs = normalizeKelompokBinaanDocumentationURLs(payload.DokumentasiURLs)
	if len(payload.DokumentasiURLs)+len(photoHeaders) > maxKelompokBinaanDokumentasiURLs {
		return echo.NewHTTPError(http.StatusBadRequest, "dokumentasi maksimal 3")
	}
	if err := validateCapaianKendalaPayload(payload); err != nil {
		return err
	}

	files, cleanup, err := s.saveKelompokBinaanDocumentationPhotos(c, photoHeaders, payload.TahunBinaan)
	if err != nil {
		return err
	}
	defer cleanup(false)

	item, kelompokFound, err := s.kelompokBinaan.CreateCapaianKendala(c.Request().Context(), payload, files...)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dibuat")
	}
	if !kelompokFound {
		return echo.NewHTTPError(http.StatusNotFound, "kelompok binaan tidak ditemukan")
	}

	cleanup(true)
	return jsonData(c, http.StatusCreated, item)
}

func (s *KelompokBinaanController) UpdateCapaianKendala(c echo.Context) error {
	id, err := kelompokBinaanID(c)
	if err != nil {
		return err
	}

	payload, photoHeaders, err := parseCapaianKendalaRequest(c)
	if err != nil {
		return err
	}
	payload.DokumentasiURLs = normalizeKelompokBinaanDocumentationURLs(payload.DokumentasiURLs)
	if len(payload.DokumentasiURLs)+len(photoHeaders) > maxKelompokBinaanDokumentasiURLs {
		return echo.NewHTTPError(http.StatusBadRequest, "dokumentasi maksimal 3")
	}
	if err := validateCapaianKendalaPayload(payload); err != nil {
		return err
	}

	files, cleanup, err := s.saveKelompokBinaanDocumentationPhotos(c, photoHeaders, payload.TahunBinaan)
	if err != nil {
		return err
	}
	defer cleanup(false)

	item, found, err := s.kelompokBinaan.UpdateCapaianKendala(c.Request().Context(), id, payload, files...)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data capaian/kendala atau kelompok binaan tidak ditemukan")
	}

	cleanup(true)
	return jsonData(c, http.StatusOK, item)
}

func (s *KelompokBinaanController) DeleteCapaianKendala(c echo.Context) error {
	id, err := kelompokBinaanID(c)
	if err != nil {
		return err
	}

	found, err := s.kelompokBinaan.DeleteCapaianKendala(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data capaian dan kendala tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func parseCapaianKendalaRequest(c echo.Context) (model.CapaianKendalaPayload, []*multipart.FileHeader, error) {
	contentType := strings.ToLower(c.Request().Header.Get(echo.HeaderContentType))
	if strings.HasPrefix(contentType, "multipart/form-data") {
		form, err := c.MultipartForm()
		if err != nil {
			return model.CapaianKendalaPayload{}, nil, echo.NewHTTPError(http.StatusBadRequest, "payload capaian dan kendala tidak valid")
		}
		kelompokID, err := strconv.ParseInt(strings.TrimSpace(firstKelompokBinaanMultipartValue(form, "kelompokId", "kelompok_id")), 10, 64)
		if err != nil {
			kelompokID = 0
		}
		payload := model.CapaianKendalaPayload{
			KelompokID:       kelompokID,
			NamaCapaian:      firstKelompokBinaanMultipartValue(form, "namaCapaian", "nama_capaian"),
			TahunBinaan:      firstKelompokBinaanMultipartValue(form, "tahunBinaan", "tahun_binaan"),
			DeskripsiCapaian: firstKelompokBinaanMultipartValue(form, "deskripsiCapaian", "deskripsi_capaian"),
			KendalaHambatan:  firstKelompokBinaanMultipartValue(form, "kendalaHambatan", "kendala_hambatan"),
			DokumentasiURLs:  kelompokBinaanMultipartValues(form, "dokumentasiUrls", "dokumentasiUrls[]", "dokumentasi_urls", "documentationUrls"),
		}
		return payload, kelompokBinaanMultipartFiles(form, "documentationPhotos", "dokumentasiPhotos", "fotoDokumentasi", "photos", "files"), nil
	}

	var payload model.CapaianKendalaPayload
	if err := c.Bind(&payload); err != nil {
		return model.CapaianKendalaPayload{}, nil, echo.NewHTTPError(http.StatusBadRequest, "payload capaian dan kendala tidak valid")
	}
	return payload, nil, nil
}

func (s *KelompokBinaanController) saveKelompokBinaanDocumentationPhotos(c echo.Context, headers []*multipart.FileHeader, year string) ([]model.StoredFileInput, func(bool), error) {
	if len(headers) == 0 {
		return nil, func(bool) {}, nil
	}
	if s.files == nil {
		return nil, func(bool) {}, echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}

	uploadYear := strings.TrimSpace(year)
	if uploadYear == "" {
		uploadYear = strconv.Itoa(time.Now().Year())
	}
	uploadedBy := kelompokBinaanUploadedBy(c)
	files := make([]model.StoredFileInput, 0, len(headers))
	cleanupCommitted := false
	cleanup := func(success bool) {
		if cleanupCommitted {
			return
		}
		cleanupCommitted = true
		if success {
			return
		}
		for _, file := range files {
			deleteManagedStoredFile(c, s.files, file.StorageKey)
		}
	}

	for _, header := range headers {
		if header == nil {
			continue
		}
		file, err := s.files.Save(c.Request().Context(), fileasset.SaveRequest{
			Header:          header,
			Kind:            fileasset.KindImage,
			Visibility:      model.FileVisibilityPrivate,
			Module:          "kelompok_binaan",
			RelatedType:     "capaian_kendala",
			Category:        "documentation-photo",
			StorageCategory: "capaian-kendala",
			Year:            uploadYear,
			UploadedBy:      uploadedBy,
		})
		if err != nil {
			cleanup(false)
			return nil, func(bool) {}, managedUploadHTTPError(err)
		}
		files = append(files, file)
	}

	return files, cleanup, nil
}

func firstKelompokBinaanMultipartValue(form *multipart.Form, keys ...string) string {
	for _, key := range keys {
		values := form.Value[key]
		for _, value := range values {
			if strings.TrimSpace(value) != "" {
				return value
			}
		}
	}
	return ""
}

func kelompokBinaanMultipartValues(form *multipart.Form, keys ...string) []string {
	values := make([]string, 0)
	for _, key := range keys {
		values = append(values, form.Value[key]...)
	}
	return values
}

func kelompokBinaanMultipartFiles(form *multipart.Form, keys ...string) []*multipart.FileHeader {
	files := make([]*multipart.FileHeader, 0)
	for _, key := range keys {
		files = append(files, form.File[key]...)
	}
	return files
}

func kelompokBinaanUploadedBy(c echo.Context) *int64 {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok || claims.UserID <= 0 {
		return nil
	}
	return &claims.UserID
}

func validateCapaianKendalaPayload(payload model.CapaianKendalaPayload) error {
	if payload.KelompokID <= 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "kelompok binaan wajib dipilih")
	}
	if value := strings.TrimSpace(payload.NamaCapaian); value == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama capaian atau produk wajib diisi")
	} else if len([]rune(value)) > maxKelompokBinaanNamaCapaianLength {
		return echo.NewHTTPError(http.StatusBadRequest, "nama capaian atau produk maksimal 200 karakter")
	}
	if value := strings.TrimSpace(payload.TahunBinaan); !tahunAnggaranPattern.MatchString(value) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun binaan tidak valid")
	}
	if value := strings.TrimSpace(payload.DeskripsiCapaian); value == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "deskripsi capaian wajib diisi")
	} else if len([]rune(value)) > maxKelompokBinaanDeskripsiCapaianLength {
		return echo.NewHTTPError(http.StatusBadRequest, "deskripsi capaian maksimal 5000 karakter")
	}
	if len([]rune(strings.TrimSpace(payload.KendalaHambatan))) > maxKelompokBinaanKendalaLength {
		return echo.NewHTTPError(http.StatusBadRequest, "kendala atau hambatan maksimal 5000 karakter")
	}
	if len(payload.DokumentasiURLs) > maxKelompokBinaanDokumentasiURLs {
		return echo.NewHTTPError(http.StatusBadRequest, "tautan dokumentasi maksimal 3")
	}
	for _, value := range payload.DokumentasiURLs {
		if len(value) > maxKelompokBinaanDokumentasiURLLength || !validKelompokBinaanDocumentationURL(value) {
			return echo.NewHTTPError(http.StatusBadRequest, "tautan dokumentasi harus berupa URL HTTP/HTTPS yang valid")
		}
	}

	return nil
}

func normalizeKelompokBinaanDocumentationURLs(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func validKelompokBinaanDocumentationURL(value string) bool {
	if kelompokBinaanInternalDocumentationURLPattern.MatchString(value) {
		return true
	}
	parsed, err := url.ParseRequestURI(value)
	if err != nil || parsed.Host == "" || strings.Contains(parsed.Path, "\x00") {
		return false
	}
	return parsed.Scheme == "http" || parsed.Scheme == "https"
}
