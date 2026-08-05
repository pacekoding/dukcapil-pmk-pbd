package repository

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type ArsipPegawaiRepository struct {
	db *gorm.DB
}

func NewArsipPegawaiRepository(db *gorm.DB) *ArsipPegawaiRepository {
	return &ArsipPegawaiRepository{db: db}
}

func (r *ArsipPegawaiRepository) List(ctx context.Context, params model.ArsipPegawaiListParams) ([]model.ArsipPegawaiItem, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}

	records := make([]model.ArsipPegawaiItem, 0)
	query := r.pegawaiQuery(db, params)
	if err := query.
		Select(`
			id,
			nip,
			nik,
			nama AS name,
			tempat_lahir AS birth_place,
			COALESCE(TO_CHAR(tanggal_lahir, 'YYYY-MM-DD'), '') AS birth_date,
			jabatan AS position,
			bidang,
			unit,
			pangkat_golongan AS rank,
			email,
			telepon AS phone,
			no_rekening AS bank_account,
			alamat AS address,
			status,
			photo_color,
			photo_file_id,
			COALESCE(
			  (SELECT f.original_filename FROM stored_files f WHERE f.id = photo_file_id AND f.deleted_at IS NULL),
			  ''
			) AS photo_original_name,
			COALESCE(
			  (SELECT f.storage_key FROM stored_files f WHERE f.id = photo_file_id AND f.deleted_at IS NULL),
			  ''
			) AS photo_storage_url
		`).
		Order("created_at DESC, id DESC").
		Scan(&records).Error; err != nil {
		return nil, fmt.Errorf("list arsip pegawai: %w", err)
	}

	if err := r.attachDocuments(db, records); err != nil {
		return nil, err
	}
	return records, nil
}

func (r *ArsipPegawaiRepository) Detail(ctx context.Context, id int64) (model.ArsipPegawaiItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiItem{}, false, err
	}

	var record model.ArsipPegawaiItem
	err = db.Table("arsip_pegawai").
		Where("id = ?", id).
		Select(`
			id,
			nip,
			nik,
			nama AS name,
			tempat_lahir AS birth_place,
			COALESCE(TO_CHAR(tanggal_lahir, 'YYYY-MM-DD'), '') AS birth_date,
			jabatan AS position,
			bidang,
			unit,
			pangkat_golongan AS rank,
			email,
			telepon AS phone,
			no_rekening AS bank_account,
			alamat AS address,
			status,
			photo_color,
			photo_file_id,
			COALESCE(
			  (SELECT f.original_filename FROM stored_files f WHERE f.id = photo_file_id AND f.deleted_at IS NULL),
			  ''
			) AS photo_original_name,
			COALESCE(
			  (SELECT f.storage_key FROM stored_files f WHERE f.id = photo_file_id AND f.deleted_at IS NULL),
			  ''
			) AS photo_storage_url
		`).
		Take(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return model.ArsipPegawaiItem{}, false, nil
		}
		return model.ArsipPegawaiItem{}, false, fmt.Errorf("detail arsip pegawai: %w", err)
	}

	records := []model.ArsipPegawaiItem{record}
	if err := r.attachDocuments(db, records); err != nil {
		return model.ArsipPegawaiItem{}, false, err
	}
	return records[0], true, nil
}

func (r *ArsipPegawaiRepository) Create(ctx context.Context, payload model.ArsipPegawaiPayload) (model.ArsipPegawaiItem, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiItem{}, err
	}

	record := pegawaiEntityFromPayload(payload)
	if record.Status == "" {
		record.Status = "Aktif"
	}
	if record.PhotoColor == "" {
		record.PhotoColor = "bg-blue-100 text-blue-700"
	}

	if err := db.Create(&record).Error; err != nil {
		return model.ArsipPegawaiItem{}, fmt.Errorf("create arsip pegawai: %w", err)
	}

	item, found, err := r.Detail(ctx, record.ID)
	if err != nil {
		return model.ArsipPegawaiItem{}, err
	}
	if !found {
		return model.ArsipPegawaiItem{}, fmt.Errorf("created arsip pegawai not found")
	}
	return item, nil
}

