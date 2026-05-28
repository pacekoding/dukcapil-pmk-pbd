package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type KegiatanRepository struct {
	db *gorm.DB
}

func NewKegiatanRepository(db *gorm.DB) *KegiatanRepository {
	return &KegiatanRepository{db: db}
}

func (r *KegiatanRepository) List(ctx context.Context) (model.KegiatanListResponse, error) {
	items, err := r.listKegiatan(ctx, false)
	if err != nil {
		return model.KegiatanListResponse{}, err
	}
	return model.KegiatanListResponse{
		Items:   items,
		Options: KegiatanOptions(),
	}, nil
}

func (r *KegiatanRepository) DashboardOverview(ctx context.Context, tahunAnggaran string) (model.DashboardOverview, error) {
	items, err := r.listKegiatan(ctx, false)
	if err != nil {
		return model.DashboardOverview{}, err
	}
	laporan, err := r.countDokumenByJenis(ctx, "Laporan")
	if err != nil {
		return model.DashboardOverview{}, err
	}

	activities := make([]model.DashboardActivity, 0, min(3, len(items)))
	for index, item := range items {
		if index >= 3 {
			break
		}

		icon := "calendar"
		color := "bg-blue-50 text-blue-600"
		if item.Status == "Selesai" {
			icon = "checkCircle"
			color = "bg-amber-50 text-amber-600"
		} else if item.Status == "Berjalan" {
			icon = "play"
			color = "bg-emerald-50 text-emerald-600"
		}

		activities = append(activities, model.DashboardActivity{
			Title:    item.Nama,
			Location: item.Lokasi,
			Status:   item.Status,
			Time:     relativeActivityTime(index),
			Icon:     icon,
			Color:    color,
		})
	}

	return model.DashboardOverview{
		TahunAnggaran: tahunAnggaran,
		Stats: []model.DashboardStat{
			{Title: "Total Kegiatan", Value: fmt.Sprintf("%d", len(items)), Icon: "calendar", Color: "bg-blue-50 text-blue-600", Trend: "+12%"},
			{Title: "Kegiatan Berjalan", Value: fmt.Sprintf("%d", countKegiatanByStatus(items, "Berjalan")), Icon: "play", Color: "bg-emerald-50 text-emerald-600", Trend: "+12%"},
			{Title: "Kegiatan Selesai", Value: fmt.Sprintf("%d", countKegiatanByStatus(items, "Selesai")), Icon: "checkCircle", Color: "bg-amber-50 text-amber-600", Trend: "+12%"},
			{Title: "Laporan Dibuat", Value: fmt.Sprintf("%d", laporan), Icon: "fileText", Color: "bg-violet-50 text-violet-600", Trend: "+12%"},
		},
		Activities: activities,
	}, nil
}

func (r *KegiatanRepository) WebsiteHome(ctx context.Context) (model.WebsiteHomeResponse, error) {
	items, err := r.publicKegiatanItems(ctx, false)
	if err != nil {
		return model.WebsiteHomeResponse{}, err
	}

	var response model.WebsiteHomeResponse
	response.Hero.Eyebrow = "Portal Kegiatan Resmi"
	response.Hero.Title = "Dukcapil & PMK Papua Barat Daya"
	response.Hero.Description = "Publikasi kegiatan, dokumen, dan profil Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung Provinsi Papua Barat Daya."
	response.Stats = websiteStats(items)
	response.Highlights = []model.WebsiteHighlight{
		{Title: "Pelayanan Administrasi Kependudukan", Description: "Kegiatan Dukcapil berfokus pada pelayanan dokumen, aktivasi IKD, validasi data, dan peningkatan kualitas layanan masyarakat."},
		{Title: "Pemberdayaan Masyarakat Kampung", Description: "Kegiatan PMK mendukung pendampingan tata kelola kampung, monitoring program, dan penguatan kapasitas aparatur."},
		{Title: "Dokumen Kegiatan Terintegrasi", Description: "Setiap kegiatan memiliki dokumen TOR dan laporan yang dapat dipreview melalui alur dashboard internal."},
	}
	response.LatestKegiatan = items[:min(3, len(items))]
	response.ProfileSummary.Title = "Profil Dinas Dukcapil & PMK"
	response.ProfileSummary.Description = "Dinas menyelenggarakan urusan administrasi kependudukan, pencatatan sipil, pemberdayaan masyarakat kampung, dan pengelolaan data layanan publik berbasis kegiatan."
	return response, nil
}

