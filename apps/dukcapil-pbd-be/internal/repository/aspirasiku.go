package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type AspirasikuRepository struct {
	db *gorm.DB
}

func NewAspirasikuRepository(db *gorm.DB) *AspirasikuRepository {
	return &AspirasikuRepository{db: db}
}

func (r *AspirasikuRepository) List(ctx context.Context) (model.AspirasiListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.AspirasiListResponse{}, err
	}

	var records []model.AspirasiEntity
	if err := db.Order("created_at DESC, id DESC").Find(&records).Error; err != nil {
		return model.AspirasiListResponse{}, fmt.Errorf("list aspirasi: %w", err)
	}

	items := make([]model.Aspirasi, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToAspirasi())
	}

	return model.AspirasiListResponse{Items: items}, nil
}

func (r *AspirasikuRepository) Create(ctx context.Context, payload model.AspirasiPayload) (model.Aspirasi, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Aspirasi{}, err
	}

	record := model.AspirasiEntity{
		Jenis:  payload.Jenis,
		Judul:  strings.TrimSpace(payload.Judul),
		Isi:    strings.TrimSpace(payload.Isi),
		Status: model.AspirasiStatusBaru,
	}
	if err := db.Create(&record).Error; err != nil {
		return model.Aspirasi{}, fmt.Errorf("create aspirasi: %w", err)
	}

	return record.ToAspirasi(), nil
}

func (r *AspirasikuRepository) UpdateStatus(ctx context.Context, id int64, status model.AspirasiStatus) (model.Aspirasi, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Aspirasi{}, false, err
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.AspirasiEntity{}).
			Where("id = ?", id).
			Updates(map[string]any{
				"status":     status,
				"updated_at": gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	}); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.Aspirasi{}, false, nil
		}
		return model.Aspirasi{}, false, fmt.Errorf("update aspirasi status: %w", err)
	}

	record, found, err := r.find(ctx, db, id)
	if err != nil || !found {
		return model.Aspirasi{}, found, err
	}
	return record.ToAspirasi(), true, nil
}

func (r *AspirasikuRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.AspirasiEntity{}, "id = ?", id)
	if result.Error != nil {
		return false, fmt.Errorf("delete aspirasi: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *AspirasikuRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *AspirasikuRepository) find(ctx context.Context, db *gorm.DB, id int64) (model.AspirasiEntity, bool, error) {
	var record model.AspirasiEntity
	if err := db.WithContext(ctx).First(&record, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.AspirasiEntity{}, false, nil
		}
		return model.AspirasiEntity{}, false, fmt.Errorf("find aspirasi: %w", err)
	}
	return record, true, nil
}