func (r *ArsipPegawaiRepository) Update(ctx context.Context, id int64, payload model.ArsipPegawaiPayload) (model.ArsipPegawaiItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiItem{}, false, err
	}

	record := pegawaiEntityFromPayload(payload)
	updates := map[string]any{
		"nip":              record.NIP,
		"nik":              record.NIK,
		"nama":             record.Nama,
		"tempat_lahir":     record.TempatLahir,
		"tanggal_lahir":    record.TanggalLahir,
		"jabatan":          record.Jabatan,
		"bidang":           record.Bidang,
		"unit":             record.Unit,
		"pangkat_golongan": record.PangkatGolongan,
		"email":            record.Email,
		"telepon":          record.Telepon,
		"no_rekening":      record.NoRekening,
		"alamat":           record.Alamat,
		"status":           record.Status,
		"photo_color":      record.PhotoColor,
	}
	if updates["status"] == "" {
		updates["status"] = "Aktif"
	}
	if updates["photo_color"] == "" {
		updates["photo_color"] = "bg-blue-100 text-blue-700"
	}

	result := db.Model(&model.ArsipPegawaiEntity{}).
		Where("id = ?", id).
		Updates(updates)
	if result.Error != nil {
		return model.ArsipPegawaiItem{}, false, fmt.Errorf("update arsip pegawai: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return model.ArsipPegawaiItem{}, false, nil
	}

	item, found, err := r.Detail(ctx, id)
	return item, found, err
}

func (r *ArsipPegawaiRepository) ReplacePhoto(
	ctx context.Context,
	id int64,
	input model.StoredFileInput,
) (model.ArsipPegawaiItem, bool, string, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiItem{}, false, "", err
	}

	found := true
	previousStorageURL := ""
	err = db.Transaction(func(tx *gorm.DB) error {
		var current model.ArsipPegawaiEntity
		if takeErr := tx.Where("id = ?", id).Take(&current).Error; takeErr != nil {
			if errors.Is(takeErr, gorm.ErrRecordNotFound) {
				found = false
				return nil
			}
			return takeErr
		}

		file, createErr := createStoredFileRecord(tx, input, id)
		if createErr != nil {
			return createErr
		}
		if current.PhotoFileID != nil {
			previous, previousFound, previousErr := storedFileByID(tx, *current.PhotoFileID)
			if previousErr != nil {
				return previousErr
			}
			if previousFound {
				previousStorageURL = previous.StorageKey
			}
			if deleteErr := softDeleteStoredFileRecord(tx, *current.PhotoFileID); deleteErr != nil {
				return deleteErr
			}
		}

		return tx.Table("arsip_pegawai").
			Where("id = ?", id).
			Updates(map[string]any{
				"photo_file_id": file.ID,
				"updated_at":    gorm.Expr("NOW()"),
			}).Error
	})
	if err != nil {
		return model.ArsipPegawaiItem{}, false, "", fmt.Errorf("replace arsip pegawai photo: %w", err)
	}
	if !found {
		return model.ArsipPegawaiItem{}, false, "", nil
	}

	item, found, err := r.Detail(ctx, id)
	return item, found, previousStorageURL, err
}

