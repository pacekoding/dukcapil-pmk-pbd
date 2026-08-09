package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type SitekadRepository struct {
	db *gorm.DB
}

func NewSitekadRepository(db *gorm.DB) *SitekadRepository {
	return &SitekadRepository{db: db}
}

func (r *SitekadRepository) List(ctx context.Context) (model.SitekadPotensiKampungListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadPotensiKampungListResponse{}, err
	}

	var records []model.SitekadPotensiKampungEntity
	if err := db.Order("updated_at DESC, id DESC").Find(&records).Error; err != nil {
		return model.SitekadPotensiKampungListResponse{}, fmt.Errorf("list sitekad potensi kampung: %w", err)
	}

	items := make([]model.SitekadPotensiKampung, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToSitekadPotensiKampung())
	}

	return model.SitekadPotensiKampungListResponse{Items: items}, nil
}

func (r *SitekadRepository) Options(ctx context.Context) (model.SitekadOptionsResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadOptionsResponse{}, err
	}

	var kabupatenKota []string
	if err := db.Table("kab_kota").
		Where("TRIM(nama) <> ''").
		Order("nama ASC").
		Pluck("nama", &kabupatenKota).Error; err != nil {
		return model.SitekadOptionsResponse{}, fmt.Errorf("list sitekad kabupaten options: %w", err)
	}

	kampung := make([]model.SitekadKampungOption, 0)
	if err := db.Table("bum_kampung").
		Select("DISTINCT kabupaten_kota, distrik, kampung").
		Where("TRIM(kabupaten_kota) <> '' AND TRIM(kampung) <> ''").
		Order("kabupaten_kota ASC, distrik ASC, kampung ASC").
		Scan(&kampung).Error; err != nil {
		return model.SitekadOptionsResponse{}, fmt.Errorf("list sitekad kampung options: %w", err)
	}

	return model.SitekadOptionsResponse{
		KabupatenKota: kabupatenKota,
		Kampung:       kampung,
	}, nil
}

func (r *SitekadRepository) Create(ctx context.Context, payload model.SitekadPotensiKampungPayload) (model.SitekadPotensiKampung, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadPotensiKampung{}, err
	}

	record := payloadToSitekadEntity(payload)
	if err := db.Create(&record).Error; err != nil {
		return model.SitekadPotensiKampung{}, fmt.Errorf("create sitekad potensi kampung: %w", err)
	}

	return record.ToSitekadPotensiKampung(), nil
}

func (r *SitekadRepository) Update(ctx context.Context, id int64, payload model.SitekadPotensiKampungPayload) (model.SitekadPotensiKampung, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SitekadPotensiKampung{}, false, err
	}

	updates := map[string]any{
		"kode":           strings.TrimSpace(payload.Kode),
		"kabupaten_kota": strings.TrimSpace(payload.KabupatenKota),
		"distrik":        strings.TrimSpace(payload.Distrik),
		"kampung":        strings.TrimSpace(payload.Kampung),
		"nama_kelompok":  strings.TrimSpace(payload.NamaKelompok),
		"kategori_usaha": payload.KategoriUsaha,
		"komoditas":      strings.TrimSpace(payload.Komoditas),
		"jumlah_anggota": payload.JumlahAnggota,
		"dana_alokasi":   payload.DanaAlokasi,
		"updated_at":     gorm.Expr("NOW()"),
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.SitekadPotensiKampungEntity{}).
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
			return model.SitekadPotensiKampung{}, false, nil
		}
		return model.SitekadPotensiKampung{}, false, fmt.Errorf("update sitekad potensi kampung: %w", err)
	}

	record, found, err := r.find(ctx, db, id)
	if err != nil || !found {
		return model.SitekadPotensiKampung{}, found, err
	}
	return record.ToSitekadPotensiKampung(), true, nil
}

func (r *SitekadRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.SitekadPotensiKampungEntity{}, "id = ?", id)
	if result.Error != nil {
		return false, fmt.Errorf("delete sitekad potensi kampung: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *SitekadRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *SitekadRepository) find(ctx context.Context, db *gorm.DB, id int64) (model.SitekadPotensiKampungEntity, bool, error) {
	var record model.SitekadPotensiKampungEntity
	if err := db.WithContext(ctx).First(&record, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.SitekadPotensiKampungEntity{}, false, nil
		}
		return model.SitekadPotensiKampungEntity{}, false, fmt.Errorf("find sitekad potensi kampung: %w", err)
	}
	return record, true, nil
}

func payloadToSitekadEntity(payload model.SitekadPotensiKampungPayload) model.SitekadPotensiKampungEntity {
	return model.SitekadPotensiKampungEntity{
		Kode:          strings.TrimSpace(payload.Kode),
		KabupatenKota: strings.TrimSpace(payload.KabupatenKota),
		Distrik:       strings.TrimSpace(payload.Distrik),
		Kampung:       strings.TrimSpace(payload.Kampung),
		NamaKelompok:  strings.TrimSpace(payload.NamaKelompok),
		KategoriUsaha: payload.KategoriUsaha,
		Komoditas:     strings.TrimSpace(payload.Komoditas),
		JumlahAnggota: payload.JumlahAnggota,
		DanaAlokasi:   payload.DanaAlokasi,
	}
}