func (r *KegiatanRepository) WebsiteKegiatan(ctx context.Context) (model.WebsiteKegiatanResponse, error) {
	items, err := r.publicKegiatanItems(ctx, true)
	if err != nil {
		return model.WebsiteKegiatanResponse{}, err
	}

	return model.WebsiteKegiatanResponse{
		Items:        items,
		JenisOptions: publicJenisOptions(items),
		Stats:        websiteStats(items),
	}, nil
}

func (r *KegiatanRepository) WebsiteKegiatanDetail(ctx context.Context, id int) (model.PublicKegiatanItem, bool, error) {
	items, err := r.publicKegiatanItems(ctx, true)
	if err != nil {
		return model.PublicKegiatanItem{}, false, err
	}

	for _, item := range items {
		if item.ID == id {
			return item, true, nil
		}
	}

	return model.PublicKegiatanItem{}, false, nil
}

func (r *KegiatanRepository) GetByID(ctx context.Context, id int) (model.Kegiatan, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Kegiatan{}, false, err
	}

	record, found, err := findKegiatanByID(db, id)
	if err != nil || !found {
		return model.Kegiatan{}, found, err
	}

	return record.ToKegiatan(), true, nil
}

func (r *KegiatanRepository) Create(ctx context.Context, payload model.Kegiatan) (model.Kegiatan, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Kegiatan{}, err
	}

	record := kegiatanEntityFromPayload(payload)
	if err := db.Create(&record).Error; err != nil {
		return model.Kegiatan{}, fmt.Errorf("create kegiatan: %w", err)
	}

	created, found, err := findKegiatanByID(db, record.ID)
	if err != nil {
		return model.Kegiatan{}, err
	}
	if !found {
		return model.Kegiatan{}, fmt.Errorf("created kegiatan not found")
	}

	return created.ToKegiatan(), nil
}

func (r *KegiatanRepository) Update(ctx context.Context, id int, payload model.Kegiatan) (model.Kegiatan, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Kegiatan{}, false, err
	}

	var record model.KegiatanEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.KegiatanEntity{}).
			Where("id = ?", id).
			Updates(map[string]any{
				"nama":             strings.TrimSpace(payload.Nama),
				"jenis":            strings.TrimSpace(payload.Jenis),
				"tanggal":          strings.TrimSpace(payload.Tanggal),
				"lokasi":           strings.TrimSpace(payload.Lokasi),
				"status":           strings.TrimSpace(payload.Status),
				"bidang":           strings.TrimSpace(payload.Bidang),
				"penanggung_jawab": strings.TrimSpace(payload.PenanggungJawab),
				"peserta":          payload.Peserta,
				"progres":          payload.Progres,
				"deskripsi":        strings.TrimSpace(payload.Deskripsi),
				"updated_at":       gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		var err error
		record, _, err = findKegiatanByID(tx, id)
		return err
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Kegiatan{}, false, nil
	}
	if err != nil {
		return model.Kegiatan{}, false, fmt.Errorf("update kegiatan: %w", err)
	}

	return record.ToKegiatan(), true, nil
}

