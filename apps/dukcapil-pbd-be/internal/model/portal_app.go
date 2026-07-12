package model

import "time"

type PortalAppStatus string

const (
	PortalAppStatusActive      PortalAppStatus = "Aktif"
	PortalAppStatusMaintenance PortalAppStatus = "Pemeliharaan"
	PortalAppStatusInactive    PortalAppStatus = "Nonaktif"
)

func (s PortalAppStatus) Valid() bool {
	switch s {
	case PortalAppStatusActive, PortalAppStatusMaintenance, PortalAppStatusInactive:
		return true
	default:
		return false
	}
}

type PortalAppStatusItem struct {
	AccessKey string          `json:"accessKey" gorm:"column:access_key"`
	Status    PortalAppStatus `json:"status" gorm:"column:status"`
	UpdatedAt time.Time       `json:"updatedAt" gorm:"column:updated_at"`
}

type PortalAppStatusPayload struct {
	Apps []PortalAppStatusUpdateItem `json:"apps"`
}

type PortalAppStatusUpdateItem struct {
	AccessKey string          `json:"accessKey"`
	Status    PortalAppStatus `json:"status"`
}

type PortalAppStatusEntity struct {
	AccessKey string          `gorm:"primaryKey;column:access_key"`
	Status    PortalAppStatus `gorm:"column:status"`
	CreatedAt time.Time       `gorm:"column:created_at"`
	UpdatedAt time.Time       `gorm:"column:updated_at"`
}

func (PortalAppStatusEntity) TableName() string {
	return "portal_app_statuses"
}
