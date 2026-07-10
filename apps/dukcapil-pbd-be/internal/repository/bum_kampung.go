package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type BumKampungRepository struct {
	db *gorm.DB
}

func NewBumKampungRepository(db *gorm.DB) *BumKampungRepository {
	return &BumKampungRepository{db: db}
}

func (r *BumKampungRepository) List(ctx context.Context, tahunAnggaran string) (model.BumKampungListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.BumKampungListResponse{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	var records []model.BumKampungEntity
	if err := db.
		Where("tahun_anggaran = ?", tahunAnggaran).
		Order("kabupaten_kota ASC, distrik ASC, kampung ASC, nama_bum_kampung ASC, id ASC").
		Find(&records).Error; err != nil {
		return model.BumKampungListResponse{}, fmt.Errorf("list bum kampung: %w", err)
	}

	items := make([]model.BumKampung, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToBumKampung())
	}

	return model.BumKampungListResponse{
		TahunAnggaran: tahunAnggaran,
		Items:         items,
	}, nil
}

func (r *BumKampungRepository) Create(ctx context.Context, tahunAnggaran string, payload model.BumKampungPayload) (model.BumKampung, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.BumKampung{}, err
	}

	record := model.BumKampungEntity{
		TahunAnggaran:  strings.TrimSpace(tahunAnggaran),
		KabupatenKota:  strings.TrimSpace(payload.KabupatenKota),
		Distrik:        strings.TrimSpace(payload.Distrik),
		Kampung:        strings.TrimSpace(payload.Kampung),
		NamaBumKampung: strings.TrimSpace(payload.NamaBumKampung),
		Kategori:       payload.Kategori,
		Status:         payload.Status,
	}
	if err := db.Create(&record).Error; err != nil {
		return model.BumKampung{}, fmt.Errorf("create bum kampung: %w", err)
	}

	return record.ToBumKampung(), nil
}

func (r *BumKampungRepository) Update(ctx context.Context, tahunAnggaran string, id int64, payload model.BumKampungPayload) (model.BumKampung, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.BumKampung{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.BumKampungEntity{}).
			Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
			Updates(map[string]any{
				"kabupaten_kota":   strings.TrimSpace(payload.KabupatenKota),
				"distrik":          strings.TrimSpace(payload.Distrik),
				"kampung":          strings.TrimSpace(payload.Kampung),
				"nama_bum_kampung": strings.TrimSpace(payload.NamaBumKampung),
				"kategori":         payload.Kategori,
				"status":           payload.Status,
				"updated_at":       gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.BumKampung{}, false, nil
	}
	if err != nil {
		return model.BumKampung{}, false, fmt.Errorf("update bum kampung: %w", err)
	}

	record, found, err := r.find(ctx, db, tahunAnggaran, id)
	if err != nil || !found {
		return model.BumKampung{}, found, err
	}
	return record.ToBumKampung(), true, nil
}

func (r *BumKampungRepository) Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.BumKampungEntity{}, "tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id)
	if result.Error != nil {
		return false, fmt.Errorf("delete bum kampung: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *BumKampungRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *BumKampungRepository) find(ctx context.Context, db *gorm.DB, tahunAnggaran string, id int64) (model.BumKampungEntity, bool, error) {
	var record model.BumKampungEntity
	if err := db.WithContext(ctx).First(&record, "tahun_anggaran = ? AND id = ?", tahunAnggaran, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.BumKampungEntity{}, false, nil
		}
		return model.BumKampungEntity{}, false, fmt.Errorf("find bum kampung: %w", err)
	}
	return record, true, nil
}
