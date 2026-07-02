package repository

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type SubkegiatanRepository struct {
	db *gorm.DB
}

func NewSubkegiatanRepository(db *gorm.DB) *SubkegiatanRepository {
	return &SubkegiatanRepository{db: db}
}

func (r *SubkegiatanRepository) List(ctx context.Context, tahunAnggaran string) (model.SubkegiatanListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SubkegiatanListResponse{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	var records []model.SubkegiatanEntity
	if err := db.
		Where("tahun_anggaran = ?", tahunAnggaran).
		Order("kode ASC, id ASC").
		Find(&records).Error; err != nil {
		return model.SubkegiatanListResponse{}, fmt.Errorf("list subkegiatan: %w", err)
	}

	items := make([]model.Subkegiatan, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToSubkegiatan())
	}
	items, err = r.attachSSDItems(ctx, db, strings.TrimSpace(tahunAnggaran), items)
	if err != nil {
		return model.SubkegiatanListResponse{}, err
	}

	return model.SubkegiatanListResponse{
		TahunAnggaran: tahunAnggaran,
		Items:         items,
	}, nil
}

func (r *SubkegiatanRepository) Create(ctx context.Context, tahunAnggaran string, payload model.SubkegiatanPayload) (model.Subkegiatan, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Subkegiatan{}, err
	}

	record := model.SubkegiatanEntity{
		TahunAnggaran: strings.TrimSpace(tahunAnggaran),
		Kode:          strings.TrimSpace(payload.Kode),
		Nama:          strings.TrimSpace(payload.Nama),
		Bidang:        payload.Bidang,
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&record).Error; err != nil {
			return err
		}
		return r.replaceSSDRelations(tx, strings.TrimSpace(tahunAnggaran), record.ID, payload.SSDIDs)
	}); err != nil {
		return model.Subkegiatan{}, fmt.Errorf("create subkegiatan: %w", err)
	}

	items, err := r.attachSSDItems(ctx, db, strings.TrimSpace(tahunAnggaran), []model.Subkegiatan{record.ToSubkegiatan()})
	if err != nil {
		return model.Subkegiatan{}, err
	}
	return items[0], nil
}

func (r *SubkegiatanRepository) Import(ctx context.Context, tahunAnggaran string, payloads []model.SubkegiatanImportPayload) (model.SubkegiatanImportResult, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.SubkegiatanImportResult{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	result := model.SubkegiatanImportResult{
		TahunAnggaran: tahunAnggaran,
		Total:         len(payloads),
	}
	if len(payloads) == 0 {
		return result, nil
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		ssdByCode, err := r.activeSSDByCode(tx, tahunAnggaran)
		if err != nil {
			return err
		}

		kodes := make([]string, 0, len(payloads))
		for _, payload := range payloads {
			kodes = append(kodes, strings.ToLower(strings.TrimSpace(payload.Kode)))
		}

		var existing []model.SubkegiatanEntity
		if err := tx.
			Where("tahun_anggaran = ? AND LOWER(kode) IN ?", tahunAnggaran, kodes).
			Find(&existing).Error; err != nil {
			return err
		}

		existingByCode := make(map[string]model.SubkegiatanEntity, len(existing))
		for _, record := range existing {
			existingByCode[strings.ToLower(strings.TrimSpace(record.Kode))] = record
		}

		for _, payload := range payloads {
			ssdIDs := make([]int64, 0, len(payload.SSDCodes))
			for _, ssdCode := range payload.SSDCodes {
				ssd, exists := ssdByCode[strings.ToLower(strings.TrimSpace(ssdCode))]
				if !exists {
					return fmt.Errorf("baris %d: kode dssd %s tidak ditemukan atau tidak aktif", payload.Row, ssdCode)
				}
				ssdIDs = append(ssdIDs, ssd.ID)
			}

			normalizedCode := strings.ToLower(strings.TrimSpace(payload.Kode))
			if record, exists := existingByCode[normalizedCode]; exists {
				if err := tx.Model(&model.SubkegiatanEntity{}).
					Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, record.ID).
					Updates(map[string]any{
						"kode":       strings.TrimSpace(payload.Kode),
						"nama":       strings.TrimSpace(payload.Nama),
						"bidang":     payload.Bidang,
						"updated_at": gorm.Expr("NOW()"),
					}).Error; err != nil {
					return err
				}
				if err := r.replaceSSDRelations(tx, tahunAnggaran, record.ID, ssdIDs); err != nil {
					return err
				}
				result.Updated++
				continue
			}

			record := model.SubkegiatanEntity{
				TahunAnggaran: tahunAnggaran,
				Kode:          strings.TrimSpace(payload.Kode),
				Nama:          strings.TrimSpace(payload.Nama),
				Bidang:        payload.Bidang,
			}
			if err := tx.Create(&record).Error; err != nil {
				return err
			}
			if err := r.replaceSSDRelations(tx, tahunAnggaran, record.ID, ssdIDs); err != nil {
				return err
			}
			existingByCode[normalizedCode] = record
			result.Created++
		}

		return nil
	})
	if err != nil {
		return model.SubkegiatanImportResult{}, fmt.Errorf("import subkegiatan: %w", err)
	}

	return result, nil
}

func (r *SubkegiatanRepository) activeSSDByCode(db *gorm.DB, tahunAnggaran string) (map[string]model.SSD, error) {
	var records []model.SSDEntity
	if err := db.
		Where("tahun_anggaran = ? AND is_active = TRUE", tahunAnggaran).
		Find(&records).Error; err != nil {
		return nil, fmt.Errorf("load active ssd: %w", err)
	}

	items := make(map[string]model.SSD, len(records))
	for _, record := range records {
		item := record.ToSSD()
		items[strings.ToLower(strings.TrimSpace(item.Kode))] = item
	}
	return items, nil
}

