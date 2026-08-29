package controller

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/fileasset"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type SitekadStore interface {
	List(ctx context.Context) (model.SitekadPotensiKampungListResponse, error)
	Options(ctx context.Context) (model.SitekadOptionsResponse, error)
	Create(ctx context.Context, payload model.SitekadPotensiKampungPayload) (model.SitekadPotensiKampung, error)
	Update(ctx context.Context, id int64, payload model.SitekadPotensiKampungPayload) (model.SitekadPotensiKampung, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
	ListCapaianKendala(ctx context.Context) (model.SitekadCapaianKendalaListResponse, error)
	CreateCapaianKendala(ctx context.Context, payload model.SitekadCapaianKendalaPayload, files ...model.StoredFileInput) (model.SitekadCapaianKendala, bool, error)
	UpdateCapaianKendala(ctx context.Context, id int64, payload model.SitekadCapaianKendalaPayload, files ...model.StoredFileInput) (model.SitekadCapaianKendala, bool, error)
	DeleteCapaianKendala(ctx context.Context, id int64) (bool, error)
}

type SitekadController struct {
	sitekad SitekadStore
	files   *fileasset.Service
}

func NewSitekadController(sitekad SitekadStore, files ...*fileasset.Service) *SitekadController {
	var service *fileasset.Service
	if len(files) > 0 {
		service = files[0]
	}
	return &SitekadController{sitekad: sitekad, files: service}
}

func (s *SitekadController) List(c echo.Context) error {
	response, err := s.sitekad.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SitekadController) Options(c echo.Context) error {
	response, err := s.sitekad.Options(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "opsi wilayah SITeKAD gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SitekadController) Create(c echo.Context) error {
	var payload model.SitekadPotensiKampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload kelompok binaan tidak valid")
	}
	if err := validateSitekadPayload(payload); err != nil {
		return err
	}

	item, err := s.sitekad.Create(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal dibuat")
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
		return echo.NewHTTPError(http.StatusBadRequest, "payload kelompok binaan tidak valid")
	}
	if err := validateSitekadPayload(payload); err != nil {
		return err
	}

	item, found, err := s.sitekad.Update(c.Request().Context(), id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kelompok binaan tidak ditemukan")
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
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kelompok binaan tidak ditemukan")
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
	if strings.TrimSpace(payload.Distrik) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "distrik wajib diisi")
	}
	if strings.TrimSpace(payload.Kampung) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kampung wajib diisi")
	}
	if strings.TrimSpace(payload.NamaKelompok) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama kelompok wajib diisi")
	}
	if !validSitekadKategoriUsaha(payload.KategoriUsaha) {
		return echo.NewHTTPError(http.StatusBadRequest, "kategori usaha tidak valid")
	}
	if strings.TrimSpace(payload.Komoditas) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "komoditas wajib diisi")
	}
	if payload.JumlahAnggota <= 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "jumlah anggota minimal 1 orang")
	}
	if payload.DanaAlokasi < 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "dana alokasi tidak boleh negatif")
	}
	return nil
}

func validSitekadKategoriUsaha(kategori model.SitekadKategoriUsaha) bool {
	switch kategori {
	case model.SitekadKategoriPertanian,
		model.SitekadKategoriPerikanan,
		model.SitekadKategoriPerikananDarat,
		model.SitekadKategoriPerikananLaut,
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
