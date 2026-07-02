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

func (r *DataWilayahRepository) GetWebsiteSettings(ctx context.Context) (model.DataWilayahWebsiteSettingsResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}

	availableYears, err := r.listAvailableYears(db)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}
	if len(availableYears) == 0 {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("data wilayah year is empty")
	}

	entity, changed, err := r.loadOrCreateWebsiteSettings(db, availableYears)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}
	if changed {
		if err := db.Save(&entity).Error; err != nil {
			return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("persist data wilayah settings: %w", err)
		}
	}

	settings := entity.ToWebsiteSettings()
	return model.DataWilayahWebsiteSettingsResponse{
		FeaturedTahunAnggaran:  settings.FeaturedTahunAnggaran,
		PublishedTahunAnggaran: settings.PublishedTahunAnggaran,
		AvailableTahunAnggaran: availableYears,
	}, nil
}

func (r *DataWilayahRepository) UpdateWebsiteSettings(
	ctx context.Context,
	featuredTahunAnggaran string,
	publishedTahunAnggaran []string,
) (model.DataWilayahWebsiteSettingsResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}

	featuredTahunAnggaran = strings.TrimSpace(featuredTahunAnggaran)
	for _, year := range uniqueYears(append([]string{featuredTahunAnggaran}, publishedTahunAnggaran...)) {
		if err := r.ensureYearData(db, year); err != nil {
			return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("prepare data wilayah year %s: %w", year, err)
		}
	}

	availableYears, err := r.listAvailableYears(db)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}
	if len(availableYears) == 0 {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("data wilayah year is empty")
	}

	normalizedPublished := normalizeYears(publishedTahunAnggaran, availableYears)
	if featuredTahunAnggaran == "" {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("featured year is required")
	}
	if !containsYear(availableYears, featuredTahunAnggaran) {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("featured year is invalid")
	}
	if len(normalizedPublished) == 0 {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("published years are required")
	}
	if !containsYear(normalizedPublished, featuredTahunAnggaran) {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("featured year must be published")
	}

	entity := model.DataWilayahPublicSettingsEntity{
		ID:                     1,
		FeaturedTahunAnggaran:  featuredTahunAnggaran,
		PublishedTahunAnggaran: normalizedPublished,
	}
	if err := db.Save(&entity).Error; err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("update data wilayah settings: %w", err)
	}

	return model.DataWilayahWebsiteSettingsResponse{
		FeaturedTahunAnggaran:  featuredTahunAnggaran,
		PublishedTahunAnggaran: normalizedPublished,
		AvailableTahunAnggaran: availableYears,
	}, nil
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

func (r *DataWilayahRepository) listAvailableYears(db *gorm.DB) ([]string, error) {
	var years []string
	if err := db.Model(&model.DataWilayahEntity{}).
		Distinct("tahun_anggaran").
		Order("tahun_anggaran DESC").
		Pluck("tahun_anggaran", &years).Error; err != nil {
		return nil, fmt.Errorf("list data wilayah years: %w", err)
	}

	return years, nil
}

func (r *DataWilayahRepository) loadOrCreateWebsiteSettings(
	db *gorm.DB,
	availableYears []string,
) (model.DataWilayahPublicSettingsEntity, bool, error) {
	var entity model.DataWilayahPublicSettingsEntity
	err := db.First(&entity, "id = ?", 1).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		entity = model.DataWilayahPublicSettingsEntity{
			ID:                     1,
			FeaturedTahunAnggaran:  availableYears[0],
			PublishedTahunAnggaran: availableYears,
		}
		if err := db.Create(&entity).Error; err != nil {
			return model.DataWilayahPublicSettingsEntity{}, false, fmt.Errorf("create data wilayah settings: %w", err)
		}
		return entity, false, nil
	}
	if err != nil {
		return model.DataWilayahPublicSettingsEntity{}, false, fmt.Errorf("load data wilayah settings: %w", err)
	}

	normalizedPublished := normalizeYears(entity.PublishedTahunAnggaran, availableYears)
	changed := false
	if len(normalizedPublished) == 0 {
		normalizedPublished = []string{availableYears[0]}
		changed = true
	}
	if !containsYear(availableYears, entity.FeaturedTahunAnggaran) ||
		!containsYear(normalizedPublished, entity.FeaturedTahunAnggaran) {
		entity.FeaturedTahunAnggaran = normalizedPublished[0]
		changed = true
	}
	if strings.Join(entity.PublishedTahunAnggaran, ",") != strings.Join(normalizedPublished, ",") {
		entity.PublishedTahunAnggaran = normalizedPublished
		changed = true
	}

	return entity, changed, nil
}

func normalizeYears(years []string, allowedYears []string) []string {
	result := make([]string, 0, len(years))
	seen := make(map[string]struct{}, len(years))
	for _, year := range allowedYears {
		for _, candidate := range years {
			normalized := strings.TrimSpace(candidate)
			if normalized != year {
				continue
			}
			if _, exists := seen[normalized]; exists {
				break
			}
			result = append(result, normalized)
			seen[normalized] = struct{}{}
			break
		}
	}

	return result
}

func uniqueYears(years []string) []string {
	result := make([]string, 0, len(years))
	seen := make(map[string]struct{}, len(years))
	for _, year := range years {
		normalized := strings.TrimSpace(year)
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		result = append(result, normalized)
		seen[normalized] = struct{}{}
	}

	return result
}

func containsYear(years []string, target string) bool {
	target = strings.TrimSpace(target)
	for _, year := range years {
		if strings.TrimSpace(year) == target {
			return true
		}
	}

	return false
}

func (r *DataWilayahRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