func (r *ArsipPegawaiRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	found := true
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`
			UPDATE stored_files
			SET deleted_at = NOW(), updated_at = NOW()
			WHERE module = 'arsip'
			  AND related_entity_type = 'arsip_pegawai_document'
			  AND related_entity_id IN (
			    SELECT id FROM arsip WHERE sumber_aplikasi = 'arsip_pegawai' AND pegawai_id = ?
			  )
			  AND deleted_at IS NULL
		`, id).Error; err != nil {
			return err
		}
		if err := tx.Exec(`
			UPDATE stored_files
			SET deleted_at = NOW(), updated_at = NOW()
			WHERE module = 'arsip-pegawai'
			  AND related_entity_type = 'arsip_pegawai'
			  AND related_entity_id = ?
			  AND deleted_at IS NULL
		`, id).Error; err != nil {
			return err
		}
		result := tx.Where("id = ?", id).Delete(&model.ArsipPegawaiEntity{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			found = false
		}
		return nil
	})
	if err != nil {
		return false, fmt.Errorf("delete arsip pegawai: %w", err)
	}
	return found, nil
}

func (r *ArsipPegawaiRepository) CreateDocument(ctx context.Context, payload model.ArsipPegawaiDocumentPayload) (model.ArsipPegawaiDocument, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiDocument{}, err
	}

	pegawaiID := payload.PegawaiID
	record := model.PelaksanaanDocumentEntity{
		TahunAnggaran:    strings.TrimSpace(payload.TahunAnggaran),
		SumberAplikasi:   "arsip_pegawai",
		Bidang:           strings.TrimSpace(payload.Bidang),
		PegawaiID:        &pegawaiID,
		Nama:             strings.TrimSpace(payload.Title),
		OriginalName:     strings.TrimSpace(payload.OriginalName),
		MimeType:         strings.TrimSpace(payload.MimeType),
		Size:             payload.Size,
		URL:              strings.TrimSpace(payload.URL),
		Kategori:         strings.TrimSpace(payload.Category),
		NomorDokumen:     strings.TrimSpace(payload.Number),
		TahunDokumen:     strings.TrimSpace(payload.Year),
		StatusVerifikasi: strings.TrimSpace(payload.Status),
	}
	if record.Nama == "" {
		record.Nama = record.OriginalName
	}
	if record.Bidang == "" {
		record.Bidang = "sekretariat"
	}
	if record.StatusVerifikasi == "" {
		record.StatusVerifikasi = "Lengkap"
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&record).Error; err != nil {
			return err
		}
		if payload.File == nil {
			return nil
		}
		file, err := createStoredFileRecord(tx, *payload.File, record.ID)
		if err != nil {
			return err
		}
		record.FileID = &file.ID
		return tx.Table("arsip").Where("id = ?", record.ID).Update("file_id", file.ID).Error
	})
	if err != nil {
		return model.ArsipPegawaiDocument{}, fmt.Errorf("create dokumen arsip pegawai: %w", err)
	}

	document, found, err := r.DocumentByID(ctx, payload.PegawaiID, record.ID)
	if err != nil {
		return model.ArsipPegawaiDocument{}, err
	}
	if !found {
		return model.ArsipPegawaiDocument{}, fmt.Errorf("created dokumen arsip pegawai not found")
	}
	return document, nil
}

func (r *ArsipPegawaiRepository) DocumentByID(ctx context.Context, pegawaiID int64, id int64) (model.ArsipPegawaiDocument, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiDocument{}, false, err
	}

	var record model.ArsipPegawaiDocument
	err = db.Table("arsip").
		Where("sumber_aplikasi = ? AND pegawai_id = ? AND id = ?", "arsip_pegawai", pegawaiID, id).
		Select(arsipPegawaiDocumentSelect()).
		Take(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return model.ArsipPegawaiDocument{}, false, nil
		}
		return model.ArsipPegawaiDocument{}, false, fmt.Errorf("detail dokumen arsip pegawai: %w", err)
	}

	return finalizeArsipPegawaiDocument(record), true, nil
}

