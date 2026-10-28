package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrOtsusInvalid  = errors.New("data labelisasi Otsus tidak valid")
	ErrOtsusConflict = errors.New("subkegiatan sudah dilabelisasi Otsus pada tahun anggaran aktif")
	ErrOtsusNotFound = errors.New("labelisasi Otsus tidak ditemukan")
)

type OtsusRepository struct{ db *gorm.DB }

func NewOtsusRepository(db *gorm.DB) *OtsusRepository { return &OtsusRepository{db: db} }

func ValidateOtsusPayload(p model.OtsusPayload) error {
	p.Status = strings.TrimSpace(p.Status)
	if p.SubkegiatanID <= 0 {
		return fmt.Errorf("%w: subkegiatan wajib dipilih", ErrOtsusInvalid)
	}
	if p.Pagu < 0 || p.Realisasi < 0 {
		return fmt.Errorf("%w: pagu dan realisasi tidak boleh negatif", ErrOtsusInvalid)
	}
	if p.Realisasi > p.Pagu {
		return fmt.Errorf("%w: realisasi tidak boleh melebihi pagu", ErrOtsusInvalid)
	}
	switch p.Status {
	case model.OtsusStatusBelumMulai, model.OtsusStatusBerjalan, model.OtsusStatusSelesai:
		return nil
	default:
		return fmt.Errorf("%w: status pelaksanaan wajib dipilih", ErrOtsusInvalid)
	}
}

func (r *OtsusRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *OtsusRepository) List(ctx context.Context, year, search string) ([]model.OtsusLabel, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}
	var rows []model.OtsusLabel
	q := db.Table("labelisasi_otsus o").
		Select(`o.*, s.bidang, s.program, s.kegiatan, s.subkegiatan,
		 (SELECT COUNT(*) FROM dokumentasi_otsus od WHERE od.otsus_label_id=o.id) AS documentation_count,
		 (SELECT COUNT(*) FROM versi_dpa_otsus dv WHERE dv.otsus_label_id=o.id) AS dpa_count,
		 EXISTS(SELECT 1 FROM lpj_otsus l WHERE l.otsus_label_id=o.id) AS has_lpj`).
		Joins("JOIN subkegiatan s ON s.id=o.subkegiatan_id").
		Where("o.tahun_anggaran = ?", strings.TrimSpace(year)).Order("o.updated_at DESC, o.id DESC")
	if term := strings.TrimSpace(search); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		q = q.Where("LOWER(s.subkegiatan) LIKE ? OR CAST(s.id AS TEXT) LIKE ?", like, "%"+term+"%")
	}
	if err := q.Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("list otsus: %w", err)
	}
	return rows, nil
}

func (r *OtsusRepository) Detail(ctx context.Context, id int64, year string) (model.OtsusDetail, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OtsusDetail{}, err
	}
	return loadOtsusDetail(db, id, year)
}

func loadOtsusDetail(db *gorm.DB, id int64, year string) (model.OtsusDetail, error) {
	var out model.OtsusDetail
	err := db.Table("labelisasi_otsus o").Select("o.*, s.bidang, s.program, s.kegiatan, s.subkegiatan").
		Joins("JOIN subkegiatan s ON s.id=o.subkegiatan_id").
		Where("o.id=? AND o.tahun_anggaran=?", id, strings.TrimSpace(year)).Take(&out.Label).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return out, ErrOtsusNotFound
	}
	if err != nil {
		return out, fmt.Errorf("load otsus: %w", err)
	}
	if err := db.Where("otsus_label_id=?", id).Order("created_at DESC").Find(&out.Documentations).Error; err != nil {
		return out, err
	}
	for i := range out.Documentations {
		file, found, e := storedFileByID(db, out.Documentations[i].FileID)
		if e != nil {
			return out, e
		}
		if found {
			out.Documentations[i].File = file
		}
	}
	var lpj model.OtsusLPJ
	err = db.Where("otsus_label_id=?", id).Take(&lpj).Error
	if err == nil {
		file, found, e := storedFileByID(db, lpj.FileID)
		if e != nil {
			return out, e
		}
		if found {
			lpj.File = file
		}
		out.LPJ = &lpj
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return out, err
	}
	if err := db.Where("otsus_label_id=?", id).Order("versi DESC").Find(&out.DPAVersions).Error; err != nil {
		return out, err
	}
	for i := range out.DPAVersions {
		file, found, e := storedFileByID(db, out.DPAVersions[i].FileID)
		if e != nil {
			return out, e
		}
		if found {
			out.DPAVersions[i].File = file
		}
	}
	out.Label.DocumentationCount = int64(len(out.Documentations))
	out.Label.DPACount = int64(len(out.DPAVersions))
	out.Label.HasLPJ = out.LPJ != nil
	return out, nil
}

