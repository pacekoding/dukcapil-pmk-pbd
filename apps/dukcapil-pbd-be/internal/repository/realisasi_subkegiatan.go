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

type RealisasiSubkegiatanRepository struct {
	db *gorm.DB
}

func NewRealisasiSubkegiatanRepository(db *gorm.DB) *RealisasiSubkegiatanRepository {
	return &RealisasiSubkegiatanRepository{db: db}
}

func (r *RealisasiSubkegiatanRepository) List(ctx context.Context, tahunAnggaran string) (model.RealisasiSubkegiatanListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RealisasiSubkegiatanListResponse{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	var records []model.RealisasiSubkegiatanEntity
	if err := db.Where("tahun_anggaran = ?", tahunAnggaran).Order("tanggal DESC, id DESC").Find(&records).Error; err != nil {
		return model.RealisasiSubkegiatanListResponse{}, fmt.Errorf("list realisasi subkegiatan: %w", err)
	}

	items, err := r.hydrate(ctx, db, tahunAnggaran, records, false)
	if err != nil {
		return model.RealisasiSubkegiatanListResponse{}, err
	}

	return model.RealisasiSubkegiatanListResponse{
		TahunAnggaran: tahunAnggaran,
		Items:         items,
	}, nil
}

func (r *RealisasiSubkegiatanRepository) Detail(ctx context.Context, tahunAnggaran string, id int64) (model.RealisasiSubkegiatanItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, false, err
	}

	var record model.RealisasiSubkegiatanEntity
	if err := db.First(&record, "tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.RealisasiSubkegiatanItem{}, false, nil
		}
		return model.RealisasiSubkegiatanItem{}, false, fmt.Errorf("detail realisasi subkegiatan: %w", err)
	}

	items, err := r.hydrate(ctx, db, strings.TrimSpace(tahunAnggaran), []model.RealisasiSubkegiatanEntity{record}, true)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, false, err
	}
	if len(items) == 0 {
		return model.RealisasiSubkegiatanItem{}, false, nil
	}

	return items[0], true, nil
}

func (r *RealisasiSubkegiatanRepository) Create(ctx context.Context, tahunAnggaran string, payload model.RealisasiSubkegiatanPayload) (model.RealisasiSubkegiatanItem, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, err
	}

	tanggal, err := parseRealisasiDate(payload.Tanggal)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, err
	}

	record := model.RealisasiSubkegiatanEntity{
		TahunAnggaran:     strings.TrimSpace(tahunAnggaran),
		SubkegiatanID:     payload.SubkegiatanID,
		Tanggal:           tanggal,
		Nama:              strings.TrimSpace(payload.Nama),
		Lokasi:            strings.TrimSpace(payload.Lokasi),
		Fasilitator:       strings.TrimSpace(payload.Fasilitator),
		Narasumber:        strings.TrimSpace(payload.Narasumber),
		JabatanNarasumber: strings.TrimSpace(payload.JabatanNarasumber),
		JumlahTamu:        payload.JumlahTamu,
		TujuanKegiatan:    strings.TrimSpace(payload.TujuanKegiatan),
		PoinPenting:       strings.TrimSpace(payload.PoinPenting),
		HasilKegiatan:     strings.TrimSpace(payload.HasilKegiatan),
		Keterangan:        strings.TrimSpace(payload.Keterangan),
		TargetOutput:      payload.TargetOutput,
		RealisasiOutput:   payload.RealisasiOutput,
		SatuanOutput:      strings.TrimSpace(payload.SatuanOutput),
		Kendala:           strings.TrimSpace(payload.Kendala),
		TindakLanjut:      strings.TrimSpace(payload.TindakLanjut),
		CatatanEvaluasi:   strings.TrimSpace(payload.CatatanEvaluasi),
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&record).Error; err != nil {
			return err
		}
		return r.replaceSSDData(tx, strings.TrimSpace(tahunAnggaran), record.ID, payload.SubkegiatanID, payload.SSDValues)
	}); err != nil {
		return model.RealisasiSubkegiatanItem{}, fmt.Errorf("create realisasi subkegiatan: %w", err)
	}

	item, _, err := r.Detail(ctx, tahunAnggaran, record.ID)
	return item, err
}

