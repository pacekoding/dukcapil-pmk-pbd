package repository

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

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
			jabatan AS position,
			unit,
			pangkat_golongan AS rank,
			email,
			telepon AS phone,
			no_rekening AS bank_account,
			alamat AS address,
			status,
			photo_color
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
			jabatan AS position,
			unit,
			pangkat_golongan AS rank,
			email,
			telepon AS phone,
			no_rekening AS bank_account,
			alamat AS address,
			status,
			photo_color
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
		"jabatan":          record.Jabatan,
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

func (r *ArsipPegawaiRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Where("id = ?", id).Delete(&model.ArsipPegawaiEntity{})
	if result.Error != nil {
		return false, fmt.Errorf("delete arsip pegawai: %w", result.Error)
	}
	return result.RowsAffected > 0, nil
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

	if err := db.Create(&record).Error; err != nil {
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

func (r *ArsipPegawaiRepository) DeleteDocument(ctx context.Context, pegawaiID int64, id int64) (model.ArsipPegawaiDocument, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.ArsipPegawaiDocument{}, false, err
	}

	document, found, err := r.DocumentByID(ctx, pegawaiID, id)
	if err != nil || !found {
		return document, found, err
	}

	result := db.Table("arsip").
		Where("sumber_aplikasi = ? AND pegawai_id = ? AND id = ?", "arsip_pegawai", pegawaiID, id).
		Delete(&model.PelaksanaanDocumentEntity{})
	if result.Error != nil {
		return model.ArsipPegawaiDocument{}, false, fmt.Errorf("delete dokumen arsip pegawai: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return model.ArsipPegawaiDocument{}, false, nil
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
			LOWER(unit) LIKE ? OR
			LOWER(pangkat_golongan) LIKE ?
		`, like, like, like, like, like, like)
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

func arsipPegawaiDocumentSelect() string {
	return `
		id,
		pegawai_id,
		bidang,
		nama AS title,
		kategori AS category,
		nomor_dokumen AS number,
		tahun_dokumen AS year,
		mime_type,
		size AS file_size,
		status_verifikasi AS status,
		COALESCE(original_name, '') AS stored_file_name,
		url AS storage_url,
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
	record.DownloadURL = fmt.Sprintf("/api/v1/arsip-pegawai/%d/documents/%d/download", record.PegawaiID, record.ID)
	return record
}

func pegawaiEntityFromPayload(payload model.ArsipPegawaiPayload) model.ArsipPegawaiEntity {
	return model.ArsipPegawaiEntity{
		NIP:             strings.TrimSpace(payload.NIP),
		NIK:             strings.TrimSpace(payload.NIK),
		Nama:            strings.TrimSpace(payload.Name),
		Jabatan:         strings.TrimSpace(payload.Position),
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

func (r *ArsipPegawaiRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
