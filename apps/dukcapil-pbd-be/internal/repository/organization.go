package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrOrganizationInvalid   = errors.New("relasi organisasi tidak valid")
	ErrOrganizationUsed      = errors.New("data organisasi masih digunakan")
	ErrOrganizationDuplicate = errors.New("nama pada struktur organisasi tersebut sudah terdaftar")
	ErrOrganizationNotFound  = errors.New("data organisasi tidak ditemukan")
)

type OrganizationRepository struct{ db *gorm.DB }

func NewOrganizationRepository(db *gorm.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

func ValidateOrganizationPayload(kind model.OrganizationKind, p *model.OrganizationPayload) error {
	p.Name = strings.Join(strings.Fields(p.Name), " ")
	p.Code = strings.TrimSpace(p.Code)
	if kind.Table() == "" || p.Name == "" {
		return fmt.Errorf("%w: nama wajib diisi", ErrOrganizationInvalid)
	}
	if kind != model.OrganizationFields && (p.BidangID == nil || *p.BidangID <= 0) {
		return fmt.Errorf("%w: bidang wajib dipilih", ErrOrganizationInvalid)
	}
	if p.SeksiID != nil && *p.SeksiID <= 0 {
		return ErrOrganizationInvalid
	}
	if kind == model.OrganizationFields {
		p.BidangID = nil
	}
	if kind != model.OrganizationPositions {
		p.SeksiID = nil
	}
	return nil
}

func organizationQuery(db *gorm.DB, kind model.OrganizationKind) *gorm.DB {
	columns := `o.id, o.name, o.code, o.is_active, o.created_at, o.updated_at`
	switch kind {
	case model.OrganizationFields:
		columns += `, (SELECT COUNT(*) FROM organisasi_seksi s WHERE s.bidang_id = o.id) AS section_count`
	case model.OrganizationSections:
		columns += `, o.bidang_id, (SELECT name FROM organisasi_bidang b WHERE b.id = o.bidang_id) AS bidang_name`
	case model.OrganizationPositions:
		columns += `, o.bidang_id, o.seksi_id, (SELECT name FROM organisasi_bidang b WHERE b.id = o.bidang_id) AS bidang_name, COALESCE((SELECT name FROM organisasi_seksi s WHERE s.id = o.seksi_id), '') AS seksi_name`
	}
	return db.Table(kind.Table() + " AS o").Select(columns)
}

func (r *OrganizationRepository) List(ctx context.Context, kind model.OrganizationKind, p model.OrganizationListParams) ([]model.OrganizationItem, error) {
	if kind.Table() == "" {
		return nil, ErrOrganizationInvalid
	}
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	q := organizationQuery(r.db.WithContext(ctx), kind)
	if search := strings.TrimSpace(p.Search); search != "" {
		q = q.Where("o.name ILIKE ?", "%"+search+"%")
	}
	if p.Active != nil {
		q = q.Where("o.is_active = ?", *p.Active)
		// Active child choices also require an active ancestor.
		if *p.Active && kind != model.OrganizationFields {
			q = q.Where("EXISTS (SELECT 1 FROM organisasi_bidang b WHERE b.id = o.bidang_id AND b.is_active)")
			if kind == model.OrganizationPositions {
				q = q.Where("o.seksi_id IS NULL OR EXISTS (SELECT 1 FROM organisasi_seksi s WHERE s.id = o.seksi_id AND s.is_active)")
			}
		}
	}
	if kind != model.OrganizationFields && p.BidangID != nil {
		q = q.Where("o.bidang_id = ?", *p.BidangID)
	}
	if kind == model.OrganizationPositions && p.SeksiID != nil {
		if *p.SeksiID == 0 {
			q = q.Where("o.seksi_id IS NULL")
		} else {
			q = q.Where("o.seksi_id = ? OR o.seksi_id IS NULL", *p.SeksiID)
		}
	}
	items := make([]model.OrganizationItem, 0)
	err := q.Order("LOWER(o.name), o.id").Scan(&items).Error
	return items, err
}

func organizationByID(db *gorm.DB, kind model.OrganizationKind, id int64, lock bool) (model.OrganizationItem, error) {
	var item model.OrganizationItem
	q := organizationQuery(db, kind).Where("o.id = ?", id)
	if lock {
		q = q.Clauses(clause.Locking{Strength: "UPDATE", Table: clause.Table{Name: "o"}})
	}
	err := q.Take(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = ErrOrganizationNotFound
	}
	return item, err
}

func organizationParent(db *gorm.DB, kind model.OrganizationKind, id int64) (model.OrganizationItem, error) {
	var item model.OrganizationItem
	err := db.Table(kind.Table()).Clauses(clause.Locking{Strength: "SHARE"}).Where("id = ?", id).Take(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return item, ErrOrganizationInvalid
	}
	return item, err
}

func sameOrganizationID(a, b *int64) bool {
	return a == nil && b == nil || a != nil && b != nil && *a == *b
}

func organizationReferences(db *gorm.DB, kind model.OrganizationKind, id int64) (bool, error) {
	var used bool
	sql := ""
	switch kind {
	case model.OrganizationFields:
		sql = `SELECT EXISTS(SELECT 1 FROM organisasi_seksi WHERE bidang_id = @id UNION ALL SELECT 1 FROM organisasi_jabatan WHERE bidang_id = @id UNION ALL SELECT 1 FROM arsip_pegawai WHERE bidang_id = @id)`
	case model.OrganizationSections:
		sql = `SELECT EXISTS(SELECT 1 FROM organisasi_jabatan WHERE seksi_id = @id UNION ALL SELECT 1 FROM arsip_pegawai WHERE seksi_id = @id)`
	case model.OrganizationPositions:
		sql = `SELECT EXISTS(SELECT 1 FROM arsip_pegawai WHERE jabatan_id = @id)`
	}
	err := db.Raw(sql, map[string]any{"id": id}).Scan(&used).Error
	return used, err
}

func organizationWriteError(err error) error {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return ErrOrganizationDuplicate
	}
	if errors.Is(err, gorm.ErrForeignKeyViolated) {
		return ErrOrganizationUsed
	}
	return err
}

