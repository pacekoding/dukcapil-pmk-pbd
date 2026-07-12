package controller

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

const maxAspirasiIsiLength = 1000

type AspirasikuStore interface {
	List(ctx context.Context) (model.AspirasiListResponse, error)
	Create(ctx context.Context, payload model.AspirasiPayload) (model.Aspirasi, error)
	UpdateStatus(ctx context.Context, id int64, status model.AspirasiStatus) (model.Aspirasi, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
}

type AspirasikuController struct {
	aspirasiku AspirasikuStore
}

func NewAspirasikuController(aspirasiku AspirasikuStore) *AspirasikuController {
	return &AspirasikuController{aspirasiku: aspirasiku}
}

func (a *AspirasikuController) List(c echo.Context) error {
	response, err := a.aspirasiku.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data aspirasi gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (a *AspirasikuController) PublicCreate(c echo.Context) error {
	var payload model.AspirasiPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload aspirasi tidak valid")
	}
	if err := validateAspirasiPayload(payload); err != nil {
		return err
	}

	item, err := a.aspirasiku.Create(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "aspirasi gagal dikirim")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (a *AspirasikuController) UpdateStatus(c echo.Context) error {
	id, err := aspirasiID(c)
	if err != nil {
		return err
	}

	var payload model.AspirasiStatusPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload status aspirasi tidak valid")
	}
	if !payload.Status.Valid() {
		return echo.NewHTTPError(http.StatusBadRequest, "status aspirasi tidak valid")
	}

	item, found, err := a.aspirasiku.UpdateStatus(c.Request().Context(), id, payload.Status)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "status aspirasi gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "aspirasi tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (a *AspirasikuController) Delete(c echo.Context) error {
	id, err := aspirasiID(c)
	if err != nil {
		return err
	}

	found, err := a.aspirasiku.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "aspirasi gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "aspirasi tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func aspirasiID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func validateAspirasiPayload(payload model.AspirasiPayload) error {
	if !payload.Jenis.Valid() {
		return echo.NewHTTPError(http.StatusBadRequest, "jenis aspirasi tidak valid")
	}
	if len(strings.TrimSpace(payload.Judul)) > 160 {
		return echo.NewHTTPError(http.StatusBadRequest, "judul aspirasi maksimal 160 karakter")
	}
	isi := strings.TrimSpace(payload.Isi)
	if isi == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "isi aspirasi wajib diisi")
	}
	if len([]rune(isi)) > maxAspirasiIsiLength {
		return echo.NewHTTPError(http.StatusBadRequest, "isi aspirasi maksimal 1000 karakter")
	}

	return nil
}
