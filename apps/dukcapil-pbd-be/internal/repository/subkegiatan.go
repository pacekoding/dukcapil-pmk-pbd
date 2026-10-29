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

func (r *SubkegiatanRepository) ListPage(ctx context.Context, params model.SubkegiatanListParams) (model.SubkegiatanListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SubkegiatanListResponse{}, err
	}

	page := max(params.Page, 1)
	pageSize := params.PageSize
	if pageSize <= 0 {
		pageSize = 10
	} else if pageSize > 100 {
		pageSize = 100
	}
	query := db.Model(&model.SubkegiatanEntity{})
	if search := strings.ToLower(strings.TrimSpace(params.Search)); search != "" {
		pattern := "%" + search + "%"
		query = query.Where(`LOWER(bidang) LIKE ? OR LOWER(program) LIKE ? OR LOWER(kegiatan) LIKE ? OR LOWER(subkegiatan) LIKE ? OR LOWER(kinerja) LIKE ? OR LOWER(indikator) LIKE ? OR LOWER(satuan) LIKE ? OR LOWER(definisi_operasional) LIKE ?`, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return model.SubkegiatanListResponse{}, fmt.Errorf("count subkegiatan: %w", err)
	}
	if total == 0 {
		page = 1
	} else if totalPages := int((total + int64(pageSize) - 1) / int64(pageSize)); page > totalPages {
		page = totalPages
	}

	var records []model.SubkegiatanEntity
	if err := query.Order("id DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&records).Error; err != nil {
		return model.SubkegiatanListResponse{}, fmt.Errorf("list subkegiatan page: %w", err)
	}
	items := make([]model.Subkegiatan, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToSubkegiatan())
	}
	return model.SubkegiatanListResponse{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
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

func (r *SubkegiatanRepository) Import(ctx context.Context, payloads []model.SubkegiatanPayload) error {
	db, err := r.session(ctx)
	if err != nil {
		return err
	}
	return db.Transaction(func(tx *gorm.DB) error {
		for _, payload := range payloads {
			record := model.SubkegiatanEntity{
				Bidang: strings.TrimSpace(payload.Bidang), Program: strings.TrimSpace(payload.Program),
				Kegiatan: strings.TrimSpace(payload.Kegiatan), Subkegiatan: strings.TrimSpace(payload.Subkegiatan),
				Kinerja: strings.TrimSpace(payload.Kinerja), Indikator: strings.TrimSpace(payload.Indikator),
				Satuan: strings.TrimSpace(payload.Satuan), DefinisiOperasional: strings.TrimSpace(payload.DefinisiOperasional),
			}
			if err := tx.Create(&record).Error; err != nil {
				if errors.Is(err, gorm.ErrDuplicatedKey) {
					return ErrSubkegiatanAlreadyExists
				}
				return fmt.Errorf("import subkegiatan: %w", err)
			}
		}
		return nil
	})
}

func (r *SubkegiatanRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