func (r *OrganizationRepository) Save(ctx context.Context, kind model.OrganizationKind, id int64, p model.OrganizationPayload) (model.OrganizationItem, error) {
	if err := ValidateOrganizationPayload(kind, &p); err != nil {
		return model.OrganizationItem{}, err
	}
	if r == nil || r.db == nil {
		return model.OrganizationItem{}, fmt.Errorf("database connection is required")
	}
	var item model.OrganizationItem
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var current model.OrganizationItem
		var err error
		if id != 0 {
			current, err = organizationByID(tx, kind, id, true)
			if err != nil {
				return err
			}
			if !sameOrganizationID(p.BidangID, current.BidangID) || !sameOrganizationID(p.SeksiID, current.SeksiID) {
				used, err := organizationReferences(tx, kind, id)
				if err != nil {
					return err
				}
				if used {
					return ErrOrganizationUsed
				}
			}
		}
		if p.BidangID != nil {
			parent, err := organizationParent(tx, model.OrganizationFields, *p.BidangID)
			if err != nil {
				return err
			}
			if !parent.IsActive && !sameOrganizationID(current.BidangID, p.BidangID) {
				return fmt.Errorf("%w: bidang nonaktif tidak dapat dipilih", ErrOrganizationInvalid)
			}
		}
		if p.SeksiID != nil {
			parent, err := organizationParent(tx, model.OrganizationSections, *p.SeksiID)
			if err != nil {
				return err
			}
			if !sameOrganizationID(parent.BidangID, p.BidangID) {
				return fmt.Errorf("%w: seksi tidak berada pada bidang yang dipilih", ErrOrganizationInvalid)
			}
			if !parent.IsActive && !sameOrganizationID(current.SeksiID, p.SeksiID) {
				return fmt.Errorf("%w: seksi nonaktif tidak dapat dipilih", ErrOrganizationInvalid)
			}
		}
		values := map[string]any{"name": p.Name, "code": p.Code, "is_active": p.IsActive, "updated_at": time.Now()}
		if kind != model.OrganizationFields {
			values["bidang_id"] = p.BidangID
		}
		if kind == model.OrganizationPositions {
			values["seksi_id"] = p.SeksiID
		}
		if id == 0 {
			// RETURNING avoids a separate sequence lookup and keeps inserts atomic.
			row := tx.Table(kind.Table()).Clauses(clause.Returning{Columns: []clause.Column{{Name: "id"}}}).Create(values)
			if row.Error != nil {
				return row.Error
			}
			switch v := values["id"].(type) {
			case int64:
				id = v
			case int:
				id = int64(v)
			}
			if id == 0 {
				return fmt.Errorf("created organization ID missing")
			}
		} else if err := tx.Table(kind.Table()).Where("id = ?", id).Updates(values).Error; err != nil {
			return err
		}
		item, err = organizationByID(tx, kind, id, false)
		return err
	})
	return item, organizationWriteError(err)
}

