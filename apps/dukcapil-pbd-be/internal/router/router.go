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
	DataKampung     *controller.DataKampungController
	KelompokBinaan  *controller.KelompokBinaanController
	StoredFiles     *controller.StoredFileController
	KabKota         *controller.KabKotaController
	Subkegiatan     *controller.SubkegiatanController
	Organization    *controller.OrganizationController
	Otsus           *controller.OtsusController
	Users           *controller.UserController
	Website         *controller.WebsiteController
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
	pmkRoles := []model.Role{model.RoleSuperAdmin, model.RoleAdminPMK}
	dukcapilRoles := []model.Role{model.RoleSuperAdmin, model.RoleAdminDukcapil}
	sekretariatRoles := []model.Role{model.RoleSuperAdmin, model.RoleAdminSekretariat}

	protected := api.Group("", config.AuthMiddleware.RequireRoles(adminRoles...))
	protected.GET("/auth/me", config.Auth.Me)
	protected.POST("/auth/switch-year", config.Auth.SwitchTahunAnggaran)
	protected.GET("/dashboard/data-wilayah", config.DataWilayah.DashboardList)
	protected.GET("/kab-kota", config.KabKota.List)
	otsus := protected.Group("/otsus")
	otsus.GET("/options", config.Otsus.Options)
	otsus.GET("", config.Otsus.List)
	otsus.POST("", config.Otsus.Save)
	otsus.GET("/:id", config.Otsus.Detail)
	otsus.PUT("/:id", config.Otsus.Save)
	otsus.DELETE("/:id", config.Otsus.Delete)
	otsus.POST("/:id/documentations", config.Otsus.UploadDocumentation)
	otsus.DELETE("/:id/documentations/:document_id", config.Otsus.DeleteDocumentation)
	otsus.POST("/:id/lpj", config.Otsus.UploadLPJ)
	otsus.DELETE("/:id/lpj", config.Otsus.DeleteLPJ)
	otsus.POST("/:id/dpa", config.Otsus.UploadDPA)
	for _, method := range []string{http.MethodGet, http.MethodHead} {
		protected.Add(method, "/otsus-files/:file_id/preview", config.StoredFiles.Preview)
		protected.Add(method, "/otsus-files/:file_id/download", config.StoredFiles.Download)
	}
	sekretariat := api.Group("", config.AuthMiddleware.RequireRoles(sekretariatRoles...))
	sekretariat.GET("/organization/:kind", config.Organization.List)
	sekretariat.GET("/pegawai", config.ArsipPegawai.List)
	sekretariat.POST("/pegawai", config.ArsipPegawai.Create)
	sekretariat.GET("/pegawai/:id", config.ArsipPegawai.Detail)
	sekretariat.PUT("/pegawai/:id", config.ArsipPegawai.Update)
	sekretariat.POST("/pegawai/:id/photo", config.ArsipPegawai.UploadPhoto)
	sekretariat.DELETE("/pegawai/:id", config.ArsipPegawai.Delete)
	sekretariat.POST("/pegawai/:id/documents", config.ArsipPegawai.UploadDocument)
	sekretariat.PUT("/pegawai/:id/documents/:document_id", config.ArsipPegawai.UpdateDocument)
	sekretariat.DELETE("/pegawai/:id/documents/:document_id", config.ArsipPegawai.DeleteDocument)
	sekretariat.GET("/pegawai/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	sekretariat.GET("/pegawai/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
	sekretariat.HEAD("/pegawai/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	sekretariat.HEAD("/pegawai/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
	sekretariat.GET("/files/:file_id/preview", config.StoredFiles.Preview)
	sekretariat.GET("/files/:file_id/download", config.StoredFiles.Download)
	sekretariat.HEAD("/files/:file_id/preview", config.StoredFiles.Preview)
	sekretariat.HEAD("/files/:file_id/download", config.StoredFiles.Download)

	pmk := api.Group("", config.AuthMiddleware.RequireRoles(pmkRoles...))
	pmk.GET("/bum-kampung", config.BumKampung.List)
	pmk.POST("/bum-kampung", config.BumKampung.Create)
	pmk.PUT("/bum-kampung/:id", config.BumKampung.Update)
	pmk.DELETE("/bum-kampung/:id", config.BumKampung.Delete)
	pmk.GET("/data-kampung", config.DataKampung.List)
	pmk.POST("/data-kampung", config.DataKampung.Create)
	pmk.GET("/data-kampung/:id", config.DataKampung.Detail)
	pmk.PUT("/data-kampung/:id", config.DataKampung.Update)
	pmk.DELETE("/data-kampung/:id", config.DataKampung.Delete)
	pmk.GET("/kelompok-binaan", config.KelompokBinaan.List)
	pmk.GET("/kelompok-binaan/options", config.KelompokBinaan.Options)
	pmk.GET("/kelompok-binaan/capaian-kendala", config.KelompokBinaan.ListCapaianKendala)
	pmk.POST("/kelompok-binaan/capaian-kendala", config.KelompokBinaan.CreateCapaianKendala)
	pmk.PUT("/kelompok-binaan/capaian-kendala/:id", config.KelompokBinaan.UpdateCapaianKendala)
	pmk.DELETE("/kelompok-binaan/capaian-kendala/:id", config.KelompokBinaan.DeleteCapaianKendala)
	pmk.POST("/kelompok-binaan", config.KelompokBinaan.Create)
	pmk.PUT("/kelompok-binaan/:id", config.KelompokBinaan.Update)
	pmk.DELETE("/kelompok-binaan/:id", config.KelompokBinaan.Delete)

	dukcapil := api.Group(
		"/dukcapil",
		config.AuthMiddleware.RequireRoles(dukcapilRoles...),
	)
	dukcapil.GET("/data-wilayah", config.DataWilayah.DukcapilList)
	dukcapil.PUT("/data-wilayah/:id", config.DataWilayah.UpdateDukcapilRegion)
	dukcapil.GET("/pendaftaran-penduduk", config.DataWilayah.PopulationRegistrationList)
	dukcapil.GET("/pendaftaran-penduduk/:id", config.DataWilayah.PopulationRegistrationDetail)
	dukcapil.PUT("/pendaftaran-penduduk/:id", config.DataWilayah.UpdatePopulationRegistration)
	dukcapil.GET("/pencatatan-sipil", config.DataWilayah.CivilRegistrationList)
	dukcapil.GET("/pencatatan-sipil/:id", config.DataWilayah.CivilRegistrationDetail)
	dukcapil.PUT("/pencatatan-sipil/:id", config.DataWilayah.UpdateCivilRegistration)

	superAdmin := api.Group("", config.AuthMiddleware.RequireRoles(model.RoleSuperAdmin))
	superAdmin.GET("/users", config.Users.List)
	superAdmin.POST("/users", config.Users.Create)
	superAdmin.PUT("/users/:id", config.Users.Update)
	superAdmin.DELETE("/users/:id", config.Users.Delete)
	superAdmin.POST("/users/:id/reset-password", config.Users.ResetPassword)
	superAdmin.POST("/kab-kota", config.KabKota.Create)
	superAdmin.PUT("/kab-kota/:id", config.KabKota.Update)
	superAdmin.DELETE("/kab-kota/:id", config.KabKota.Delete)
	superAdmin.POST("/organization/:kind", config.Organization.Save)
	superAdmin.PUT("/organization/:kind/:id", config.Organization.Save)
	superAdmin.DELETE("/organization/:kind/:id", config.Organization.Delete)
	superAdmin.GET("/subkegiatan", config.Subkegiatan.List)
	superAdmin.POST("/subkegiatan", config.Subkegiatan.Create)
	superAdmin.PUT("/subkegiatan/:id", config.Subkegiatan.Update)
	superAdmin.DELETE("/subkegiatan/:id", config.Subkegiatan.Delete)
	superAdmin.GET("/data-wilayah/settings", config.DataWilayah.AdminWebsiteSettings)
	superAdmin.PUT("/data-wilayah/settings", config.DataWilayah.UpdateAdminWebsiteSettings)

	website := api.Group("/website")
	website.GET("/home", config.Website.Home)
	website.GET("/data-wilayah/settings", config.DataWilayah.WebsiteSettings)
	website.GET("/data-wilayah", config.DataWilayah.WebsiteList)
	website.GET("/profile", config.Website.Profile)

	return e
}
