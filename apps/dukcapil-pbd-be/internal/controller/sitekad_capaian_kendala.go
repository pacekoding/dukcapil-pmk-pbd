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
	maxSitekadNamaCapaianLength      = 200
	maxSitekadDeskripsiCapaianLength = 5000
	maxSitekadKendalaLength          = 5000
	maxSitekadDokumentasiURLs        = 3
	maxSitekadDokumentasiURLLength   = 2048
)

var sitekadInternalDocumentationURLPattern = regexp.MustCompile(`^/api/backend/files/[1-9]\d*/(?:preview|download)(?:\?.*)?$`)

func (s *SitekadController) ListCapaianKendala(c echo.Context) error {
	response, err := s.sitekad.ListCapaianKendala(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SitekadController) CreateCapaianKendala(c echo.Context) error {
	payload, photoHeaders, err := parseSitekadCapaianKendalaRequest(c)
	if err != nil {
		return err
	}
	payload.DokumentasiURLs = normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)
	if len(payload.DokumentasiURLs)+len(photoHeaders) > maxSitekadDokumentasiURLs {
		return echo.NewHTTPError(http.StatusBadRequest, "dokumentasi maksimal 3")
	}
	if err := validateSitekadCapaianKendalaPayload(payload); err != nil {
		return err
	}

	files, cleanup, err := s.saveSitekadDocumentationPhotos(c, photoHeaders, payload.TahunBinaan)
	if err != nil {
		return err
	}
	defer cleanup(false)

	item, kelompokFound, err := s.sitekad.CreateCapaianKendala(c.Request().Context(), payload, files...)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dibuat")
	}
	if !kelompokFound {
		return echo.NewHTTPError(http.StatusNotFound, "kelompok binaan tidak ditemukan")
	}

	cleanup(true)
	return jsonData(c, http.StatusCreated, item)
}

func (s *SitekadController) UpdateCapaianKendala(c echo.Context) error {
	id, err := sitekadID(c)
	if err != nil {
		return err
	}

	payload, photoHeaders, err := parseSitekadCapaianKendalaRequest(c)
	if err != nil {
		return err
	}
	payload.DokumentasiURLs = normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)
	if len(payload.DokumentasiURLs)+len(photoHeaders) > maxSitekadDokumentasiURLs {
		return echo.NewHTTPError(http.StatusBadRequest, "dokumentasi maksimal 3")
	}
	if err := validateSitekadCapaianKendalaPayload(payload); err != nil {
		return err
	}

	files, cleanup, err := s.saveSitekadDocumentationPhotos(c, photoHeaders, payload.TahunBinaan)
	if err != nil {
		return err
	}
	defer cleanup(false)

	item, found, err := s.sitekad.UpdateCapaianKendala(c.Request().Context(), id, payload, files...)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data capaian/kendala atau kelompok binaan tidak ditemukan")
	}

	cleanup(true)
	return jsonData(c, http.StatusOK, item)
}

