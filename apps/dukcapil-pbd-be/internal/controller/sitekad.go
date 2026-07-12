package controller

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type SitekadStore interface {
	List(ctx context.Context) (model.SitekadPotensiKampungListResponse, error)
	Options(ctx context.Context) (model.SitekadOptionsResponse, error)
	Create(ctx context.Context, payload model.SitekadPotensiKampungPayload) (model.SitekadPotensiKampung, error)
	Update(ctx context.Context, id int64, payload model.SitekadPotensiKampungPayload) (model.SitekadPotensiKampung, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
}

type SitekadController struct {
	sitekad SitekadStore
}

func NewSitekadController(sitekad SitekadStore) *SitekadController {
	return &SitekadController{sitekad: sitekad}
}

func (s *SitekadController) List(c echo.Context) error {
	response, err := s.sitekad.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data potensi kampung gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SitekadController) Options(c echo.Context) error {
	response, err := s.sitekad.Options(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "opsi wilayah SiTEKAD gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SitekadController) Create(c echo.Context) error {
	var payload model.SitekadPotensiKampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload potensi kampung tidak valid")
	}
	if err := validateSitekadPayload(payload); err != nil {
		return err
	}

	item, err := s.sitekad.Create(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data potensi kampung gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *SitekadController) Update(c echo.Context) error {
	id, err := sitekadID(c)
	if err != nil {
		return err
	}

	var payload model.SitekadPotensiKampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload potensi kampung tidak valid")
	}
	if err := validateSitekadPayload(payload); err != nil {
		return err
	}

	item, found, err := s.sitekad.Update(c.Request().Context(), id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data potensi kampung gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data potensi kampung tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *SitekadController) Delete(c echo.Context) error {
	id, err := sitekadID(c)
	if err != nil {
		return err
	}

	found, err := s.sitekad.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data potensi kampung gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data potensi kampung tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func sitekadID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func validateSitekadPayload(payload model.SitekadPotensiKampungPayload) error {
	if strings.TrimSpace(payload.Kode) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kode data kampung wajib diisi")
	}
	if strings.TrimSpace(payload.KabupatenKota) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kabupaten wajib diisi")
	}
	if strings.TrimSpace(payload.Kampung) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kampung wajib diisi")
	}
	if !validSitekadKategoriUsaha(payload.KategoriUsaha) {
		return echo.NewHTTPError(http.StatusBadRequest, "kategori usaha tidak valid")
	}
	if payload.DanaAlokasi < 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "dana alokasi tidak boleh negatif")
	}
	if strings.TrimSpace(payload.CapaianUtama) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "capaian utama wajib diisi")
	}
	if strings.TrimSpace(payload.KendalaLapangan) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kendala lapangan wajib diisi")
	}

	return nil
}

func validSitekadKategoriUsaha(kategori model.SitekadKategoriUsaha) bool {
	switch kategori {
	case model.SitekadKategoriPertanian,
		model.SitekadKategoriPerikanan,
		model.SitekadKategoriPeternakan,
		model.SitekadKategoriPerkebunan,
		model.SitekadKategoriPariwisata,
		model.SitekadKategoriPerdagangan,
		model.SitekadKategoriKerajinan,
		model.SitekadKategoriJasa,
		model.SitekadKategoriLainnya:
		return true
	default:
		return false
	}
}
