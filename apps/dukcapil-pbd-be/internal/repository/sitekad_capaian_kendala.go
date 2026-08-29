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

var sitekadStoredFileURLPattern = regexp.MustCompile(`^/api/backend/files/([1-9]\d*)/(?:preview|download)(?:\?.*)?$`)

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

func (r *SitekadRepository) CreateCapaianKendala(ctx context.Context, payload model.SitekadCapaianKendalaPayload, files ...model.StoredFileInput) (model.SitekadCapaianKendala, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadCapaianKendala{}, false, err
	}

	record := payloadToSitekadCapaianKendalaEntity(payload)
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&model.SitekadPotensiKampungEntity{}, "id = ?", payload.KelompokID).Error; err != nil {
			return err
		}
		if err := tx.Create(&record).Error; err != nil {
			return err
		}
		if len(files) == 0 {
			return nil
		}
		documentationURLs := normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)
		for _, fileInput := range files {
			file, err := createStoredFileRecord(tx, fileInput, record.ID)
			if err != nil {
				return err
			}
			documentationURLs = append(documentationURLs, finalizeStoredFile(file, false).PreviewURL)
		}
		record.DokumentasiURLs = pq.StringArray(normalizeSitekadDocumentationURLs(documentationURLs))
		return tx.Model(&record).Update("dokumentasi_urls", record.DokumentasiURLs).Error
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

func (r *SitekadRepository) UpdateCapaianKendala(ctx context.Context, id int64, payload model.SitekadCapaianKendalaPayload, files ...model.StoredFileInput) (model.SitekadCapaianKendala, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadCapaianKendala{}, false, err
	}

	documentationURLs := normalizeSitekadDocumentationURLs(payload.DokumentasiURLs)
	updates := map[string]any{
		"kelompok_id":       payload.KelompokID,
		"nama_capaian":      strings.TrimSpace(payload.NamaCapaian),
		"tahun_binaan":      strings.TrimSpace(payload.TahunBinaan),
		"deskripsi_capaian": strings.TrimSpace(payload.DeskripsiCapaian),
		"kendala_hambatan":  strings.TrimSpace(payload.KendalaHambatan),
		"updated_at":        gorm.Expr("NOW()"),
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&model.SitekadPotensiKampungEntity{}, "id = ?", payload.KelompokID).Error; err != nil {
			return err
		}

		var current model.SitekadCapaianKendalaEntity
		if err := tx.First(&current, "id = ?", id).Error; err != nil {
			return err
		}

		for _, fileInput := range files {
			file, err := createStoredFileRecord(tx, fileInput, id)
			if err != nil {
				return err
			}
			documentationURLs = append(documentationURLs, finalizeStoredFile(file, false).PreviewURL)
		}
		documentationURLs = normalizeSitekadDocumentationURLs(documentationURLs)
		updates["dokumentasi_urls"] = pq.StringArray(documentationURLs)

		if err := tx.Model(&model.SitekadCapaianKendalaEntity{}).
			Where("id = ?", id).
			Updates(updates).Error; err != nil {
			return err
		}

		currentFileIDs := sitekadStoredFileIDs(current.DokumentasiURLs)
		nextFileIDs := sitekadStoredFileIDs(documentationURLs)
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

	var deleted bool
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := softDeleteStoredFilesForEntity(tx, "sitekad", "sitekad_capaian_kendala", id); err != nil {
			return err
		}
		result := tx.Delete(&model.SitekadCapaianKendalaEntity{}, "id = ?", id)
		if result.Error != nil {
			return result.Error
		}
		deleted = result.RowsAffected > 0
		return nil
	}); err != nil {
		return false, fmt.Errorf("delete sitekad capaian kendala: %w", err)
	}

	return deleted, nil
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

func sitekadStoredFileIDs(values []string) map[int64]struct{} {
	result := make(map[int64]struct{})
	for _, value := range values {
		matches := sitekadStoredFileURLPattern.FindStringSubmatch(strings.TrimSpace(value))
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
