package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

type healthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Time    string `json:"time"`
}

type responseEnvelope struct {
	Data any `json:"data"`
}

func main() {
	port := env("PORT", "8080")
	allowedOrigin := env("CORS_ALLOWED_ORIGIN", "*")

	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{allowedOrigin},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
	}))

	e.GET("/health", healthHandler)
	e.GET("/api/v1/health", healthHandler)

	api := e.Group("/api/v1")
	website := api.Group("/website")
	website.GET("/kegiatan", websiteKegiatanHandler)
	website.GET("/kegiatan/:id", websiteKegiatanDetailHandler)

	log.Printf("dukcapil-pbd-be listening on :%s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}

func healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, responseEnvelope{Data: healthResponse{
		Status:  "ok",
		Service: "dukcapil-pbd-be",
		Time:    time.Now().UTC().Format(time.RFC3339),
	}})
}

func websiteKegiatanHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, responseEnvelope{Data: getWebsiteKegiatanData()})
}

func websiteKegiatanDetailHandler(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid kegiatan id")
	}

	item, found := getWebsiteKegiatanDetailData(id)
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "kegiatan tidak ditemukan")
	}

	return c.JSON(http.StatusOK, responseEnvelope{Data: item})
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