func (r *RealisasiSubkegiatanRepository) Update(ctx context.Context, tahunAnggaran string, id int64, payload model.RealisasiSubkegiatanPayload) (model.RealisasiSubkegiatanItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, false, err
	}

	tanggal, err := parseRealisasiDate(payload.Tanggal)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, false, err
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.RealisasiSubkegiatanEntity{}).
			Where("tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).
			Updates(map[string]any{
				"subkegiatan_id":     payload.SubkegiatanID,
				"tanggal":            tanggal,
				"nama":               strings.TrimSpace(payload.Nama),
				"lokasi":             strings.TrimSpace(payload.Lokasi),
				"fasilitator":        strings.TrimSpace(payload.Fasilitator),
				"narasumber":         strings.TrimSpace(payload.Narasumber),
				"jabatan_narasumber": strings.TrimSpace(payload.JabatanNarasumber),
				"jumlah_tamu":        payload.JumlahTamu,
				"tujuan_kegiatan":    strings.TrimSpace(payload.TujuanKegiatan),
				"poin_penting":       strings.TrimSpace(payload.PoinPenting),
				"hasil_kegiatan":     strings.TrimSpace(payload.HasilKegiatan),
				"keterangan":         strings.TrimSpace(payload.Keterangan),
				"target_output":      payload.TargetOutput,
				"realisasi_output":   payload.RealisasiOutput,
				"satuan_output":      strings.TrimSpace(payload.SatuanOutput),
				"kendala":            strings.TrimSpace(payload.Kendala),
				"tindak_lanjut":      strings.TrimSpace(payload.TindakLanjut),
				"catatan_evaluasi":   strings.TrimSpace(payload.CatatanEvaluasi),
				"updated_at":         gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return r.replaceSSDData(tx, strings.TrimSpace(tahunAnggaran), id, payload.SubkegiatanID, payload.SSDValues)
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.RealisasiSubkegiatanItem{}, false, nil
	}
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, false, fmt.Errorf("update realisasi subkegiatan: %w", err)
	}

	item, found, err := r.Detail(ctx, tahunAnggaran, id)
	return item, found, err
}

func (r *RealisasiSubkegiatanRepository) Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Where("tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).Delete(&model.RealisasiSubkegiatanEntity{})
	if result.Error != nil {
		return false, fmt.Errorf("delete realisasi subkegiatan: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *RealisasiSubkegiatanRepository) AddFoto(ctx context.Context, tahunAnggaran string, realisasiID int64, files []model.RealisasiFile) (model.RealisasiSubkegiatanItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, false, err
	}
	if exists, err := r.exists(db, tahunAnggaran, realisasiID); err != nil || !exists {
		return model.RealisasiSubkegiatanItem{}, exists, err
	}

	records := make([]model.RealisasiFotoEntity, 0, len(files))
	for _, file := range files {
		records = append(records, model.RealisasiFotoEntity{
			RealisasiID:  realisasiID,
			FileName:     file.FileName,
			OriginalName: file.OriginalName,
			MimeType:     file.MimeType,
			Size:         file.Size,
			URL:          file.URL,
		})
	}
	if len(records) > 0 {
		if err := db.Create(&records).Error; err != nil {
			return model.RealisasiSubkegiatanItem{}, false, fmt.Errorf("add foto realisasi: %w", err)
		}
	}

	item, found, err := r.Detail(ctx, tahunAnggaran, realisasiID)
	return item, found, err
}

func (r *RealisasiSubkegiatanRepository) AddDokumen(ctx context.Context, tahunAnggaran string, realisasiID int64, files []model.RealisasiFile) (model.RealisasiSubkegiatanItem, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.RealisasiSubkegiatanItem{}, false, err
	}
	if exists, err := r.exists(db, tahunAnggaran, realisasiID); err != nil || !exists {
		return model.RealisasiSubkegiatanItem{}, exists, err
	}

	records := make([]model.RealisasiDokumenEntity, 0, len(files))
	for _, file := range files {
		records = append(records, model.RealisasiDokumenEntity{
			RealisasiID:  realisasiID,
			FileName:     file.FileName,
			OriginalName: file.OriginalName,
			MimeType:     file.MimeType,
			Size:         file.Size,
			URL:          file.URL,
		})
	}
	if len(records) > 0 {
		if err := db.Create(&records).Error; err != nil {
			return model.RealisasiSubkegiatanItem{}, false, fmt.Errorf("add dokumen realisasi: %w", err)
		}
	}

	item, found, err := r.Detail(ctx, tahunAnggaran, realisasiID)
	return item, found, err
}

