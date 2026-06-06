package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type SSDRepository struct {
	db *gorm.DB
}

func NewSSDRepository(db *gorm.DB) *SSDRepository {
	return &SSDRepository{db: db}
}

func (r *SSDRepository) List(ctx context.Context, tahunAnggaran string) (model.SSDListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDListResponse{}, err
	}

	type row struct {
		model.SSDEntity
		JumlahVariabel  int64 `gorm:"column:jumlah_variabel"`
		JumlahIndikator int64 `gorm:"column:jumlah_indikator"`
	}

	var records []row
	if err := db.Table("ssd AS s").
		Select(`
			s.*,
			COUNT(DISTINCT v.id) AS jumlah_variabel,
			COUNT(DISTINCT i.id) AS jumlah_indikator
		`).
		Joins("LEFT JOIN ssd_variables AS v ON v.ssd_id = s.id").
		Joins("LEFT JOIN ssd_indicators AS i ON i.ssd_id = s.id").
		Where("s.tahun_anggaran = ?", strings.TrimSpace(tahunAnggaran)).
		Group("s.id").
		Order("s.kode ASC, s.id ASC").
		Find(&records).Error; err != nil {
		return model.SSDListResponse{}, fmt.Errorf("list ssd: %w", err)
	}

	items := make([]model.SSD, 0, len(records))
	for _, record := range records {
		item := record.SSDEntity.ToSSD()
		item.JumlahVariabel = int(record.JumlahVariabel)
		item.JumlahIndikator = int(record.JumlahIndikator)
		items = append(items, item)
	}

	return model.SSDListResponse{
		TahunAnggaran: strings.TrimSpace(tahunAnggaran),
		Items:         items,
	}, nil
}

func (r *SSDRepository) Detail(ctx context.Context, tahunAnggaran string, id int64) (model.SSDDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDDetail{}, false, err
	}
	return r.loadDetail(ctx, db, strings.TrimSpace(tahunAnggaran), id)
}

func (r *SSDRepository) Import(ctx context.Context, tahunAnggaran string, payloads []model.SSDPayload) (model.SSDImportResult, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDImportResult{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	normalized := normalizeSSDImportPayloads(payloads)
	if len(normalized) == 0 {
		return model.SSDImportResult{TahunAnggaran: tahunAnggaran}, nil
	}

	result := model.SSDImportResult{
		TahunAnggaran: tahunAnggaran,
		Total:         len(normalized),
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		codes := make([]string, 0, len(normalized))
		for _, item := range normalized {
			codes = append(codes, item.Kode)
		}

		var existing []model.SSDEntity
		if err := tx.
			Where("tahun_anggaran = ? AND LOWER(kode) IN ?", tahunAnggaran, lowerStrings(codes)).
			Find(&existing).Error; err != nil {
			return err
		}

		existingByCode := make(map[string]model.SSDEntity, len(existing))
		for _, item := range existing {
			existingByCode[strings.ToLower(item.Kode)] = item
		}

		for _, item := range normalized {
			if current, ok := existingByCode[strings.ToLower(item.Kode)]; ok {
				if err := tx.Model(&model.SSDEntity{}).
					Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, current.ID).
					Updates(map[string]any{
						"uraian":               item.Uraian,
						"satuan":               item.Satuan,
						"definisi_operasional": item.DefinisiOperasional,
						"is_active":            true,
						"updated_at":           gorm.Expr("NOW()"),
					}).Error; err != nil {
					return err
				}
				result.Updated++
				continue
			}

			record := model.SSDEntity{
				TahunAnggaran:       tahunAnggaran,
				Kode:                item.Kode,
				Uraian:              item.Uraian,
				Satuan:              item.Satuan,
				DefinisiOperasional: item.DefinisiOperasional,
				IsActive:            true,
			}
			if err := tx.Create(&record).Error; err != nil {
				return err
			}
			result.Created++
		}
		return nil
	})
	if err != nil {
		return model.SSDImportResult{}, fmt.Errorf("import ssd: %w", err)
	}

	return result, nil
}