func (r *OrganizationRepository) Delete(ctx context.Context, kind model.OrganizationKind, id int64) error {
	if kind.Table() == "" {
		return ErrOrganizationInvalid
	}
	if r == nil || r.db == nil {
		return fmt.Errorf("database connection is required")
	}
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if _, err := organizationByID(tx, kind, id, true); err != nil {
			return err
		}
		used, err := organizationReferences(tx, kind, id)
		if err != nil {
			return err
		}
		if used {
			return ErrOrganizationUsed
		}
		return tx.Table(kind.Table()).Where("id = ?", id).Delete(&model.OrganizationItem{}).Error
	})
	return organizationWriteError(err)
}

// Resolve labels from IDs under locks. Inactive records are allowed only when
// retaining that employee's existing selection, never when assigning a new one.
func resolvePegawaiOrganization(tx *gorm.DB, p *model.ArsipPegawaiPayload, current model.ArsipPegawaiEntity) error {
	if p.BidangID == nil || *p.BidangID <= 0 || p.JabatanID == nil || *p.JabatanID <= 0 {
		return fmt.Errorf("%w: bidang dan jabatan wajib dipilih", ErrOrganizationInvalid)
	}
	bidang, err := organizationParent(tx, model.OrganizationFields, *p.BidangID)
	if err != nil {
		return err
	}
	if !bidang.IsActive && !sameOrganizationID(p.BidangID, current.BidangID) {
		return fmt.Errorf("%w: bidang nonaktif", ErrOrganizationInvalid)
	}
	p.Bidang = bidang.Name
	p.Unit = ""
	if p.SeksiID != nil {
		seksi, err := organizationParent(tx, model.OrganizationSections, *p.SeksiID)
		if err != nil {
			return err
		}
		if !sameOrganizationID(seksi.BidangID, p.BidangID) {
			return fmt.Errorf("%w: seksi tidak sesuai bidang", ErrOrganizationInvalid)
		}
		if !seksi.IsActive && !sameOrganizationID(p.SeksiID, current.SeksiID) {
			return fmt.Errorf("%w: seksi nonaktif", ErrOrganizationInvalid)
		}
		p.Unit = seksi.Name
	}
	jabatan, err := organizationParent(tx, model.OrganizationPositions, *p.JabatanID)
	if err != nil {
		return err
	}
	if !sameOrganizationID(jabatan.BidangID, p.BidangID) || jabatan.SeksiID != nil && !sameOrganizationID(jabatan.SeksiID, p.SeksiID) {
		return fmt.Errorf("%w: jabatan tidak sesuai bidang/seksi", ErrOrganizationInvalid)
	}
	if !jabatan.IsActive && !sameOrganizationID(p.JabatanID, current.JabatanID) {
		return fmt.Errorf("%w: jabatan nonaktif", ErrOrganizationInvalid)
	}
	p.Position = jabatan.Name
	return nil
}