func (s *SitekadController) DeleteCapaianKendala(c echo.Context) error {
	id, err := sitekadID(c)
	if err != nil {
		return err
	}

	found, err := s.sitekad.DeleteCapaianKendala(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data capaian dan kendala tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func parseSitekadCapaianKendalaRequest(c echo.Context) (model.SitekadCapaianKendalaPayload, []*multipart.FileHeader, error) {
	contentType := strings.ToLower(c.Request().Header.Get(echo.HeaderContentType))
	if strings.HasPrefix(contentType, "multipart/form-data") {
		form, err := c.MultipartForm()
		if err != nil {
			return model.SitekadCapaianKendalaPayload{}, nil, echo.NewHTTPError(http.StatusBadRequest, "payload capaian dan kendala tidak valid")
		}
		kelompokID, err := strconv.ParseInt(strings.TrimSpace(firstSitekadMultipartValue(form, "kelompokId", "kelompok_id")), 10, 64)
		if err != nil {
			kelompokID = 0
		}
		payload := model.SitekadCapaianKendalaPayload{
			KelompokID:       kelompokID,
			NamaCapaian:      firstSitekadMultipartValue(form, "namaCapaian", "nama_capaian"),
			TahunBinaan:      firstSitekadMultipartValue(form, "tahunBinaan", "tahun_binaan"),
			DeskripsiCapaian: firstSitekadMultipartValue(form, "deskripsiCapaian", "deskripsi_capaian"),
			KendalaHambatan:  firstSitekadMultipartValue(form, "kendalaHambatan", "kendala_hambatan"),
			DokumentasiURLs:  sitekadMultipartValues(form, "dokumentasiUrls", "dokumentasiUrls[]", "dokumentasi_urls", "documentationUrls"),
		}
		return payload, sitekadMultipartFiles(form, "documentationPhotos", "dokumentasiPhotos", "fotoDokumentasi", "photos", "files"), nil
	}

	var payload model.SitekadCapaianKendalaPayload
	if err := c.Bind(&payload); err != nil {
		return model.SitekadCapaianKendalaPayload{}, nil, echo.NewHTTPError(http.StatusBadRequest, "payload capaian dan kendala tidak valid")
	}
	return payload, nil, nil
}

func (s *SitekadController) saveSitekadDocumentationPhotos(c echo.Context, headers []*multipart.FileHeader, year string) ([]model.StoredFileInput, func(bool), error) {
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
	uploadedBy := sitekadUploadedBy(c)
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
			Module:          "sitekad",
			RelatedType:     "sitekad_capaian_kendala",
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

func firstSitekadMultipartValue(form *multipart.Form, keys ...string) string {
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

func sitekadMultipartValues(form *multipart.Form, keys ...string) []string {
	values := make([]string, 0)
	for _, key := range keys {
		values = append(values, form.Value[key]...)
	}
	return values
}

func sitekadMultipartFiles(form *multipart.Form, keys ...string) []*multipart.FileHeader {
	files := make([]*multipart.FileHeader, 0)
	for _, key := range keys {
		files = append(files, form.File[key]...)
	}
	return files
}

func sitekadUploadedBy(c echo.Context) *int64 {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok || claims.UserID <= 0 {
		return nil
	}
	return &claims.UserID
}

func validateSitekadCapaianKendalaPayload(payload model.SitekadCapaianKendalaPayload) error {
	if payload.KelompokID <= 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "kelompok binaan wajib dipilih")
	}
	if value := strings.TrimSpace(payload.NamaCapaian); value == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama capaian atau produk wajib diisi")
	} else if len([]rune(value)) > maxSitekadNamaCapaianLength {
		return echo.NewHTTPError(http.StatusBadRequest, "nama capaian atau produk maksimal 200 karakter")
	}
	if value := strings.TrimSpace(payload.TahunBinaan); !tahunAnggaranPattern.MatchString(value) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun binaan tidak valid")
	}
	if value := strings.TrimSpace(payload.DeskripsiCapaian); value == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "deskripsi capaian wajib diisi")
	} else if len([]rune(value)) > maxSitekadDeskripsiCapaianLength {
		return echo.NewHTTPError(http.StatusBadRequest, "deskripsi capaian maksimal 5000 karakter")
	}
	if len([]rune(strings.TrimSpace(payload.KendalaHambatan))) > maxSitekadKendalaLength {
		return echo.NewHTTPError(http.StatusBadRequest, "kendala atau hambatan maksimal 5000 karakter")
	}
	if len(payload.DokumentasiURLs) > maxSitekadDokumentasiURLs {
		return echo.NewHTTPError(http.StatusBadRequest, "tautan dokumentasi maksimal 3")
	}
	for _, value := range payload.DokumentasiURLs {
		if len(value) > maxSitekadDokumentasiURLLength || !validSitekadDocumentationURL(value) {
			return echo.NewHTTPError(http.StatusBadRequest, "tautan dokumentasi harus berupa URL HTTP/HTTPS yang valid")
		}
	}

	return nil
}

func normalizeSitekadDocumentationURLs(values []string) []string {
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

func validSitekadDocumentationURL(value string) bool {
	if sitekadInternalDocumentationURLPattern.MatchString(value) {
		return true
	}
	parsed, err := url.ParseRequestURI(value)
	if err != nil || parsed.Host == "" || strings.Contains(parsed.Path, "\x00") {
		return false
	}
	return parsed.Scheme == "http" || parsed.Scheme == "https"
}
