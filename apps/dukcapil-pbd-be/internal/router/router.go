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
	SSD             *controller.SSDController
	Subkegiatan     *controller.SubkegiatanController
	Documents       *controller.PelaksanaanDocumentController
	ArsipPegawai    *controller.ArsipPegawaiController
	BumKampung      *controller.BumKampungController
	Sikampung       *controller.SikampungController
	Sitekad         *controller.SitekadController
	Aspirasiku      *controller.AspirasikuController
	MacekuPKK       *controller.MacekuPKKController
	OptimaInfo      *controller.OptimaInfoController
	StoredFiles     *controller.StoredFileController
	KabKota         *controller.KabKotaController
	Users           *controller.UserController
	Website         *controller.WebsiteController
	PortalApps      *controller.PortalAppController
	OutgoingLetters *controller.OutgoingLetterController
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
	protected.GET("/ssd", config.SSD.List)
	protected.GET("/ssd/template", config.SSD.Template)
	protected.GET("/ssd/:id", config.SSD.Detail)
	protected.GET("/subkegiatan", config.Subkegiatan.List)
	protected.GET("/subkegiatan/template", config.Subkegiatan.Template)
	protected.GET("/pelaksanaan-documents", config.Documents.ListDocuments)
	protected.POST("/pelaksanaan-documents", config.Documents.UploadDocument)
	protected.PUT("/pelaksanaan-documents/:id", config.Documents.UpdateDocument)
	protected.DELETE("/pelaksanaan-documents/:id", config.Documents.DeleteDocument)
	protected.GET("/pelaksanaan-documents/:id/preview", config.Documents.PreviewDocument)
	protected.GET("/pelaksanaan-documents/:id/download", config.Documents.DownloadDocument)
	protected.HEAD("/pelaksanaan-documents/:id/preview", config.Documents.PreviewDocument)
	protected.HEAD("/pelaksanaan-documents/:id/download", config.Documents.DownloadDocument)
	protected.GET("/arsip-pegawai", config.ArsipPegawai.List)
	protected.POST("/arsip-pegawai", config.ArsipPegawai.Create)
	protected.GET("/arsip-pegawai/:id", config.ArsipPegawai.Detail)
	protected.PUT("/arsip-pegawai/:id", config.ArsipPegawai.Update)
	protected.DELETE("/arsip-pegawai/:id", config.ArsipPegawai.Delete)
	protected.POST("/arsip-pegawai/:id/documents", config.ArsipPegawai.UploadDocument)
	protected.DELETE("/arsip-pegawai/:id/documents/:document_id", config.ArsipPegawai.DeleteDocument)
	protected.GET("/arsip-pegawai/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	protected.GET("/arsip-pegawai/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
	protected.HEAD("/arsip-pegawai/:id/documents/:document_id/download", config.ArsipPegawai.DownloadDocument)
	protected.HEAD("/arsip-pegawai/:id/documents/:document_id/preview", config.ArsipPegawai.PreviewDocument)
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
	protected.POST("/sitekad", config.Sitekad.Create)
	protected.PUT("/sitekad/:id", config.Sitekad.Update)
	protected.DELETE("/sitekad/:id", config.Sitekad.Delete)
	protected.GET("/aspirasiku", config.Aspirasiku.List)
	protected.PATCH("/aspirasiku/:id/status", config.Aspirasiku.UpdateStatus)
	protected.DELETE("/aspirasiku/:id", config.Aspirasiku.Delete)

	sisurat := api.Group(
		"/outgoing-letters",
		config.AuthMiddleware.RequireRoles(adminRoles...),
		config.AuthMiddleware.RequireSystemAccess("sisurat"),
	)
	sisurat.GET("", config.OutgoingLetters.List)
	sisurat.GET("/:id", config.OutgoingLetters.Detail)
	sisurat.POST("", config.OutgoingLetters.Create)
	sisurat.PUT("/:id", config.OutgoingLetters.Update)
	sisurat.DELETE("/:id", config.OutgoingLetters.Delete)
	sisurat.GET("/:id/preview", config.OutgoingLetters.Preview)
	sisurat.GET("/:id/pdf", config.OutgoingLetters.PDF)

	maceku := api.Group(
		"/maceku-pkk",
		config.AuthMiddleware.RequireRoles(adminRoles...),
		config.AuthMiddleware.RequireSystemAccess("maceku_pkk"),
	)
	maceku.GET("", config.MacekuPKK.List)
	maceku.GET("/options", config.MacekuPKK.Options)
	maceku.GET("/:id", config.MacekuPKK.Detail)
	maceku.GET("/:id/logo", config.MacekuPKK.Logo)
	maceku.POST("", config.MacekuPKK.Create)
	maceku.PUT("/:id", config.MacekuPKK.Update)
	maceku.DELETE("/:id", config.MacekuPKK.Delete)
	maceku.POST("/:id/archives", config.MacekuPKK.UploadArchive)
	maceku.PUT("/:id/archives/:archive_id", config.MacekuPKK.UpdateArchive)
	maceku.DELETE("/:id/archives/:archive_id", config.MacekuPKK.DeleteArchive)
	maceku.GET("/:id/archives/:archive_id/download", config.MacekuPKK.DownloadArchive)
	maceku.GET("/:id/archives/:archive_id/preview", config.MacekuPKK.PreviewArchive)

	optimaInfo := api.Group(
		"/optima-info",
		config.AuthMiddleware.RequireRoles(adminRoles...),
		config.AuthMiddleware.RequireSystemAccess("optima_info"),
	)
	optimaInfo.GET("", config.OptimaInfo.List)
	optimaInfo.GET("/:id", config.OptimaInfo.Detail)
	optimaInfo.GET("/:id/preview", config.OptimaInfo.Preview)
	optimaInfo.GET("/:id/thumbnail", config.OptimaInfo.Thumbnail)
	optimaInfo.GET("/:id/attachment", config.OptimaInfo.Attachment)
	optimaInfo.POST("/:id/images", config.OptimaInfo.UploadContentImage)
	optimaInfo.DELETE("/:id/images/:file_id", config.OptimaInfo.DeleteContentImage)
	optimaInfo.POST("", config.OptimaInfo.Create)
	optimaInfo.PUT("/:id", config.OptimaInfo.Update)
	optimaInfo.DELETE("/:id", config.OptimaInfo.Delete)
	optimaInfo.POST("/:id/publish", config.OptimaInfo.Publish)
	optimaInfo.POST("/:id/unpublish", config.OptimaInfo.Unpublish)
	optimaInfo.POST("/:id/archive", config.OptimaInfo.Archive)

	legacyOptimaInfo := api.Group(
		"/op_info",
		config.AuthMiddleware.RequireRoles(adminRoles...),
		config.AuthMiddleware.RequireSystemAccess("optima_info"),
	)
	legacyOptimaInfo.GET("/:id/thumbnail", config.OptimaInfo.Thumbnail)
	legacyOptimaInfo.GET("/:id/attachment", config.OptimaInfo.Attachment)

	siber := api.Group(
		"/siber",
		config.AuthMiddleware.RequireRoles(adminRoles...),
		config.AuthMiddleware.RequireSystemAccess("siber"),
	)
	siber.GET("/data-wilayah/settings", config.DataWilayah.AdminWebsiteSettings)
	siber.GET("/data-wilayah", config.DataWilayah.SiberList)
	siber.PUT("/data-wilayah/:id", config.DataWilayah.UpdateSiberRegion)

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
	website.GET("/informasi", config.OptimaInfo.PublicList)
	website.GET("/informasi/:slug", config.OptimaInfo.PublicDetail)
	website.GET("/informasi/:slug/thumbnail", config.OptimaInfo.PublicThumbnail)
	website.GET("/informasi/:slug/attachment", config.OptimaInfo.PublicAttachment)
	website.GET("/files/:file_id/preview", config.StoredFiles.PublicPreview)
	website.GET("/files/:file_id/download", config.StoredFiles.PublicDownload)
	website.HEAD("/files/:file_id/preview", config.StoredFiles.PublicPreview)
	website.HEAD("/files/:file_id/download", config.StoredFiles.PublicDownload)

	return e
}