func (r *OtsusRepository) Save(ctx context.Context, id int64, year string, p model.OtsusPayload, user int64) (model.OtsusDetail, error) {
	if err := ValidateOtsusPayload(p); err != nil {
		return model.OtsusDetail{}, err
	}
	db, err := r.session(ctx)
	if err != nil {
		return model.OtsusDetail{}, err
	}
	year = strings.TrimSpace(year)
	p.Status = strings.TrimSpace(p.Status)
	p.Keterangan = strings.TrimSpace(p.Keterangan)
	err = db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if e := tx.Model(&model.SubkegiatanEntity{}).Where("id=?", p.SubkegiatanID).Count(&count).Error; e != nil {
			return e
		}
		if count == 0 {
			return fmt.Errorf("%w: subkegiatan tidak ditemukan", ErrOtsusInvalid)
		}
		if id == 0 {
			rec := model.OtsusLabel{TahunAnggaran: year, OtsusPayload: p, CreatedBy: user, UpdatedBy: user}
			if e := tx.Create(&rec).Error; e != nil {
				if isUniqueViolation(e) {
					return ErrOtsusConflict
				}
				return e
			}
			id = rec.ID
			return nil
		}
		res := tx.Model(&model.OtsusLabel{}).Where("id=? AND tahun_anggaran=?", id, year).Updates(map[string]any{"subkegiatan_id": p.SubkegiatanID, "pagu": p.Pagu, "realisasi": p.Realisasi, "status": p.Status, "keterangan": p.Keterangan, "updated_by": user, "updated_at": gorm.Expr("NOW()")})
		if res.Error != nil {
			if isUniqueViolation(res.Error) {
				return ErrOtsusConflict
			}
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrOtsusNotFound
		}
		return nil
	})
	if err != nil {
		return model.OtsusDetail{}, err
	}
	return loadOtsusDetail(db, id, year)
}

func isUniqueViolation(err error) bool {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}
	var pqErr *pq.Error
	return errors.As(err, &pqErr) && pqErr.Code == "23505"
}

func (r *OtsusRepository) Delete(ctx context.Context, id int64, year string) ([]string, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}
	var keys []string
	err = db.Transaction(func(tx *gorm.DB) error {
		var exists int64
		if e := tx.Model(&model.OtsusLabel{}).Where("id=? AND tahun_anggaran=?", id, year).Count(&exists).Error; e != nil {
			return e
		}
		if exists == 0 {
			return ErrOtsusNotFound
		}
		if e := tx.Table("stored_files").Where("module='otsus' AND related_entity_type IN ? AND related_entity_id IN (SELECT id FROM dokumentasi_otsus WHERE otsus_label_id=?) AND deleted_at IS NULL", []string{"otsus_documentation"}, id).Pluck("storage_key", &keys).Error; e != nil {
			return e
		}
		var other []string
		if e := tx.Table("stored_files").Where("module='otsus' AND ((related_entity_type='lpj_otsus' AND related_entity_id IN (SELECT id FROM lpj_otsus WHERE otsus_label_id=?)) OR (related_entity_type='otsus_dpa' AND related_entity_id IN (SELECT id FROM versi_dpa_otsus WHERE otsus_label_id=?))) AND deleted_at IS NULL", id, id).Pluck("storage_key", &other).Error; e != nil {
			return e
		}
		keys = append(keys, other...)
		if e := tx.Table("stored_files").Where("storage_key IN ?", keys).Updates(map[string]any{"deleted_at": gorm.Expr("NOW()"), "updated_at": gorm.Expr("NOW()")}).Error; e != nil {
			return e
		}
		return tx.Delete(&model.OtsusLabel{}, "id=? AND tahun_anggaran=?", id, year).Error
	})
	return keys, err
}

func ensureOtsusLabel(tx *gorm.DB, id int64, year string, lock bool) error {
	var rec model.OtsusLabel
	q := tx.Where("id=? AND tahun_anggaran=?", id, year)
	if lock {
		q = q.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if e := q.Take(&rec).Error; errors.Is(e, gorm.ErrRecordNotFound) {
		return ErrOtsusNotFound
	} else {
		return e
	}
}

func (r *OtsusRepository) AddDocumentation(ctx context.Context, id int64, year, caption string, input model.StoredFileInput, user int64) (model.OtsusDocumentation, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OtsusDocumentation{}, err
	}
	var out model.OtsusDocumentation
	err = db.Transaction(func(tx *gorm.DB) error {
		if e := ensureOtsusLabel(tx, id, year, false); e != nil {
			return e
		}
		file, e := createStoredFileRecord(tx, input, id)
		if e != nil {
			return e
		}
		out = model.OtsusDocumentation{OtsusLabelID: id, FileID: file.ID, Caption: strings.TrimSpace(caption), CreatedBy: user}
		if e := tx.Create(&out).Error; e != nil {
			return e
		}
		if e := tx.Model(&model.StoredFile{}).Where("id=?", file.ID).Update("related_entity_id", out.ID).Error; e != nil {
			return e
		}
		file.RelatedEntityID = out.ID
		out.File = finalizeStoredFile(file)
		return nil
	})
	return out, err
}

