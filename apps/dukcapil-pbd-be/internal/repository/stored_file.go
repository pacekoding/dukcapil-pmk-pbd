package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"strings"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"
	"dukcapil-pbd-be/internal/storage"

	"gorm.io/gorm"
)

type StoredFileRepository struct {
	db *gorm.DB
}

func NewStoredFileRepository(db *gorm.DB) *StoredFileRepository {
	return &StoredFileRepository{db: db}
}

func (r *StoredFileRepository) ByID(ctx context.Context, id int64) (model.StoredFile, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.StoredFile{}, false, err
	}
	return storedFileByID(db, id)
}

func (r *StoredFileRepository) AuthorizedByID(
	ctx context.Context,
	id int64,
	claims security.Claims,
) (model.StoredFile, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.StoredFile{}, false, err
	}
	file, found, err := storedFileByID(db, id)
	if err != nil || !found {
		return file, found, err
	}
	allowed, err := storedFileAccessAllowed(db, file, claims)
	if err != nil {
		return model.StoredFile{}, false, err
	}
	if !allowed {
		return model.StoredFile{}, false, nil
	}
	return finalizeStoredFile(file), true, nil
}

func (r *StoredFileRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func createStoredFileRecord(tx *gorm.DB, input model.StoredFileInput, relatedEntityID int64) (model.StoredFile, error) {
	record := model.StoredFile{
		Module:            strings.TrimSpace(input.Module),
		RelatedEntityType: strings.TrimSpace(input.RelatedType),
		RelatedEntityID:   relatedEntityID,
		Category:          strings.TrimSpace(input.Category),
		OriginalFilename:  strings.TrimSpace(input.OriginalFilename),
		StoredFilename:    strings.TrimSpace(input.StoredFilename),
		StorageKey:        strings.TrimSpace(input.StorageKey),
		MimeType:          strings.TrimSpace(input.MimeType),
		FileSize:          input.FileSize,
		ChecksumSHA256:    strings.ToLower(strings.TrimSpace(input.ChecksumSHA256)),
		Visibility:        input.Visibility,
		UploadedBy:        input.UploadedBy,
	}
	if err := tx.Create(&record).Error; err != nil {
		return model.StoredFile{}, fmt.Errorf("create stored file metadata: %w", err)
	}
	return record, nil
}

func storedFileByID(tx *gorm.DB, id int64) (model.StoredFile, bool, error) {
	if id <= 0 {
		return model.StoredFile{}, false, nil
	}
	var record model.StoredFile
	err := tx.Table("stored_files").
		Where("id = ? AND deleted_at IS NULL", id).
		Take(&record).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.StoredFile{}, false, nil
	}
	if err != nil {
		return model.StoredFile{}, false, fmt.Errorf("load stored file: %w", err)
	}
	return finalizeStoredFile(record), true, nil
}

func softDeleteStoredFileRecord(tx *gorm.DB, id int64) error {
	if id <= 0 {
		return nil
	}
	if err := tx.Table("stored_files").
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(map[string]any{
			"deleted_at": gorm.Expr("NOW()"),
			"updated_at": gorm.Expr("NOW()"),
		}).Error; err != nil {
		return fmt.Errorf("soft delete stored file metadata: %w", err)
	}
	return nil
}

func softDeleteStoredFilesForEntity(tx *gorm.DB, module string, relatedType string, relatedEntityID int64) error {
	if err := tx.Table("stored_files").
		Where(
			"module = ? AND related_entity_type = ? AND related_entity_id = ? AND deleted_at IS NULL",
			module,
			relatedType,
			relatedEntityID,
		).
		Updates(map[string]any{
			"deleted_at": gorm.Expr("NOW()"),
			"updated_at": gorm.Expr("NOW()"),
		}).Error; err != nil {
		return fmt.Errorf("soft delete entity files: %w", err)
	}
	return nil
}

func finalizeStoredFile(file model.StoredFile) model.StoredFile {
	prefix := "files"
	if file.Module == "otsus" {
		prefix = "otsus-files"
	}
	file.PreviewURL = fmt.Sprintf("/api/backend/%s/%d/preview", prefix, file.ID)
	file.DownloadURL = fmt.Sprintf("/api/backend/%s/%d/download", prefix, file.ID)
	return file
}

