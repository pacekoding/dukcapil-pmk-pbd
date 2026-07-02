package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type SSDRepository struct {
	db *gorm.DB
}

func NewSSDRepository(db *gorm.DB) *SSDRepository {
	return &SSDRepository{db: db}
}

func (r *SSDRepository) List(ctx context.Context, tahunAnggaran string) (model.SSDListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDListResponse{}, err
	}

	var records []model.SSDEntity
	if err := db.
		Where("tahun_anggaran = ?", strings.TrimSpace(tahunAnggaran)).
		Order("kode ASC, id ASC").
		Find(&records).Error; err != nil {
		return model.SSDListResponse{}, fmt.Errorf("list ssd: %w", err)
	}

	items := make([]model.SSD, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToSSD())
	}

	return model.SSDListResponse{
		TahunAnggaran: strings.TrimSpace(tahunAnggaran),
		Items:         items,
	}, nil
}

func (r *SSDRepository) Detail(ctx context.Context, tahunAnggaran string, id int64) (model.SSDDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDDetail{}, false, err
	}
	return r.loadDetail(ctx, db, strings.TrimSpace(tahunAnggaran), id)
}

func (r *SSDRepository) Create(ctx context.Context, tahunAnggaran string, payload model.SSDPayload) (model.SSDDetail, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDDetail{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	record := model.SSDEntity{
		TahunAnggaran:       tahunAnggaran,
		Kode:                strings.TrimSpace(payload.Kode),
		Uraian:              strings.TrimSpace(payload.Uraian),
		Satuan:              strings.TrimSpace(payload.Satuan),
		DefinisiOperasional: strings.TrimSpace(payload.DefinisiOperasional),
		IsActive:            false,
	}
	if err := db.Create(&record).Error; err != nil {
		return model.SSDDetail{}, fmt.Errorf("create ssd: %w", err)
	}

	return model.SSDDetail{
		SSD: record.ToSSD(),
	}, nil
}

func (r *SSDRepository) Import(ctx context.Context, tahunAnggaran string, payloads []model.SSDPayload) (model.SSDImportResult, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDImportResult{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	normalized := normalizeSSDImportPayloads(payloads)
	if len(normalized) == 0 {
		return model.SSDImportResult{TahunAnggaran: tahunAnggaran}, nil
	}

	result := model.SSDImportResult{
		TahunAnggaran: tahunAnggaran,
		Total:         len(normalized),
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		codes := make([]string, 0, len(normalized))
		for _, item := range normalized {
			codes = append(codes, item.Kode)
		}

		var existing []model.SSDEntity
		if err := tx.
			Where("tahun_anggaran = ? AND LOWER(kode) IN ?", tahunAnggaran, lowerStrings(codes)).
			Find(&existing).Error; err != nil {
			return err
		}

		existingByCode := make(map[string]model.SSDEntity, len(existing))
		for _, item := range existing {
			existingByCode[strings.ToLower(item.Kode)] = item
		}

		for _, item := range normalized {
			if current, ok := existingByCode[strings.ToLower(item.Kode)]; ok {
				if err := tx.Model(&model.SSDEntity{}).
					Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, current.ID).
					Updates(map[string]any{
						"uraian":               item.Uraian,
						"satuan":               item.Satuan,
						"definisi_operasional": item.DefinisiOperasional,
						"is_active":            false,
						"updated_at":           gorm.Expr("NOW()"),
					}).Error; err != nil {
					return err
				}
				result.Updated++
				continue
			}

			record := model.SSDEntity{
				TahunAnggaran:       tahunAnggaran,
				Kode:                item.Kode,
				Uraian:              item.Uraian,
				Satuan:              item.Satuan,
				DefinisiOperasional: item.DefinisiOperasional,
				IsActive:            false,
			}
			if err := tx.Create(&record).Error; err != nil {
				return err
			}
			result.Created++
		}
		return nil
	})
	if err != nil {
		return model.SSDImportResult{}, fmt.Errorf("import ssd: %w", err)
	}

	return result, nil
}

func (r *SSDRepository) Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SSDPayload) (model.SSDDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDDetail{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.SSDEntity{}).
			Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
			Updates(map[string]any{
				"kode":                 strings.TrimSpace(payload.Kode),
				"uraian":               strings.TrimSpace(payload.Uraian),
				"satuan":               strings.TrimSpace(payload.Satuan),
				"definisi_operasional": strings.TrimSpace(payload.DefinisiOperasional),
				"updated_at":           gorm.Expr("NOW()"),
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
		return model.SSDDetail{}, false, nil
	}
	if err != nil {
		return model.SSDDetail{}, false, fmt.Errorf("update ssd: %w", err)
	}

	detail, found, err := r.loadDetail(ctx, db, tahunAnggaran, id)
	if err != nil || !found {
		return model.SSDDetail{}, found, err
	}
	return detail, true, nil
}

func (r *SSDRepository) SetStatus(ctx context.Context, tahunAnggaran string, id int64, isActive bool) (model.SSD, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSD{}, false, err
	}

	var record model.SSDEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.SSDEntity{}).
			Where("tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).
			Updates(map[string]any{
				"is_active":  isActive,
				"updated_at": gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return tx.First(&record, "tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.SSD{}, false, nil
	}
	if err != nil {
		return model.SSD{}, false, fmt.Errorf("set ssd status: %w", err)
	}

	detail, found, err := r.loadDetail(ctx, db, strings.TrimSpace(tahunAnggaran), id)
	if err == nil && found {
		return detail.SSD, true, nil
	}
	return record.ToSSD(), true, nil
}

func (r *SSDRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *SSDRepository) loadDetail(ctx context.Context, db *gorm.DB, tahunAnggaran string, id int64) (model.SSDDetail, bool, error) {
	var record model.SSDEntity
	if err := db.WithContext(ctx).First(&record, "tahun_anggaran = ? AND id = ?", tahunAnggaran, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.SSDDetail{}, false, nil
		}
		return model.SSDDetail{}, false, fmt.Errorf("detail ssd: %w", err)
	}

	return model.SSDDetail{
		SSD: record.ToSSD(),
	}, true, nil
}

func normalizeSSDImportPayloads(payloads []model.SSDPayload) []model.SSDPayload {
	deduped := make(map[string]model.SSDPayload, len(payloads))
	for _, payload := range payloads {
		kode := strings.TrimSpace(payload.Kode)
		uraian := strings.TrimSpace(payload.Uraian)
		if kode == "" || uraian == "" {
			continue
		}

		item := model.SSDPayload{
			Kode:                kode,
			Uraian:              uraian,
			Satuan:              strings.TrimSpace(payload.Satuan),
			DefinisiOperasional: strings.TrimSpace(payload.DefinisiOperasional),
		}
		deduped[strings.ToLower(kode)] = item
	}

	result := make([]model.SSDPayload, 0, len(deduped))
	for _, item := range deduped {
		result = append(result, item)
	}
	return result
}

func lowerStrings(items []string) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		result = append(result, strings.ToLower(strings.TrimSpace(item)))
	}
	return result
}