func (r *OtsusRepository) DeleteDocumentation(ctx context.Context, labelID, docID int64, year string) (string, error) {
	db, err := r.session(ctx)
	if err != nil {
		return "", err
	}
	key := ""
	err = db.Transaction(func(tx *gorm.DB) error {
		if e := ensureOtsusLabel(tx, labelID, year, false); e != nil {
			return e
		}
		var doc model.OtsusDocumentation
		if e := tx.Where("id=? AND otsus_label_id=?", docID, labelID).Take(&doc).Error; errors.Is(e, gorm.ErrRecordNotFound) {
			return ErrOtsusNotFound
		} else if e != nil {
			return e
		}
		var file model.StoredFile
		if e := tx.Where("id=?", doc.FileID).Take(&file).Error; e != nil {
			return e
		}
		key = file.StorageKey
		if e := softDeleteStoredFileRecord(tx, file.ID); e != nil {
			return e
		}
		return tx.Delete(&doc).Error
	})
	return key, err
}

func (r *OtsusRepository) ReplaceLPJ(ctx context.Context, id int64, year string, input model.StoredFileInput, user int64) (model.OtsusLPJ, string, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OtsusLPJ{}, "", err
	}
	var out model.OtsusLPJ
	oldKey := ""
	err = db.Transaction(func(tx *gorm.DB) error {
		if e := ensureOtsusLabel(tx, id, year, true); e != nil {
			return e
		}
		file, e := createStoredFileRecord(tx, input, id)
		if e != nil {
			return e
		}
		var current model.OtsusLPJ
		e = tx.Where("otsus_label_id=?", id).Take(&current).Error
		if e == nil {
			var old model.StoredFile
			if e = tx.Where("id=?", current.FileID).Take(&old).Error; e != nil {
				return e
			}
			oldKey = old.StorageKey
			if e = softDeleteStoredFileRecord(tx, old.ID); e != nil {
				return e
			}
			out = current
			out.FileID = file.ID
			out.UpdatedBy = user
			if e = tx.Model(&out).Updates(map[string]any{"file_id": file.ID, "updated_by": user, "updated_at": gorm.Expr("NOW()")}).Error; e != nil {
				return e
			}
		} else if errors.Is(e, gorm.ErrRecordNotFound) {
			out = model.OtsusLPJ{OtsusLabelID: id, FileID: file.ID, CreatedBy: user, UpdatedBy: user}
			if e = tx.Create(&out).Error; e != nil {
				return e
			}
		} else {
			return e
		}
		if e = tx.Model(&model.StoredFile{}).Where("id=?", file.ID).Update("related_entity_id", out.ID).Error; e != nil {
			return e
		}
		file.RelatedEntityID = out.ID
		out.File = finalizeStoredFile(file)
		return nil
	})
	return out, oldKey, err
}

func (r *OtsusRepository) DeleteLPJ(ctx context.Context, id int64, year string) (string, error) {
	db, err := r.session(ctx)
	if err != nil {
		return "", err
	}
	key := ""
	err = db.Transaction(func(tx *gorm.DB) error {
		if e := ensureOtsusLabel(tx, id, year, false); e != nil {
			return e
		}
		var lpj model.OtsusLPJ
		if e := tx.Where("otsus_label_id=?", id).Take(&lpj).Error; errors.Is(e, gorm.ErrRecordNotFound) {
			return ErrOtsusNotFound
		} else if e != nil {
			return e
		}
		var file model.StoredFile
		if e := tx.Where("id=?", lpj.FileID).Take(&file).Error; e != nil {
			return e
		}
		key = file.StorageKey
		if e := softDeleteStoredFileRecord(tx, file.ID); e != nil {
			return e
		}
		return tx.Delete(&lpj).Error
	})
	return key, err
}

func (r *OtsusRepository) AddDPAVersion(ctx context.Context, id int64, year, jenis, catatan string, input model.StoredFileInput, user int64) (model.OtsusDPAVersion, error) {
	jenis = strings.TrimSpace(jenis)
	switch jenis {
	case model.OtsusDPAAwal, model.OtsusDPAPergeseran, model.OtsusDPAPerubahan:
	default:
		return model.OtsusDPAVersion{}, fmt.Errorf("%w: jenis DPA tidak valid", ErrOtsusInvalid)
	}
	db, err := r.session(ctx)
	if err != nil {
		return model.OtsusDPAVersion{}, err
	}
	var out model.OtsusDPAVersion
	err = db.Transaction(func(tx *gorm.DB) error {
		if e := ensureOtsusLabel(tx, id, year, true); e != nil {
			return e
		}
		var max int
		if e := tx.Model(&model.OtsusDPAVersion{}).Where("otsus_label_id=?", id).Select("COALESCE(MAX(versi),0)").Scan(&max).Error; e != nil {
			return e
		}
		file, e := createStoredFileRecord(tx, input, id)
		if e != nil {
			return e
		}
		out = model.OtsusDPAVersion{OtsusLabelID: id, Jenis: jenis, Versi: max + 1, FileID: file.ID, Catatan: strings.TrimSpace(catatan), UploadedBy: user}
		if e := tx.Create(&out).Error; e != nil {
			return e
		}
		if e = tx.Model(&model.StoredFile{}).Where("id=?", file.ID).Update("related_entity_id", out.ID).Error; e != nil {
			return e
		}
		file.RelatedEntityID = out.ID
		out.File = finalizeStoredFile(file)
		return nil
	})
	return out, err
}