func (r *KegiatanRepository) Delete(ctx context.Context, id int) (model.Kegiatan, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Kegiatan{}, false, err
	}

	var record model.KegiatanEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		var found bool
		var err error
		record, found, err = findKegiatanByID(tx, id)
		if err != nil {
			return err
		}
		if !found {
			return gorm.ErrRecordNotFound
		}

		return tx.Delete(&model.KegiatanEntity{}, "id = ?", id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Kegiatan{}, false, nil
	}
	if err != nil {
		return model.Kegiatan{}, false, fmt.Errorf("delete kegiatan: %w", err)
	}

	return record.ToKegiatan(), true, nil
}

func (r *KegiatanRepository) AddDokumentasi(ctx context.Context, id int, payload model.KegiatanDokumentasiPayload) (model.KegiatanDokumentasiItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KegiatanDokumentasiItem{}, false, err
	}

	var item model.KegiatanDokumentasiEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&model.KegiatanEntity{}).Where("id = ?", id).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return gorm.ErrRecordNotFound
		}

		item = model.KegiatanDokumentasiEntity{
			KegiatanID: id,
			URL:        strings.TrimSpace(payload.URL),
			Caption:    strings.TrimSpace(payload.Caption),
			FileName:   strings.TrimSpace(payload.FileName),
			UploadedAt: time.Now().UTC(),
		}
		return tx.Create(&item).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.KegiatanDokumentasiItem{}, false, nil
	}
	if err != nil {
		return model.KegiatanDokumentasiItem{}, false, fmt.Errorf("add kegiatan dokumentasi: %w", err)
	}

	return item.ToDokumentasiItem(), true, nil
}

func (r *KegiatanRepository) DeleteDokumentasi(ctx context.Context, id, documentationID int) (model.KegiatanDokumentasiItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KegiatanDokumentasiItem{}, false, err
	}

	var item model.KegiatanDokumentasiEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&item, "id = ? AND kegiatan_id = ?", documentationID, id).Error; err != nil {
			return err
		}
		return tx.Delete(&item).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.KegiatanDokumentasiItem{}, false, nil
	}
	if err != nil {
		return model.KegiatanDokumentasiItem{}, false, fmt.Errorf("delete kegiatan dokumentasi: %w", err)
	}

	return item.ToDokumentasiItem(), true, nil
}

func KegiatanOptions() model.KegiatanListOptions {
	return model.KegiatanListOptions{
		BidangOptions: []model.KegiatanSelectOption{
			{Value: "Dukcapil", Label: "Dukcapil"},
			{Value: "PMK", Label: "PMK"},
			{Value: "Sekretariat", Label: "Sekretariat"},
		},
		JenisOptions: []model.KegiatanSelectOption{
			{Value: "Sosialisasi", Label: "Sosialisasi"},
			{Value: "Bimtek", Label: "Bimtek"},
			{Value: "Pendampingan", Label: "Pendampingan"},
			{Value: "Monev", Label: "Monev"},
			{Value: "Rapat", Label: "Rapat"},
		},
		StatusFilterOptions: []model.KegiatanStatusFilterOption{
			{Value: "all", Label: "Semua Status"},
			{Value: "Berjalan", Label: "Berjalan"},
			{Value: "Selesai", Label: "Selesai"},
			{Value: "Draft", Label: "Draft"},
		},
		StatusFormOptions: []model.KegiatanSelectOption{
			{Value: "Draft", Label: "Draft"},
			{Value: "Berjalan", Label: "Berjalan"},
			{Value: "Selesai", Label: "Selesai"},
		},
	}
}

func kegiatanEntityFromPayload(payload model.Kegiatan) model.KegiatanEntity {
	return model.KegiatanEntity{
		Nama:            strings.TrimSpace(payload.Nama),
		Jenis:           strings.TrimSpace(payload.Jenis),
		Tanggal:         strings.TrimSpace(payload.Tanggal),
		Lokasi:          strings.TrimSpace(payload.Lokasi),
		Status:          strings.TrimSpace(payload.Status),
		Bidang:          strings.TrimSpace(payload.Bidang),
		PenanggungJawab: strings.TrimSpace(payload.PenanggungJawab),
		Peserta:         payload.Peserta,
		Progres:         payload.Progres,
		Deskripsi:       strings.TrimSpace(payload.Deskripsi),
	}
}

