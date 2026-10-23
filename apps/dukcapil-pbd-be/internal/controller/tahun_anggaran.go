package controller

import (
	"net/http"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"

	"github.com/labstack/echo"
)

func authenticatedTahunAnggaran(c echo.Context) (string, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "autentikasi diperlukan")
	}

	tahunAnggaran := strings.TrimSpace(claims.TahunAnggaran)
	if !isSupportedTahunAnggaran(tahunAnggaran) {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	return tahunAnggaran, nil
}