func (r *SubkegiatanRepository) Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SubkegiatanPayload) (model.Subkegiatan, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.Subkegiatan{}, false, err
	}

	var record model.SubkegiatanEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.SubkegiatanEntity{}).
			Where("tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).
			Updates(map[string]any{
				"kode":       strings.TrimSpace(payload.Kode),
				"nama":       strings.TrimSpace(payload.Nama),
				"bidang":     payload.Bidang,
				"updated_at": gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		if err := r.replaceSSDRelations(tx, strings.TrimSpace(tahunAnggaran), id, payload.SSDIDs); err != nil {
			return err
		}

		return tx.First(&record, "tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Subkegiatan{}, false, nil
	}
	if err != nil {
		return model.Subkegiatan{}, false, fmt.Errorf("update subkegiatan: %w", err)
	}

	items, err := r.attachSSDItems(ctx, db, strings.TrimSpace(tahunAnggaran), []model.Subkegiatan{record.ToSubkegiatan()})
	if err != nil {
		return model.Subkegiatan{}, false, err
	}
	return items[0], true, nil
}

func (r *SubkegiatanRepository) Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	var deleted bool
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Where("tahun_anggaran = ? AND subkegiatan_id = ?", tahunAnggaran, id).
			Delete(&model.RealisasiSubkegiatanEntity{}).Error; err != nil {
			return err
		}

		result := tx.
			Where("tahun_anggaran = ? AND id = ?", tahunAnggaran, id).
			Delete(&model.SubkegiatanEntity{})
		if result.Error != nil {
			return result.Error
		}
		deleted = result.RowsAffected > 0
		return nil
	})
	if err != nil {
		return false, fmt.Errorf("delete subkegiatan: %w", err)
	}

	return deleted, nil
}

func (r *SubkegiatanRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *SubkegiatanRepository) replaceSSDRelations(db *gorm.DB, tahunAnggaran string, subkegiatanID int64, ssdIDs []int64) error {
	uniqueIDs := make([]int64, 0, len(ssdIDs))
	seen := map[int64]struct{}{}
	for _, id := range ssdIDs {
		if id <= 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		uniqueIDs = append(uniqueIDs, id)
	}

	if err := db.Where("tahun_anggaran = ? AND subkegiatan_id = ?", tahunAnggaran, subkegiatanID).Delete(&model.SubkegiatanSSDEntity{}).Error; err != nil {
		return fmt.Errorf("clear subkegiatan ssd: %w", err)
	}

	if len(uniqueIDs) == 0 {
		return nil
	}

	var count int64
	if err := db.Model(&model.SSDEntity{}).
		Where("tahun_anggaran = ? AND is_active = TRUE AND id IN ?", tahunAnggaran, uniqueIDs).
		Count(&count).Error; err != nil {
		return fmt.Errorf("validate ssd relation: %w", err)
	}
	if count != int64(len(uniqueIDs)) {
		return fmt.Errorf("invalid ssd relation")
	}

	relations := make([]model.SubkegiatanSSDEntity, 0, len(uniqueIDs))
	for _, ssdID := range uniqueIDs {
		relations = append(relations, model.SubkegiatanSSDEntity{
			SubkegiatanID: subkegiatanID,
			SSDID:         ssdID,
			TahunAnggaran: tahunAnggaran,
		})
	}

	if err := db.Create(&relations).Error; err != nil {
		return fmt.Errorf("create subkegiatan ssd: %w", err)
	}
	return nil
}

func (r *SubkegiatanRepository) attachSSDItems(ctx context.Context, db *gorm.DB, tahunAnggaran string, items []model.Subkegiatan) ([]model.Subkegiatan, error) {
	if len(items) == 0 {
		return items, nil
	}

	subkegiatanIDs := make([]int64, 0, len(items))
	for _, item := range items {
		subkegiatanIDs = append(subkegiatanIDs, item.ID)
	}

	var relations []model.SubkegiatanSSDEntity
	if err := db.WithContext(ctx).
		Where("tahun_anggaran = ? AND subkegiatan_id IN ?", tahunAnggaran, subkegiatanIDs).
		Find(&relations).Error; err != nil {
		return nil, fmt.Errorf("load subkegiatan ssd relations: %w", err)
	}
	if len(relations) == 0 {
		return items, nil
	}

	ssdIDs := make([]int64, 0, len(relations))
	for _, relation := range relations {
		ssdIDs = append(ssdIDs, relation.SSDID)
	}
	ssdIDs = slices.Compact(ssdIDs)

	var ssdRecords []model.SSDEntity
	if err := db.WithContext(ctx).
		Where("tahun_anggaran = ? AND id IN ?", tahunAnggaran, ssdIDs).
		Order("kode ASC, id ASC").
		Find(&ssdRecords).Error; err != nil {
		return nil, fmt.Errorf("load subkegiatan ssd items: %w", err)
	}

	ssdMap := make(map[int64]model.SSD, len(ssdRecords))
	for _, record := range ssdRecords {
		ssdMap[record.ID] = record.ToSSD()
	}

	relMap := make(map[int64][]model.SSD, len(items))
	for _, relation := range relations {
		if item, ok := ssdMap[relation.SSDID]; ok {
			relMap[relation.SubkegiatanID] = append(relMap[relation.SubkegiatanID], item)
		}
	}

	for index := range items {
		if related, ok := relMap[items[index].ID]; ok {
			items[index].SSDItems = related
		}
	}

	return items, nil
}
