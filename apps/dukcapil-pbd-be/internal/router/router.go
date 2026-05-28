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
	Kegiatan       *controller.KegiatanController
	Dokumen        *controller.DokumenController
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
	protected.GET("/kegiatan", config.Kegiatan.List)
	protected.POST("/kegiatan", config.Kegiatan.Create)
	protected.GET("/kegiatan/:id", config.Kegiatan.Detail)
	protected.PUT("/kegiatan/:id", config.Kegiatan.Update)
	protected.DELETE("/kegiatan/:id", config.Kegiatan.Delete)
	protected.GET("/kegiatan/:id/dokumentasi", config.Kegiatan.ListDokumentasi)
	protected.POST("/kegiatan/:id/dokumentasi", config.Kegiatan.AddDokumentasi)
	protected.DELETE("/kegiatan/:id/dokumentasi/:documentationId", config.Kegiatan.DeleteDokumentasi)
	protected.GET("/dokumen", config.Dokumen.List)
	protected.POST("/dokumen", config.Dokumen.Create)
	protected.GET("/dokumen/form-meta", config.Dokumen.FormMeta)
	protected.GET("/dokumen/:id", config.Dokumen.Detail)
	protected.PUT("/dokumen/:id", config.Dokumen.Update)
	protected.DELETE("/dokumen/:id", config.Dokumen.Delete)
	protected.GET("/dokumen/:id/preview", config.Dokumen.Preview)

	superAdmin := api.Group("", config.AuthMiddleware.RequireRoles(model.RoleSuperAdmin))
	superAdmin.GET("/users", config.Users.List)
	superAdmin.POST("/users", config.Users.Create)
	superAdmin.PUT("/users/:id", config.Users.Update)
	superAdmin.DELETE("/users/:id", config.Users.Delete)
	superAdmin.POST("/users/:id/reset-password", config.Users.ResetPassword)

	website := api.Group("/website")
	website.GET("/home", config.Website.Home)
	website.GET("/kegiatan", config.Website.Kegiatan)
	website.GET("/kegiatan/:id", config.Website.KegiatanDetail)
	website.GET("/profile", config.Website.Profile)

	return e
}
