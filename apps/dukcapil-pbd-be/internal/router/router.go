package router

import (
	"fmt"
	"net/http"

	"dukcapil-pbd-be/internal/controller"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
	echomiddleware "github.com/labstack/echo/middleware"
)

type Config struct {
	AllowedOrigin   string
	MaxUploadSizeMB int
	Health          *controller.HealthController
	Auth            *controller.AuthController
	DataWilayah     *controller.DataWilayahController
	ArsipPegawai    *controller.ArsipPegawaiController
	BumKampung      *controller.BumKampungController
	Sikampung       *controller.SikampungController
	Sitekad         *controller.SitekadController
	StoredFiles     *controller.StoredFileController
	KabKota         *controller.KabKotaController
	Users           *controller.UserController
	Website         *controller.WebsiteController
	PortalApps      *controller.PortalAppController
	AuthMiddleware  *authmiddleware.AuthMiddleware
}

func New(config Config) *echo.Echo {
	e := echo.New()
	e.HideBanner = true

	e.Use(echomiddleware.Recover())
	if config.MaxUploadSizeMB > 0 {
		e.Use(echomiddleware.BodyLimit(fmt.Sprintf("%dM", config.MaxUploadSizeMB+2)))
	}
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
	protected.GET("/dashboard/data-wilayah", config.DataWilayah.DashboardList)
	protected.GET("/arsipku", config.ArsipPegawai.List)
	protected.POST("/arsipku", config.ArsipPegawai.Create)
	protected.GET("/arsipku/:id", config.ArsipPegawai.Detail)
	protected.PUT("/arsipku/:id", config.ArsipPegawai.Update)
	protected.POST("/arsipku/:id/photo", config.ArsipPegawai.UploadPhoto)
	protected.DELETE("/arsipku/:id", config.ArsipPegawai.Delete)
	protected.POST("/arsipku/:id/documents", config.ArsipPegawai.UploadDocument)
	protected.PUT("/arsipku/:id/documents/:document_id", config.ArsipPegawai.UpdateDocument)
	protected.DELETE("/arsipku/:id/documents/:document_id", config.ArsipPegawai.DeleteDocument)
	protected.GET("/arsipku/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	protected.GET("/arsipku/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
	protected.HEAD("/arsipku/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	protected.HEAD("/arsipku/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
	protected.GET("/files/:file_id/preview", config.StoredFiles.Preview)
	protected.GET("/files/:file_id/download", config.StoredFiles.Download)
	protected.HEAD("/files/:file_id/preview", config.StoredFiles.Preview)
	protected.HEAD("/files/:file_id/download", config.StoredFiles.Download)
	protected.GET("/kab-kota", config.KabKota.List)
	protected.GET("/bum-kampung", config.BumKampung.List)
	protected.POST("/bum-kampung", config.BumKampung.Create)
	protected.PUT("/bum-kampung/:id", config.BumKampung.Update)
	protected.DELETE("/bum-kampung/:id", config.BumKampung.Delete)

	sikampung := api.Group(
		"/sikampung",
		config.AuthMiddleware.RequireRoles(adminRoles...),
		config.AuthMiddleware.RequireSystemAccess("sikampung"),
	)
	sikampung.GET("", config.Sikampung.List)
	sikampung.POST("", config.Sikampung.Create)
	sikampung.PUT("/:id", config.Sikampung.Update)
	sikampung.DELETE("/:id", config.Sikampung.Delete)

	protected.GET("/sitekad", config.Sitekad.List)
	protected.GET("/sitekad/options", config.Sitekad.Options)
	protected.GET("/sitekad/capaian-kendala", config.Sitekad.ListCapaianKendala)
	protected.POST("/sitekad/capaian-kendala", config.Sitekad.CreateCapaianKendala)
	protected.PUT("/sitekad/capaian-kendala/:id", config.Sitekad.UpdateCapaianKendala)
	protected.DELETE("/sitekad/capaian-kendala/:id", config.Sitekad.DeleteCapaianKendala)
	protected.POST("/sitekad", config.Sitekad.Create)
	protected.PUT("/sitekad/:id", config.Sitekad.Update)
	protected.DELETE("/sitekad/:id", config.Sitekad.Delete)
	siber := api.Group(
		"/siber",
		config.AuthMiddleware.RequireRoles(adminRoles...),
		config.AuthMiddleware.RequireSystemAccess("siber"),
	)
	siber.GET("/data-wilayah/settings", config.DataWilayah.AdminWebsiteSettings)
	siber.GET("/data-wilayah", config.DataWilayah.SiberList)
	siber.PUT("/data-wilayah/:id", config.DataWilayah.UpdateSiberRegion)

	superAdmin := api.Group("", config.AuthMiddleware.RequireRoles(model.RoleSuperAdmin))
	superAdmin.GET("/users", config.Users.List)
	superAdmin.POST("/users", config.Users.Create)
	superAdmin.PUT("/users/:id", config.Users.Update)
	superAdmin.DELETE("/users/:id", config.Users.Delete)
	superAdmin.POST("/users/:id/reset-password", config.Users.ResetPassword)
	superAdmin.GET("/portal-apps", config.PortalApps.AdminStatuses)
	superAdmin.PUT("/portal-apps", config.PortalApps.UpdateAdminStatuses)
	superAdmin.POST("/kab-kota", config.KabKota.Create)
	superAdmin.PUT("/kab-kota/:id", config.KabKota.Update)
	superAdmin.DELETE("/kab-kota/:id", config.KabKota.Delete)
	superAdmin.GET("/data-wilayah/settings", config.DataWilayah.AdminWebsiteSettings)
	superAdmin.PUT("/data-wilayah/settings", config.DataWilayah.UpdateAdminWebsiteSettings)

	website := api.Group("/website")
	website.GET("/home", config.Website.Home)
	website.GET("/portal-apps", config.PortalApps.WebsiteStatuses)
	website.GET("/data-wilayah/settings", config.DataWilayah.WebsiteSettings)
	website.GET("/data-wilayah", config.DataWilayah.WebsiteList)
	website.GET("/profile", config.Website.Profile)

	return e
}