func (r *RealisasiSubkegiatanRepository) hydrate(ctx context.Context, db *gorm.DB, tahunAnggaran string, records []model.RealisasiSubkegiatanEntity, includeFiles bool) ([]model.RealisasiSubkegiatanItem, error) {
	subkegiatanIDs := make([]int64, 0, len(records))
	realisasiIDs := make([]int64, 0, len(records))
	for _, record := range records {
		subkegiatanIDs = append(subkegiatanIDs, record.SubkegiatanID)
		realisasiIDs = append(realisasiIDs, record.ID)
	}

	subkegiatanMap := map[int64]model.Subkegiatan{}
	if len(subkegiatanIDs) > 0 {
		var subRecords []model.SubkegiatanEntity
		if err := db.WithContext(ctx).Where("tahun_anggaran = ? AND id IN ?", strings.TrimSpace(tahunAnggaran), subkegiatanIDs).Find(&subRecords).Error; err != nil {
			return nil, fmt.Errorf("load subkegiatan realisasi: %w", err)
		}
		for _, subRecord := range subRecords {
			subkegiatanMap[subRecord.ID] = subRecord.ToSubkegiatan()
		}
	}
	if len(subkegiatanIDs) > 0 {
		if err := r.attachSSDItems(ctx, db, strings.TrimSpace(tahunAnggaran), subkegiatanIDs, subkegiatanMap); err != nil {
			return nil, err
		}
	}

	fotoCount := map[int64]int64{}
	dokumenCount := map[int64]int64{}
	if len(realisasiIDs) > 0 {
		var counts []struct {
			RealisasiID int64
			Count       int64
		}
		if err := db.Model(&model.RealisasiFotoEntity{}).Select("realisasi_id, COUNT(*) AS count").Where("realisasi_id IN ?", realisasiIDs).Group("realisasi_id").Scan(&counts).Error; err != nil {
			return nil, fmt.Errorf("count foto realisasi: %w", err)
		}
		for _, count := range counts {
			fotoCount[count.RealisasiID] = count.Count
		}
		counts = nil
		if err := db.Model(&model.RealisasiDokumenEntity{}).Select("realisasi_id, COUNT(*) AS count").Where("realisasi_id IN ?", realisasiIDs).Group("realisasi_id").Scan(&counts).Error; err != nil {
			return nil, fmt.Errorf("count dokumen realisasi: %w", err)
		}
		for _, count := range counts {
			dokumenCount[count.RealisasiID] = count.Count
		}
	}

	fotoMap := map[int64][]model.RealisasiFile{}
	dokumenMap := map[int64][]model.RealisasiFile{}
	ssdValueMap := map[int64][]model.RealisasiSSDDataValue{}
	ssdDataCount := map[int64]int64{}
	allowedSSDByRealisasi := map[int64]map[int64]struct{}{}
	for _, record := range records {
		allowedSSDIDs := map[int64]struct{}{}
		if subkegiatan, ok := subkegiatanMap[record.SubkegiatanID]; ok {
			for _, ssd := range subkegiatan.SSDItems {
				allowedSSDIDs[ssd.ID] = struct{}{}
			}
		}
		allowedSSDByRealisasi[record.ID] = allowedSSDIDs
	}
	if len(realisasiIDs) > 0 {
		var ssdDataRecords []model.RealisasiSSDDataEntity
		if err := db.WithContext(ctx).
			Where("tahun_anggaran = ? AND realisasi_id IN ?", strings.TrimSpace(tahunAnggaran), realisasiIDs).
			Order("ssd_id ASC").
			Find(&ssdDataRecords).Error; err != nil {
			return nil, fmt.Errorf("load realisasi ssd data: %w", err)
		}

		ssdIDs := make([]int64, 0, len(ssdDataRecords))
		seenSSDIDs := map[int64]struct{}{}
		for _, record := range ssdDataRecords {
			if _, allowed := allowedSSDByRealisasi[record.RealisasiID][record.SSDID]; !allowed {
				continue
			}
			if strings.TrimSpace(record.Nilai) != "" {
				ssdDataCount[record.RealisasiID]++
			}
			if _, exists := seenSSDIDs[record.SSDID]; !exists {
				ssdIDs = append(ssdIDs, record.SSDID)
				seenSSDIDs[record.SSDID] = struct{}{}
			}
		}

		ssdMap := map[int64]model.SSD{}
		if len(ssdIDs) > 0 {
			var ssdRecords []model.SSDEntity
			if err := db.WithContext(ctx).
				Where("tahun_anggaran = ? AND id IN ?", strings.TrimSpace(tahunAnggaran), ssdIDs).
				Find(&ssdRecords).Error; err != nil {
				return nil, fmt.Errorf("load realisasi ssd items: %w", err)
			}
			for _, record := range ssdRecords {
				ssdMap[record.ID] = record.ToSSD()
			}
		}

		for _, record := range ssdDataRecords {
			if _, allowed := allowedSSDByRealisasi[record.RealisasiID][record.SSDID]; !allowed {
				continue
			}
			value := model.RealisasiSSDDataValue{
				SSDID: record.SSDID,
				Nilai: record.Nilai,
			}
			if ssd, ok := ssdMap[record.SSDID]; ok {
				copied := ssd
				value.SSD = &copied
			}
			ssdValueMap[record.RealisasiID] = append(ssdValueMap[record.RealisasiID], value)
		}
	}
	if includeFiles && len(realisasiIDs) > 0 {
		var fotoRecords []model.RealisasiFotoEntity
		if err := db.Where("realisasi_id IN ?", realisasiIDs).Order("created_at DESC, id DESC").Find(&fotoRecords).Error; err != nil {
			return nil, fmt.Errorf("load foto realisasi: %w", err)
		}
		for _, file := range fotoRecords {
			fotoMap[file.RealisasiID] = append(fotoMap[file.RealisasiID], file.ToFile())
		}
		var dokumenRecords []model.RealisasiDokumenEntity
		if err := db.Where("realisasi_id IN ?", realisasiIDs).Order("created_at DESC, id DESC").Find(&dokumenRecords).Error; err != nil {
			return nil, fmt.Errorf("load dokumen realisasi: %w", err)
		}
		for _, file := range dokumenRecords {
			dokumenMap[file.RealisasiID] = append(dokumenMap[file.RealisasiID], file.ToFile())
		}
	}

	items := make([]model.RealisasiSubkegiatanItem, 0, len(records))
	for _, record := range records {
		var subkegiatan *model.Subkegiatan
		var jumlahSSD int64
		if item, ok := subkegiatanMap[record.SubkegiatanID]; ok {
			copied := item
			jumlahSSD = int64(len(copied.SSDItems))
			subkegiatan = &copied
		}
		items = append(items, model.RealisasiSubkegiatanItem{
			ID:                record.ID,
			TahunAnggaran:     record.TahunAnggaran,
			SubkegiatanID:     record.SubkegiatanID,
			Subkegiatan:       subkegiatan,
			Tanggal:           record.Tanggal.Format("2006-01-02"),
			Nama:              record.Nama,
			Lokasi:            record.Lokasi,
			Fasilitator:       record.Fasilitator,
			Narasumber:        record.Narasumber,
			JabatanNarasumber: record.JabatanNarasumber,
			JumlahTamu:        record.JumlahTamu,
			TujuanKegiatan:    record.TujuanKegiatan,
			PoinPenting:       record.PoinPenting,
			HasilKegiatan:     record.HasilKegiatan,
			Keterangan:        record.Keterangan,
			TargetOutput:      record.TargetOutput,
			RealisasiOutput:   record.RealisasiOutput,
			SatuanOutput:      record.SatuanOutput,
			PersentaseCapaian: model.CalculateCapaian(record.TargetOutput, record.RealisasiOutput),
			StatusCapaian:     model.GetStatusCapaian(record.TargetOutput, record.RealisasiOutput),
			Kendala:           record.Kendala,
			TindakLanjut:      record.TindakLanjut,
			CatatanEvaluasi:   record.CatatanEvaluasi,
			JumlahFoto:        fotoCount[record.ID],
			JumlahDokumen:     dokumenCount[record.ID],
			JumlahSSD:         jumlahSSD,
			JumlahSSDData:     ssdDataCount[record.ID],
			SSDValues:         ssdValueMap[record.ID],
			FotoDokumentasi:   fotoMap[record.ID],
			Dokumen:           dokumenMap[record.ID],
		})
	}

	return items, nil
}

