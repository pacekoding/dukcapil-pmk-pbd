package controller

import (
	"context"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"

	"github.com/labstack/echo"
)

var tahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)

const earliestSupportedTahunAnggaran = 2025

type UserAuthenticator interface {
	Authenticate(ctx context.Context, username, password string) (model.User, bool, error)
}

type AuthController struct {
	users  UserAuthenticator
	tokens *security.Manager
}

func NewAuthController(users UserAuthenticator, tokens *security.Manager) *AuthController {
	return &AuthController{
		users:  users,
		tokens: tokens,
	}
}

func (a *AuthController) Login(c echo.Context) error {
	var request model.LoginRequest
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload login tidak valid")
	}

	request.Username = strings.TrimSpace(request.Username)
	request.TahunAnggaran = strings.TrimSpace(request.TahunAnggaran)
	if !isSupportedTahunAnggaran(request.TahunAnggaran) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	user, ok, err := a.users.Authenticate(c.Request().Context(), request.Username, request.Password)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "login gagal diproses")
	}
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "username atau password salah")
	}

	token, err := a.tokens.Issue(user, request.TahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "token login gagal dibuat")
	}

	return jsonData(c, http.StatusOK, model.LoginResponse{
		Token:         token,
		User:          user,
		TahunAnggaran: request.TahunAnggaran,
	})
}

func (a *AuthController) Me(c echo.Context) error {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	return jsonData(c, http.StatusOK, model.SessionResponse{
		Authenticated: true,
		User: model.User{
			ID:           claims.UserID,
			Username:     claims.Username,
			Name:         claims.Name,
			Role:         claims.Role,
			SystemAccess: claims.SystemAccess,
			RegionScope:  claims.RegionScope,
		},
		TahunAnggaran: claims.TahunAnggaran,
	})
}

func (a *AuthController) SwitchTahunAnggaran(c echo.Context) error {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	var request model.SwitchTahunAnggaranRequest
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload tahun anggaran tidak valid")
	}

	request.TahunAnggaran = strings.TrimSpace(request.TahunAnggaran)
	if !isSupportedTahunAnggaran(request.TahunAnggaran) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	user := model.User{
		ID:           claims.UserID,
		Username:     claims.Username,
		Name:         claims.Name,
		Role:         claims.Role,
		SystemAccess: claims.SystemAccess,
		RegionScope:  claims.RegionScope,
	}
	token, err := a.tokens.Issue(user, request.TahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "token login gagal dibuat")
	}

	return jsonData(c, http.StatusOK, model.LoginResponse{
		Token:         token,
		User:          user,
		TahunAnggaran: request.TahunAnggaran,
	})
}

func isSupportedTahunAnggaran(value string) bool {
	if !tahunAnggaranPattern.MatchString(value) {
		return false
	}

	year, err := strconv.Atoi(value)
	return err == nil && year >= earliestSupportedTahunAnggaran
}
