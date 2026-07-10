package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type KabKotaRepository struct {
	db *gorm.DB
}

func NewKabKotaRepository(db *gorm.DB) *KabKotaRepository {
	return &KabKotaRepository{db: db}
}

func (r *KabKotaRepository) List(ctx context.Context) ([]model.KabKota, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}

	var records []model.KabKotaEntity
	if err := db.Order("kode_wilayah ASC, nama ASC").Find(&records).Error; err != nil {
		return nil, fmt.Errorf("list kab kota: %w", err)
	}

	items := make([]model.KabKota, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToKabKota())
	}
	return items, nil
}

func (r *KabKotaRepository) Create(ctx context.Context, payload model.KabKotaPayload) (model.KabKota, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KabKota{}, err
	}

	record := model.KabKotaEntity{
		KodeWilayah: strings.TrimSpace(payload.KodeWilayah),
		Nama:        strings.TrimSpace(payload.Nama),
		Provinsi:    strings.TrimSpace(payload.Provinsi),
	}
	if err := db.Create(&record).Error; err != nil {
		return model.KabKota{}, fmt.Errorf("create kab kota: %w", normalizeWriteError(err))
	}
	return record.ToKabKota(), nil
}

func (r *KabKotaRepository) Update(ctx context.Context, id int64, payload model.KabKotaPayload) (model.KabKota, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KabKota{}, false, err
	}

	var record model.KabKotaEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.KabKotaEntity{}).
			Where("id = ?", id).
			Updates(map[string]any{
				"kode_wilayah": strings.TrimSpace(payload.KodeWilayah),
				"nama":         strings.TrimSpace(payload.Nama),
				"provinsi":     strings.TrimSpace(payload.Provinsi),
				"updated_at":   gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return normalizeWriteError(result.Error)
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return tx.First(&record, "id = ?", id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.KabKota{}, false, nil
	}
	if err != nil {
		return model.KabKota{}, false, fmt.Errorf("update kab kota: %w", err)
	}

	return record.ToKabKota(), true, nil
}

func (r *KabKotaRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.KabKotaEntity{}, "id = ?", id)
	if result.Error != nil {
		return false, fmt.Errorf("delete kab kota: %w", result.Error)
	}
	return result.RowsAffected > 0, nil
}

func (r *KabKotaRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