func (r *RealisasiSubkegiatanRepository) attachSSDItems(
	ctx context.Context,
	db *gorm.DB,
	tahunAnggaran string,
	subkegiatanIDs []int64,
	subkegiatanMap map[int64]model.Subkegiatan,
) error {
	var relations []model.SubkegiatanSSDEntity
	if err := db.WithContext(ctx).
		Where("tahun_anggaran = ? AND subkegiatan_id IN ?", tahunAnggaran, subkegiatanIDs).
		Find(&relations).Error; err != nil {
		return fmt.Errorf("load realisasi subkegiatan ssd relations: %w", err)
	}
	if len(relations) == 0 {
		return nil
	}

	ssdIDs := make([]int64, 0, len(relations))
	seenSSDIDs := map[int64]struct{}{}
	for _, relation := range relations {
		if _, exists := seenSSDIDs[relation.SSDID]; exists {
			continue
		}
		ssdIDs = append(ssdIDs, relation.SSDID)
		seenSSDIDs[relation.SSDID] = struct{}{}
	}

	var ssdRecords []model.SSDEntity
	if err := db.WithContext(ctx).
		Where("tahun_anggaran = ? AND id IN ?", tahunAnggaran, ssdIDs).
		Order("kode ASC, id ASC").
		Find(&ssdRecords).Error; err != nil {
		return fmt.Errorf("load realisasi subkegiatan ssd items: %w", err)
	}

	ssdMap := make(map[int64]model.SSD, len(ssdRecords))
	for _, record := range ssdRecords {
		ssdMap[record.ID] = record.ToSSD()
	}

	for _, relation := range relations {
		subkegiatan, ok := subkegiatanMap[relation.SubkegiatanID]
		if !ok {
			continue
		}
		ssd, ok := ssdMap[relation.SSDID]
		if !ok {
			continue
		}
		subkegiatan.SSDItems = append(subkegiatan.SSDItems, ssd)
		subkegiatanMap[relation.SubkegiatanID] = subkegiatan
	}

	return nil
}