func (r *SSDRepository) Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SSDPayload) (model.SSDDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSDDetail{}, false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.SSDEntity{}).
			Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
			Updates(map[string]any{
				"kode":                 strings.TrimSpace(payload.Kode),
				"uraian":               strings.TrimSpace(payload.Uraian),
				"satuan":               strings.TrimSpace(payload.Satuan),
				"definisi_operasional": strings.TrimSpace(payload.DefinisiOperasional),
				"updated_at":           gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		if err := tx.Where("ssd_id = ? AND tahun_anggaran = ?", id, tahunAnggaran).Delete(&model.SSDVariableEntity{}).Error; err != nil {
			return fmt.Errorf("clear ssd variables: %w", err)
		}
		if err := tx.Where("ssd_id = ? AND tahun_anggaran = ?", id, tahunAnggaran).Delete(&model.SSDIndicatorEntity{}).Error; err != nil {
			return fmt.Errorf("clear ssd indicators: %w", err)
		}

		createdVariableIDs := make([]int64, 0, len(payload.Variables))
		for variableIndex, variable := range payload.Variables {
			record := model.SSDVariableEntity{
				SSDID:             id,
				TahunAnggaran:     tahunAnggaran,
				SortOrder:         variableIndex,
				NamaVariabel:      strings.TrimSpace(variable.NamaVariabel),
				ReferensiWaktu:    strings.TrimSpace(variable.ReferensiWaktu),
				KonsepDasar:       strings.TrimSpace(variable.KonsepDasar),
				DefinisiVariabel:  strings.TrimSpace(variable.DefinisiVariabel),
				KalimatPertanyaan: strings.TrimSpace(variable.KalimatPertanyaan),
			}
			if err := tx.Create(&record).Error; err != nil {
				return fmt.Errorf("create ssd variable: %w", err)
			}
			createdVariableIDs = append(createdVariableIDs, record.ID)
		}

		for indicatorIndex, indicator := range payload.Indicators {
			legacyVariableID := createdVariableIDs[0]
			if len(indicator.VariableIDs) > 0 {
				firstVariableID := indicator.VariableIDs[0]
				if firstVariableID > 0 && firstVariableID <= int64(len(createdVariableIDs)) {
					legacyVariableID = createdVariableIDs[firstVariableID-1]
				}
			}

			indicatorRecord := model.SSDIndicatorEntity{
				SSDID:                id,
				VariableID:           legacyVariableID,
				TahunAnggaran:        tahunAnggaran,
				SortOrder:            indicatorIndex,
				NamaIndikator:        strings.TrimSpace(indicator.NamaIndikator),
				KonsepIndikator:      strings.TrimSpace(indicator.KonsepIndikator),
				LevelEstimasiHasil:   strings.TrimSpace(indicator.LevelEstimasiHasil),
				UkuranIndikator:      strings.TrimSpace(indicator.UkuranIndikator),
				SatuanIndikator:      strings.TrimSpace(indicator.SatuanIndikator),
				KlasifikasiPenyajian: strings.TrimSpace(indicator.KlasifikasiPenyajian),
				DefinisiIndikator:    strings.TrimSpace(indicator.DefinisiIndikator),
				MetodeRumus:          strings.TrimSpace(indicator.MetodeRumus),
				InterpretasiHasil:    strings.TrimSpace(indicator.InterpretasiHasil),
			}
			if err := tx.Create(&indicatorRecord).Error; err != nil {
				return fmt.Errorf("create ssd indicator: %w", err)
			}

			relations := make([]model.SSDIndicatorVariableEntity, 0, len(indicator.VariableIDs))
			for _, variableID := range indicator.VariableIDs {
				if variableID <= 0 || variableID > int64(len(createdVariableIDs)) {
					continue
				}
				relations = append(relations, model.SSDIndicatorVariableEntity{
					IndicatorID:   indicatorRecord.ID,
					VariableID:    createdVariableIDs[variableID-1],
					TahunAnggaran: tahunAnggaran,
				})
			}
			if len(relations) > 0 {
				if err := tx.Create(&relations).Error; err != nil {
					return fmt.Errorf("create ssd indicator variables: %w", err)
				}
			}
		}

		return nil
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.SSDDetail{}, false, nil
	}
	if err != nil {
		return model.SSDDetail{}, false, fmt.Errorf("update ssd: %w", err)
	}

	detail, found, err := r.loadDetail(ctx, db, tahunAnggaran, id)
	if err != nil || !found {
		return model.SSDDetail{}, found, err
	}
	return detail, true, nil
}