func (r *ArsipPegawaiRepository) UpdateDocument(
	ctx context.Context,
	pegawaiID int64,
	id int64,
	payload model.ArsipPegawaiDocumentMetadataPayload,
) (model.ArsipPegawaiDocument, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiDocument{}, false, err
	}

	result := db.Table("arsip").
		Where(
			"sumber_aplikasi = ? AND pegawai_id = ? AND id = ?",
			"arsip_pegawai",
			pegawaiID,
			id,
		).
		Updates(map[string]any{
			"bidang":            strings.TrimSpace(payload.Bidang),
			"nama":              strings.TrimSpace(payload.Title),
			"kategori":          strings.TrimSpace(payload.Category),
			"nomor_dokumen":     strings.TrimSpace(payload.Number),
			"tahun_dokumen":     strings.TrimSpace(payload.Year),
			"status_verifikasi": strings.TrimSpace(payload.Status),
		})
	if result.Error != nil {
		return model.ArsipPegawaiDocument{}, false, fmt.Errorf(
			"update metadata dokumen arsip pegawai: %w",
			result.Error,
		)
	}
	if result.RowsAffected == 0 {
		return model.ArsipPegawaiDocument{}, false, nil
	}

	return r.DocumentByID(ctx, pegawaiID, id)
}

func (r *ArsipPegawaiRepository) DeleteDocument(ctx context.Context, pegawaiID int64, id int64) (model.ArsipPegawaiDocument, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiDocument{}, false, err
	}

	document, found, err := r.DocumentByID(ctx, pegawaiID, id)
	if err != nil || !found {
		return document, found, err
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		if document.FileID != nil {
			if err := softDeleteStoredFileRecord(tx, *document.FileID); err != nil {
				return err
			}
		}
		result := tx.Table("arsip").
			Where("sumber_aplikasi = ? AND pegawai_id = ? AND id = ?", "arsip_pegawai", pegawaiID, id).
			Delete(&model.PelaksanaanDocumentEntity{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err == gorm.ErrRecordNotFound {
		return model.ArsipPegawaiDocument{}, false, nil
	}
	if err != nil {
		return model.ArsipPegawaiDocument{}, false, fmt.Errorf("delete dokumen arsip pegawai: %w", err)
	}

	return document, true, nil
}

func (r *ArsipPegawaiRepository) pegawaiQuery(db *gorm.DB, params model.ArsipPegawaiListParams) *gorm.DB {
	query := db.Table("arsip_pegawai")
	search := strings.TrimSpace(strings.ToLower(params.Search))
	if search != "" {
		like := "%" + search + "%"
		query = query.Where(`
			LOWER(nama) LIKE ? OR
			LOWER(nip) LIKE ? OR
			LOWER(nik) LIKE ? OR
			LOWER(jabatan) LIKE ? OR
			LOWER(tempat_lahir) LIKE ? OR
			LOWER(bidang) LIKE ? OR
			LOWER(unit) LIKE ? OR
			LOWER(pangkat_golongan) LIKE ?
		`, like, like, like, like, like, like, like, like)
	}
	return query
}

func (r *ArsipPegawaiRepository) attachDocuments(db *gorm.DB, records []model.ArsipPegawaiItem) error {
	if len(records) == 0 {
		return nil
	}

	ids := make([]int64, 0, len(records))
	indexByID := make(map[int64]int, len(records))
	for index := range records {
		ids = append(ids, records[index].ID)
		indexByID[records[index].ID] = index
		records[index] = finalizeArsipPegawaiItem(records[index])
		records[index].Documents = []model.ArsipPegawaiDocument{}
	}

	documents := make([]model.ArsipPegawaiDocument, 0)
	if err := db.Table("arsip").
		Where("sumber_aplikasi = ? AND pegawai_id IN ?", "arsip_pegawai", ids).
		Select(arsipPegawaiDocumentSelect()).
		Order("created_at DESC, id DESC").
		Scan(&documents).Error; err != nil {
		return fmt.Errorf("list dokumen arsip pegawai: %w", err)
	}

	for _, document := range documents {
		finalized := finalizeArsipPegawaiDocument(document)
		index, ok := indexByID[finalized.PegawaiID]
		if ok {
			records[index].Documents = append(records[index].Documents, finalized)
		}
	}
	return nil
}

func finalizeArsipPegawaiItem(record model.ArsipPegawaiItem) model.ArsipPegawaiItem {
	if record.PhotoFileID != nil && *record.PhotoFileID > 0 {
		record.PhotoPreviewURL = fmt.Sprintf(
			"/api/backend/files/%d/preview",
			*record.PhotoFileID,
		)
	}
	return record
}

func arsipPegawaiDocumentSelect() string {
	return `
		id,
		pegawai_id,
		bidang,
		nama AS title,
		kategori AS category,
		nomor_dokumen AS number,
		tahun_dokumen AS year,
		file_id,
		COALESCE(
		  (SELECT f.mime_type FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  mime_type
		) AS mime_type,
		COALESCE(
		  (SELECT f.file_size FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  size
		) AS file_size,
		COALESCE(
		  (SELECT f.checksum_sha256 FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  ''
		) AS checksum_sha256,
		status_verifikasi AS status,
		COALESCE(
		  (SELECT f.original_filename FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  original_name,
		  ''
		) AS stored_file_name,
		COALESCE(
		  (SELECT f.storage_key FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  url
		) AS storage_url,
		created_at AS uploaded_at
	`
}

func finalizeArsipPegawaiDocument(record model.ArsipPegawaiDocument) model.ArsipPegawaiDocument {
	storedName := filepath.Base(strings.TrimSpace(record.StorageURL))
	if storedName == "." || storedName == string(filepath.Separator) {
		storedName = record.StoredFileName
	}
	record.StoredFileName = storedName
	typeSource := record.Title
	if filepath.Ext(typeSource) == "" {
		typeSource = storedName
	}
	record.FileType = strings.ToUpper(pelaksanaanDocumentFileType(typeSource, record.MimeType))
	if record.FileID != nil && *record.FileID > 0 {
		record.DownloadURL = fmt.Sprintf("/api/backend/files/%d/download", *record.FileID)
		record.PreviewURL = fmt.Sprintf("/api/backend/files/%d/preview", *record.FileID)
	} else {
		record.DownloadURL = fmt.Sprintf("/api/backend/arsipku/%d/documents/%d/download", record.PegawaiID, record.ID)
		record.PreviewURL = fmt.Sprintf("/api/backend/arsipku/%d/documents/%d/download?disposition=inline", record.PegawaiID, record.ID)
	}
	return record
}

func pegawaiEntityFromPayload(payload model.ArsipPegawaiPayload) model.ArsipPegawaiEntity {
	return model.ArsipPegawaiEntity{
		NIP:             strings.TrimSpace(payload.NIP),
		NIK:             strings.TrimSpace(payload.NIK),
		Nama:            strings.TrimSpace(payload.Name),
		TempatLahir:     strings.TrimSpace(payload.BirthPlace),
		TanggalLahir:    arsipPegawaiBirthDate(payload.BirthDate),
		Jabatan:         strings.TrimSpace(payload.Position),
		Bidang:          strings.TrimSpace(payload.Bidang),
		Unit:            strings.TrimSpace(payload.Unit),
		PangkatGolongan: strings.TrimSpace(payload.Rank),
		Email:           strings.TrimSpace(payload.Email),
		Telepon:         strings.TrimSpace(payload.Phone),
		NoRekening:      strings.TrimSpace(payload.BankAccount),
		Alamat:          strings.TrimSpace(payload.Address),
		Status:          strings.TrimSpace(payload.Status),
		PhotoColor:      strings.TrimSpace(payload.PhotoColor),
	}
}

func arsipPegawaiBirthDate(value string) *time.Time {
	parsed, err := time.Parse("2006-01-02", strings.TrimSpace(value))
	if err != nil {
		return nil
	}
	return &parsed
}

func (r *ArsipPegawaiRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
