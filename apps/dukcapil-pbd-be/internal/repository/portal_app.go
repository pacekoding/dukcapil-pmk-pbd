package repository

import (
	"context"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

var defaultPortalAppStatuses = []model.PortalAppStatusUpdateItem{
	{AccessKey: "sibum", Status: model.PortalAppStatusActive},
	{AccessKey: "sikampung", Status: model.PortalAppStatusMaintenance},
	{AccessKey: "sitekad", Status: model.PortalAppStatusActive},
	{AccessKey: "aspirasiku", Status: model.PortalAppStatusActive},
	{AccessKey: "sidoka", Status: model.PortalAppStatusMaintenance},
	{AccessKey: "sidak", Status: model.PortalAppStatusMaintenance},
	{AccessKey: "siber", Status: model.PortalAppStatusActive},
	{AccessKey: "sisurat", Status: model.PortalAppStatusActive},
	{AccessKey: "simonev", Status: model.PortalAppStatusActive},
	{AccessKey: "optima_info", Status: model.PortalAppStatusActive},
	{AccessKey: "arsip_pegawai", Status: model.PortalAppStatusMaintenance},
	{AccessKey: "maceku_pkk", Status: model.PortalAppStatusActive},
}

type PortalAppRepository struct {
	db *gorm.DB
}

func NewPortalAppRepository(db *gorm.DB) *PortalAppRepository {
	return &PortalAppRepository{db: db}
}

func (r *PortalAppRepository) ListStatuses(ctx context.Context) ([]model.PortalAppStatusItem, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}
	if err := seedPortalAppStatuses(db); err != nil {
		return nil, err
	}

	var records []model.PortalAppStatusItem
	if err := db.Table("portal_app_statuses").Select("access_key, status, updated_at").Find(&records).Error; err != nil {
		return nil, fmt.Errorf("list portal app statuses: %w", err)
	}

	byAccessKey := make(map[string]model.PortalAppStatusItem, len(records))
	for _, record := range records {
		byAccessKey[record.AccessKey] = record
	}

	result := make([]model.PortalAppStatusItem, 0, len(defaultPortalAppStatuses))
	for _, defaultItem := range defaultPortalAppStatuses {
		if item, exists := byAccessKey[defaultItem.AccessKey]; exists {
			result = append(result, item)
			continue
		}
		result = append(result, model.PortalAppStatusItem{
			AccessKey: defaultItem.AccessKey,
			Status:    defaultItem.Status,
		})
	}

	return result, nil
}

func (r *PortalAppRepository) UpdateStatuses(
	ctx context.Context,
	payload model.PortalAppStatusPayload,
) ([]model.PortalAppStatusItem, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}
	if err := seedPortalAppStatuses(db); err != nil {
		return nil, err
	}

	allowed := portalAppAccessKeySet()
	if len(payload.Apps) == 0 {
		return nil, fmt.Errorf("minimal satu status aplikasi wajib dikirim")
	}

	returnItems := make([]model.PortalAppStatusUpdateItem, 0, len(payload.Apps))
	seen := make(map[string]struct{}, len(payload.Apps))
	for _, item := range payload.Apps {
		accessKey := strings.TrimSpace(item.AccessKey)
		if _, exists := allowed[accessKey]; !exists {
			return nil, fmt.Errorf("sistem informasi tidak dikenal")
		}
		if _, duplicate := seen[accessKey]; duplicate {
			return nil, fmt.Errorf("status sistem informasi duplikat")
		}
		if !item.Status.Valid() {
			return nil, fmt.Errorf("status sistem informasi tidak valid")
		}

		returnItems = append(returnItems, model.PortalAppStatusUpdateItem{
			AccessKey: accessKey,
			Status:    item.Status,
		})
		seen[accessKey] = struct{}{}
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		for _, item := range returnItems {
			if err := tx.Model(&model.PortalAppStatusEntity{}).
				Where("access_key = ?", item.AccessKey).
				Update("status", item.Status).Error; err != nil {
				return fmt.Errorf("update portal app status: %w", err)
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return r.ListStatuses(ctx)
}

func (r *PortalAppRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func seedPortalAppStatuses(db *gorm.DB) error {
	for _, item := range defaultPortalAppStatuses {
		entity := model.PortalAppStatusEntity{
			AccessKey: item.AccessKey,
			Status:    item.Status,
		}
		if err := db.Where("access_key = ?", item.AccessKey).
			FirstOrCreate(&entity).Error; err != nil {
			return fmt.Errorf("seed portal app status: %w", err)
		}
	}
	return nil
}

func portalAppAccessKeySet() map[string]struct{} {
	result := make(map[string]struct{}, len(defaultPortalAppStatuses))
	for _, item := range defaultPortalAppStatuses {
		result[item.AccessKey] = struct{}{}
	}
	return result
}
