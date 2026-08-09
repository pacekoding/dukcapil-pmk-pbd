package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

func (r *SitekadRepository) ListCapaianKendala(ctx context.Context) (model.SitekadCapaianKendalaListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadCapaianKendalaListResponse{}, err
	}

	var records []model.SitekadCapaianKendalaEntity
	if err := db.
		Preload("Kelompok").
		Order("tahun_binaan DESC, updated_at DESC, id DESC").
		Find(&records).Error; err != nil {
		return model.SitekadCapaianKendalaListResponse{}, fmt.Errorf("list sitekad capaian kendala: %w", err)
	}

	items := make([]model.SitekadCapaianKendala, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToSitekadCapaianKendala())
	}

	return model.SitekadCapaianKendalaListResponse{Items: items}, nil
}

func (r *SitekadRepository) CreateCapaianKendala(ctx context.Context, payload model.SitekadCapaianKendalaPayload) (model.SitekadCapaianKendala, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadCapaianKendala{}, false, err
	}

	record := payloadToSitekadCapaianKendalaEntity(payload)
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&model.SitekadPotensiKampungEntity{}, "id = ?", payload.KelompokID).Error; err != nil {
			return err
		}
		return tx.Create(&record).Error
	}); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.SitekadCapaianKendala{}, false, nil
		}
		return model.SitekadCapaianKendala{}, false, fmt.Errorf("create sitekad capaian kendala: %w", err)
	}

	created, found, err := r.findCapaianKendala(ctx, db, record.ID)
	if err != nil || !found {
		return model.SitekadCapaianKendala{}, found, err
	}

	return created.ToSitekadCapaianKendala(), true, nil
}

func (r *SitekadRepository) UpdateCapaianKendala(ctx context.Context, id int64, payload model.SitekadCapaianKendalaPayload) (model.SitekadCapaianKendala, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadCapaianKendala{}, false, err
	}

	updates := map[string]any{
		"kelompok_id":       payload.KelompokID,
		"nama_capaian":      strings.TrimSpace(payload.NamaCapaian),
		"tahun_binaan":      strings.TrimSpace(payload.TahunBinaan),
		"deskripsi_capaian": strings.TrimSpace(payload.DeskripsiCapaian),
		"kendala_hambatan":  strings.TrimSpace(payload.KendalaHambatan),
		"dokumentasi_urls":  pq.StringArray(normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)),
		"updated_at":        gorm.Expr("NOW()"),
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&model.SitekadPotensiKampungEntity{}, "id = ?", payload.KelompokID).Error; err != nil {
			return err
		}

		result := tx.Model(&model.SitekadCapaianKendalaEntity{}).
			Where("id = ?", id).
			Updates(updates)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	}); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.SitekadCapaianKendala{}, false, nil
		}
		return model.SitekadCapaianKendala{}, false, fmt.Errorf("update sitekad capaian kendala: %w", err)
	}

	record, found, err := r.findCapaianKendala(ctx, db, id)
	if err != nil || !found {
		return model.SitekadCapaianKendala{}, found, err
	}
	return record.ToSitekadCapaianKendala(), true, nil
}

func (r *SitekadRepository) DeleteCapaianKendala(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.SitekadCapaianKendalaEntity{}, "id = ?", id)
	if result.Error != nil {
		return false, fmt.Errorf("delete sitekad capaian kendala: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *SitekadRepository) findCapaianKendala(ctx context.Context, db *gorm.DB, id int64) (model.SitekadCapaianKendalaEntity, bool, error) {
	var record model.SitekadCapaianKendalaEntity
	if err := db.WithContext(ctx).Preload("Kelompok").First(&record, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.SitekadCapaianKendalaEntity{}, false, nil
		}
		return model.SitekadCapaianKendalaEntity{}, false, fmt.Errorf("find sitekad capaian kendala: %w", err)
	}
	return record, true, nil
}

func payloadToSitekadCapaianKendalaEntity(payload model.SitekadCapaianKendalaPayload) model.SitekadCapaianKendalaEntity {
	return model.SitekadCapaianKendalaEntity{
		KelompokID:       payload.KelompokID,
		NamaCapaian:      strings.TrimSpace(payload.NamaCapaian),
		TahunBinaan:      strings.TrimSpace(payload.TahunBinaan),
		DeskripsiCapaian: strings.TrimSpace(payload.DeskripsiCapaian),
		KendalaHambatan:  strings.TrimSpace(payload.KendalaHambatan),
		DokumentasiURLs:  pq.StringArray(normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)),
	}
}

func normalizeSitekadDocumentationURLs(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
