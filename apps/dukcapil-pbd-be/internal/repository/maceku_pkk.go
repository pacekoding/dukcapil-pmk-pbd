package repository

import (
	"context"
	"errors"
	"fmt"
	"math"
	"path/filepath"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

var ErrMacekuPKKDuplicate = errors.New("maceku pkk duplicate scope")

type MacekuPKKRepository struct {
	db *gorm.DB
}

type macekuPKKProfileRecord struct {
	ID                 int64     `gorm:"column:id"`
	Name               string    `gorm:"column:nama_pkk"`
	Level              string    `gorm:"column:tingkat_pkk"`
	KabupatenKota      string    `gorm:"column:kabupaten_kota"`
	Distrik            string    `gorm:"column:distrik"`
	Kampung            string    `gorm:"column:kampung"`
	SecretariatAddress string    `gorm:"column:alamat_sekretariat"`
	Chairperson        string    `gorm:"column:nama_ketua"`
	Secretary          string    `gorm:"column:nama_sekretaris"`
	Phone              string    `gorm:"column:nomor_telepon"`
	Email              string    `gorm:"column:email"`
	ManagementPeriod   string    `gorm:"column:periode_kepengurusan"`
	Description        string    `gorm:"column:deskripsi_singkat"`
	LogoFileID         *int64    `gorm:"column:logo_file_id"`
	LogoURL            string    `gorm:"column:logo_url"`
	LogoOriginalName   string    `gorm:"column:logo_original_name"`
	LogoMimeType       string    `gorm:"column:logo_mime_type"`
	LogoSize           int64     `gorm:"column:logo_size"`
	IsActive           bool      `gorm:"column:is_active"`
	CreatedByUserID    *int64    `gorm:"column:created_by_user_id"`
	UpdatedByUserID    *int64    `gorm:"column:updated_by_user_id"`
	CreatedAt          time.Time `gorm:"column:created_at"`
	UpdatedAt          time.Time `gorm:"column:updated_at"`
}

func (macekuPKKProfileRecord) TableName() string {
	return "maceku_pkk_profiles"
}

type macekuPKKArchiveRecord struct {
	ID               int64      `gorm:"column:id"`
	ProfileID        int64      `gorm:"column:profile_id"`
	Title            string     `gorm:"column:judul_dokumen"`
	Category         string     `gorm:"column:kategori_arsip"`
	DocumentYear     string     `gorm:"column:tahun_dokumen"`
	DocumentNumber   string     `gorm:"column:nomor_dokumen"`
	DocumentDate     *time.Time `gorm:"column:tanggal_dokumen"`
	Description      string     `gorm:"column:deskripsi"`
	FileID           *int64     `gorm:"column:file_id"`
	FileURL          string     `gorm:"column:file_url"`
	OriginalName     string     `gorm:"column:original_name"`
	MimeType         string     `gorm:"column:mime_type"`
	Size             int64      `gorm:"column:size"`
	UploadedByUserID *int64     `gorm:"column:uploaded_by_user_id"`
	UploadedByName   string     `gorm:"column:uploaded_by_name"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
	UpdatedAt        time.Time  `gorm:"column:updated_at"`
}

func (macekuPKKArchiveRecord) TableName() string {
	return "maceku_pkk_archives"
}

func NewMacekuPKKRepository(db *gorm.DB) *MacekuPKKRepository {
	return &MacekuPKKRepository{db: db}
}

func (r *MacekuPKKRepository) List(ctx context.Context, params model.MacekuPKKProfileListParams) (model.MacekuPKKListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKListResponse{}, err
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Limit > 100 {
		params.Limit = 100
	}

	var total int64
	if err := r.profileQuery(db, params).Count(&total).Error; err != nil {
		return model.MacekuPKKListResponse{}, fmt.Errorf("count maceku pkk profiles: %w", err)
	}

	records := make([]model.MacekuPKKProfileSummary, 0)
	if err := r.profileQuery(db, params).
		Select(`
			p.id,
			p.nama_pkk AS name,
			p.tingkat_pkk AS level,
			p.kabupaten_kota,
			p.distrik,
			p.kampung,
			p.nama_ketua AS chairperson,
			p.periode_kepengurusan AS management_period,
			p.is_active,
			p.updated_at,
			COUNT(a.id) AS document_count
		`).
		Group("p.id").
		Order("p.updated_at DESC, p.id DESC").
		Offset((params.Page - 1) * params.Limit).
		Limit(params.Limit).
		Scan(&records).Error; err != nil {
		return model.MacekuPKKListResponse{}, fmt.Errorf("list maceku pkk profiles: %w", err)
	}

	return model.MacekuPKKListResponse{
		Items: records,
		Meta: model.MacekuPKKMeta{
			Page:       params.Page,
			Limit:      params.Limit,
			Total:      total,
			TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
		},
	}, nil
}

func (r *MacekuPKKRepository) Options(ctx context.Context, scope model.UserRegionScope) (model.MacekuPKKOptionsResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKOptionsResponse{}, err
	}

	kabupatenKota := make([]string, 0)
	queryKabupaten := db.Table("kab_kota").
		Where("TRIM(nama) <> ''")
	if strings.TrimSpace(scope.KabupatenKota) != "" {
		queryKabupaten = queryKabupaten.Where("LOWER(nama) = ?", strings.ToLower(strings.TrimSpace(scope.KabupatenKota)))
	}
	if err := queryKabupaten.Order("nama ASC").Pluck("nama", &kabupatenKota).Error; err != nil {
		return model.MacekuPKKOptionsResponse{}, fmt.Errorf("list maceku kabupaten options: %w", err)
	}

	distrik := make([]model.MacekuPKKDistrikOption, 0)
	distrikQuery := db.Table("bum_kampung").
		Select("DISTINCT kabupaten_kota, distrik").
		Where("TRIM(kabupaten_kota) <> '' AND TRIM(distrik) <> ''")
	distrikQuery = applyRegionScopeToBumKampungQuery(distrikQuery, scope)
	if err := distrikQuery.
		Order("kabupaten_kota ASC, distrik ASC").
		Scan(&distrik).Error; err != nil {
		return model.MacekuPKKOptionsResponse{}, fmt.Errorf("list maceku distrik options: %w", err)
	}

	kampung := make([]model.MacekuPKKKampungOption, 0)
	kampungQuery := db.Table("bum_kampung").
		Select("DISTINCT kabupaten_kota, distrik, kampung").
		Where("TRIM(kabupaten_kota) <> '' AND TRIM(distrik) <> '' AND TRIM(kampung) <> ''")
	kampungQuery = applyRegionScopeToBumKampungQuery(kampungQuery, scope)
	if err := kampungQuery.
		Order("kabupaten_kota ASC, distrik ASC, kampung ASC").
		Scan(&kampung).Error; err != nil {
		return model.MacekuPKKOptionsResponse{}, fmt.Errorf("list maceku kampung options: %w", err)
	}

	return model.MacekuPKKOptionsResponse{
		KabupatenKota: kabupatenKota,
		Distrik:       distrik,
		Kampung:       kampung,
	}, nil
}

func (r *MacekuPKKRepository) Detail(ctx context.Context, id int64, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKProfileDetail{}, false, err
	}

	var record model.MacekuPKKProfileDetail
	err = r.profileQuery(db, model.MacekuPKKProfileListParams{RegionScope: scope}).
		Where("p.id = ?", id).
		Select(`
			p.id,
			p.nama_pkk AS name,
			p.tingkat_pkk AS level,
			p.kabupaten_kota,
			p.distrik,
			p.kampung,
			p.alamat_sekretariat AS secretariat_address,
			p.nama_ketua AS chairperson,
			p.nama_sekretaris AS secretary,
			p.nomor_telepon AS phone,
			p.email,
			p.periode_kepengurusan AS management_period,
			p.deskripsi_singkat AS description,
			p.logo_file_id,
			COALESCE(f.original_filename, p.logo_original_name) AS logo_original_name,
			COALESCE(f.mime_type, p.logo_mime_type) AS logo_mime_type,
			COALESCE(f.file_size, p.logo_size) AS logo_size,
			COALESCE(f.storage_key, p.logo_url) AS logo_storage_url,
			COALESCE(f.checksum_sha256, '') AS logo_checksum_sha256,
			p.is_active,
			p.created_at,
			p.updated_at,
			COUNT(a.id) AS document_count
		`).
		Joins("LEFT JOIN stored_files f ON f.id = p.logo_file_id AND f.deleted_at IS NULL").
		Group("p.id, f.id").
		Take(&record).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.MacekuPKKProfileDetail{}, false, nil
		}
		return model.MacekuPKKProfileDetail{}, false, fmt.Errorf("detail maceku pkk profile: %w", err)
	}

	if record.LogoFileID != nil && *record.LogoFileID > 0 {
		record.LogoPreviewURL = fmt.Sprintf("/api/backend/files/%d/preview", *record.LogoFileID)
	} else if strings.TrimSpace(record.LogoStorageURL) != "" {
		record.LogoPreviewURL = fmt.Sprintf("/api/backend/maceku-pkk/%d/logo", record.ID)
	}
	archives, err := r.listArchives(db, record.ID)
	if err != nil {
		return model.MacekuPKKProfileDetail{}, false, err
	}
	record.Archives = archives
	return record, true, nil
}

func (r *MacekuPKKRepository) Create(ctx context.Context, input model.MacekuPKKProfileMutation, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKProfileDetail{}, err
	}

	record := mapProfileMutationToEntity(input)
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&record).Error; err != nil {
			return err
		}
		if input.LogoFile == nil {
			return nil
		}
		file, err := createStoredFileRecord(tx, *input.LogoFile, record.ID)
		if err != nil {
			return err
		}
		record.LogoFileID = &file.ID
		return tx.Table("maceku_pkk_profiles").
			Where("id = ?", record.ID).
			Update("logo_file_id", file.ID).Error
	})
	if err != nil {
		return model.MacekuPKKProfileDetail{}, fmt.Errorf("create maceku pkk profile: %w", normalizeMacekuWriteError(err))
	}

	detail, found, err := r.Detail(ctx, record.ID, scope)
	if err != nil {
		return model.MacekuPKKProfileDetail{}, err
	}
	if !found {
		return model.MacekuPKKProfileDetail{}, fmt.Errorf("created maceku pkk profile not found")
	}
	return detail, nil
}

func (r *MacekuPKKRepository) Update(ctx context.Context, id int64, input model.MacekuPKKProfileMutation, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKProfileDetail{}, false, err
	}

	updates := map[string]any{
		"nama_pkk":             strings.TrimSpace(input.Payload.Name),
		"tingkat_pkk":          input.Level,
		"kabupaten_kota":       strings.TrimSpace(input.Payload.KabupatenKota),
		"distrik":              strings.TrimSpace(input.Payload.Distrik),
		"kampung":              strings.TrimSpace(input.Payload.Kampung),
		"alamat_sekretariat":   strings.TrimSpace(input.Payload.SecretariatAddress),
		"nama_ketua":           strings.TrimSpace(input.Payload.Chairperson),
		"nama_sekretaris":      strings.TrimSpace(input.Payload.Secretary),
		"nomor_telepon":        strings.TrimSpace(input.Payload.Phone),
		"email":                strings.TrimSpace(input.Payload.Email),
		"periode_kepengurusan": strings.TrimSpace(input.Payload.ManagementPeriod),
		"deskripsi_singkat":    strings.TrimSpace(input.Payload.Description),
		"is_active":            input.Payload.IsActive,
		"updated_by_user_id":   input.ActorUserID,
		"updated_at":           gorm.Expr("NOW()"),
	}
	if input.LogoURL != "" || input.LogoOriginalName != "" || input.LogoMimeType != "" || input.LogoSize > 0 {
		updates["logo_url"] = strings.TrimSpace(input.LogoURL)
		updates["logo_original_name"] = strings.TrimSpace(input.LogoOriginalName)
		updates["logo_mime_type"] = strings.TrimSpace(input.LogoMimeType)
		updates["logo_size"] = input.LogoSize
	}

	found := true
	err = db.Transaction(func(tx *gorm.DB) error {
		var current macekuPKKProfileRecord
		if err := tx.Where("id = ?", id).Take(&current).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				found = false
				return nil
			}
			return err
		}
		if input.LogoFile != nil {
			file, err := createStoredFileRecord(tx, *input.LogoFile, id)
			if err != nil {
				return err
			}
			updates["logo_file_id"] = file.ID
			if current.LogoFileID != nil {
				if err := softDeleteStoredFileRecord(tx, *current.LogoFileID); err != nil {
					return err
				}
			}
		}
		return tx.Table("maceku_pkk_profiles").Where("id = ?", id).Updates(updates).Error
	})
	if err != nil {
		return model.MacekuPKKProfileDetail{}, false, fmt.Errorf("update maceku pkk profile: %w", normalizeMacekuWriteError(err))
	}
	if !found {
		return model.MacekuPKKProfileDetail{}, false, nil
	}

	detail, found, err := r.Detail(ctx, id, scope)
	return detail, found, err
}

func (r *MacekuPKKRepository) Delete(ctx context.Context, id int64, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, bool, error) {
	detail, found, err := r.Detail(ctx, id, scope)
	if err != nil || !found {
		return detail, found, err
	}

	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKProfileDetail{}, false, err
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		if err := softDeleteStoredFilesForEntity(tx, "maceku-pkk", "maceku_pkk_profile", id); err != nil {
			return err
		}
		if err := tx.Exec(`
			UPDATE stored_files
			SET deleted_at = NOW(), updated_at = NOW()
			WHERE module = 'maceku-pkk'
			  AND related_entity_type = 'maceku_pkk_archive'
			  AND related_entity_id IN (
			    SELECT id FROM maceku_pkk_archives WHERE profile_id = ?
			  )
			  AND deleted_at IS NULL
		`, id).Error; err != nil {
			return err
		}
		result := tx.Table("maceku_pkk_profiles").Where("id = ?", id).Delete(&macekuPKKProfileRecord{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.MacekuPKKProfileDetail{}, false, nil
	}
	if err != nil {
		return model.MacekuPKKProfileDetail{}, false, fmt.Errorf("delete maceku pkk profile: %w", err)
	}

	return detail, true, nil
}

func (r *MacekuPKKRepository) CreateArchive(ctx context.Context, payload model.MacekuPKKArchivePayload) (model.MacekuPKKArchive, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKArchive{}, err
	}

	record := macekuPKKArchiveRecord{
		ProfileID:        payload.ProfileID,
		Title:            strings.TrimSpace(payload.Title),
		Category:         string(payload.Category),
		DocumentYear:     strings.TrimSpace(payload.DocumentYear),
		DocumentNumber:   strings.TrimSpace(payload.DocumentNumber),
		DocumentDate:     payload.DocumentDate,
		Description:      strings.TrimSpace(payload.Description),
		FileURL:          strings.TrimSpace(payload.FileURL),
		OriginalName:     strings.TrimSpace(payload.OriginalName),
		MimeType:         strings.TrimSpace(payload.MimeType),
		Size:             payload.Size,
		UploadedByUserID: payload.UploadedByUserID,
		UploadedByName:   strings.TrimSpace(payload.UploadedByName),
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
		return tx.Table("maceku_pkk_archives").
			Where("id = ?", record.ID).
			Update("file_id", file.ID).Error
	})
	if err != nil {
		return model.MacekuPKKArchive{}, fmt.Errorf("create maceku pkk archive: %w", err)
	}
	archive, found, err := r.ArchiveByID(ctx, payload.ProfileID, record.ID)
	if err != nil {
		return model.MacekuPKKArchive{}, err
	}
	if !found {
		return model.MacekuPKKArchive{}, fmt.Errorf("created maceku pkk archive not found")
	}
	return archive, nil
}

func (r *MacekuPKKRepository) ArchiveByID(ctx context.Context, profileID, archiveID int64) (model.MacekuPKKArchive, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKArchive{}, false, err
	}

	var record model.MacekuPKKArchive
	err = db.Table("maceku_pkk_archives").
		Where("profile_id = ? AND id = ?", profileID, archiveID).
		Select(macekuArchiveSelect()).
		Take(&record).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.MacekuPKKArchive{}, false, nil
		}
		return model.MacekuPKKArchive{}, false, fmt.Errorf("detail maceku pkk archive: %w", err)
	}
	return finalizeMacekuArchive(record), true, nil
}

func (r *MacekuPKKRepository) UpdateArchive(ctx context.Context, profileID, archiveID int64, payload model.UpdateMacekuPKKArchivePayload) (model.MacekuPKKArchive, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKArchive{}, false, err
	}

	var documentDate any
	if trimmed := strings.TrimSpace(payload.DocumentDate); trimmed != "" {
		parsed, parseErr := time.Parse("2006-01-02", trimmed)
		if parseErr != nil {
			return model.MacekuPKKArchive{}, false, fmt.Errorf("parse maceku pkk archive date: %w", parseErr)
		}
		documentDate = parsed
	}

	result := db.Table("maceku_pkk_archives").
		Where("profile_id = ? AND id = ?", profileID, archiveID).
		Updates(map[string]any{
			"judul_dokumen":   strings.TrimSpace(payload.Title),
			"kategori_arsip":  payload.Category,
			"tahun_dokumen":   strings.TrimSpace(payload.DocumentYear),
			"nomor_dokumen":   strings.TrimSpace(payload.DocumentNumber),
			"tanggal_dokumen": documentDate,
			"deskripsi":       strings.TrimSpace(payload.Description),
			"updated_at":      gorm.Expr("NOW()"),
		})
	if result.Error != nil {
		return model.MacekuPKKArchive{}, false, fmt.Errorf("update maceku pkk archive: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return model.MacekuPKKArchive{}, false, nil
	}

	return r.ArchiveByID(ctx, profileID, archiveID)
}

func (r *MacekuPKKRepository) DeleteArchive(ctx context.Context, profileID, archiveID int64) (model.MacekuPKKArchive, bool, error) {
	archive, found, err := r.ArchiveByID(ctx, profileID, archiveID)
	if err != nil || !found {
		return archive, found, err
	}

	db, err := r.session(ctx)
	if err != nil {
		return model.MacekuPKKArchive{}, false, err
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		if archive.FileID != nil {
			if err := softDeleteStoredFileRecord(tx, *archive.FileID); err != nil {
				return err
			}
		}
		result := tx.Table("maceku_pkk_archives").
			Where("profile_id = ? AND id = ?", profileID, archiveID).
			Delete(&struct{}{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.MacekuPKKArchive{}, false, nil
	}
	if err != nil {
		return model.MacekuPKKArchive{}, false, fmt.Errorf("delete maceku pkk archive: %w", err)
	}
	return archive, true, nil
}

func (r *MacekuPKKRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *MacekuPKKRepository) profileQuery(db *gorm.DB, params model.MacekuPKKProfileListParams) *gorm.DB {
	query := db.Table("maceku_pkk_profiles AS p").
		Joins("LEFT JOIN maceku_pkk_archives AS a ON a.profile_id = p.id")
	query = applyRegionScopeToProfileQuery(query, params.RegionScope)

	search := strings.ToLower(strings.TrimSpace(params.Search))
	if search != "" {
		like := "%" + search + "%"
		query = query.Where(`
			LOWER(p.nama_pkk) LIKE ? OR
			LOWER(p.nama_ketua) LIKE ? OR
			LOWER(p.nama_sekretaris) LIKE ? OR
			LOWER(p.kabupaten_kota) LIKE ? OR
			LOWER(p.distrik) LIKE ? OR
			LOWER(p.kampung) LIKE ?
		`, like, like, like, like, like, like)
	}
	if level := strings.TrimSpace(params.Level); level != "" {
		query = query.Where("p.tingkat_pkk = ?", level)
	}
	if kabupaten := strings.TrimSpace(params.KabupatenKota); kabupaten != "" {
		query = query.Where("LOWER(p.kabupaten_kota) = ?", strings.ToLower(kabupaten))
	}
	if distrik := strings.TrimSpace(params.Distrik); distrik != "" {
		query = query.Where("LOWER(p.distrik) = ?", strings.ToLower(distrik))
	}
	if kampung := strings.TrimSpace(params.Kampung); kampung != "" {
		query = query.Where("LOWER(p.kampung) = ?", strings.ToLower(kampung))
	}
	switch strings.ToLower(strings.TrimSpace(params.Status)) {
	case "aktif", "active", "true":
		query = query.Where("p.is_active = TRUE")
	case "nonaktif", "inactive", "false":
		query = query.Where("p.is_active = FALSE")
	}
	return query
}

func (r *MacekuPKKRepository) listArchives(db *gorm.DB, profileID int64) ([]model.MacekuPKKArchive, error) {
	records := make([]model.MacekuPKKArchive, 0)
	if err := db.Table("maceku_pkk_archives").
		Where("profile_id = ?", profileID).
		Select(macekuArchiveSelect()).
		Order("created_at DESC, id DESC").
		Scan(&records).Error; err != nil {
		return nil, fmt.Errorf("list maceku pkk archives: %w", err)
	}

	for index := range records {
		records[index] = finalizeMacekuArchive(records[index])
	}
	return records, nil
}

func macekuArchiveSelect() string {
	return `
		id,
		profile_id,
		judul_dokumen AS title,
		kategori_arsip AS category,
		tahun_dokumen AS document_year,
		nomor_dokumen AS document_number,
		COALESCE(TO_CHAR(tanggal_dokumen, 'YYYY-MM-DD'), '') AS document_date,
		deskripsi AS description,
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
		  (SELECT f.original_filename FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  original_name
		) AS original_name,
		COALESCE(
		  (SELECT f.checksum_sha256 FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  ''
		) AS checksum_sha256,
		uploaded_by_name,
		COALESCE(
		  (SELECT f.storage_key FROM stored_files f WHERE f.id = file_id AND f.deleted_at IS NULL),
		  file_url
		) AS storage_url,
		created_at AS uploaded_at,
		updated_at
	`
}

func finalizeMacekuArchive(record model.MacekuPKKArchive) model.MacekuPKKArchive {
	fileTypeSource := record.OriginalName
	if fileTypeSource == "" {
		fileTypeSource = filepath.Base(strings.TrimSpace(record.StorageURL))
	}
	record.FileType = pelaksanaanDocumentFileType(fileTypeSource, record.MimeType)
	if record.FileID != nil && *record.FileID > 0 {
		record.DownloadURL = fmt.Sprintf("/api/backend/files/%d/download", *record.FileID)
		record.PreviewURL = fmt.Sprintf("/api/backend/files/%d/preview", *record.FileID)
	} else {
		record.DownloadURL = fmt.Sprintf("/api/backend/maceku-pkk/%d/archives/%d/download", record.ProfileID, record.ID)
		record.PreviewURL = fmt.Sprintf("/api/backend/maceku-pkk/%d/archives/%d/preview", record.ProfileID, record.ID)
	}
	return record
}

func applyRegionScopeToProfileQuery(query *gorm.DB, scope model.UserRegionScope) *gorm.DB {
	if kabupaten := strings.TrimSpace(scope.KabupatenKota); kabupaten != "" {
		query = query.Where("LOWER(p.kabupaten_kota) = ?", strings.ToLower(kabupaten))
	}
	if distrik := strings.TrimSpace(scope.Distrik); distrik != "" {
		query = query.Where("LOWER(p.distrik) = ?", strings.ToLower(distrik))
	}
	if kampung := strings.TrimSpace(scope.Kampung); kampung != "" {
		query = query.Where("LOWER(p.kampung) = ?", strings.ToLower(kampung))
	}
	return query
}

func applyRegionScopeToBumKampungQuery(query *gorm.DB, scope model.UserRegionScope) *gorm.DB {
	if kabupaten := strings.TrimSpace(scope.KabupatenKota); kabupaten != "" {
		query = query.Where("LOWER(kabupaten_kota) = ?", strings.ToLower(kabupaten))
	}
	if distrik := strings.TrimSpace(scope.Distrik); distrik != "" {
		query = query.Where("LOWER(distrik) = ?", strings.ToLower(distrik))
	}
	if kampung := strings.TrimSpace(scope.Kampung); kampung != "" {
		query = query.Where("LOWER(kampung) = ?", strings.ToLower(kampung))
	}
	return query
}

func mapProfileMutationToEntity(input model.MacekuPKKProfileMutation) macekuPKKProfileRecord {
	return macekuPKKProfileRecord{
		Name:               strings.TrimSpace(input.Payload.Name),
		Level:              string(input.Level),
		KabupatenKota:      strings.TrimSpace(input.Payload.KabupatenKota),
		Distrik:            strings.TrimSpace(input.Payload.Distrik),
		Kampung:            strings.TrimSpace(input.Payload.Kampung),
		SecretariatAddress: strings.TrimSpace(input.Payload.SecretariatAddress),
		Chairperson:        strings.TrimSpace(input.Payload.Chairperson),
		Secretary:          strings.TrimSpace(input.Payload.Secretary),
		Phone:              strings.TrimSpace(input.Payload.Phone),
		Email:              strings.TrimSpace(input.Payload.Email),
		ManagementPeriod:   strings.TrimSpace(input.Payload.ManagementPeriod),
		Description:        strings.TrimSpace(input.Payload.Description),
		LogoURL:            strings.TrimSpace(input.LogoURL),
		LogoOriginalName:   strings.TrimSpace(input.LogoOriginalName),
		LogoMimeType:       strings.TrimSpace(input.LogoMimeType),
		LogoSize:           input.LogoSize,
		IsActive:           input.Payload.IsActive,
		CreatedByUserID:    input.ActorUserID,
		UpdatedByUserID:    input.ActorUserID,
	}
}

func normalizeMacekuWriteError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return ErrMacekuPKKDuplicate
	}
	return err
}
