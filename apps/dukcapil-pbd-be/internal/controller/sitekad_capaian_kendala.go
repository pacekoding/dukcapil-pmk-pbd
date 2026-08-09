package controller

import (
	"net/http"
	"net/url"
	"strings"

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

func (s *SitekadController) ListCapaianKendala(c echo.Context) error {
	response, err := s.sitekad.ListCapaianKendala(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SitekadController) CreateCapaianKendala(c echo.Context) error {
	var payload model.SitekadCapaianKendalaPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload capaian dan kendala tidak valid")
	}
	payload.DokumentasiURLs = normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)
	if err := validateSitekadCapaianKendalaPayload(payload); err != nil {
		return err
	}

	item, kelompokFound, err := s.sitekad.CreateCapaianKendala(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal dibuat")
	}
	if !kelompokFound {
		return echo.NewHTTPError(http.StatusNotFound, "kelompok binaan tidak ditemukan")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *SitekadController) UpdateCapaianKendala(c echo.Context) error {
	id, err := sitekadID(c)
	if err != nil {
		return err
	}

	var payload model.SitekadCapaianKendalaPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload capaian dan kendala tidak valid")
	}
	payload.DokumentasiURLs = normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)
	if err := validateSitekadCapaianKendalaPayload(payload); err != nil {
		return err
	}

	item, found, err := s.sitekad.UpdateCapaianKendala(c.Request().Context(), id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data capaian dan kendala gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data capaian/kendala atau kelompok binaan tidak ditemukan")
	}

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
	parsed, err := url.ParseRequestURI(value)
	if err != nil || parsed.Host == "" {
		return false
	}
	return parsed.Scheme == "http" || parsed.Scheme == "https"
}
