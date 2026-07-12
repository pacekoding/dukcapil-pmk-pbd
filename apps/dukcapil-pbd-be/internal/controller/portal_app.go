package controller

import (
	"context"
	"net/http"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type PortalAppStore interface {
	ListStatuses(ctx context.Context) ([]model.PortalAppStatusItem, error)
	UpdateStatuses(ctx context.Context, payload model.PortalAppStatusPayload) ([]model.PortalAppStatusItem, error)
}

type PortalAppController struct {
	portalApps PortalAppStore
}

func NewPortalAppController(portalApps PortalAppStore) *PortalAppController {
	return &PortalAppController{portalApps: portalApps}
}

func (p *PortalAppController) WebsiteStatuses(c echo.Context) error {
	response, err := p.portalApps.ListStatuses(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "status portal aplikasi gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (p *PortalAppController) AdminStatuses(c echo.Context) error {
	response, err := p.portalApps.ListStatuses(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "status portal aplikasi gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (p *PortalAppController) UpdateAdminStatuses(c echo.Context) error {
	var payload model.PortalAppStatusPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload status portal aplikasi tidak valid")
	}

	response, err := p.portalApps.UpdateStatuses(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return jsonData(c, http.StatusOK, response)
}
