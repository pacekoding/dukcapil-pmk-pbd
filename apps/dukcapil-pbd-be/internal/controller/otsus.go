package controller

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"github.com/labstack/echo"
)

type OtsusController struct {
	store       *repository.OtsusRepository
	subkegiatan *repository.SubkegiatanRepository
	files       *fileasset.Service
}

func NewOtsusController(store *repository.OtsusRepository, subkegiatan *repository.SubkegiatanRepository, files *fileasset.Service) *OtsusController {
	return &OtsusController{store: store, subkegiatan: subkegiatan, files: files}
}

func otsusHTTPError(err error) error {
	switch {
	case errors.Is(err, repository.ErrOtsusInvalid):
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	case errors.Is(err, repository.ErrOtsusConflict):
		return echo.NewHTTPError(http.StatusConflict, err.Error())
	case errors.Is(err, repository.ErrOtsusNotFound):
		return echo.NewHTTPError(http.StatusNotFound, "Labelisasi Otsus tidak ditemukan pada tahun anggaran aktif.")
	default:
		return echo.NewHTTPError(http.StatusInternalServerError, "Data Labelisasi Otsus gagal diproses. Silakan coba lagi.")
	}
}

func otsusContext(c echo.Context) (int64, string, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok || claims.UserID <= 0 {
		return 0, "", echo.NewHTTPError(http.StatusUnauthorized, "sesi internal tidak valid")
	}
	year, err := authenticatedTahunAnggaran(c)
	if err != nil {
		return 0, "", err
	}
	return claims.UserID, year, nil
}

func otsusID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "ID Labelisasi Otsus tidak valid")
	}
	return id, nil
}

func (o *OtsusController) Options(c echo.Context) error {
	items, err := o.subkegiatan.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(500, "Referensi subkegiatan gagal dimuat.")
	}
	return jsonData(c, 200, items)
}
func (o *OtsusController) List(c echo.Context) error {
	_, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	items, err := o.store.List(c.Request().Context(), year, c.QueryParam("search"))
	if err != nil {
		return otsusHTTPError(err)
	}
	return jsonData(c, 200, items)
}
func (o *OtsusController) Detail(c echo.Context) error {
	_, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	item, err := o.store.Detail(c.Request().Context(), id, year)
	if err != nil {
		return otsusHTTPError(err)
	}
	return jsonData(c, 200, item)
}
func (o *OtsusController) Save(c echo.Context) error {
	user, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	var id int64
	if c.Param("id") != "" {
		id, err = otsusID(c)
		if err != nil {
			return err
		}
	}
	var p model.OtsusPayload
	if err = c.Bind(&p); err != nil {
		return echo.NewHTTPError(400, "Payload Labelisasi Otsus tidak valid.")
	}
	item, err := o.store.Save(c.Request().Context(), id, year, p, user)
	if err != nil {
		return otsusHTTPError(err)
	}
	status := 200
	if id == 0 {
		status = 201
	}
	return jsonData(c, status, item)
}
func (o *OtsusController) Delete(c echo.Context) error {
	_, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	keys, err := o.store.Delete(c.Request().Context(), id, year)
	if err != nil {
		return otsusHTTPError(err)
	}
	for _, key := range keys {
		deleteManagedStoredFile(c, o.files, key)
	}
	return c.NoContent(204)
}

func (o *OtsusController) UploadDocumentation(c echo.Context) error {
	user, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	header, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(400, "Foto wajib diunggah.")
	}
	input, err := o.files.Save(c.Request().Context(), fileasset.SaveRequest{Header: header, Kind: fileasset.KindImage, Visibility: model.FileVisibilityPrivate, Module: "otsus", RelatedType: "otsus_documentation", Category: "documentation", StorageCategory: "documentation", Year: year, UploadedBy: &user})
	if err != nil {
		return managedUploadHTTPError(err)
	}
	item, err := o.store.AddDocumentation(c.Request().Context(), id, year, c.FormValue("caption"), input, user)
	if err != nil {
		deleteManagedStoredFile(c, o.files, input.StorageKey)
		return otsusHTTPError(err)
	}
	return jsonData(c, 201, item)
}
func (o *OtsusController) DeleteDocumentation(c echo.Context) error {
	_, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	docID, err := strconv.ParseInt(c.Param("document_id"), 10, 64)
	if err != nil || docID <= 0 {
		return echo.NewHTTPError(400, "Dokumentasi tidak valid.")
	}
	key, err := o.store.DeleteDocumentation(c.Request().Context(), id, docID, year)
	if err != nil {
		return otsusHTTPError(err)
	}
	deleteManagedStoredFile(c, o.files, key)
	return c.NoContent(204)
}

func (o *OtsusController) UploadLPJ(c echo.Context) error {
	user, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	header, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(400, "File LPJ wajib diunggah.")
	}
	input, err := o.files.Save(c.Request().Context(), fileasset.SaveRequest{Header: header, Kind: fileasset.KindOtsusLPJ, Visibility: model.FileVisibilityPrivate, Module: "otsus", RelatedType: "lpj_otsus", Category: "lpj", StorageCategory: "lpj", Year: year, UploadedBy: &user})
	if err != nil {
		return managedUploadHTTPError(err)
	}
	item, oldKey, err := o.store.ReplaceLPJ(c.Request().Context(), id, year, input, user)
	if err != nil {
		deleteManagedStoredFile(c, o.files, input.StorageKey)
		return otsusHTTPError(err)
	}
	deleteManagedStoredFile(c, o.files, oldKey)
	return jsonData(c, 201, item)
}
func (o *OtsusController) DeleteLPJ(c echo.Context) error {
	_, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	key, err := o.store.DeleteLPJ(c.Request().Context(), id, year)
	if err != nil {
		return otsusHTTPError(err)
	}
	deleteManagedStoredFile(c, o.files, key)
	return c.NoContent(204)
}

func (o *OtsusController) UploadDPA(c echo.Context) error {
	user, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	jenis := strings.TrimSpace(c.FormValue("jenis"))
	header, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(400, "File DPA wajib diunggah.")
	}
	input, err := o.files.Save(c.Request().Context(), fileasset.SaveRequest{Header: header, Kind: fileasset.KindPDF, Visibility: model.FileVisibilityPrivate, Module: "otsus", RelatedType: "otsus_dpa", Category: strings.ToLower(jenis), StorageCategory: "dpa", Year: year, UploadedBy: &user})
	if err != nil {
		return managedUploadHTTPError(err)
	}
	item, err := o.store.AddDPAVersion(c.Request().Context(), id, year, jenis, c.FormValue("catatan"), input, user)
	if err != nil {
		deleteManagedStoredFile(c, o.files, input.StorageKey)
		return otsusHTTPError(err)
	}
	return jsonData(c, 201, item)
}

func (o *OtsusController) DeleteDPA(c echo.Context) error {
	_, year, err := otsusContext(c)
	if err != nil {
		return err
	}
	id, err := otsusID(c)
	if err != nil {
		return err
	}
	dpaID, err := strconv.ParseInt(c.Param("dpa_id"), 10, 64)
	if err != nil || dpaID <= 0 {
		return echo.NewHTTPError(400, "Dokumen DPA tidak valid.")
	}
	key, err := o.store.DeleteDPAVersion(c.Request().Context(), id, dpaID, year)
	if err != nil {
		return otsusHTTPError(err)
	}
	deleteManagedStoredFile(c, o.files, key)
	return c.NoContent(204)
}
