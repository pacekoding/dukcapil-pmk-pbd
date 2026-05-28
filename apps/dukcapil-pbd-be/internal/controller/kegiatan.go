package controller

import (
	"context"
	"net/http"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type KegiatanStore interface {
	List(ctx context.Context) (model.KegiatanListResponse, error)
	GetByID(ctx context.Context, id int) (model.Kegiatan, bool, error)
	Create(ctx context.Context, payload model.Kegiatan) (model.Kegiatan, error)
	Update(ctx context.Context, id int, payload model.Kegiatan) (model.Kegiatan, bool, error)
	Delete(ctx context.Context, id int) (model.Kegiatan, bool, error)
	AddDokumentasi(ctx context.Context, id int, payload model.KegiatanDokumentasiPayload) (model.KegiatanDokumentasiItem, bool, error)
	DeleteDokumentasi(ctx context.Context, id, documentationID int) (model.KegiatanDokumentasiItem, bool, error)
}

type KegiatanController struct {
	kegiatan KegiatanStore
}

func NewKegiatanController(kegiatan KegiatanStore) *KegiatanController {
	return &KegiatanController{kegiatan: kegiatan}
}

func (k *KegiatanController) List(c echo.Context) error {
	result, err := k.kegiatan.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kegiatan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, result)
}

func (k *KegiatanController) Detail(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	item, found, err := k.kegiatan.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kegiatan gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (k *KegiatanController) Create(c echo.Context) error {
	var payload model.Kegiatan
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload kegiatan tidak valid")
	}
	if err := validateKegiatanPayload(payload); err != nil {
		return err
	}

	item, err := k.kegiatan.Create(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "kegiatan gagal dibuat")
	}
	return jsonData(c, http.StatusCreated, item)
}

func (k *KegiatanController) Update(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	var payload model.Kegiatan
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload kegiatan tidak valid")
	}
	if err := validateKegiatanPayload(payload); err != nil {
		return err
	}

	item, found, err := k.kegiatan.Update(c.Request().Context(), id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "kegiatan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (k *KegiatanController) Delete(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	item, found, err := k.kegiatan.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "kegiatan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (k *KegiatanController) ListDokumentasi(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	item, found, err := k.kegiatan.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data dokumentasi gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item.Dokumentasi)
}

func (k *KegiatanController) AddDokumentasi(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	current, found, err := k.kegiatan.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kegiatan gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}
	if current.Status != "Selesai" {
		return echo.NewHTTPError(http.StatusBadRequest, "dokumentasi hanya dapat ditambahkan untuk kegiatan selesai")
	}

	var payload model.KegiatanDokumentasiPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload dokumentasi tidak valid")
	}
	if strings.TrimSpace(payload.URL) == "" || strings.TrimSpace(payload.Caption) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "foto dan keterangan dokumentasi wajib diisi")
	}

	item, found, err := k.kegiatan.AddDokumentasi(c.Request().Context(), id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "foto dokumentasi gagal disimpan")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (k *KegiatanController) DeleteDokumentasi(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}
	documentationID, err := paramInt(c, "documentationId")
	if err != nil {
		return err
	}

	if _, found, err := k.kegiatan.GetByID(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kegiatan gagal dimuat")
	} else if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	item, found, err := k.kegiatan.DeleteDokumentasi(c.Request().Context(), id, documentationID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "foto dokumentasi gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "foto dokumentasi tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func validateKegiatanPayload(payload model.Kegiatan) error {
	if strings.TrimSpace(payload.Nama) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama kegiatan wajib diisi")
	}
	if !validKegiatanValue(payload.Jenis, []string{"Sosialisasi", "Bimtek", "Pendampingan", "Monev", "Rapat"}) {
		return echo.NewHTTPError(http.StatusBadRequest, "jenis kegiatan tidak valid")
	}
	if strings.TrimSpace(payload.Tanggal) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "tanggal kegiatan wajib diisi")
	}
	if strings.TrimSpace(payload.Lokasi) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "lokasi kegiatan wajib diisi")
	}
	if !validKegiatanValue(payload.Status, []string{"Draft", "Berjalan", "Selesai"}) {
		return echo.NewHTTPError(http.StatusBadRequest, "status kegiatan tidak valid")
	}
	if !validKegiatanValue(payload.Bidang, []string{"Dukcapil", "PMK", "Sekretariat"}) {
		return echo.NewHTTPError(http.StatusBadRequest, "bidang kegiatan tidak valid")
	}
	if strings.TrimSpace(payload.PenanggungJawab) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "penanggung jawab wajib diisi")
	}
	if payload.Peserta < 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "jumlah peserta tidak valid")
	}
	if payload.Progres < 0 || payload.Progres > 100 {
		return echo.NewHTTPError(http.StatusBadRequest, "progres kegiatan tidak valid")
	}
	if strings.TrimSpace(payload.Deskripsi) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "deskripsi kegiatan wajib diisi")
	}

	return nil
}

func validKegiatanValue(value string, allowed []string) bool {
	normalized := strings.TrimSpace(value)
	for _, item := range allowed {
		if normalized == item {
			return true
		}
	}
	return false
}
