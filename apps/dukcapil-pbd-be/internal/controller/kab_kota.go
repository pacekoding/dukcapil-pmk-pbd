package controller

import (
	"context"
	"net/http"
	"strings"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"

	"github.com/labstack/echo"
)

type KabKotaStore interface {
	List(ctx context.Context) ([]model.KabKota, error)
	Create(ctx context.Context, payload model.KabKotaPayload) (model.KabKota, error)
	Update(ctx context.Context, id int64, payload model.KabKotaPayload) (model.KabKota, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
}

type KabKotaController struct {
	kabKota KabKotaStore
}

func NewKabKotaController(kabKota KabKotaStore) *KabKotaController {
	return &KabKotaController{kabKota: kabKota}
}

func (k *KabKotaController) List(c echo.Context) error {
	items, err := k.kabKota.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kabupaten/kota gagal dimuat")
	}
	return jsonData(c, http.StatusOK, items)
}

func (k *KabKotaController) Create(c echo.Context) error {
	var payload model.KabKotaPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload kabupaten/kota tidak valid")
	}
	if err := validateKabKotaPayload(payload); err != nil {
		return err
	}

	item, err := k.kabKota.Create(c.Request().Context(), payload)
	if err != nil {
		if strings.Contains(err.Error(), repository.ErrUsernameAlreadyExists.Error()) {
			return echo.NewHTTPError(http.StatusConflict, "kode wilayah atau nama kabupaten/kota sudah digunakan")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "data kabupaten/kota gagal dibuat")
	}
	return jsonData(c, http.StatusCreated, item)
}

func (k *KabKotaController) Update(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}

	var payload model.KabKotaPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload kabupaten/kota tidak valid")
	}
	if err := validateKabKotaPayload(payload); err != nil {
		return err
	}

	item, found, err := k.kabKota.Update(c.Request().Context(), id, payload)
	if err != nil {
		if strings.Contains(err.Error(), repository.ErrUsernameAlreadyExists.Error()) {
			return echo.NewHTTPError(http.StatusConflict, "kode wilayah atau nama kabupaten/kota sudah digunakan")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "data kabupaten/kota gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kabupaten/kota tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, item)
}

func (k *KabKotaController) Delete(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}

	found, err := k.kabKota.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kabupaten/kota gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data kabupaten/kota tidak ditemukan")
	}
	return c.NoContent(http.StatusNoContent)
}

func validateKabKotaPayload(payload model.KabKotaPayload) error {
	if strings.TrimSpace(payload.KodeWilayah) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kode wilayah wajib diisi")
	}
	if strings.TrimSpace(payload.Nama) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama kabupaten/kota wajib diisi")
	}
	if strings.TrimSpace(payload.Provinsi) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "provinsi wajib diisi")
	}
	return nil
}
