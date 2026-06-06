package controller

import (
	"net/http"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type WebsiteController struct{}

func NewWebsiteController() *WebsiteController {
	return &WebsiteController{}
}

func (w *WebsiteController) Home(c echo.Context) error {
	response := model.WebsiteHomeResponse{
		Stats: []model.WebsiteStat{
			{Label: "Wilayah", Value: "6", Description: "Kabupaten/kota Papua Barat Daya"},
			{Label: "Layanan", Value: "2", Description: "Dukcapil dan PMK"},
			{Label: "Data", Value: "Aktif", Description: "Dashboard data wilayah tersedia"},
		},
		Highlights: []model.WebsiteHighlight{
			{Title: "Administrasi Kependudukan", Description: "Pelayanan kependudukan, pencatatan sipil, dan pengelolaan data layanan publik."},
			{Title: "Pemberdayaan Masyarakat Kampung", Description: "Penguatan tata kelola kampung dan pemberdayaan masyarakat."},
			{Title: "Data Wilayah", Description: "Statistik wilayah Papua Barat Daya tersedia melalui kanal publik dan dashboard internal."},
		},
	}
	response.Hero.Eyebrow = "Portal Resmi"
	response.Hero.Title = "Dukcapil & PMK Papua Barat Daya"
	response.Hero.Description = "Portal data wilayah dan profil Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung Provinsi Papua Barat Daya."
	response.ProfileSummary.Title = "Profil Dinas Dukcapil & PMK"
	response.ProfileSummary.Description = "Dinas menyelenggarakan urusan administrasi kependudukan, pencatatan sipil, pemberdayaan masyarakat kampung, dan pengelolaan data layanan publik."

	return jsonData(c, http.StatusOK, response)
}

func (w *WebsiteController) Profile(c echo.Context) error {
	return jsonData(c, http.StatusOK, websiteProfileResponse())
}

func websiteProfileResponse() model.WebsiteProfileResponse {
	return model.WebsiteProfileResponse{
		Title:       "Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung",
		Description: "Pemerintah Provinsi Papua Barat Daya menyelenggarakan pelayanan administrasi kependudukan dan pemberdayaan masyarakat kampung secara tertib, inklusif, dan modern.",
		Visi:        "Terwujudnya pelayanan administrasi kependudukan dan pemberdayaan masyarakat kampung yang tertib, inklusif, dan berdaya saing.",
		Misi: []string{
			"Meningkatkan kualitas pelayanan administrasi kependudukan",
			"Meningkatkan digitalisasi pelayanan publik",
			"Meningkatkan kapasitas pemerintahan kampung",
			"Meningkatkan pemberdayaan masyarakat kampung",
			"Meningkatkan kualitas pengelolaan data kependudukan",
		},
		Tugas: []string{
			"Pelayanan administrasi kependudukan",
			"Pelayanan pencatatan sipil",
			"Pengelolaan data kependudukan",
			"Pembinaan pemerintahan kampung",
			"Pemberdayaan masyarakat kampung",
			"Penguatan kapasitas kelembagaan masyarakat",
		},
		Struktur: []model.StrukturOrganisasiItem{
			{ID: 1, Name: "Kepala Dinas"},
			{ID: 2, Name: "Sekretariat"},
			{ID: 3, Name: "Bidang Administrasi Kependudukan"},
			{ID: 4, Name: "Bidang Pencatatan Sipil"},
			{ID: 5, Name: "Bidang Pemberdayaan Masyarakat Kampung"},
			{ID: 6, Name: "Bidang Pengelolaan Informasi Administrasi Kependudukan"},
		},
		Wilayah: []string{
			"Kota Sorong",
			"Kabupaten Sorong",
			"Kabupaten Sorong Selatan",
			"Kabupaten Maybrat",
			"Kabupaten Tambrauw",
			"Kabupaten Raja Ampat",
		},
		Contacts: []model.ContactItem{
			{Title: "Alamat", Content: "Kantor Gubernur Papua Barat Daya, Kota Sorong, Papua Barat Daya"},
			{Title: "Email", Content: "dukcapilpmk@papuabaratdaya.go.id"},
			{Title: "Jam Pelayanan", Content: "Senin - Jumat | 08.00 - 16.00 WIT"},
		},
	}
}