func findKegiatanByID(db *gorm.DB, id int) (model.KegiatanEntity, bool, error) {
	var record model.KegiatanEntity
	err := db.
		Preload("Dokumentasi", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("uploaded_at DESC, id DESC")
		}).
		First(&record, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.KegiatanEntity{}, false, nil
	}
	if err != nil {
		return model.KegiatanEntity{}, false, fmt.Errorf("find kegiatan by id: %w", err)
	}

	return record, true, nil
}

func (r *KegiatanRepository) listKegiatan(ctx context.Context, onlyCompleted bool) ([]model.Kegiatan, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}

	query := db.
		Preload("Dokumentasi", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("uploaded_at DESC, id DESC")
		})
	if onlyCompleted {
		query = query.Where("status = ?", "Selesai")
	}

	var records []model.KegiatanEntity
	if err := query.Order("created_at DESC, id DESC").Find(&records).Error; err != nil {
		return nil, fmt.Errorf("list kegiatan: %w", err)
	}

	items := make([]model.Kegiatan, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToKegiatan())
	}

	return items, nil
}

func (r *KegiatanRepository) publicKegiatanItems(ctx context.Context, onlyCompleted bool) ([]model.PublicKegiatanItem, error) {
	items, err := r.listKegiatan(ctx, onlyCompleted)
	if err != nil {
		return nil, err
	}
	dokumenCounts, err := r.dokumenCountsByKegiatan(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]model.PublicKegiatanItem, 0, len(items))
	for _, kegiatan := range items {
		counts := dokumenCounts[kegiatan.Nama]
		result = append(result, model.PublicKegiatanItem{
			ID:              kegiatan.ID,
			Nama:            kegiatan.Nama,
			Jenis:           kegiatan.Jenis,
			Tanggal:         kegiatan.Tanggal,
			Lokasi:          kegiatan.Lokasi,
			Status:          kegiatan.Status,
			Bidang:          kegiatan.Bidang,
			PenanggungJawab: kegiatan.PenanggungJawab,
			Peserta:         kegiatan.Peserta,
			Progres:         kegiatan.Progres,
			Deskripsi:       kegiatan.Deskripsi,
			Dokumentasi:     append([]model.KegiatanDokumentasiItem(nil), kegiatan.Dokumentasi...),
			Ringkasan:       ringkasan(kegiatan.Deskripsi),
			Dokumen:         model.WebsiteDokumenSummary{TOR: counts.TOR, Laporan: counts.Laporan, Total: counts.TOR + counts.Laporan},
		})
	}

	return result, nil
}

func (r *KegiatanRepository) countDokumenByJenis(ctx context.Context, jenis string) (int, error) {
	db, err := r.session(ctx)
	if err != nil {
		return 0, err
	}

	var count int64
	if err := db.Model(&model.DokumenEntity{}).Where("jenis_dokumen = ?", jenis).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("count dokumen by jenis: %w", err)
	}
	return int(count), nil
}

func (r *KegiatanRepository) dokumenCountsByKegiatan(ctx context.Context) (map[string]model.WebsiteDokumenSummary, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}

	var records []model.DokumenEntity
	if err := db.Find(&records).Error; err != nil {
		return nil, fmt.Errorf("list dokumen counts: %w", err)
	}

	result := map[string]model.WebsiteDokumenSummary{}
	for _, record := range records {
		counts := result[record.NamaKegiatan]
		if record.JenisDokumen == "TOR" {
			counts.TOR++
		}
		if record.JenisDokumen == "Laporan" {
			counts.Laporan++
		}
		counts.Total = counts.TOR + counts.Laporan
		result[record.NamaKegiatan] = counts
	}
	return result, nil
}

func (r *KegiatanRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