func (r *RealisasiSubkegiatanRepository) replaceSSDData(
	db *gorm.DB,
	tahunAnggaran string,
	realisasiID int64,
	subkegiatanID int64,
	values []model.RealisasiSSDDataInput,
) error {
	if err := db.
		Where("tahun_anggaran = ? AND realisasi_id = ?", tahunAnggaran, realisasiID).
		Delete(&model.RealisasiSSDDataEntity{}).Error; err != nil {
		return fmt.Errorf("clear realisasi ssd data: %w", err)
	}

	if len(values) == 0 {
		return nil
	}

	var relations []model.SubkegiatanSSDEntity
	if err := db.
		Where("tahun_anggaran = ? AND subkegiatan_id = ?", tahunAnggaran, subkegiatanID).
		Find(&relations).Error; err != nil {
		return fmt.Errorf("load realisasi ssd relation scope: %w", err)
	}

	allowedSSDIDs := make(map[int64]struct{}, len(relations))
	for _, relation := range relations {
		allowedSSDIDs[relation.SSDID] = struct{}{}
	}

	records := make([]model.RealisasiSSDDataEntity, 0, len(values))
	seenValues := map[int64]struct{}{}
	for _, value := range values {
		nilai := strings.TrimSpace(value.Nilai)
		if nilai == "" {
			continue
		}
		if _, allowed := allowedSSDIDs[value.SSDID]; !allowed {
			continue
		}
		if _, exists := seenValues[value.SSDID]; exists {
			continue
		}
		records = append(records, model.RealisasiSSDDataEntity{
			RealisasiID:   realisasiID,
			SSDID:         value.SSDID,
			TahunAnggaran: tahunAnggaran,
			Nilai:         nilai,
		})
		seenValues[value.SSDID] = struct{}{}
	}

	if len(records) == 0 {
		return nil
	}
	if err := db.Create(&records).Error; err != nil {
		return fmt.Errorf("create realisasi ssd data: %w", err)
	}

	return nil
}

func (r *RealisasiSubkegiatanRepository) exists(db *gorm.DB, tahunAnggaran string, id int64) (bool, error) {
	var count int64
	if err := db.Model(&model.RealisasiSubkegiatanEntity{}).Where("tahun_anggaran = ? AND id = ?", strings.TrimSpace(tahunAnggaran), id).Count(&count).Error; err != nil {
		return false, fmt.Errorf("check realisasi subkegiatan: %w", err)
	}

	return count > 0, nil
}

func parseRealisasiDate(value string) (time.Time, error) {
	parsed, err := time.Parse("2006-01-02", strings.TrimSpace(value))
	if err != nil {
		return time.Time{}, fmt.Errorf("tanggal tidak valid")
	}
	return parsed, nil
}

func (r *RealisasiSubkegiatanRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