func storedFileAccessAllowed(db *gorm.DB, file model.StoredFile, claims security.Claims) (bool, error) {
	if claims.Role == model.RoleSuperAdmin && file.Module != "otsus" {
		return true, nil
	}

	switch file.Module {
	case "otsus":
		if file.RelatedEntityType != "otsus_documentation" && file.RelatedEntityType != "lpj_otsus" && file.RelatedEntityType != "otsus_dpa" {
			return false, nil
		}
		var count int64
		var query *gorm.DB
		switch file.RelatedEntityType {
		case "otsus_documentation":
			query = db.Table("dokumentasi_otsus d").Joins("JOIN labelisasi_otsus o ON o.id=d.otsus_label_id").Where("d.id=? AND d.file_id=? AND o.tahun_anggaran=?", file.RelatedEntityID, file.ID, strings.TrimSpace(claims.TahunAnggaran))
		case "lpj_otsus":
			query = db.Table("lpj_otsus l").Joins("JOIN labelisasi_otsus o ON o.id=l.otsus_label_id").Where("l.id=? AND l.file_id=? AND o.tahun_anggaran=?", file.RelatedEntityID, file.ID, strings.TrimSpace(claims.TahunAnggaran))
		case "otsus_dpa":
			query = db.Table("versi_dpa_otsus d").Joins("JOIN labelisasi_otsus o ON o.id=d.otsus_label_id").Where("d.id=? AND d.file_id=? AND o.tahun_anggaran=?", file.RelatedEntityID, file.ID, strings.TrimSpace(claims.TahunAnggaran))
		}
		err := query.Count(&count).Error
		return count > 0, err
	case "arsip":
		var count int64
		err := db.Table("arsip").
			Where("id = ? AND tahun_anggaran = ?", file.RelatedEntityID, strings.TrimSpace(claims.TahunAnggaran)).
			Count(&count).Error
		if err != nil {
			return false, fmt.Errorf("check archive file access: %w", err)
		}
		return count > 0, nil
	case "arsip-pegawai":
		if file.RelatedEntityType != "arsip_pegawai" {
			return false, nil
		}
		var count int64
		err := db.Table("arsip_pegawai").
			Where("id = ? AND photo_file_id = ?", file.RelatedEntityID, file.ID).
			Count(&count).Error
		if err != nil {
			return false, fmt.Errorf("check employee photo access: %w", err)
		}
		return count > 0, nil
	case "kelompok_binaan":
		if file.RelatedEntityType != "capaian_kendala" {
			return false, nil
		}
		var count int64
		err := db.Table("capaian_kendala").
			Where("id = ?", file.RelatedEntityID).
			Count(&count).Error
		if err != nil {
			return false, fmt.Errorf("check kelompok binaan file access: %w", err)
		}
		return count > 0, nil
	default:
		return false, nil
	}
}

func ReconcileStoredFileMetadata(ctx context.Context, db *gorm.DB, service storage.Service) error {
	if db == nil || service == nil {
		return fmt.Errorf("database and storage service are required")
	}

	var files []model.StoredFile
	if err := db.WithContext(ctx).
		Table("stored_files").
		Where("deleted_at IS NULL AND checksum_sha256 = ''").
		Order("id ASC").
		Find(&files).Error; err != nil {
		return fmt.Errorf("list stored files for reconciliation: %w", err)
	}

	for _, file := range files {
		reader, err := service.Open(ctx, file.StorageKey)
		if errors.Is(err, storage.ErrNotFound) {
			continue
		}
		if err != nil {
			return fmt.Errorf("open stored file %d for reconciliation: %w", file.ID, err)
		}
		hasher := sha256.New()
		size, copyErr := io.Copy(hasher, reader)
		closeErr := reader.Close()
		if copyErr != nil {
			return fmt.Errorf("checksum stored file %d: %w", file.ID, copyErr)
		}
		if closeErr != nil {
			return fmt.Errorf("close stored file %d: %w", file.ID, closeErr)
		}
		if err := db.WithContext(ctx).
			Table("stored_files").
			Where("id = ? AND deleted_at IS NULL", file.ID).
			Updates(map[string]any{
				"file_size":       size,
				"checksum_sha256": hex.EncodeToString(hasher.Sum(nil)),
				"updated_at":      gorm.Expr("NOW()"),
			}).Error; err != nil {
			return fmt.Errorf("update stored file %d reconciliation: %w", file.ID, err)
		}
	}
	return nil
}
