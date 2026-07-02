package controller

import (
	"context"
	"net/http"
	"regexp"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

var dataWilayahTahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)

type DataWilayahStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.DataWilayahResponse, error)
	Update(ctx context.Context, tahunAnggaran string, id string, payload model.RegionData) (model.RegionData, bool, error)
	GetWebsiteSettings(ctx context.Context) (model.DataWilayahWebsiteSettingsResponse, error)
	UpdateWebsiteSettings(
		ctx context.Context,
		featuredTahunAnggaran string,
		publishedTahunAnggaran []string,
	) (model.DataWilayahWebsiteSettingsResponse, error)
}

type DataWilayahController struct {
	dataWilayah DataWilayahStore
}

func NewDataWilayahController(dataWilayah DataWilayahStore) *DataWilayahController {
	return &DataWilayahController{dataWilayah: dataWilayah}
}

func (d *DataWilayahController) List(c echo.Context) error {
	tahunAnggaran, err := dashboardTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := d.dataWilayah.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data wilayah gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (d *DataWilayahController) WebsiteList(c echo.Context) error {
	settings, err := d.dataWilayah.GetWebsiteSettings(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "pengaturan data wilayah gagal dimuat")
	}

	tahunAnggaran := strings.TrimSpace(c.QueryParam("tahunAnggaran"))
	if tahunAnggaran == "" {
		tahunAnggaran = settings.FeaturedTahunAnggaran
	}
	if !dataWilayahTahunAnggaranPattern.MatchString(tahunAnggaran) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}
	if !containsDataWilayahYear(settings.PublishedTahunAnggaran, tahunAnggaran) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak dipublikasikan")
	}

	response, err := d.dataWilayah.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data wilayah gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (d *DataWilayahController) Settings(c echo.Context) error {
	response, err := d.dataWilayah.GetWebsiteSettings(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "pengaturan data wilayah gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (d *DataWilayahController) WebsiteSettings(c echo.Context) error {
	response, err := d.dataWilayah.GetWebsiteSettings(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "pengaturan data wilayah gagal dimuat")
	}

	return jsonData(c, http.StatusOK, model.DataWilayahWebsiteSettings{
		FeaturedTahunAnggaran:  response.FeaturedTahunAnggaran,
		PublishedTahunAnggaran: response.PublishedTahunAnggaran,
	})
}

func (d *DataWilayahController) UpdateSettings(c echo.Context) error {
	var payload model.DataWilayahWebsiteSettings
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload pengaturan data wilayah tidak valid")
	}
	if !dataWilayahTahunAnggaranPattern.MatchString(strings.TrimSpace(payload.FeaturedTahunAnggaran)) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun ringkasan wilayah tidak valid")
	}
	if len(payload.PublishedTahunAnggaran) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "pilih minimal satu tahun untuk ditampilkan")
	}
	for _, year := range payload.PublishedTahunAnggaran {
		if !dataWilayahTahunAnggaranPattern.MatchString(strings.TrimSpace(year)) {
			return echo.NewHTTPError(http.StatusBadRequest, "daftar tahun publik tidak valid")
		}
	}

	response, err := d.dataWilayah.UpdateWebsiteSettings(
		c.Request().Context(),
		payload.FeaturedTahunAnggaran,
		payload.PublishedTahunAnggaran,
	)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return jsonData(c, http.StatusOK, response)
}

func (d *DataWilayahController) Update(c echo.Context) error {
	tahunAnggaran, err := dashboardTahunAnggaran(c)
	if err != nil {
		return err
	}

	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	var payload model.RegionData
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload data wilayah tidak valid")
	}
	if err := validateDataWilayahPayload(payload); err != nil {
		return err
	}

	item, found, err := d.dataWilayah.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data wilayah gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data wilayah tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func dashboardTahunAnggaran(c echo.Context) (string, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	tahunAnggaran := strings.TrimSpace(claims.TahunAnggaran)
	if !dataWilayahTahunAnggaranPattern.MatchString(tahunAnggaran) {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	return tahunAnggaran, nil
}

func validateDataWilayahPayload(payload model.RegionData) error {
	if strings.TrimSpace(payload.Name) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama wilayah wajib diisi")
	}
	if strings.TrimSpace(payload.ShortName) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama singkat wilayah wajib diisi")
	}
	if !validDataWilayahValue(payload.Type, []string{"Kabupaten", "Kota"}) {
		return echo.NewHTTPError(http.StatusBadRequest, "jenis wilayah tidak valid")
	}
	if strings.TrimSpace(payload.MapLabel) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "label peta wajib diisi")
	}
	if hasNegativeDataWilayahValue(payload) {
		return echo.NewHTTPError(http.StatusBadRequest, "angka data wilayah tidak boleh negatif")
	}

	return nil
}

func validDataWilayahValue(value string, allowed []string) bool {
	normalized := strings.TrimSpace(value)
	for _, item := range allowed {
		if normalized == item {
			return true
		}
	}

	return false
}

func hasNegativeDataWilayahValue(payload model.RegionData) bool {
	values := []int{
		payload.Idm.SangatTertinggal,
		payload.Idm.Tertinggal,
		payload.Idm.Berkembang,
		payload.Idm.Maju,
		payload.Idm.Mandiri,
		payload.Registration.PenerbitanKk,
		payload.Registration.PerubahanKk,
		payload.Registration.Kia,
		payload.Registration.NikWni,
		payload.Registration.PerekamanKtpEl,
		payload.Registration.PencetakanKtpEl,
		payload.Oap.JumlahOap,
		payload.Oap.JumlahNonOap,
		payload.Oap.JumlahJiwa,
		payload.Civil.AktaKelahiran,
		payload.Civil.AktaKematian,
		payload.Civil.AktaPerkawinan,
		payload.Civil.AktaPerceraian,
	}
	for _, value := range values {
		if value < 0 {
			return true
		}
	}

	return payload.Oap.LuasWilayah < 0
}

func containsDataWilayahYear(years []string, target string) bool {
	target = strings.TrimSpace(target)
	for _, year := range years {
		if strings.TrimSpace(year) == target {
			return true
		}
	}

	return false
}
