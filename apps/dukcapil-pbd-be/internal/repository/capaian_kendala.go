package repository

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

var kelompokBinaanStoredFileURLPattern = regexp.MustCompile(`^/api/backend/files/([1-9]\d*)/(?:preview|download)(?:\?.*)?$`)

func (r *KelompokBinaanRepository) ListCapaianKendala(ctx context.Context) (model.CapaianKendalaListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.CapaianKendalaListResponse{}, err
	}

	var records []model.CapaianKendalaEntity
	if err := db.
		Preload("Kelompok").
		Order("tahun_binaan DESC, updated_at DESC, id DESC").
		Find(&records).Error; err != nil {
		return model.CapaianKendalaListResponse{}, fmt.Errorf("list kelompokBinaan capaian kendala: %w", err)
	}

	items := make([]model.CapaianKendala, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToCapaianKendala())
	}

	return model.CapaianKendalaListResponse{Items: items}, nil
}

func (r *KelompokBinaanRepository) CreateCapaianKendala(ctx context.Context, payload model.CapaianKendalaPayload, files ...model.StoredFileInput) (model.CapaianKendala, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.CapaianKendala{}, false, err
	}

	record := payloadToCapaianKendalaEntity(payload)
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&model.KelompokBinaanEntity{}, "id = ?", payload.KelompokID).Error; err != nil {
			return err
		}
		if err := tx.Create(&record).Error; err != nil {
			return err
		}
		if len(files) == 0 {
			return nil
		}
		documentationURLs := normalizeKelompokBinaanDocumentationURLs(payload.DokumentasiURLs)
		for _, fileInput := range files {
			file, err := createStoredFileRecord(tx, fileInput, record.ID)
			if err != nil {
				return err
			}
			documentationURLs = append(documentationURLs, finalizeStoredFile(file).PreviewURL)
		}
		record.DokumentasiURLs = pq.StringArray(normalizeKelompokBinaanDocumentationURLs(documentationURLs))
		return tx.Model(&record).Update("dokumentasi_urls", record.DokumentasiURLs).Error
	}); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.CapaianKendala{}, false, nil
		}
		return model.CapaianKendala{}, false, fmt.Errorf("create kelompokBinaan capaian kendala: %w", err)
	}

	created, found, err := r.findCapaianKendala(ctx, db, record.ID)
	if err != nil || !found {
		return model.CapaianKendala{}, found, err
	}

	return created.ToCapaianKendala(), true, nil
}

func (r *KelompokBinaanRepository) UpdateCapaianKendala(ctx context.Context, id int64, payload model.CapaianKendalaPayload, files ...model.StoredFileInput) (model.CapaianKendala, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.CapaianKendala{}, false, err
	}

	documentationURLs := normalizeKelompokBinaanDocumentationURLs(payload.DokumentasiURLs)
	updates := map[string]any{
		"kelompok_id":       payload.KelompokID,
		"nama_capaian":      strings.TrimSpace(payload.NamaCapaian),
		"tahun_binaan":      strings.TrimSpace(payload.TahunBinaan),
		"deskripsi_capaian": strings.TrimSpace(payload.DeskripsiCapaian),
		"kendala_hambatan":  strings.TrimSpace(payload.KendalaHambatan),
		"updated_at":        gorm.Expr("NOW()"),
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&model.KelompokBinaanEntity{}, "id = ?", payload.KelompokID).Error; err != nil {
			return err
		}

		var current model.CapaianKendalaEntity
		if err := tx.First(&current, "id = ?", id).Error; err != nil {
			return err
		}

		for _, fileInput := range files {
			file, err := createStoredFileRecord(tx, fileInput, id)
			if err != nil {
				return err
			}
			documentationURLs = append(documentationURLs, finalizeStoredFile(file).PreviewURL)
		}
		documentationURLs = normalizeKelompokBinaanDocumentationURLs(documentationURLs)
		updates["dokumentasi_urls"] = pq.StringArray(documentationURLs)

		if err := tx.Model(&model.CapaianKendalaEntity{}).
			Where("id = ?", id).
			Updates(updates).Error; err != nil {
			return err
		}

		currentFileIDs := kelompokBinaanStoredFileIDs(current.DokumentasiURLs)
		nextFileIDs := kelompokBinaanStoredFileIDs(documentationURLs)
		for fileID := range currentFileIDs {
			if _, keep := nextFileIDs[fileID]; keep {
				continue
			}
			if err := softDeleteStoredFileRecord(tx, fileID); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.CapaianKendala{}, false, nil
		}
		return model.CapaianKendala{}, false, fmt.Errorf("update kelompokBinaan capaian kendala: %w", err)
	}

	record, found, err := r.findCapaianKendala(ctx, db, id)
	if err != nil || !found {
		return model.CapaianKendala{}, found, err
	}
	return record.ToCapaianKendala(), true, nil
}

func (r *KelompokBinaanRepository) DeleteCapaianKendala(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	var deleted bool
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := softDeleteStoredFilesForEntity(tx, "kelompok_binaan", "capaian_kendala", id); err != nil {
			return err
		}
		result := tx.Delete(&model.CapaianKendalaEntity{}, "id = ?", id)
		if result.Error != nil {
			return result.Error
		}
		deleted = result.RowsAffected > 0
		return nil
	}); err != nil {
		return false, fmt.Errorf("delete kelompokBinaan capaian kendala: %w", err)
	}

	return deleted, nil
}

func (r *KelompokBinaanRepository) findCapaianKendala(ctx context.Context, db *gorm.DB, id int64) (model.CapaianKendalaEntity, bool, error) {
	var record model.CapaianKendalaEntity
	if err := db.WithContext(ctx).Preload("Kelompok").First(&record, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.CapaianKendalaEntity{}, false, nil
		}
		return model.CapaianKendalaEntity{}, false, fmt.Errorf("find kelompokBinaan capaian kendala: %w", err)
	}
	return record, true, nil
}

func payloadToCapaianKendalaEntity(payload model.CapaianKendalaPayload) model.CapaianKendalaEntity {
	return model.CapaianKendalaEntity{
		KelompokID:       payload.KelompokID,
		NamaCapaian:      strings.TrimSpace(payload.NamaCapaian),
		TahunBinaan:      strings.TrimSpace(payload.TahunBinaan),
		DeskripsiCapaian: strings.TrimSpace(payload.DeskripsiCapaian),
		KendalaHambatan:  strings.TrimSpace(payload.KendalaHambatan),
		DokumentasiURLs:  pq.StringArray(normalizeKelompokBinaanDocumentationURLs(payload.DokumentasiURLs)),
	}
}

func normalizeKelompokBinaanDocumentationURLs(values []string) []string {
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

func kelompokBinaanStoredFileIDs(values []string) map[int64]struct{} {
	result := make(map[int64]struct{})
	for _, value := range values {
		matches := kelompokBinaanStoredFileURLPattern.FindStringSubmatch(strings.TrimSpace(value))
		if len(matches) != 2 {
			continue
		}
		id, err := strconv.ParseInt(matches[1], 10, 64)
		if err != nil || id <= 0 {
			continue
		}
		result[id] = struct{}{}
	}
	return result
}
