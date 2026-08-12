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

	var records []model.DataWilayahEntity
	if err := db.Where("tahun_anggaran = ?", tahunAnggaran).Order("sort_order ASC").Find(&records).Error; err != nil {
		return model.DataWilayahResponse{}, fmt.Errorf("list data wilayah: %w", err)
	}

	regions := make([]model.RegionData, 0, len(records))
	latestUpdatedAt := time.Time{}
	for _, record := range records {
		regions = append(regions, record.ToRegionData())
		if record.UpdatedAt.After(latestUpdatedAt) {
			latestUpdatedAt = record.UpdatedAt
		}
	}
	if err := r.attachBumKampungSummary(ctx, db, tahunAnggaran, regions); err != nil {
		return model.DataWilayahResponse{}, err
	}

	var updatedAt *time.Time
	if !latestUpdatedAt.IsZero() {
		updatedAt = &latestUpdatedAt
	}

	return model.DataWilayahResponse{
		TahunAnggaran: tahunAnggaran,
		Regions:       regions,
		UpdatedAt:     updatedAt,
	}, nil
}

func (r *DataWilayahRepository) UpdateDukcapil(
	ctx context.Context,
	tahunAnggaran string,
	id string,
	payload model.DataWilayahDukcapilPayload,
) (model.RegionData, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RegionData{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	id = strings.TrimSpace(id)

	jumlahJiwa := int64(payload.Oap.JumlahOap) + int64(payload.Oap.JumlahNonOap)
	if jumlahJiwa < 0 || jumlahJiwa > 2147483647 {
		return model.RegionData{}, false, fmt.Errorf("jumlah jiwa is out of range")
	}

	var record model.DataWilayahEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.DataWilayahEntity{}).
			Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
			Updates(map[string]any{
				"registration_penerbitan_kk":     payload.Registration.PenerbitanKk,
				"registration_perubahan_kk":      payload.Registration.PerubahanKk,
				"registration_kia":               payload.Registration.Kia,
				"registration_nik_wni":           payload.Registration.NikWni,
				"registration_perekaman_ktp_el":  payload.Registration.PerekamanKtpEl,
				"registration_pencetakan_ktp_el": payload.Registration.PencetakanKtpEl,
				"oap_luas_wilayah":               payload.Oap.LuasWilayah,
				"oap_jumlah_oap":                 payload.Oap.JumlahOap,
				"oap_jumlah_non_oap":             payload.Oap.JumlahNonOap,
				"oap_jumlah_jiwa":                int(jumlahJiwa),
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
		return model.RegionData{}, false, fmt.Errorf("update data wilayah Dukcapil: %w", err)
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
		return model.DataWilayahWebsiteSettingsResponse{
			FeaturedTahunAnggaran:  "",
			PublishedTahunAnggaran: []string{},
			AvailableTahunAnggaran: []string{},
		}, nil
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
	payload model.DataWilayahWebsiteSettingsPayload,
) (model.DataWilayahWebsiteSettingsResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}

	availableYears, err := r.listAvailableYears(db)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}
	if len(availableYears) == 0 {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("data wilayah belum tersedia")
	}

	publishedYears := normalizeYears(payload.PublishedTahunAnggaran, availableYears)
	if len(publishedYears) == 0 {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("minimal satu tahun release wajib dipilih")
	}

	featuredYear := strings.TrimSpace(payload.FeaturedTahunAnggaran)
	if !containsYear(publishedYears, featuredYear) {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("tahun unggulan wajib termasuk dalam tahun release")
	}

	entity, _, err := r.loadOrCreateWebsiteSettings(db, availableYears)
	if err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, err
	}

	entity.FeaturedTahunAnggaran = featuredYear
	entity.PublishedTahunAnggaran = publishedYears

	if err := db.Save(&entity).Error; err != nil {
		return model.DataWilayahWebsiteSettingsResponse{}, fmt.Errorf("update data wilayah settings: %w", err)
	}

	return model.DataWilayahWebsiteSettingsResponse{
		FeaturedTahunAnggaran:  entity.FeaturedTahunAnggaran,
		PublishedTahunAnggaran: append([]string(nil), entity.PublishedTahunAnggaran...),
		AvailableTahunAnggaran: availableYears,
	}, nil
}

func (r *DataWilayahRepository) listAvailableYears(db *gorm.DB) ([]string, error) {
	currentYear := currentDataWilayahReleaseYear()
	if err := r.ensureCurrentReleaseYearData(db, currentYear); err != nil {
		return nil, err
	}

	var years []string
	if err := db.Model(&model.DataWilayahEntity{}).
		Distinct("tahun_anggaran").
		Where("tahun_anggaran <= ?", currentYear).
		Order("tahun_anggaran DESC").
		Pluck("tahun_anggaran", &years).Error; err != nil {
		return nil, fmt.Errorf("list data wilayah years: %w", err)
	}

	return years, nil
}

