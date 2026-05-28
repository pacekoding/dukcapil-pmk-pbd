package controller

import (
	"context"
	"net/http"
	"time"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
	"gorm.io/gorm"
)

type HealthController struct {
	db *gorm.DB
}

func NewHealthController(db *gorm.DB) *HealthController {
	return &HealthController{db: db}
}

func (h *HealthController) Show(c echo.Context) error {
	response := model.HealthResponse{
		Status:   "ok",
		Service:  "dukcapil-pbd-be",
		Time:     time.Now().UTC().Format(time.RFC3339),
		Database: "not_configured",
	}
	statusCode := http.StatusOK

	if h.db != nil {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 2*time.Second)
		defer cancel()

		sqlDB, err := h.db.DB()
		if err != nil {
			response.Status = "degraded"
			response.Database = "error"
			statusCode = http.StatusServiceUnavailable
		} else if err := sqlDB.PingContext(ctx); err != nil {
			response.Status = "degraded"
			response.Database = "error"
			statusCode = http.StatusServiceUnavailable
		} else {
			response.Database = "ok"
		}
	}

	return jsonData(c, statusCode, response)
}
