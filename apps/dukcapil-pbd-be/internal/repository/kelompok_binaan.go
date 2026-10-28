package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type KelompokBinaanRepository struct {
	db *gorm.DB
}

func NewKelompokBinaanRepository(db *gorm.DB) *KelompokBinaanRepository {
	return &KelompokBinaanRepository{db: db}
}

func (r *KelompokBinaanRepository) List(ctx context.Context) (model.KelompokBinaanListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KelompokBinaanListResponse{}, err
	}

	var records []model.KelompokBinaanEntity
	if err := db.Order("updated_at DESC, id DESC").Find(&records).Error; err != nil {
		return model.KelompokBinaanListResponse{}, fmt.Errorf("list kelompokBinaan potensi kampung: %w", err)
	}

	items := make([]model.KelompokBinaan, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToKelompokBinaan())
	}

	return model.KelompokBinaanListResponse{Items: items}, nil
}

func (r *KelompokBinaanRepository) Options(ctx context.Context) (model.KelompokBinaanOptionsResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KelompokBinaanOptionsResponse{}, err
	}

	var kabupatenKota []string
	if err := db.Table("kab_kota").
		Where("TRIM(nama) <> ''").
		Order("nama ASC").
		Pluck("nama", &kabupatenKota).Error; err != nil {
		return model.KelompokBinaanOptionsResponse{}, fmt.Errorf("list kelompokBinaan kabupaten options: %w", err)
	}

	kampung := make([]model.KampungOption, 0)
	if err := db.Table("data_kampung").
		Select("DISTINCT kabupaten AS kabupaten_kota, distrik, desa AS kampung").
		Where("TRIM(kabupaten) <> '' AND TRIM(distrik) <> '' AND TRIM(desa) <> ''").
		Order("kabupaten_kota ASC, distrik ASC, kampung ASC").
		Scan(&kampung).Error; err != nil {
		return model.KelompokBinaanOptionsResponse{}, fmt.Errorf("list kelompokBinaan kampung options: %w", err)
	}
	if len(kampung) == 0 {
		if err := db.Table("bum_kampung").
			Select("DISTINCT kabupaten_kota, distrik, kampung").
			Where("TRIM(kabupaten_kota) <> '' AND TRIM(distrik) <> '' AND TRIM(kampung) <> ''").
			Order("kabupaten_kota ASC, distrik ASC, kampung ASC").
			Scan(&kampung).Error; err != nil {
			return model.KelompokBinaanOptionsResponse{}, fmt.Errorf("list kelompokBinaan fallback kampung options: %w", err)
		}
	}

	return model.KelompokBinaanOptionsResponse{
		KabupatenKota: kabupatenKota,
		Kampung:       kampung,
	}, nil
}

func (r *KelompokBinaanRepository) Create(ctx context.Context, payload model.KelompokBinaanPayload) (model.KelompokBinaan, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KelompokBinaan{}, err
	}

	record := payloadToKelompokBinaanEntity(payload)
	if err := db.Create(&record).Error; err != nil {
		return model.KelompokBinaan{}, fmt.Errorf("create kelompokBinaan potensi kampung: %w", err)
	}

	return record.ToKelompokBinaan(), nil
}

func (r *KelompokBinaanRepository) Update(ctx context.Context, id int64, payload model.KelompokBinaanPayload) (model.KelompokBinaan, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.KelompokBinaan{}, false, err
	}

	updates := map[string]any{
		"kode":           strings.TrimSpace(payload.Kode),
		"kabupaten_kota": strings.TrimSpace(payload.KabupatenKota),
		"distrik":        strings.TrimSpace(payload.Distrik),
		"kampung":        strings.TrimSpace(payload.Kampung),
		"nama_kelompok":  strings.TrimSpace(payload.NamaKelompok),
		"kategori_usaha": payload.KategoriUsaha,
		"jenis_usaha":    strings.TrimSpace(payload.JenisUsaha),
		"komoditas":      strings.TrimSpace(payload.Komoditas),
		"jumlah_anggota": payload.JumlahAnggota,
		"dana_alokasi":   payload.DanaAlokasi,
		"updated_at":     gorm.Expr("NOW()"),
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.KelompokBinaanEntity{}).
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
			return model.KelompokBinaan{}, false, nil
		}
		return model.KelompokBinaan{}, false, fmt.Errorf("update kelompokBinaan potensi kampung: %w", err)
	}

	record, found, err := r.find(ctx, db, id)
	if err != nil || !found {
		return model.KelompokBinaan{}, found, err
	}
	return record.ToKelompokBinaan(), true, nil
}

func (r *KelompokBinaanRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.KelompokBinaanEntity{}, "id = ?", id)
	if result.Error != nil {
		return false, fmt.Errorf("delete kelompokBinaan potensi kampung: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *KelompokBinaanRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *KelompokBinaanRepository) find(ctx context.Context, db *gorm.DB, id int64) (model.KelompokBinaanEntity, bool, error) {
	var record model.KelompokBinaanEntity
	if err := db.WithContext(ctx).First(&record, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.KelompokBinaanEntity{}, false, nil
		}
		return model.KelompokBinaanEntity{}, false, fmt.Errorf("find kelompokBinaan potensi kampung: %w", err)
	}
	return record, true, nil
}

func payloadToKelompokBinaanEntity(payload model.KelompokBinaanPayload) model.KelompokBinaanEntity {
	return model.KelompokBinaanEntity{
		Kode:          strings.TrimSpace(payload.Kode),
		KabupatenKota: strings.TrimSpace(payload.KabupatenKota),
		Distrik:       strings.TrimSpace(payload.Distrik),
		Kampung:       strings.TrimSpace(payload.Kampung),
		NamaKelompok:  strings.TrimSpace(payload.NamaKelompok),
		KategoriUsaha: payload.KategoriUsaha,
		JenisUsaha:    strings.TrimSpace(payload.JenisUsaha),
		Komoditas:     strings.TrimSpace(payload.Komoditas),
		JumlahAnggota: payload.JumlahAnggota,
		DanaAlokasi:   payload.DanaAlokasi,
	}
}
