package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type DataWilayahRepository struct {
	db *gorm.DB
}

func NewDataWilayahRepository(db *gorm.DB) *DataWilayahRepository {
	return &DataWilayahRepository{db: db}
}

func (r *DataWilayahRepository) List(ctx context.Context, tahunAnggaran string) (model.DataWilayahResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DataWilayahResponse{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	if err := r.ensureYearData(db, tahunAnggaran); err != nil {
		return model.DataWilayahResponse{}, err
	}

	var records []model.DataWilayahEntity
	if err := db.Where("tahun_anggaran = ?", tahunAnggaran).Order("sort_order ASC").Find(&records).Error; err != nil {
		return model.DataWilayahResponse{}, fmt.Errorf("list data wilayah: %w", err)
	}

	regions := make([]model.RegionData, 0, len(records))
	for _, record := range records {
		regions = append(regions, record.ToRegionData())
	}

	return model.DataWilayahResponse{
		TahunAnggaran: tahunAnggaran,
		Regions:       regions,
	}, nil
}

func (r *DataWilayahRepository) Update(ctx context.Context, tahunAnggaran string, id string, payload model.RegionData) (model.RegionData, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RegionData{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	var record model.DataWilayahEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := r.ensureYearData(tx, tahunAnggaran); err != nil {
			return err
		}

		result := tx.Model(&model.DataWilayahEntity{}).
			Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
			Updates(map[string]any{
				"name":                           strings.TrimSpace(payload.Name),
				"short_name":                     strings.TrimSpace(payload.ShortName),
				"region_type":                    strings.TrimSpace(payload.Type),
				"map_label":                      strings.TrimSpace(payload.MapLabel),
				"idm_sangat_tertinggal":          payload.Idm.SangatTertinggal,
				"idm_tertinggal":                 payload.Idm.Tertinggal,
				"idm_berkembang":                 payload.Idm.Berkembang,
				"idm_maju":                       payload.Idm.Maju,
				"idm_mandiri":                    payload.Idm.Mandiri,
				"registration_penerbitan_kk":     payload.Registration.PenerbitanKk,
				"registration_perubahan_kk":      payload.Registration.PerubahanKk,
				"registration_kia":               payload.Registration.Kia,
				"registration_nik_wni":           payload.Registration.NikWni,
				"registration_perekaman_ktp_el":  payload.Registration.PerekamanKtpEl,
				"registration_pencetakan_ktp_el": payload.Registration.PencetakanKtpEl,
				"oap_luas_wilayah":               payload.Oap.LuasWilayah,
				"oap_jumlah_oap":                 payload.Oap.JumlahOap,
				"oap_jumlah_non_oap":             payload.Oap.JumlahNonOap,
				"oap_jumlah_jiwa":                payload.Oap.JumlahJiwa,
				"civil_akta_kelahiran":           payload.Civil.AktaKelahiran,
				"civil_akta_kematian":            payload.Civil.AktaKematian,
				"civil_akta_perkawinan":          payload.Civil.AktaPerkawinan,
				"civil_akta_perceraian":          payload.Civil.AktaPerceraian,
				"updated_at":                     gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		return tx.First(&record, "tahun_anggaran = ? AND id = ?", tahunAnggaran, id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.RegionData{}, false, nil
	}
	if err != nil {
		return model.RegionData{}, false, fmt.Errorf("update data wilayah: %w", err)
	}

	return record.ToRegionData(), true, nil
}

func (r *DataWilayahRepository) ensureYearData(db *gorm.DB, tahunAnggaran string) error {
	if tahunAnggaran == "" {
		return fmt.Errorf("tahun anggaran is required")
	}

	var count int64
	if err := db.Model(&model.DataWilayahEntity{}).
		Where("tahun_anggaran = ?", tahunAnggaran).
		Count(&count).Error; err != nil {
		return fmt.Errorf("count data wilayah: %w", err)
	}
	if count > 0 {
		return nil
	}

	var sourceYear string
	if err := db.Model(&model.DataWilayahEntity{}).
		Select("tahun_anggaran").
		Order("tahun_anggaran DESC").
		Limit(1).
		Scan(&sourceYear).Error; err != nil {
		return fmt.Errorf("find source data wilayah: %w", err)
	}
	if sourceYear == "" {
		return fmt.Errorf("source data wilayah is empty")
	}

	if err := db.Exec(`
		INSERT INTO data_wilayah (
			tahun_anggaran, id, sort_order, name, short_name, region_type, map_label,
			idm_sangat_tertinggal, idm_tertinggal, idm_berkembang, idm_maju, idm_mandiri,
			registration_penerbitan_kk, registration_perubahan_kk, registration_kia, registration_nik_wni,
			registration_perekaman_ktp_el, registration_pencetakan_ktp_el,
			oap_luas_wilayah, oap_jumlah_oap, oap_jumlah_non_oap, oap_jumlah_jiwa,
			civil_akta_kelahiran, civil_akta_kematian, civil_akta_perkawinan, civil_akta_perceraian
		)
		SELECT
			?, id, sort_order, name, short_name, region_type, map_label,
			idm_sangat_tertinggal, idm_tertinggal, idm_berkembang, idm_maju, idm_mandiri,
			registration_penerbitan_kk, registration_perubahan_kk, registration_kia, registration_nik_wni,
			registration_perekaman_ktp_el, registration_pencetakan_ktp_el,
			oap_luas_wilayah, oap_jumlah_oap, oap_jumlah_non_oap, oap_jumlah_jiwa,
			civil_akta_kelahiran, civil_akta_kematian, civil_akta_perkawinan, civil_akta_perceraian
		FROM data_wilayah
		WHERE tahun_anggaran = ?
		ON CONFLICT (tahun_anggaran, id) DO NOTHING
	`, tahunAnggaran, sourceYear).Error; err != nil {
		return fmt.Errorf("seed data wilayah year: %w", err)
	}

	return nil
}

func (r *DataWilayahRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
