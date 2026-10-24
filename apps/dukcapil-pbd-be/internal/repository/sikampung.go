package repository

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type SikampungRepository struct {
	db *gorm.DB
}

func NewSikampungRepository(db *gorm.DB) *SikampungRepository {
	return &SikampungRepository{db: db}
}

func (r *SikampungRepository) List(ctx context.Context, params model.SikampungListParams) (model.SikampungListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SikampungListResponse{}, err
	}

	tahunAnggaran := strings.TrimSpace(params.TahunAnggaran)
	page := max(params.Page, 1)
	pageSize := params.PageSize
	if pageSize <= 0 {
		pageSize = 10
	} else if pageSize > 100 {
		pageSize = 100
	}

	query := db.Model(&model.SikampungEntity{}).
		Where("tahun_anggaran = ?", tahunAnggaran)
	if search := strings.ToLower(strings.TrimSpace(params.Search)); search != "" {
		pattern := "%" + search + "%"
		query = query.Where(
			"LOWER(kode_desa) LIKE ? OR LOWER(desa) LIKE ? OR LOWER(distrik) LIKE ? OR LOWER(kabupaten) LIKE ? OR LOWER(status_idm) LIKE ?",
			pattern,
			pattern,
			pattern,
			pattern,
			pattern,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return model.SikampungListResponse{}, fmt.Errorf("count sikampung data: %w", err)
	}
	if total == 0 {
		page = 1
	} else if totalPages := int((total + int64(pageSize) - 1) / int64(pageSize)); page > totalPages {
		page = totalPages
	}

	var records []model.SikampungEntity
	if err := query.
		Order("kabupaten ASC, distrik ASC, desa ASC, kode_desa ASC, id ASC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&records).Error; err != nil {
		return model.SikampungListResponse{}, fmt.Errorf("list sikampung data: %w", err)
	}

	items := make([]model.SikampungData, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToSikampungData())
	}

	return model.SikampungListResponse{
		TahunAnggaran: tahunAnggaran,
		Items:         items,
		Page:          page,
		PageSize:      pageSize,
		Total:         total,
	}, nil
}

func (r *SikampungRepository) Get(ctx context.Context, tahunAnggaran string, id int64) (model.SikampungData, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SikampungData{}, false, err
	}

	record, found, err := r.find(ctx, db, strings.TrimSpace(tahunAnggaran), id)
	if err != nil || !found {
		return model.SikampungData{}, found, err
	}
	return record.ToSikampungData(), true, nil
}

func (r *SikampungRepository) Create(ctx context.Context, tahunAnggaran string, payload model.SikampungPayload) (model.SikampungData, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SikampungData{}, err
	}

	record := sikampungPayloadToEntity(tahunAnggaran, payload)
	if err := db.Create(&record).Error; err != nil {
		return model.SikampungData{}, fmt.Errorf("create sikampung data: %w", err)
	}

	return record.ToSikampungData(), nil
}

func (r *SikampungRepository) Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SikampungPayload) (model.SikampungData, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SikampungData{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.SikampungEntity{}).
			Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
			Updates(map[string]any{
				"kode_desa":  strings.TrimSpace(payload.KodeDesa),
				"desa":       strings.TrimSpace(payload.Desa),
				"distrik":    strings.TrimSpace(payload.Distrik),
				"kabupaten":  strings.TrimSpace(payload.Kabupaten),
				"iks":        roundIDM(payload.IKS),
				"ike":        roundIDM(payload.IKE),
				"ikl":        roundIDM(payload.IKL),
				"nilai_idm":  roundIDM(payload.NilaiIDM),
				"status_idm": payload.StatusIDM,
				"updated_at": gorm.Expr("NOW()"),
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
		return model.SikampungData{}, false, nil
	}
	if err != nil {
		return model.SikampungData{}, false, fmt.Errorf("update sikampung data: %w", err)
	}

	record, found, err := r.find(ctx, db, tahunAnggaran, id)
	if err != nil || !found {
		return model.SikampungData{}, found, err
	}
	return record.ToSikampungData(), true, nil
}

func (r *SikampungRepository) Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.SikampungEntity{}, "tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id)
	if result.Error != nil {
		return false, fmt.Errorf("delete sikampung data: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *SikampungRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *SikampungRepository) find(ctx context.Context, db *gorm.DB, tahunAnggaran string, id int64) (model.SikampungEntity, bool, error) {
	var record model.SikampungEntity
	if err := db.WithContext(ctx).First(&record, "tahun_anggaran = ? AND id = ?", tahunAnggaran, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.SikampungEntity{}, false, nil
		}
		return model.SikampungEntity{}, false, fmt.Errorf("find sikampung data: %w", err)
	}
	return record, true, nil
}

func sikampungPayloadToEntity(tahunAnggaran string, payload model.SikampungPayload) model.SikampungEntity {
	return model.SikampungEntity{
		TahunAnggaran: strings.TrimSpace(tahunAnggaran),
		KodeDesa:      strings.TrimSpace(payload.KodeDesa),
		Desa:          strings.TrimSpace(payload.Desa),
		Distrik:       strings.TrimSpace(payload.Distrik),
		Kabupaten:     strings.TrimSpace(payload.Kabupaten),
		IKS:           roundIDM(payload.IKS),
		IKE:           roundIDM(payload.IKE),
		IKL:           roundIDM(payload.IKL),
		NilaiIDM:      roundIDM(payload.NilaiIDM),
		StatusIDM:     payload.StatusIDM,
	}
}

func roundIDM(value float64) float64 {
	return math.Round(value*10000) / 10000
}
