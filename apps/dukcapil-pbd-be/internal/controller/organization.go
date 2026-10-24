package controller

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"github.com/labstack/echo"
)

type OrganizationStore interface {
	List(context.Context, model.OrganizationKind, model.OrganizationListParams) ([]model.OrganizationItem, error)
	Save(context.Context, model.OrganizationKind, int64, model.OrganizationPayload) (model.OrganizationItem, error)
	Delete(context.Context, model.OrganizationKind, int64) error
}
type OrganizationController struct{ store OrganizationStore }

func NewOrganizationController(store OrganizationStore) *OrganizationController {
	return &OrganizationController{store: store}
}

func organizationKind(c echo.Context) (model.OrganizationKind, error) {
	kind := model.OrganizationKind(c.Param("kind"))
	if kind.Table() == "" {
		return kind, echo.NewHTTPError(http.StatusNotFound, "master organisasi tidak ditemukan")
	}
	return kind, nil
}
func organizationID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "ID organisasi tidak valid")
	}
	return id, nil
}

func organizationQueryID(c echo.Context, key string, allowZero bool) (*int64, error) {
	value := c.QueryParam(key)
	if value == "" {
		return nil, nil
	}
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id < 0 || (!allowZero && id == 0) {
		return nil, echo.NewHTTPError(http.StatusBadRequest, key+" tidak valid")
	}
	return &id, nil
}
func organizationHTTPError(err error) error {
	switch {
	case errors.Is(err, repository.ErrOrganizationInvalid):
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	case errors.Is(err, repository.ErrOrganizationDuplicate):
		return echo.NewHTTPError(http.StatusConflict, "Nama pada struktur organisasi tersebut sudah terdaftar.")
	case errors.Is(err, repository.ErrOrganizationUsed):
		return echo.NewHTTPError(http.StatusConflict, "Data tidak dapat dihapus atau dipindahkan karena masih digunakan. Nonaktifkan data bila tidak digunakan lagi.")
	case errors.Is(err, repository.ErrOrganizationNotFound):
		return echo.NewHTTPError(http.StatusNotFound, "Data organisasi tidak ditemukan.")
	default:
		return echo.NewHTTPError(http.StatusInternalServerError, "Data organisasi gagal diproses. Silakan coba lagi.")
	}
}
func (o *OrganizationController) List(c echo.Context) error {
	kind, err := organizationKind(c)
	if err != nil {
		return err
	}
	p := model.OrganizationListParams{Search: c.QueryParam("search")}
	p.BidangID, err = organizationQueryID(c, "bidang_id", false)
	if err != nil {
		return err
	}
	p.SeksiID, err = organizationQueryID(c, "seksi_id", true)
	if err != nil {
		return err
	}
	if value := c.QueryParam("active"); value != "" {
		active, parseErr := strconv.ParseBool(value)
		if parseErr != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "status aktif tidak valid")
		}
		p.Active = &active
	}
	items, err := o.store.List(c.Request().Context(), kind, p)
	if err != nil {
		return organizationHTTPError(err)
	}
	return jsonData(c, http.StatusOK, items)
}
func (o *OrganizationController) Save(c echo.Context) error {
	kind, err := organizationKind(c)
	if err != nil {
		return err
	}
	var id int64
	if c.Param("id") != "" {
		id, err = organizationID(c)
		if err != nil {
			return err
		}
	}
	var p model.OrganizationPayload
	// New masters default to active, while explicit false is respected.
	p.IsActive = true
	if err := c.Bind(&p); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload organisasi tidak valid")
	}
	if err := repository.ValidateOrganizationPayload(kind, &p); err != nil {
		return organizationHTTPError(err)
	}
	item, err := o.store.Save(c.Request().Context(), kind, id, p)
	if err != nil {
		return organizationHTTPError(err)
	}
	status := http.StatusOK
	if id == 0 {
		status = http.StatusCreated
	}
	return jsonData(c, status, item)
}
func (o *OrganizationController) Delete(c echo.Context) error {
	kind, err := organizationKind(c)
	if err != nil {
		return err
	}
	id, err := organizationID(c)
	if err != nil {
		return err
	}
	if err := o.store.Delete(c.Request().Context(), kind, id); err != nil {
		if errors.Is(err, repository.ErrOrganizationUsed) {
			label := map[model.OrganizationKind]string{model.OrganizationFields: "Bidang", model.OrganizationSections: "Seksi", model.OrganizationPositions: "Jabatan"}[kind]
			return echo.NewHTTPError(http.StatusConflict, label+" tidak dapat dihapus karena masih digunakan.")
		}
		return organizationHTTPError(err)
	}
	return c.NoContent(http.StatusNoContent)
}
