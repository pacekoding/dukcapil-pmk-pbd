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

type KelompokBinaanStore interface {
	List(ctx context.Context) (model.KelompokBinaanListResponse, error)
	Options(ctx context.Context) (model.KelompokBinaanOptionsResponse, error)
	Create(ctx context.Context, payload model.KelompokBinaanPayload) (model.KelompokBinaan, error)
	Update(ctx context.Context, id int64, payload model.KelompokBinaanPayload) (model.KelompokBinaan, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
	ListCapaianKendala(ctx context.Context) (model.CapaianKendalaListResponse, error)
	CreateCapaianKendala(ctx context.Context, payload model.CapaianKendalaPayload, files ...model.StoredFileInput) (model.CapaianKendala, bool, error)
	UpdateCapaianKendala(ctx context.Context, id int64, payload model.CapaianKendalaPayload, files ...model.StoredFileInput) (model.CapaianKendala, bool, error)
	DeleteCapaianKendala(ctx context.Context, id int64) (bool, error)
}

type KelompokBinaanController struct {
	kelompokBinaan KelompokBinaanStore
	files          *fileasset.Service
}

func NewKelompokBinaanController(kelompokBinaan KelompokBinaanStore, files ...*fileasset.Service) *KelompokBinaanController {
	var service *fileasset.Service
	if len(files) > 0 {
		service = files[0]
	}
	return &KelompokBinaanController{kelompokBinaan: kelompokBinaan, files: service}
}

func (s *KelompokBinaanController) List(c echo.Context) error {
	response, err := s.kelompokBinaan.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *KelompokBinaanController) Options(c echo.Context) error {
	response, err := s.kelompokBinaan.Options(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "opsi wilayah kelompok binaan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *KelompokBinaanController) Create(c echo.Context) error {
	var payload model.KelompokBinaanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload kelompok binaan tidak valid")
	}
	if err := validateKelompokBinaanPayload(payload); err != nil {
		return err
	}

	item, err := s.kelompokBinaan.Create(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *KelompokBinaanController) Update(c echo.Context) error {
	id, err := kelompokBinaanID(c)
	if err != nil {
		return err
	}

	var payload model.KelompokBinaanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload kelompok binaan tidak valid")
	}
	if err := validateKelompokBinaanPayload(payload); err != nil {
		return err
	}

	item, found, err := s.kelompokBinaan.Update(c.Request().Context(), id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kelompok binaan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *KelompokBinaanController) Delete(c echo.Context) error {
	id, err := kelompokBinaanID(c)
	if err != nil {
		return err
	}

	found, err := s.kelompokBinaan.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kelompok binaan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kelompok binaan tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func kelompokBinaanID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func validateKelompokBinaanPayload(payload model.KelompokBinaanPayload) error {
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
	if !validKategoriUsaha(payload.KategoriUsaha) {
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

func validKategoriUsaha(kategori model.KategoriUsaha) bool {
	switch kategori {
	case model.KategoriPertanian,
		model.KategoriPerikanan,
		model.KategoriPerikananDarat,
		model.KategoriPerikananLaut,
		model.KategoriPeternakan,
		model.KategoriPerkebunan,
		model.KategoriPariwisata,
		model.KategoriPerdagangan,
		model.KategoriKerajinan,
		model.KategoriJasa,
		model.KategoriLainnya:
		return true
	default:
		return false
	}
}
