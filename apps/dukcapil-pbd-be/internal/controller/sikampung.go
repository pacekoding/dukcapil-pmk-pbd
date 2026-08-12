package controller

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type SikampungStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.SikampungListResponse, error)
	Create(ctx context.Context, tahunAnggaran string, payload model.SikampungPayload) (model.SikampungData, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SikampungPayload) (model.SikampungData, bool, error)
	Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error)
}

type SikampungController struct {
	sikampung SikampungStore
}

func NewSikampungController(sikampung SikampungStore) *SikampungController {
	return &SikampungController{sikampung: sikampung}
}

func (s *SikampungController) List(c echo.Context) error {
	tahunAnggaran, err := sikampungListTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := s.sikampung.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data SIKAMPUNG gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SikampungController) Create(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	var payload model.SikampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload SIKAMPUNG tidak valid")
	}
	if err := validateSikampungPayload(payload); err != nil {
		return err
	}

	item, err := s.sikampung.Create(c.Request().Context(), tahunAnggaran, payload)
	if err != nil {
		return sikampungSaveError(err, "data SIKAMPUNG gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *SikampungController) Update(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := sikampungID(c)
	if err != nil {
		return err
	}

	var payload model.SikampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload SIKAMPUNG tidak valid")
	}
	if err := validateSikampungPayload(payload); err != nil {
		return err
	}

	item, found, err := s.sikampung.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return sikampungSaveError(err, "data SIKAMPUNG gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data SIKAMPUNG tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *SikampungController) Delete(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := sikampungID(c)
	if err != nil {
		return err
	}

	found, err := s.sikampung.Delete(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data SIKAMPUNG gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data SIKAMPUNG tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func sikampungID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func sikampungListTahunAnggaran(c echo.Context) (string, error) {
	tahunAnggaran := strings.TrimSpace(c.QueryParam("tahunAnggaran"))
	if tahunAnggaran == "" {
		tahunAnggaran = strings.TrimSpace(c.QueryParam("tahun_anggaran"))
	}
	if tahunAnggaran == "" {
		return subkegiatanTahunAnggaran(c)
	}
	if tahunAnggaran != "2025" && tahunAnggaran != "2026" {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran SIKAMPUNG tidak valid")
	}

	return tahunAnggaran, nil
}

func validateSikampungPayload(payload model.SikampungPayload) error {
	if strings.TrimSpace(payload.KodeDesa) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kode desa wajib diisi")
	}
	if strings.TrimSpace(payload.Desa) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "desa wajib diisi")
	}
	if strings.TrimSpace(payload.Distrik) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "distrik wajib diisi")
	}
	if strings.TrimSpace(payload.Kabupaten) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kabupaten wajib diisi")
	}
	if !idmValueValid(payload.IKS) {
		return echo.NewHTTPError(http.StatusBadRequest, "IKS harus bernilai 0 sampai 1")
	}
	if !idmValueValid(payload.IKE) {
		return echo.NewHTTPError(http.StatusBadRequest, "IKE harus bernilai 0 sampai 1")
	}
	if !idmValueValid(payload.IKL) {
		return echo.NewHTTPError(http.StatusBadRequest, "IKL harus bernilai 0 sampai 1")
	}
	if !idmValueValid(payload.NilaiIDM) {
		return echo.NewHTTPError(http.StatusBadRequest, "nilai IDM harus bernilai 0 sampai 1")
	}
	if !payload.StatusIDM.Valid() {
		return echo.NewHTTPError(http.StatusBadRequest, "status IDM tidak valid")
	}
	return nil
}

func idmValueValid(value float64) bool {
	return value >= 0 && value <= 1
}

func sikampungSaveError(err error, fallback string) error {
	if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
		return echo.NewHTTPError(http.StatusConflict, "kode desa sudah digunakan pada tahun anggaran ini")
	}
	return echo.NewHTTPError(http.StatusInternalServerError, fallback)
}
