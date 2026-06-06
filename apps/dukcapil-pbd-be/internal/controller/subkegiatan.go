package controller

import (
	"context"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

var subkegiatanTahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)

type SubkegiatanStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.SubkegiatanListResponse, error)
	Create(ctx context.Context, tahunAnggaran string, payload model.SubkegiatanPayload) (model.Subkegiatan, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SubkegiatanPayload) (model.Subkegiatan, bool, error)
	Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error)
}

type SubkegiatanController struct {
	subkegiatan SubkegiatanStore
}

func NewSubkegiatanController(subkegiatan SubkegiatanStore) *SubkegiatanController {
	return &SubkegiatanController{subkegiatan: subkegiatan}
}

func (s *SubkegiatanController) List(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := s.subkegiatan.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SubkegiatanController) Create(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	payload.Bidang = detectSubkegiatanBidang(payload.Kode)
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}

	item, err := s.subkegiatan.Create(c.Request().Context(), tahunAnggaran, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *SubkegiatanController) Update(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	id, err := subkegiatanID(c)
	if err != nil {
		return err
	}

	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	payload.Bidang = detectSubkegiatanBidang(payload.Kode)
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}

	item, found, err := s.subkegiatan.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "subkegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *SubkegiatanController) Delete(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	id, err := subkegiatanID(c)
	if err != nil {
		return err
	}

	found, err := s.subkegiatan.Delete(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "subkegiatan tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func subkegiatanTahunAnggaran(c echo.Context) (string, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	tahunAnggaran := strings.TrimSpace(claims.TahunAnggaran)
	if !subkegiatanTahunAnggaranPattern.MatchString(tahunAnggaran) {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	return tahunAnggaran, nil
}

func subkegiatanID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func validateSubkegiatanPayload(payload model.SubkegiatanPayload) error {
	if strings.TrimSpace(payload.Kode) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kode subkegiatan wajib diisi")
	}
	if strings.TrimSpace(payload.Nama) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama subkegiatan wajib diisi")
	}
	if !validSubkegiatanBidang(payload.Bidang) {
		return echo.NewHTTPError(http.StatusBadRequest, "bidang subkegiatan tidak valid")
	}
	for _, ssdID := range payload.SSDIDs {
		if ssdID <= 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "pilihan ssd tidak valid")
		}
	}

	return nil
}

func validSubkegiatanBidang(bidang model.SubkegiatanBidang) bool {
	switch bidang {
	case model.SubkegiatanBidangDukcapil, model.SubkegiatanBidangPMK, model.SubkegiatanBidangUmum:
		return true
	default:
		return false
	}
}

func detectSubkegiatanBidang(kode string) model.SubkegiatanBidang {
	normalized := strings.TrimSpace(kode)
	if strings.HasPrefix(normalized, "2.12.") {
		return model.SubkegiatanBidangDukcapil
	}
	if strings.HasPrefix(normalized, "2.13") {
		return model.SubkegiatanBidangPMK
	}
	return model.SubkegiatanBidangUmum
}
