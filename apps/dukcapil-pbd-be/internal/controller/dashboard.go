package controller

import (
	"context"
	"net/http"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type DashboardStore interface {
	Overview(ctx context.Context, tahunAnggaran string) (model.DashboardOverview, error)
}

type DashboardController struct {
	dashboard DashboardStore
}

func NewDashboardController(dashboard DashboardStore) *DashboardController {
	return &DashboardController{dashboard: dashboard}
}

func (d *DashboardController) Overview(c echo.Context) error {
	tahunAnggaran := "2026"
	if claims, ok := authmiddleware.ClaimsFromContext(c); ok && claims.TahunAnggaran != "" {
		tahunAnggaran = claims.TahunAnggaran
	}

	overview, err := d.dashboard.Overview(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "ringkasan dashboard gagal dimuat")
	}

	return jsonData(c, http.StatusOK, overview)
}
