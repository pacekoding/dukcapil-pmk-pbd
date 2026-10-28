package controller

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type DataKampungStore interface {
	List(ctx context.Context, params model.DataKampungListParams) (model.DataKampungListResponse, error)
	Get(ctx context.Context, tahunAnggaran string, id int64) (model.DataKampungData, bool, error)
	Create(ctx context.Context, tahunAnggaran string, payload model.DataKampungPayload) (model.DataKampungData, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.DataKampungPayload) (model.DataKampungData, bool, error)
	Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error)
}

func (s *DataKampungController) Detail(c echo.Context) error {
	tahunAnggaran, err := authenticatedTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := dataKampungID(c)
	if err != nil {
		return err
	}

	item, found, err := s.dataKampung.Get(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kampung gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kampung tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

type DataKampungController struct {
	dataKampung DataKampungStore
}

func NewDataKampungController(dataKampung DataKampungStore) *DataKampungController {
	return &DataKampungController{dataKampung: dataKampung}
}

func (s *DataKampungController) List(c echo.Context) error {
	tahunAnggaran, err := dataKampungListTahunAnggaran(c)
	if err != nil {
		return err
	}
	page, err := dataKampungPositiveQueryInt(c, "page", 1, 1_000_000)
	if err != nil {
		return err
	}
	pageSize, err := dataKampungPositiveQueryInt(c, "pageSize", 10, 100)
	if err != nil {
		return err
	}
	search := strings.TrimSpace(c.QueryParam("search"))
	if len(search) > 200 {
		return echo.NewHTTPError(http.StatusBadRequest, "pencarian data kampung terlalu panjang")
	}

	response, err := s.dataKampung.List(c.Request().Context(), model.DataKampungListParams{
		TahunAnggaran: tahunAnggaran,
		Search:        search,
		Page:          page,
		PageSize:      pageSize,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kampung gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func dataKampungPositiveQueryInt(c echo.Context, name string, fallback, maximum int) (int, error) {
	rawValue := strings.TrimSpace(c.QueryParam(name))
	if rawValue == "" {
		return fallback, nil
	}

	value, err := strconv.Atoi(rawValue)
	if err != nil || value <= 0 || value > maximum {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter "+name+" tidak valid")
	}

	return value, nil
}

func (s *DataKampungController) Create(c echo.Context) error {
	tahunAnggaran, err := authenticatedTahunAnggaran(c)
	if err != nil {
		return err
	}

	var payload model.DataKampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "data kampung tidak valid")
	}
	if err := validateDataKampungPayload(payload); err != nil {
		return err
	}

	item, err := s.dataKampung.Create(c.Request().Context(), tahunAnggaran, payload)
	if err != nil {
		return dataKampungSaveError(err, "data kampung gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *DataKampungController) Update(c echo.Context) error {
	tahunAnggaran, err := authenticatedTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := dataKampungID(c)
	if err != nil {
		return err
	}

	var payload model.DataKampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "data kampung tidak valid")
	}
	if err := validateDataKampungPayload(payload); err != nil {
		return err
	}

	item, found, err := s.dataKampung.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return dataKampungSaveError(err, "data kampung gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kampung tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *DataKampungController) Delete(c echo.Context) error {
	tahunAnggaran, err := authenticatedTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := dataKampungID(c)
	if err != nil {
		return err
	}

	found, err := s.dataKampung.Delete(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kampung gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kampung tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func dataKampungID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func dataKampungListTahunAnggaran(c echo.Context) (string, error) {
	tahunAnggaran := strings.TrimSpace(c.QueryParam("tahunAnggaran"))
	if tahunAnggaran == "" {
		tahunAnggaran = strings.TrimSpace(c.QueryParam("tahun_anggaran"))
	}
	if tahunAnggaran == "" {
		return authenticatedTahunAnggaran(c)
	}
	if tahunAnggaran != "2025" && tahunAnggaran != "2026" {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran data kampung tidak valid")
	}

	return tahunAnggaran, nil
}

func validateDataKampungPayload(payload model.DataKampungPayload) error {
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

func dataKampungSaveError(err error, fallback string) error {
	if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
		return echo.NewHTTPError(http.StatusConflict, "kode desa sudah digunakan pada tahun anggaran ini")
	}
	return echo.NewHTTPError(http.StatusInternalServerError, fallback)
}
