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
	DataWilayah    *controller.DataWilayahController
	SSD            *controller.SSDController
	Subkegiatan    *controller.SubkegiatanController
	Documents      *controller.PelaksanaanDocumentController
	BumKampung     *controller.BumKampungController
	Sitekad        *controller.SitekadController
	Aspirasiku     *controller.AspirasikuController
	KabKota        *controller.KabKotaController
	Users          *controller.UserController
	Website        *controller.WebsiteController
	PortalApps     *controller.PortalAppController
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
	protected.POST("/auth/switch-year", config.Auth.SwitchTahunAnggaran)
	protected.GET("/ssd", config.SSD.List)
	protected.GET("/ssd/template", config.SSD.Template)
	protected.GET("/ssd/:id", config.SSD.Detail)
	protected.GET("/subkegiatan", config.Subkegiatan.List)
	protected.GET("/subkegiatan/template", config.Subkegiatan.Template)
	protected.GET("/pelaksanaan-documents", config.Documents.ListDocuments)
	protected.POST("/pelaksanaan-documents", config.Documents.UploadDocument)
	protected.PUT("/pelaksanaan-documents/:id", config.Documents.UpdateDocument)
	protected.DELETE("/pelaksanaan-documents/:id", config.Documents.DeleteDocument)
	protected.GET("/pelaksanaan-documents/:id/download", config.Documents.DownloadDocument)
	protected.GET("/bum-kampung", config.BumKampung.List)
	protected.POST("/bum-kampung", config.BumKampung.Create)
	protected.PUT("/bum-kampung/:id", config.BumKampung.Update)
	protected.DELETE("/bum-kampung/:id", config.BumKampung.Delete)
	protected.GET("/sitekad", config.Sitekad.List)
	protected.GET("/sitekad/options", config.Sitekad.Options)
	protected.POST("/sitekad", config.Sitekad.Create)
	protected.PUT("/sitekad/:id", config.Sitekad.Update)
	protected.DELETE("/sitekad/:id", config.Sitekad.Delete)
	protected.GET("/aspirasiku", config.Aspirasiku.List)
	protected.PATCH("/aspirasiku/:id/status", config.Aspirasiku.UpdateStatus)
	protected.DELETE("/aspirasiku/:id", config.Aspirasiku.Delete)

	superAdmin := api.Group("", config.AuthMiddleware.RequireRoles(model.RoleSuperAdmin))
	superAdmin.POST("/ssd", config.SSD.Create)
	superAdmin.POST("/ssd/import", config.SSD.Import)
	superAdmin.PUT("/ssd/:id", config.SSD.Update)
	superAdmin.PATCH("/ssd/:id/status", config.SSD.SetStatus)
	superAdmin.POST("/subkegiatan/import", config.Subkegiatan.Import)
	superAdmin.POST("/subkegiatan", config.Subkegiatan.Create)
	superAdmin.PUT("/subkegiatan/:id", config.Subkegiatan.Update)
	superAdmin.DELETE("/subkegiatan/:id", config.Subkegiatan.Delete)
	superAdmin.GET("/users", config.Users.List)
	superAdmin.POST("/users", config.Users.Create)
	superAdmin.PUT("/users/:id", config.Users.Update)
	superAdmin.DELETE("/users/:id", config.Users.Delete)
	superAdmin.POST("/users/:id/reset-password", config.Users.ResetPassword)
	superAdmin.GET("/portal-apps", config.PortalApps.AdminStatuses)
	superAdmin.PUT("/portal-apps", config.PortalApps.UpdateAdminStatuses)
	superAdmin.GET("/kab-kota", config.KabKota.List)
	superAdmin.POST("/kab-kota", config.KabKota.Create)
	superAdmin.PUT("/kab-kota/:id", config.KabKota.Update)
	superAdmin.DELETE("/kab-kota/:id", config.KabKota.Delete)
	superAdmin.GET("/data-wilayah/settings", config.DataWilayah.AdminWebsiteSettings)
	superAdmin.PUT("/data-wilayah/settings", config.DataWilayah.UpdateAdminWebsiteSettings)

	website := api.Group("/website")
	website.GET("/home", config.Website.Home)
	website.GET("/portal-apps", config.PortalApps.WebsiteStatuses)
	website.POST("/aspirasiku", config.Aspirasiku.PublicCreate)
	website.GET("/data-wilayah/settings", config.DataWilayah.WebsiteSettings)
	website.GET("/data-wilayah", config.DataWilayah.WebsiteList)
	website.GET("/profile", config.Website.Profile)

	return e
}
