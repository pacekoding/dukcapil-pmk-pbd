package model

import (
	"time"

	"github.com/lib/pq"
)

type Role string

const (
	RoleSuperAdmin       Role = "superadmin"
	RoleAdminDukcapil    Role = "admin_dukcapil"
	RoleAdminPMK         Role = "admin_pmk"
	RoleAdminSekretariat Role = "admin_sekretariat"
)

func (r Role) Valid() bool {
	switch r {
	case RoleSuperAdmin, RoleAdminDukcapil, RoleAdminPMK, RoleAdminSekretariat:
		return true
	default:
		return false
	}
}

type User struct {
	Username     string   `json:"username"`
	Name         string   `json:"name"`
	Role         Role     `json:"role"`
	SystemAccess []string `json:"systemAccess"`
}

type AdminUserEntity struct {
	ID           int64          `gorm:"primaryKey;column:id"`
	Username     string         `gorm:"column:username"`
	FullName     string         `gorm:"column:full_name"`
	Role         Role           `gorm:"column:role"`
	SystemAccess pq.StringArray `gorm:"type:text[];column:system_access"`
	PasswordHash string         `gorm:"column:password_hash"`
	IsActive     bool           `gorm:"column:is_active"`
	CreatedAt    time.Time      `gorm:"column:created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at"`
}

func (AdminUserEntity) TableName() string {
	return "admin_users"
}

func (u AdminUserEntity) ToUser() User {
	return User{
		Username:     u.Username,
		Name:         u.FullName,
		Role:         u.Role,
		SystemAccess: []string(u.SystemAccess),
	}
}

func (u AdminUserEntity) ToAdminUser() AdminUser {
	return AdminUser{
		ID:           u.ID,
		Username:     u.Username,
		Name:         u.FullName,
		Role:         u.Role,
		SystemAccess: []string(u.SystemAccess),
		IsActive:     u.IsActive,
		CreatedAt:    formatJSONTime(u.CreatedAt),
		UpdatedAt:    formatJSONTime(u.UpdatedAt),
	}
}

type AdminUser struct {
	ID           int64    `json:"id"`
	Username     string   `json:"username"`
	Name         string   `json:"name"`
	Role         Role     `json:"role"`
	SystemAccess []string `json:"systemAccess"`
	IsActive     bool     `json:"isActive"`
	CreatedAt    string   `json:"createdAt"`
	UpdatedAt    string   `json:"updatedAt"`
}

type CreateAdminUserRequest struct {
	Username     string   `json:"username"`
	Name         string   `json:"name"`
	Role         Role     `json:"role"`
	SystemAccess []string `json:"systemAccess"`
	Password     string   `json:"password"`
	IsActive     bool     `json:"isActive"`
}

type UpdateAdminUserRequest struct {
	Username     string   `json:"username"`
	Name         string   `json:"name"`
	Role         Role     `json:"role"`
	SystemAccess []string `json:"systemAccess"`
	IsActive     bool     `json:"isActive"`
}

type ResetPasswordRequest struct {
	NewPassword string `json:"newPassword"`
}

type LoginRequest struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	TahunAnggaran string `json:"tahunAnggaran"`
}

type LoginResponse struct {
	Token         string `json:"token"`
	User          User   `json:"user"`
	TahunAnggaran string `json:"tahunAnggaran"`
}

type SwitchTahunAnggaranRequest struct {
	TahunAnggaran string `json:"tahunAnggaran"`
}

type SessionResponse struct {
	Authenticated bool   `json:"authenticated"`
	User          User   `json:"user"`
	TahunAnggaran string `json:"tahunAnggaran"`
}

func formatJSONTime(value time.Time) string {
	if value.IsZero() {
		return ""
	}
	return value.UTC().Format(time.RFC3339)
}