func (r *DataWilayahRepository) ensureCurrentReleaseYearData(db *gorm.DB, currentYear string) error {
	var count int64
	if err := db.Model(&model.DataWilayahEntity{}).
		Where("tahun_anggaran = ?", currentYear).
		Count(&count).Error; err != nil {
		return fmt.Errorf("count current data wilayah year: %w", err)
	}
	if count > 0 {
		return nil
	}

	var sourceYear string
	if err := db.Model(&model.DataWilayahEntity{}).
		Select("tahun_anggaran").
		Where("tahun_anggaran < ?", currentYear).
		Order("tahun_anggaran DESC").
		Limit(1).
		Scan(&sourceYear).Error; err != nil {
		return fmt.Errorf("find current release source data wilayah: %w", err)
	}
	if sourceYear == "" {
		return nil
	}

	if err := db.Exec(`
		INSERT INTO data_wilayah (
			tahun_anggaran, id, sort_order, name, short_name, region_type, map_label,
			idm_sangat_tertinggal, idm_tertinggal, idm_berkembang, idm_maju, idm_mandiri,
			bumdes_jumlah, bumdes_aktif, bumdes_tidak_aktif, bumdes_bersama,
			registration_penerbitan_kk, registration_perubahan_kk, registration_kia, registration_nik_wni,
			registration_perekaman_ktp_el, registration_pencetakan_ktp_el,
			oap_luas_wilayah, oap_jumlah_oap, oap_jumlah_non_oap, oap_jumlah_jiwa,
			civil_akta_kelahiran, civil_akta_kematian, civil_akta_perkawinan, civil_akta_perceraian
		)
		SELECT
			?, id, sort_order, name, short_name, region_type, map_label,
			idm_sangat_tertinggal, idm_tertinggal, idm_berkembang, idm_maju, idm_mandiri,
			bumdes_jumlah, bumdes_aktif, bumdes_tidak_aktif, bumdes_bersama,
			registration_penerbitan_kk, registration_perubahan_kk, registration_kia, registration_nik_wni,
			registration_perekaman_ktp_el, registration_pencetakan_ktp_el,
			oap_luas_wilayah, oap_jumlah_oap, oap_jumlah_non_oap, oap_jumlah_jiwa,
			civil_akta_kelahiran, civil_akta_kematian, civil_akta_perkawinan, civil_akta_perceraian
		FROM data_wilayah
		WHERE tahun_anggaran = ?
		ON CONFLICT (tahun_anggaran, id) DO NOTHING
	`, currentYear, sourceYear).Error; err != nil {
		return fmt.Errorf("seed current data wilayah year: %w", err)
	}

	return nil
}

func currentDataWilayahReleaseYear() string {
	wit := time.FixedZone("WIT", 9*60*60)
	return fmt.Sprintf("%d", time.Now().In(wit).Year())
}

type bumKampungRegionSummary struct {
	KabupatenKota string
	Jumlah        int
	Aktif         int
	TidakAktif    int
	Bersama       int
}

func (r *DataWilayahRepository) attachBumKampungSummary(
	ctx context.Context,
	db *gorm.DB,
	tahunAnggaran string,
	regions []model.RegionData,
) error {
	if len(regions) == 0 {
		return nil
	}

	var summaries []bumKampungRegionSummary
	if err := db.WithContext(ctx).
		Table("bum_kampung").
		Select(`
			kabupaten_kota,
			COUNT(*)::INTEGER AS jumlah,
			COUNT(*) FILTER (
				WHERE status IN ('Dokumen Badan Hukum Terverifikasi', 'Nama Terverifikasi')
			)::INTEGER AS aktif,
			COUNT(*) FILTER (
				WHERE status NOT IN ('Dokumen Badan Hukum Terverifikasi', 'Nama Terverifikasi')
			)::INTEGER AS tidak_aktif,
			COUNT(*) FILTER (WHERE kategori = 'BUMKam bersama')::INTEGER AS bersama
		`).
		Where("tahun_anggaran = ?", strings.TrimSpace(tahunAnggaran)).
		Group("kabupaten_kota").
		Scan(&summaries).Error; err != nil {
		return fmt.Errorf("summarize bum kampung for data wilayah: %w", err)
	}

	applyBumKampungSummary(regions, summaries)
	return nil
}

func applyBumKampungSummary(
	regions []model.RegionData,
	summaries []bumKampungRegionSummary,
) {
	summaryByKabupaten := make(map[string]bumKampungRegionSummary, len(summaries))
	for _, summary := range summaries {
		summaryByKabupaten[normalizeRegionName(summary.KabupatenKota)] = summary
	}

	for index := range regions {
		regionKey := normalizeRegionName(regions[index].Name)
		summary, found := summaryByKabupaten[regionKey]
		if !found {
			regionKey = normalizeRegionName(regions[index].ShortName)
			summary, found = summaryByKabupaten[regionKey]
		}
		if !found {
			regions[index].Bumdes = model.BumdesData{}
			continue
		}

		regions[index].Bumdes = model.BumdesData{
			Jumlah:     summary.Jumlah,
			Aktif:      summary.Aktif,
			TidakAktif: summary.TidakAktif,
			Bersama:    summary.Bersama,
		}
	}
}

func normalizeRegionName(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = strings.TrimPrefix(normalized, "kabupaten ")
	normalized = strings.TrimPrefix(normalized, "kota ")
	return strings.Join(strings.Fields(normalized), " ")
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
