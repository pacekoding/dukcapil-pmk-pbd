package router

import (
	"net/http"

	"dukcapil-pbd-be/internal/controller"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
	echomiddleware "github.com/labstack/echo/middleware"
)

type Config struct {
	AllowedOrigin  string
	Health         *controller.HealthController
	Auth           *controller.AuthController
	Dashboard      *controller.DashboardController
	DataWilayah    *controller.DataWilayahController
	SSD            *controller.SSDController
	Subkegiatan    *controller.SubkegiatanController
	Realisasi      *controller.RealisasiSubkegiatanController
	Users          *controller.UserController
	Website        *controller.WebsiteController
	AuthMiddleware *authmiddleware.AuthMiddleware
}

func New(config Config) *echo.Echo {
	e := echo.New()
	e.HideBanner = true

	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins: []string{config.AllowedOrigin},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
	}))

	e.GET("/health", config.Health.Show)
	e.Static("/uploads", "uploads")

	api := e.Group("/api/v1")
	api.GET("/health", config.Health.Show)
	api.POST("/auth/login", config.Auth.Login)

	adminRoles := []model.Role{
		model.RoleSuperAdmin,
		model.RoleAdminDukcapil,
		model.RoleAdminPMK,
		model.RoleAdminSekretariat,
	}
	protected := api.Group("", config.AuthMiddleware.RequireRoles(adminRoles...))
	protected.GET("/auth/me", config.Auth.Me)
	protected.POST("/account/change-password", config.Users.ChangePassword)
	protected.GET("/dashboard", config.Dashboard.Overview)
	protected.GET("/data-wilayah", config.DataWilayah.List)
	protected.PUT("/data-wilayah/:id", config.DataWilayah.Update)
	protected.GET("/ssd", config.SSD.List)
	protected.GET("/ssd/:id", config.SSD.Detail)
	protected.POST("/ssd/import", config.SSD.Import)
	protected.PUT("/ssd/:id", config.SSD.Update)
	protected.PATCH("/ssd/:id/status", config.SSD.SetStatus)
	protected.GET("/subkegiatan", config.Subkegiatan.List)
	protected.POST("/subkegiatan", config.Subkegiatan.Create)
	protected.PUT("/subkegiatan/:id", config.Subkegiatan.Update)
	protected.DELETE("/subkegiatan/:id", config.Subkegiatan.Delete)
	protected.GET("/realisasi-subkegiatan", config.Realisasi.List)
	protected.POST("/realisasi-subkegiatan", config.Realisasi.Create)
	protected.GET("/realisasi-subkegiatan/:id", config.Realisasi.Detail)
	protected.PUT("/realisasi-subkegiatan/:id", config.Realisasi.Update)
	protected.DELETE("/realisasi-subkegiatan/:id", config.Realisasi.Delete)
	protected.POST("/realisasi-subkegiatan/:id/foto", config.Realisasi.UploadFoto)
	protected.POST("/realisasi-subkegiatan/:id/dokumen", config.Realisasi.UploadDokumen)

	superAdmin := api.Group("", config.AuthMiddleware.RequireRoles(model.RoleSuperAdmin))
	superAdmin.GET("/users", config.Users.List)
	superAdmin.POST("/users", config.Users.Create)
	superAdmin.PUT("/users/:id", config.Users.Update)
	superAdmin.DELETE("/users/:id", config.Users.Delete)
	superAdmin.POST("/users/:id/reset-password", config.Users.ResetPassword)

	website := api.Group("/website")
	website.GET("/home", config.Website.Home)
	website.GET("/data-wilayah", config.DataWilayah.WebsiteList)
	website.GET("/profile", config.Website.Profile)

	return e
}
