package controller

import (
	"context"
	"net/http"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type WebsiteKegiatanStore interface {
	WebsiteHome(ctx context.Context) (model.WebsiteHomeResponse, error)
	WebsiteKegiatan(ctx context.Context) (model.WebsiteKegiatanResponse, error)
	WebsiteKegiatanDetail(ctx context.Context, id int) (model.PublicKegiatanItem, bool, error)
}

type WebsiteController struct {
	kegiatan WebsiteKegiatanStore
}

func NewWebsiteController(kegiatan WebsiteKegiatanStore) *WebsiteController {
	return &WebsiteController{kegiatan: kegiatan}
}

func (w *WebsiteController) Home(c echo.Context) error {
	response, err := w.kegiatan.WebsiteHome(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data website gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (w *WebsiteController) Kegiatan(c echo.Context) error {
	response, err := w.kegiatan.WebsiteKegiatan(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kegiatan website gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (w *WebsiteController) KegiatanDetail(c echo.Context) error {
	id, err := paramInt(c, "id")
	if err != nil {
		return err
	}

	item, found, err := w.kegiatan.WebsiteKegiatanDetail(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data kegiatan website gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
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
