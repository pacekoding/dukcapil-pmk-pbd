package repository

import (
	"context"
	"fmt"
	"math"
	"path/filepath"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type PelaksanaanDocumentRepository struct {
	db *gorm.DB
}

func NewPelaksanaanDocumentRepository(db *gorm.DB) *PelaksanaanDocumentRepository {
	return &PelaksanaanDocumentRepository{db: db}
}

func (r *PelaksanaanDocumentRepository) Create(ctx context.Context, tahunAnggaran string, payload model.PelaksanaanDocumentPayload) (model.PelaksanaanDocumentItem, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.PelaksanaanDocumentItem{}, err
	}

	record := model.PelaksanaanDocumentEntity{
		TahunAnggaran:  strings.TrimSpace(tahunAnggaran),
		SumberAplikasi: strings.TrimSpace(payload.SumberAplikasi),
		Bidang:         strings.TrimSpace(payload.Bidang),
		SubkegiatanID:  payload.SubkegiatanID,
		Nama:           strings.TrimSpace(payload.Nama),
		OriginalName:   strings.TrimSpace(payload.OriginalName),
		MimeType:       strings.TrimSpace(payload.MimeType),
		Size:           payload.Size,
		URL:            strings.TrimSpace(payload.URL),
		IsDokumenDSSD:  payload.IsDokumenDSSD,
	}
	if record.Nama == "" {
		record.Nama = record.OriginalName
	}
	if record.SumberAplikasi == "" {
		record.SumberAplikasi = "sidoka"
	}
	if record.Bidang == "" {
		record.Bidang = "pmk"
	}

	if err := db.Create(&record).Error; err != nil {
		return model.PelaksanaanDocumentItem{}, fmt.Errorf("create pelaksanaan document: %w", err)
	}

	item, found, err := r.DocumentByID(ctx, strings.TrimSpace(tahunAnggaran), record.ID)
	if err != nil {
		return model.PelaksanaanDocumentItem{}, err
	}
	if !found {
		return model.PelaksanaanDocumentItem{}, fmt.Errorf("created pelaksanaan document not found")
	}
	return item, nil
}

func (r *PelaksanaanDocumentRepository) ListDocuments(ctx context.Context, params model.PelaksanaanDocumentListParams) (model.PelaksanaanDocumentListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.PelaksanaanDocumentListResponse{}, err
	}

	params.TahunAnggaran = strings.TrimSpace(params.TahunAnggaran)
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
	if err := r.documentQuery(db, params).Count(&total).Error; err != nil {
		return model.PelaksanaanDocumentListResponse{}, fmt.Errorf("count pelaksanaan documents: %w", err)
	}

	records := make([]model.PelaksanaanDocumentItem, 0)
	if err := r.documentQuery(db, params).
		Select(`
			d.id,
			d.sumber_aplikasi,
			d.bidang,
			d.nama,
			d.subkegiatan_id,
			COALESCE(d.original_name, '') AS stored_file_name,
			d.mime_type,
			d.size AS file_size,
			d.url AS storage_url,
			d.is_dokumen_dssd,
			s.kode AS subkegiatan_code,
			s.nama AS subkegiatan_name,
			d.created_at AS tanggal_upload
		`).
		Order("d.created_at DESC, d.id DESC").
		Offset((params.Page - 1) * params.Limit).
		Limit(params.Limit).
		Scan(&records).Error; err != nil {
		return model.PelaksanaanDocumentListResponse{}, fmt.Errorf("list pelaksanaan documents: %w", err)
	}

	return model.PelaksanaanDocumentListResponse{
		Data: r.finalizeDocuments(records),
		Meta: model.PelaksanaanDocumentMeta{
			Page:       params.Page,
			Limit:      params.Limit,
			Total:      total,
			TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
		},
	}, nil
}

func (r *PelaksanaanDocumentRepository) DocumentByID(ctx context.Context, tahunAnggaran string, id int64) (model.PelaksanaanDocumentItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.PelaksanaanDocumentItem{}, false, err
	}

	params := model.PelaksanaanDocumentListParams{TahunAnggaran: strings.TrimSpace(tahunAnggaran)}
	var record model.PelaksanaanDocumentItem
	err = r.documentQuery(db, params).
		Where("d.id = ?", id).
		Select(`
			d.id,
			d.sumber_aplikasi,
			d.bidang,
			d.nama,
			d.subkegiatan_id,
			COALESCE(d.original_name, '') AS stored_file_name,
			d.mime_type,
			d.size AS file_size,
			d.url AS storage_url,
			d.is_dokumen_dssd,
			s.kode AS subkegiatan_code,
			s.nama AS subkegiatan_name,
			d.created_at AS tanggal_upload
		`).
		Take(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return model.PelaksanaanDocumentItem{}, false, nil
		}
		return model.PelaksanaanDocumentItem{}, false, fmt.Errorf("detail pelaksanaan document: %w", err)
	}

	records := r.finalizeDocuments([]model.PelaksanaanDocumentItem{record})
	return records[0], true, nil
}

