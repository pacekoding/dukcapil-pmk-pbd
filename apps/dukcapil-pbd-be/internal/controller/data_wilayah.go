package controller

import (
	"context"
	"net/http"
	"regexp"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

var dataWilayahTahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)

type DataWilayahStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.DataWilayahResponse, error)
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
