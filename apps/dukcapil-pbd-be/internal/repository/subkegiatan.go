package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

var ErrSubkegiatanAlreadyExists = errors.New("subkegiatan sudah terdaftar")

type SubkegiatanRepository struct {
	db *gorm.DB
}

func NewSubkegiatanRepository(db *gorm.DB) *SubkegiatanRepository {
	return &SubkegiatanRepository{db: db}
}

func (r *SubkegiatanRepository) List(ctx context.Context) ([]model.Subkegiatan, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}

	var records []model.SubkegiatanEntity
	if err := db.Order("id DESC").Find(&records).Error; err != nil {
		return nil, fmt.Errorf("list subkegiatan: %w", err)
	}

	items := make([]model.Subkegiatan, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToSubkegiatan())
	}
	return items, nil
}

func (r *SubkegiatanRepository) Create(ctx context.Context, payload model.SubkegiatanPayload) (model.Subkegiatan, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Subkegiatan{}, err
	}

	record := model.SubkegiatanEntity{
		Bidang:              strings.TrimSpace(payload.Bidang),
		Program:             strings.TrimSpace(payload.Program),
		Kegiatan:            strings.TrimSpace(payload.Kegiatan),
		Subkegiatan:         strings.TrimSpace(payload.Subkegiatan),
		Kinerja:             strings.TrimSpace(payload.Kinerja),
		Indikator:           strings.TrimSpace(payload.Indikator),
		Satuan:              strings.TrimSpace(payload.Satuan),
		DefinisiOperasional: strings.TrimSpace(payload.DefinisiOperasional),
	}
	if err := db.Create(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return model.Subkegiatan{}, ErrSubkegiatanAlreadyExists
		}
		return model.Subkegiatan{}, fmt.Errorf("create subkegiatan: %w", err)
	}

	return record.ToSubkegiatan(), nil
}

func (r *SubkegiatanRepository) Update(ctx context.Context, id int64, payload model.SubkegiatanPayload) (model.Subkegiatan, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Subkegiatan{}, false, err
	}
	values := map[string]any{
		"bidang": strings.TrimSpace(payload.Bidang), "program": strings.TrimSpace(payload.Program),
		"kegiatan": strings.TrimSpace(payload.Kegiatan), "subkegiatan": strings.TrimSpace(payload.Subkegiatan),
		"kinerja": strings.TrimSpace(payload.Kinerja), "indikator": strings.TrimSpace(payload.Indikator),
		"satuan": strings.TrimSpace(payload.Satuan), "definisi_operasional": strings.TrimSpace(payload.DefinisiOperasional),
		"updated_at": gorm.Expr("NOW()"),
	}
	result := db.Model(&model.SubkegiatanEntity{}).Where("id = ?", id).Updates(values)
	if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
		return model.Subkegiatan{}, false, ErrSubkegiatanAlreadyExists
	}
	if result.Error != nil {
		return model.Subkegiatan{}, false, fmt.Errorf("update subkegiatan: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return model.Subkegiatan{}, false, nil
	}
	var record model.SubkegiatanEntity
	if err := db.First(&record, "id = ?", id).Error; err != nil {
		return model.Subkegiatan{}, false, fmt.Errorf("load updated subkegiatan: %w", err)
	}
	return record.ToSubkegiatan(), true, nil
}

func (r *SubkegiatanRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}
	result := db.Delete(&model.SubkegiatanEntity{}, "id = ?", id)
	if result.Error != nil {
		return false, fmt.Errorf("delete subkegiatan: %w", result.Error)
	}
	return result.RowsAffected > 0, nil
}

func (r *SubkegiatanRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
