package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type DokumenRepository struct {
	db *gorm.DB
}

func NewDokumenRepository(db *gorm.DB) *DokumenRepository {
	return &DokumenRepository{db: db}
}

func (r *DokumenRepository) List(ctx context.Context) (model.DokumenListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DokumenListResponse{}, err
	}

	var records []model.DokumenEntity
	if err := db.Order("created_at DESC, id DESC").Find(&records).Error; err != nil {
		return model.DokumenListResponse{}, fmt.Errorf("list dokumen: %w", err)
	}

	documents := make([]model.Dokumen, 0, len(records))
	for _, record := range records {
		documents = append(documents, record.ToDokumen())
	}

	return model.DokumenListResponse{
		Documents:            documents,
		JenisKegiatanOptions: []string{"Sosialisasi", "Bimtek", "Pendampingan", "Monev", "Rapat"},
		JenisDokumenOptions:  []string{"TOR", "Laporan"},
	}, nil
}

func (r *DokumenRepository) GetByID(ctx context.Context, id int) (model.Dokumen, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Dokumen{}, false, err
	}

	record, found, err := findDokumenByID(db, id)
	if err != nil || !found {
		return model.Dokumen{}, found, err
	}

	return record.ToDokumen(), true, nil
}

func (r *DokumenRepository) Create(ctx context.Context, payload model.Dokumen) (model.Dokumen, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Dokumen{}, err
	}

	record := dokumenEntityFromPayload(payload)
	if err := db.Create(&record).Error; err != nil {
		return model.Dokumen{}, fmt.Errorf("create dokumen: %w", err)
	}

	return record.ToDokumen(), nil
}

func (r *DokumenRepository) Update(ctx context.Context, id int, payload model.Dokumen) (model.Dokumen, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Dokumen{}, false, err
	}

	var record model.DokumenEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.DokumenEntity{}).
			Where("id = ?", id).
			Updates(map[string]any{
				"nama_kegiatan":  strings.TrimSpace(payload.NamaKegiatan),
				"jenis_kegiatan": strings.TrimSpace(payload.JenisKegiatan),
				"jenis_dokumen":  strings.TrimSpace(payload.JenisDokumen),
				"tanggal":        strings.TrimSpace(payload.Tanggal),
				"dibuat_oleh":    strings.TrimSpace(payload.DibuatOleh),
				"updated_at":     gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		var found bool
		var err error
		record, found, err = findDokumenByID(tx, id)
		if err != nil {
			return err
		}
		if !found {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Dokumen{}, false, nil
	}
	if err != nil {
		return model.Dokumen{}, false, fmt.Errorf("update dokumen: %w", err)
	}

	return record.ToDokumen(), true, nil
}

func (r *DokumenRepository) Delete(ctx context.Context, id int) (model.Dokumen, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Dokumen{}, false, err
	}

	var record model.DokumenEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		var found bool
		var err error
		record, found, err = findDokumenByID(tx, id)
		if err != nil {
			return err
		}
		if !found {
			return gorm.ErrRecordNotFound
		}
		return tx.Delete(&model.DokumenEntity{}, "id = ?", id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Dokumen{}, false, nil
	}
	if err != nil {
		return model.Dokumen{}, false, fmt.Errorf("delete dokumen: %w", err)
	}

	return record.ToDokumen(), true, nil
}

func (r *DokumenRepository) FormMeta(ctx context.Context) (model.DokumenFormMeta, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DokumenFormMeta{}, err
	}

	var kegiatan []model.KegiatanEntity
	if err := db.Order("created_at DESC, id DESC").Find(&kegiatan).Error; err != nil {
		return model.DokumenFormMeta{}, fmt.Errorf("list kegiatan options: %w", err)
	}

	options := make([]model.KegiatanOption, 0, len(kegiatan))
	for _, item := range kegiatan {
		options = append(options, model.KegiatanOption{
			ID:      item.ID,
			Nama:    item.Nama,
			Jenis:   item.Jenis,
			Tanggal: item.Tanggal,
		})
	}

	return model.DokumenFormMeta{
		DokumenTypeOptions: []model.DokumenTypeOption{
			{Value: "tor", Label: "TOR"},
			{Value: "laporan", Label: "Laporan Pelaksanaan"},
		},
		KegiatanOptions:        options,
		TorData:                defaultTorData(),
		TorPDFSections:         torPDFSections(),
		LaporanPelaksanaanData: defaultLaporanData(),
		LaporanPDFSections:     laporanPDFSections(),
	}, nil
}

func (r *DokumenRepository) Preview(ctx context.Context, id int) (model.DokumenPreviewData, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DokumenPreviewData{}, false, err
	}

	record, found, err := findDokumenByID(db, id)
	if err != nil || !found {
		return model.DokumenPreviewData{}, found, err
	}

	document := record.ToDokumen()
	kegiatan, err := findKegiatanByDokumenData(db, document)
	if err != nil {
		return model.DokumenPreviewData{}, false, err
	}

	return model.DokumenPreviewData{
		Document:               document,
		TorData:                buildTorPreviewData(document, kegiatan),
		LaporanPelaksanaanData: buildLaporanPreviewData(document, kegiatan),
	}, true, nil
}

func (r *DokumenRepository) CountByJenis(ctx context.Context, jenis string) (int, error) {
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

func dokumenEntityFromPayload(payload model.Dokumen) model.DokumenEntity {
	return model.DokumenEntity{
		NamaKegiatan:  strings.TrimSpace(payload.NamaKegiatan),
		JenisKegiatan: strings.TrimSpace(payload.JenisKegiatan),
		JenisDokumen:  strings.TrimSpace(payload.JenisDokumen),
		Tanggal:       strings.TrimSpace(payload.Tanggal),
		DibuatOleh:    strings.TrimSpace(payload.DibuatOleh),
	}
}

func findDokumenByID(db *gorm.DB, id int) (model.DokumenEntity, bool, error) {
	var record model.DokumenEntity
	err := db.First(&record, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.DokumenEntity{}, false, nil
	}
	if err != nil {
		return model.DokumenEntity{}, false, fmt.Errorf("find dokumen by id: %w", err)
	}
	return record, true, nil
}

func findKegiatanByDokumenData(db *gorm.DB, document model.Dokumen) (*model.Kegiatan, error) {
	var record model.KegiatanEntity
	err := db.
		Preload("Dokumentasi", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("uploaded_at DESC, id DESC")
		}).
		Where("nama = ?", document.NamaKegiatan).
		First(&record).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = db.
			Preload("Dokumentasi", func(tx *gorm.DB) *gorm.DB {
				return tx.Order("uploaded_at DESC, id DESC")
			}).
			Where("jenis = ?", document.JenisKegiatan).
			Order("created_at DESC, id DESC").
			First(&record).Error
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find kegiatan for dokumen: %w", err)
	}

	kegiatan := record.ToKegiatan()
	return &kegiatan, nil
}

func (r *DokumenRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
