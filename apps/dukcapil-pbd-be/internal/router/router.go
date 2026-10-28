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
	Subkegiatan     *controller.SubkegiatanController
	Organization    *controller.OrganizationController
	Travel          *controller.TravelController
	Activities      *controller.ActivityController
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
	activities := protected.Group("/activity-executions")
	activities.GET("/options", config.Activities.Options)
	activities.GET("", config.Activities.List)
	activities.POST("", config.Activities.Save)
	activities.GET("/:id", config.Activities.Detail)
	activities.PUT("/:id", config.Activities.Save)
	activities.DELETE("/:id", config.Activities.Delete)
	activities.GET("/:id/templates/:kind", config.Activities.Template)
	activities.POST("/:id/attachments", config.Activities.Upload)
	protected.GET("/activity-documents", config.Activities.Documents)
	protected.POST("/activity-documents", config.Activities.SaveDocument)
	protected.GET("/activity-documents/:id", config.Activities.Document)
	protected.PUT("/activity-documents/:id", config.Activities.SaveDocument)
	protected.DELETE("/activity-documents/:id", config.Activities.DeleteDocument)
	protected.POST("/activity-documents/:id/:action", config.Activities.TransitionDocument)
	protected.GET("/activity-attachments", config.Activities.Attachments)
	protected.PUT("/activity-attachments/:id", config.Activities.UpdateAttachment)
	protected.DELETE("/activity-attachments/:id", config.Activities.DeleteAttachment)
	for _, method := range []string{http.MethodGet, http.MethodHead} {
		protected.Add(method, "/activity-files/:file_id/preview", config.StoredFiles.Preview)
		protected.Add(method, "/activity-files/:file_id/download", config.StoredFiles.Download)
	}
	protected.POST("/travel/:kind/:id/link-activity", config.Activities.LinkTravel)
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
	travel := protected.Group("/travel")
	travel.GET("/options", config.Travel.Options)
	travel.GET("/:kind", config.Travel.List)
	travel.GET("/:kind/:id", config.Travel.Detail)
	travel.POST("/:kind", config.Travel.Save)
	travel.PUT("/:kind/:id", config.Travel.Save)
	travel.DELETE("/:kind/:id", config.Travel.Delete)
	travel.POST("/:kind/:id/:action", config.Travel.Transition)

	sekretariat := api.Group("", config.AuthMiddleware.RequireRoles(sekretariatRoles...))
	sekretariat.GET("/organization/:kind", config.Organization.List)
	sekretariat.GET("/arsipku", config.ArsipPegawai.List)
	sekretariat.POST("/arsipku", config.ArsipPegawai.Create)
	sekretariat.GET("/arsipku/:id", config.ArsipPegawai.Detail)
	sekretariat.PUT("/arsipku/:id", config.ArsipPegawai.Update)
	sekretariat.POST("/arsipku/:id/photo", config.ArsipPegawai.UploadPhoto)
	sekretariat.DELETE("/arsipku/:id", config.ArsipPegawai.Delete)
	sekretariat.POST("/arsipku/:id/documents", config.ArsipPegawai.UploadDocument)
	sekretariat.PUT("/arsipku/:id/documents/:document_id", config.ArsipPegawai.UpdateDocument)
	sekretariat.DELETE("/arsipku/:id/documents/:document_id", config.ArsipPegawai.DeleteDocument)
	sekretariat.GET("/arsipku/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	sekretariat.GET("/arsipku/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
	sekretariat.HEAD("/arsipku/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	sekretariat.HEAD("/arsipku/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
	sekretariat.GET("/files/:file_id/preview", config.StoredFiles.Preview)
	sekretariat.GET("/files/:file_id/download", config.StoredFiles.Download)
	sekretariat.HEAD("/files/:file_id/preview", config.StoredFiles.Preview)
	sekretariat.HEAD("/files/:file_id/download", config.StoredFiles.Download)

	pmk := api.Group("", config.AuthMiddleware.RequireRoles(pmkRoles...))
	pmk.GET("/bum-kampung", config.BumKampung.List)
	pmk.POST("/bum-kampung", config.BumKampung.Create)
	pmk.PUT("/bum-kampung/:id", config.BumKampung.Update)
	pmk.DELETE("/bum-kampung/:id", config.BumKampung.Delete)
	pmk.GET("/sikampung", config.Sikampung.List)
	pmk.POST("/sikampung", config.Sikampung.Create)
	pmk.GET("/sikampung/:id", config.Sikampung.Detail)
	pmk.PUT("/sikampung/:id", config.Sikampung.Update)
	pmk.DELETE("/sikampung/:id", config.Sikampung.Delete)
	pmk.GET("/sitekad", config.Sitekad.List)
	pmk.GET("/sitekad/options", config.Sitekad.Options)
	pmk.GET("/sitekad/capaian-kendala", config.Sitekad.ListCapaianKendala)
	pmk.POST("/sitekad/capaian-kendala", config.Sitekad.CreateCapaianKendala)
	pmk.PUT("/sitekad/capaian-kendala/:id", config.Sitekad.UpdateCapaianKendala)
	pmk.DELETE("/sitekad/capaian-kendala/:id", config.Sitekad.DeleteCapaianKendala)
	pmk.POST("/sitekad", config.Sitekad.Create)
	pmk.PUT("/sitekad/:id", config.Sitekad.Update)
	pmk.DELETE("/sitekad/:id", config.Sitekad.Delete)

	siber := api.Group(
		"/siber",
		config.AuthMiddleware.RequireRoles(dukcapilRoles...),
	)
	siber.GET("/data-wilayah", config.DataWilayah.SiberList)
	siber.PUT("/data-wilayah/:id", config.DataWilayah.UpdateSiberRegion)
	siber.GET("/pendaftaran-penduduk", config.DataWilayah.PopulationRegistrationList)
	siber.GET("/pendaftaran-penduduk/:id", config.DataWilayah.PopulationRegistrationDetail)
	siber.PUT("/pendaftaran-penduduk/:id", config.DataWilayah.UpdatePopulationRegistration)
	siber.GET("/pencatatan-sipil", config.DataWilayah.CivilRegistrationList)
	siber.GET("/pencatatan-sipil/:id", config.DataWilayah.CivilRegistrationDetail)
	siber.PUT("/pencatatan-sipil/:id", config.DataWilayah.UpdateCivilRegistration)

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