func (r *SSDRepository) SetStatus(ctx context.Context, tahunAnggaran string, id int64, isActive bool) (model.SSD, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SSD{}, false, err
	}

	var record model.SSDEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.SSDEntity{}).
			Where("tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).
			Updates(map[string]any{
				"is_active":  isActive,
				"updated_at": gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return tx.First(&record, "tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.SSD{}, false, nil
	}
	if err != nil {
		return model.SSD{}, false, fmt.Errorf("set ssd status: %w", err)
	}

	detail, found, err := r.loadDetail(ctx, db, strings.TrimSpace(tahunAnggaran), id)
	if err == nil && found {
		return detail.SSD, true, nil
	}
	return record.ToSSD(), true, nil
}

func (r *SSDRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *SSDRepository) loadDetail(ctx context.Context, db *gorm.DB, tahunAnggaran string, id int64) (model.SSDDetail, bool, error) {
	var record model.SSDEntity
	if err := db.WithContext(ctx).First(&record, "tahun_anggaran = ? AND id = ?", tahunAnggaran, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.SSDDetail{}, false, nil
		}
		return model.SSDDetail{}, false, fmt.Errorf("detail ssd: %w", err)
	}

	var variableRecords []model.SSDVariableEntity
	if err := db.WithContext(ctx).
		Where("ssd_id = ? AND tahun_anggaran = ?", id, tahunAnggaran).
		Order("sort_order ASC, id ASC").
		Find(&variableRecords).Error; err != nil {
		return model.SSDDetail{}, false, fmt.Errorf("detail ssd variables: %w", err)
	}

	variables := make([]model.SSDVariable, 0, len(variableRecords))
	variableIDs := make([]int64, 0, len(variableRecords))
	variableOrderMap := make(map[int64]int64, len(variableRecords))
	for index, variableRecord := range variableRecords {
		variableIDs = append(variableIDs, variableRecord.ID)
		variables = append(variables, variableRecord.ToSSDVariable())
		variableOrderMap[variableRecord.ID] = int64(index + 1)
	}

	var indicatorRecords []model.SSDIndicatorEntity
	if err := db.WithContext(ctx).
		Where("ssd_id = ? AND tahun_anggaran = ?", id, tahunAnggaran).
		Order("sort_order ASC, id ASC").
		Find(&indicatorRecords).Error; err != nil {
		return model.SSDDetail{}, false, fmt.Errorf("detail ssd indicators: %w", err)
	}

	indicators := make([]model.SSDIndicator, 0, len(indicatorRecords))
	indicatorIDs := make([]int64, 0, len(indicatorRecords))
	indicatorMap := make(map[int64]int, len(indicatorRecords))
	for index, indicatorRecord := range indicatorRecords {
		indicators = append(indicators, indicatorRecord.ToSSDIndicator())
		indicatorIDs = append(indicatorIDs, indicatorRecord.ID)
		indicatorMap[indicatorRecord.ID] = index
	}

	if len(indicatorIDs) > 0 {
		var relationRecords []model.SSDIndicatorVariableEntity
		if err := db.WithContext(ctx).
			Where("indicator_id IN ? AND tahun_anggaran = ?", indicatorIDs, tahunAnggaran).
			Order("indicator_id ASC, variable_id ASC").
			Find(&relationRecords).Error; err != nil {
			return model.SSDDetail{}, false, fmt.Errorf("detail ssd indicator variables: %w", err)
		}

		for _, relationRecord := range relationRecords {
			indicatorIndex, ok := indicatorMap[relationRecord.IndicatorID]
			if !ok {
				continue
			}
			if variableIndex, ok := variableOrderMap[relationRecord.VariableID]; ok {
				indicators[indicatorIndex].VariableIDs = append(
					indicators[indicatorIndex].VariableIDs,
					variableIndex,
				)
			}
		}
	}

	ssd := record.ToSSD()
	ssd.JumlahVariabel = len(variables)
	ssd.JumlahIndikator = len(indicators)

	return model.SSDDetail{
		SSD:        ssd,
		Variables:  variables,
		Indicators: indicators,
	}, true, nil
}

func normalizeSSDImportPayloads(payloads []model.SSDPayload) []model.SSDPayload {
	deduped := make(map[string]model.SSDPayload, len(payloads))
	for _, payload := range payloads {
		kode := strings.TrimSpace(payload.Kode)
		uraian := strings.TrimSpace(payload.Uraian)
		if kode == "" || uraian == "" {
			continue
		}

		item := model.SSDPayload{
			Kode:                kode,
			Uraian:              uraian,
			Satuan:              strings.TrimSpace(payload.Satuan),
			DefinisiOperasional: strings.TrimSpace(payload.DefinisiOperasional),
			Variables:           nil,
			Indicators:          nil,
		}
		deduped[strings.ToLower(kode)] = item
	}

	result := make([]model.SSDPayload, 0, len(deduped))
	for _, item := range deduped {
		result = append(result, item)
	}
	return result
}

func lowerStrings(items []string) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		result = append(result, strings.ToLower(strings.TrimSpace(item)))
	}
	return result
}
