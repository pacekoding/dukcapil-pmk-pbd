package controller

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type BumKampungStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.BumKampungListResponse, error)
	Create(ctx context.Context, tahunAnggaran string, payload model.BumKampungPayload) (model.BumKampung, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.BumKampungPayload) (model.BumKampung, bool, error)
	Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error)
}

type BumKampungController struct {
	bumKampung BumKampungStore
}

func NewBumKampungController(bumKampung BumKampungStore) *BumKampungController {
	return &BumKampungController{bumKampung: bumKampung}
}

func (b *BumKampungController) List(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := b.bumKampung.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data bum kampung gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (b *BumKampungController) Create(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	var payload model.BumKampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload bum kampung tidak valid")
	}
	if err := validateBumKampungPayload(payload); err != nil {
		return err
	}

	item, err := b.bumKampung.Create(c.Request().Context(), tahunAnggaran, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data bum kampung gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (b *BumKampungController) Update(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := bumKampungID(c)
	if err != nil {
		return err
	}

	var payload model.BumKampungPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload bum kampung tidak valid")
	}
	if err := validateBumKampungPayload(payload); err != nil {
		return err
	}

	item, found, err := b.bumKampung.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data bum kampung gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data bum kampung tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (b *BumKampungController) Delete(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := bumKampungID(c)
	if err != nil {
		return err
	}

	found, err := b.bumKampung.Delete(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data bum kampung gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data bum kampung tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func bumKampungID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func validateBumKampungPayload(payload model.BumKampungPayload) error {
	if strings.TrimSpace(payload.KabupatenKota) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kabupaten/kota wajib diisi")
	}
	if strings.TrimSpace(payload.Distrik) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "distrik wajib diisi")
	}
	if strings.TrimSpace(payload.Kampung) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kampung wajib diisi")
	}
	if strings.TrimSpace(payload.NamaBumKampung) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama bum kampung wajib diisi")
	}
	if !validBumKampungKategori(payload.Kategori) {
		return echo.NewHTTPError(http.StatusBadRequest, "kategori bum kampung tidak valid")
	}
	if !validBumKampungStatus(payload.Status) {
		return echo.NewHTTPError(http.StatusBadRequest, "status bum kampung tidak valid")
	}

	return nil
}

func validBumKampungKategori(kategori model.BumKampungKategori) bool {
	switch kategori {
	case model.BumKampungKategoriMandiri, model.BumKampungKategoriBersama:
		return true
	default:
		return false
	}
}

func validBumKampungStatus(status model.BumKampungStatus) bool {
	switch status {
	case model.BumKampungStatusDokumenBadanHukumTerverifikasi,
		model.BumKampungStatusNamaTerverifikasi,
		model.BumKampungStatusPerbaikanDokumenBadanHukum,
		model.BumKampungStatusPerbaikanNama:
		return true
	default:
		return false
	}
}
