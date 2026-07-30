package controller

import (
	"context"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

var dataWilayahTahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)
var dataWilayahRegionIDPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

const (
	dataWilayahMaxInteger     = 2147483647
	dataWilayahMaxLuasWilayah = 9999999999.99
)

type DataWilayahStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.DataWilayahResponse, error)
	UpdateDukcapil(ctx context.Context, tahunAnggaran, id string, payload model.DataWilayahDukcapilPayload) (model.RegionData, bool, error)
	GetWebsiteSettings(ctx context.Context) (model.DataWilayahWebsiteSettingsResponse, error)
	UpdateWebsiteSettings(ctx context.Context, payload model.DataWilayahWebsiteSettingsPayload) (model.DataWilayahWebsiteSettingsResponse, error)
}

type DataWilayahController struct {
	dataWilayah DataWilayahStore
}

func NewDataWilayahController(dataWilayah DataWilayahStore) *DataWilayahController {
	return &DataWilayahController{dataWilayah: dataWilayah}
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
	if tahunAnggaran == "" && len(settings.PublishedTahunAnggaran) == 0 {
		return jsonData(c, http.StatusOK, model.DataWilayahResponse{
			TahunAnggaran: "",
			Regions:       []model.RegionData{},
		})
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

func (d *DataWilayahController) SiberList(c echo.Context) error {
	tahunAnggaran, err := siberDataWilayahTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := d.dataWilayah.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data wilayah SIRBE gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (d *DataWilayahController) DashboardList(c echo.Context) error {
	tahunAnggaran, err := siberDataWilayahTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := d.dataWilayah.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data agregat dashboard gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (d *DataWilayahController) UpdateSiberRegion(c echo.Context) error {
	tahunAnggaran, err := siberDataWilayahTahunAnggaran(c)
	if err != nil {
		return err
	}

	id := strings.TrimSpace(c.Param("id"))
	if len(id) > 64 || !dataWilayahRegionIDPattern.MatchString(id) {
		return echo.NewHTTPError(http.StatusBadRequest, "id wilayah tidak valid")
	}

	var payload model.DataWilayahDukcapilPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload data wilayah Dukcapil tidak valid")
	}
	if err := validateDataWilayahDukcapilPayload(payload); err != nil {
		return err
	}

	response, found, err := d.dataWilayah.UpdateDukcapil(
		c.Request().Context(),
		tahunAnggaran,
		id,
		payload,
	)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data wilayah Dukcapil gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data wilayah tidak ditemukan")
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

func (d *DataWilayahController) AdminWebsiteSettings(c echo.Context) error {
	response, err := d.dataWilayah.GetWebsiteSettings(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "pengaturan data wilayah gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (d *DataWilayahController) UpdateAdminWebsiteSettings(c echo.Context) error {
	var payload model.DataWilayahWebsiteSettingsPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload pengaturan data wilayah tidak valid")
	}

	payload.FeaturedTahunAnggaran = strings.TrimSpace(payload.FeaturedTahunAnggaran)
	if !dataWilayahTahunAnggaranPattern.MatchString(payload.FeaturedTahunAnggaran) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun unggulan tidak valid")
	}

	for index, tahunAnggaran := range payload.PublishedTahunAnggaran {
		payload.PublishedTahunAnggaran[index] = strings.TrimSpace(tahunAnggaran)
		if !dataWilayahTahunAnggaranPattern.MatchString(payload.PublishedTahunAnggaran[index]) {
			return echo.NewHTTPError(http.StatusBadRequest, "tahun release tidak valid")
		}
	}

	response, err := d.dataWilayah.UpdateWebsiteSettings(c.Request().Context(), payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return jsonData(c, http.StatusOK, response)
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

func siberDataWilayahTahunAnggaran(c echo.Context) (string, error) {
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

func validateDataWilayahDukcapilPayload(payload model.DataWilayahDukcapilPayload) error {
	counts := []int{
		payload.Registration.PenerbitanKk,
		payload.Registration.PerubahanKk,
		payload.Registration.Kia,
		payload.Registration.NikWni,
		payload.Registration.PerekamanKtpEl,
		payload.Registration.PencetakanKtpEl,
		payload.Civil.AktaKelahiran,
		payload.Civil.AktaKematian,
		payload.Civil.AktaPerkawinan,
		payload.Civil.AktaPerceraian,
		payload.Oap.JumlahOap,
		payload.Oap.JumlahNonOap,
	}
	for _, value := range counts {
		if value < 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "nilai data wilayah tidak boleh negatif")
		}
		if int64(value) > dataWilayahMaxInteger {
			return echo.NewHTTPError(http.StatusBadRequest, "nilai data wilayah melebihi batas")
		}
	}

	if math.IsNaN(payload.Oap.LuasWilayah) || math.IsInf(payload.Oap.LuasWilayah, 0) || payload.Oap.LuasWilayah < 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "luas wilayah tidak valid")
	}
	if payload.Oap.LuasWilayah > dataWilayahMaxLuasWilayah {
		return echo.NewHTTPError(http.StatusBadRequest, "luas wilayah melebihi batas NUMERIC(12,2)")
	}
	if !hasAtMostTwoDecimalPlaces(payload.Oap.LuasWilayah) {
		return echo.NewHTTPError(http.StatusBadRequest, "luas wilayah maksimal dua angka desimal")
	}
	jumlahJiwa := int64(payload.Oap.JumlahOap) + int64(payload.Oap.JumlahNonOap)
	if jumlahJiwa > dataWilayahMaxInteger {
		return echo.NewHTTPError(http.StatusBadRequest, "jumlah jiwa melebihi batas")
	}

	return nil
}

func hasAtMostTwoDecimalPlaces(value float64) bool {
	formatted := strconv.FormatFloat(value, 'f', -1, 64)
	decimalIndex := strings.IndexByte(formatted, '.')
	return decimalIndex == -1 || len(formatted)-decimalIndex-1 <= 2
}
