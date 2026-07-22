package controller

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"

	"github.com/labstack/echo"
)

const minPasswordLength = 8

var validSystemAccess = map[string]bool{
	"sibum":         true,
	"sikampung":     true,
	"sitekad":       true,
	"aspirasiku":    true,
	"sidoka":        true,
	"sidak":         true,
	"siber":         true,
	"sisurat":       true,
	"simonev":       true,
	"optima_info":   true,
	"arsip_pegawai": true,
}

type AdminUserStore interface {
	List(ctx context.Context) ([]model.AdminUser, error)
	GetByID(ctx context.Context, id int64) (model.AdminUser, bool, error)
	UsernameExists(ctx context.Context, username string, exceptID int64) (bool, error)
	Create(ctx context.Context, request model.CreateAdminUserRequest) (model.AdminUser, error)
	Update(ctx context.Context, id int64, request model.UpdateAdminUserRequest) (model.AdminUser, bool, error)
	Delete(ctx context.Context, id int64) (model.AdminUser, bool, error)
	ResetPassword(ctx context.Context, id int64, newPassword string) (model.AdminUser, bool, error)
}

type UserController struct {
	users AdminUserStore
}

func NewUserController(users AdminUserStore) *UserController {
	return &UserController{users: users}
}

func (u *UserController) List(c echo.Context) error {
	users, err := u.users.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data user gagal dimuat")
	}

	return jsonData(c, http.StatusOK, users)
}

func (u *UserController) Create(c echo.Context) error {
	var request model.CreateAdminUserRequest
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload user tidak valid")
	}
	if err := validateCreateAdminUser(request); err != nil {
		return err
	}

	exists, err := u.users.UsernameExists(c.Request().Context(), request.Username, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "validasi username gagal")
	}
	if exists {
		return echo.NewHTTPError(http.StatusConflict, "username sudah digunakan")
	}

	user, err := u.users.Create(c.Request().Context(), request)
	if err != nil {
		if errors.Is(err, repository.ErrUsernameAlreadyExists) {
			return echo.NewHTTPError(http.StatusConflict, "username sudah digunakan")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "user gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, user)
}

func (u *UserController) Update(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}

	var request model.UpdateAdminUserRequest
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload user tidak valid")
	}
	if err := validateUpdateAdminUser(request); err != nil {
		return err
	}

	current, found, err := u.users.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data user gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "user tidak ditemukan")
	}

	if claims, ok := authmiddleware.ClaimsFromContext(c); ok && sameUsername(claims.Username, current.Username) {
		if !request.IsActive || request.Role != model.RoleSuperAdmin {
			return echo.NewHTTPError(http.StatusBadRequest, "akun sendiri tidak boleh dinonaktifkan atau diturunkan role-nya")
		}
	}

	exists, err := u.users.UsernameExists(c.Request().Context(), request.Username, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "validasi username gagal")
	}
	if exists {
		return echo.NewHTTPError(http.StatusConflict, "username sudah digunakan")
	}

	user, found, err := u.users.Update(c.Request().Context(), id, request)
	if err != nil {
		if errors.Is(err, repository.ErrUsernameAlreadyExists) {
			return echo.NewHTTPError(http.StatusConflict, "username sudah digunakan")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "user gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "user tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, user)
}

func (u *UserController) Delete(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}

	current, found, err := u.users.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data user gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "user tidak ditemukan")
	}

	if claims, ok := authmiddleware.ClaimsFromContext(c); ok && sameUsername(claims.Username, current.Username) {
		return echo.NewHTTPError(http.StatusBadRequest, "akun sendiri tidak boleh dihapus")
	}

	user, found, err := u.users.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "user gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "user tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, user)
}

func (u *UserController) ResetPassword(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}

	var request model.ResetPasswordRequest
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload reset password tidak valid")
	}
	if err := validatePassword(request.NewPassword); err != nil {
		return err
	}

	user, found, err := u.users.ResetPassword(c.Request().Context(), id, request.NewPassword)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "password gagal direset")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "user tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, user)
}

func validateCreateAdminUser(request model.CreateAdminUserRequest) error {
	if err := validateAdminUserFields(request.Username, request.Name, request.Role); err != nil {
		return err
	}
	if err := validateSystemAccess(request.SystemAccess); err != nil {
		return err
	}
	return validatePassword(request.Password)
}

func validateUpdateAdminUser(request model.UpdateAdminUserRequest) error {
	if err := validateAdminUserFields(request.Username, request.Name, request.Role); err != nil {
		return err
	}
	return validateSystemAccess(request.SystemAccess)
}

func validateAdminUserFields(username, name string, role model.Role) error {
	if strings.TrimSpace(username) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username wajib diisi")
	}
	if strings.TrimSpace(name) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama user wajib diisi")
	}
	if !validRole(role) {
		return echo.NewHTTPError(http.StatusBadRequest, "role user tidak valid")
	}
	return nil
}

func validatePassword(password string) error {
	if len(password) < minPasswordLength {
		return echo.NewHTTPError(http.StatusBadRequest, "password minimal 8 karakter")
	}
	return nil
}

func validRole(role model.Role) bool {
	return role.Valid()
}

func validateSystemAccess(values []string) error {
	for _, value := range values {
		normalized := strings.ToLower(strings.TrimSpace(value))
		if normalized == "" {
			continue
		}
		if !validSystemAccess[normalized] {
			return echo.NewHTTPError(http.StatusBadRequest, "hak akses sistem tidak valid")
		}
	}
	return nil
}

func sameUsername(left, right string) bool {
	return strings.EqualFold(strings.TrimSpace(left), strings.TrimSpace(right))
}

func paramInt64(c echo.Context, name string) (int64, error) {
	value, err := strconv.ParseInt(c.Param(name), 10, 64)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter "+name+" tidak valid")
	}
	return value, nil
}
