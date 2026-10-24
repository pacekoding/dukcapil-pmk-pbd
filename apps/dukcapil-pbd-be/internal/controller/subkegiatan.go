package controller

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"

	"github.com/labstack/echo"
)

type SubkegiatanStore interface {
	List(ctx context.Context) ([]model.Subkegiatan, error)
	Create(ctx context.Context, payload model.SubkegiatanPayload) (model.Subkegiatan, error)
	Update(ctx context.Context, id int64, payload model.SubkegiatanPayload) (model.Subkegiatan, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
}

func (s *SubkegiatanController) Update(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}
	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}
	item, found, err := s.subkegiatan.Update(c.Request().Context(), id, payload)
	if errors.Is(err, repository.ErrSubkegiatanAlreadyExists) {
		return echo.NewHTTPError(http.StatusConflict, "subkegiatan pada hierarki tersebut sudah terdaftar")
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data subkegiatan tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, item)
}

func (s *SubkegiatanController) Delete(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}
	found, err := s.subkegiatan.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data subkegiatan tidak ditemukan")
	}
	return c.NoContent(http.StatusNoContent)
}

type SubkegiatanController struct {
	subkegiatan SubkegiatanStore
}

func NewSubkegiatanController(subkegiatan SubkegiatanStore) *SubkegiatanController {
	return &SubkegiatanController{subkegiatan: subkegiatan}
}

func (s *SubkegiatanController) List(c echo.Context) error {
	items, err := s.subkegiatan.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal dimuat")
	}
	return jsonData(c, http.StatusOK, items)
}

func (s *SubkegiatanController) Create(c echo.Context) error {
	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}

	item, err := s.subkegiatan.Create(c.Request().Context(), payload)
	if errors.Is(err, repository.ErrSubkegiatanAlreadyExists) {
		return echo.NewHTTPError(http.StatusConflict, "subkegiatan pada hierarki tersebut sudah terdaftar")
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal disimpan")
	}
	return jsonData(c, http.StatusCreated, item)
}

func validateSubkegiatanPayload(payload model.SubkegiatanPayload) error {
	fields := []struct {
		label string
		value string
	}{
		{label: "bidang", value: payload.Bidang},
		{label: "program", value: payload.Program},
		{label: "kegiatan", value: payload.Kegiatan},
		{label: "subkegiatan", value: payload.Subkegiatan},
		{label: "kinerja", value: payload.Kinerja},
		{label: "indikator", value: payload.Indikator},
		{label: "satuan", value: payload.Satuan},
		{label: "definisi operasional", value: payload.DefinisiOperasional},
	}

	for _, field := range fields {
		if strings.TrimSpace(field.value) == "" {
			return echo.NewHTTPError(http.StatusBadRequest, field.label+" wajib diisi")
		}
	}
	return nil
}