func (r *PelaksanaanDocumentRepository) Update(ctx context.Context, tahunAnggaran string, id int64, payload model.UpdatePelaksanaanDocumentPayload) (model.PelaksanaanDocumentItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.PelaksanaanDocumentItem{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	result := db.Model(&model.PelaksanaanDocumentEntity{}).
		Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
		Updates(map[string]any{
			"nama":            strings.TrimSpace(payload.Nama),
			"subkegiatan_id":  payload.SubkegiatanID,
			"is_dokumen_dssd": payload.IsDokumenDSSD,
		})
	if result.Error != nil {
		return model.PelaksanaanDocumentItem{}, false, fmt.Errorf("update pelaksanaan document: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return model.PelaksanaanDocumentItem{}, false, nil
	}

	document, found, err := r.DocumentByID(ctx, tahunAnggaran, id)
	if err != nil {
		return model.PelaksanaanDocumentItem{}, false, err
	}
	return document, found, nil
}

func (r *PelaksanaanDocumentRepository) Delete(ctx context.Context, tahunAnggaran string, id int64) (model.PelaksanaanDocumentItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.PelaksanaanDocumentItem{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	document, found, err := r.DocumentByID(ctx, tahunAnggaran, id)
	if err != nil || !found {
		return document, found, err
	}

	result := db.
		Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
		Delete(&model.PelaksanaanDocumentEntity{})
	if result.Error != nil {
		return model.PelaksanaanDocumentItem{}, false, fmt.Errorf("delete pelaksanaan document: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return model.PelaksanaanDocumentItem{}, false, nil
	}

	return document, true, nil
}

func (r *PelaksanaanDocumentRepository) documentQuery(db *gorm.DB, params model.PelaksanaanDocumentListParams) *gorm.DB {
	query := db.Table("arsip AS d").
		Joins("LEFT JOIN subkegiatan AS s ON s.tahun_anggaran = d.tahun_anggaran AND s.id = d.subkegiatan_id").
		Where("d.tahun_anggaran = ?", strings.TrimSpace(params.TahunAnggaran))

	sumberAplikasi := strings.TrimSpace(strings.ToLower(params.SumberAplikasi))
	if sumberAplikasi != "" {
		query = query.Where("d.sumber_aplikasi = ?", sumberAplikasi)
	}

	bidang := strings.TrimSpace(strings.ToLower(params.Bidang))
	if bidang != "" {
		query = query.Where("d.bidang = ?", bidang)
	}

	search := strings.TrimSpace(strings.ToLower(params.Search))
	if search != "" {
		like := "%" + search + "%"
		query = query.Where(`
			LOWER(d.nama) LIKE ? OR
			LOWER(d.original_name) LIKE ? OR
			LOWER(COALESCE(s.kode, '')) LIKE ? OR
			LOWER(COALESCE(s.nama, '')) LIKE ?
		`, like, like, like, like)
	}

	subkegiatanPrefix := strings.TrimSpace(strings.ToLower(params.SubkegiatanPrefix))
	if subkegiatanPrefix != "" {
		query = query.Where("LOWER(COALESCE(s.kode, '')) LIKE ?", subkegiatanPrefix+"%")
	}

	return query
}

func (r *PelaksanaanDocumentRepository) finalizeDocuments(records []model.PelaksanaanDocumentItem) []model.PelaksanaanDocumentItem {
	for index := range records {
		storedName := filepath.Base(strings.TrimSpace(records[index].StorageURL))
		if storedName == "." || storedName == string(filepath.Separator) {
			storedName = records[index].StoredFileName
		}
		records[index].StoredFileName = storedName
		typeSource := records[index].Nama
		if filepath.Ext(typeSource) == "" {
			typeSource = storedName
		}
		records[index].FileType = pelaksanaanDocumentFileType(typeSource, records[index].MimeType)
		records[index].DownloadURL = fmt.Sprintf("/api/v1/pelaksanaan-documents/%d/download", records[index].ID)
	}
	return records
}

func pelaksanaanDocumentFileType(fileName string, mimeType string) string {
	extension := strings.ToLower(filepath.Ext(fileName))
	switch extension {
	case ".pdf":
		return string(model.PelaksanaanDocumentTypePDF)
	case ".doc", ".docx":
		return string(model.PelaksanaanDocumentTypeWord)
	case ".xls", ".xlsx":
		return string(model.PelaksanaanDocumentTypeExcel)
	case ".png", ".jpg", ".jpeg":
		return string(model.PelaksanaanDocumentTypeImage)
	}

	mimeType = strings.ToLower(strings.TrimSpace(mimeType))
	switch mimeType {
	case "application/pdf":
		return string(model.PelaksanaanDocumentTypePDF)
	case "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return string(model.PelaksanaanDocumentTypeWord)
	case "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
		return string(model.PelaksanaanDocumentTypeExcel)
	case "image/png", "image/jpeg":
		return string(model.PelaksanaanDocumentTypeImage)
	default:
		return "unknown"
	}
}

func (r *PelaksanaanDocumentRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
