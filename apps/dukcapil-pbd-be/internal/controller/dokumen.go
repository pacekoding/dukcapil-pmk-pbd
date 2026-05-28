package controller

import (
	"context"
	"net/http"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type DokumenStore interface {
	List(ctx context.Context) (model.DokumenListResponse, error)
	GetByID(ctx context.Context, id int) (model.Dokumen, bool, error)
	Create(ctx context.Context, payload model.Dokumen) (model.Dokumen, error)
	Update(ctx context.Context, id int, payload model.Dokumen) (model.Dokumen, bool, error)
	Delete(ctx context.Context, id int) (model.Dokumen, bool, error)
	FormMeta(ctx context.Context) (model.DokumenFormMeta, error)
	Preview(ctx context.Context, id int) (model.DokumenPreviewData, bool, error)
}

type DokumenController struct {
	dokumen DokumenStore
}

func NewDokumenController(dokumen DokumenStore) *DokumenController {
	return &DokumenController{dokumen: dokumen}
}

func (d *DokumenController) List(c echo.Context) error {
	response, err := d.dokumen.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data dokumen gagal dimuat")
	}
	return jsonData(c, http.StatusOK, response)
}

func (d *DokumenController) Detail(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	document, found, err := d.dokumen.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data dokumen gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, document)
}

func (d *DokumenController) Create(c echo.Context) error {
	var payload model.Dokumen
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload dokumen tidak valid")
	}
	if err := validateDokumenPayload(payload); err != nil {
		return err
	}

	document, err := d.dokumen.Create(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen gagal dibuat")
	}
	return jsonData(c, http.StatusCreated, document)
}

func (d *DokumenController) Update(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	var payload model.Dokumen
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload dokumen tidak valid")
	}
	if err := validateDokumenPayload(payload); err != nil {
		return err
	}

	document, found, err := d.dokumen.Update(c.Request().Context(), id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, document)
}

func (d *DokumenController) Delete(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	document, found, err := d.dokumen.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, document)
}

func (d *DokumenController) FormMeta(c echo.Context) error {
	response, err := d.dokumen.FormMeta(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "metadata form dokumen gagal dimuat")
	}
	return jsonData(c, http.StatusOK, response)
}

func (d *DokumenController) Preview(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	data, found, err := d.dokumen.Preview(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "preview dokumen gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, data)
}

func validateDokumenPayload(payload model.Dokumen) error {
	if strings.TrimSpace(payload.NamaKegiatan) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama kegiatan wajib diisi")
	}
	if !validKegiatanValue(payload.JenisKegiatan, []string{"Sosialisasi", "Bimtek", "Pendampingan", "Monev", "Rapat"}) {
		return echo.NewHTTPError(http.StatusBadRequest, "jenis kegiatan tidak valid")
	}
	if !validKegiatanValue(payload.JenisDokumen, []string{"TOR", "Laporan"}) {
		return echo.NewHTTPError(http.StatusBadRequest, "jenis dokumen tidak valid")
	}
	if strings.TrimSpace(payload.Tanggal) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "tanggal dokumen wajib diisi")
	}
	if strings.TrimSpace(payload.DibuatOleh) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pembuat dokumen wajib diisi")
	}
	return nil
}
