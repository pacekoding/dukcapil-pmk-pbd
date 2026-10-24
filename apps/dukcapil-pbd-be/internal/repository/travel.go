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
	ErrTravelInvalid  = errors.New("data perjalanan dinas tidak valid")
	ErrTravelNotFound = errors.New("dokumen perjalanan dinas tidak ditemukan")
	ErrTravelConflict = errors.New("dokumen tidak dapat diproses pada kondisi saat ini")
)

type TravelRepository struct {
	db     *gorm.DB
	office model.TravelOffice
}

func NewTravelRepository(db *gorm.DB, office model.TravelOffice) *TravelRepository {
	return &TravelRepository{db: db, office: office}
}
func travelInvalid(message string) error  { return fmt.Errorf("%w: %s", ErrTravelInvalid, message) }
func travelConflict(message string) error { return fmt.Errorf("%w: %s", ErrTravelConflict, message) }
func travelError(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrTravelNotFound
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return travelConflict("nomor dokumen atau SPD aktif untuk pelaksana tersebut sudah digunakan")
	}
	if errors.Is(err, gorm.ErrForeignKeyViolated) {
		return travelConflict("data masih digunakan atau referensi pegawai/subkegiatan tidak valid")
	}
	return err
}
func (r *TravelRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
func validTravelDate(value string) bool { _, err := time.Parse("2006-01-02", value); return err == nil }
func cleanTravelLines(lines []string) []string {
	out := make([]string, 0, len(lines))
	for _, v := range lines {
		if v = strings.TrimSpace(v); v != "" {
			out = append(out, v)
		}
	}
	return out
}
func ValidateTravelAssignment(p *model.TravelAssignmentPayload) error {
	p.Number = strings.TrimSpace(p.Number)
	p.IssuePlace = strings.TrimSpace(p.IssuePlace)
	p.Origin = strings.TrimSpace(p.Origin)
	p.Destination = strings.TrimSpace(p.Destination)
	p.Transport = strings.TrimSpace(p.Transport)
	p.TripType = strings.TrimSpace(p.TripType)
	p.Bases = cleanTravelLines(p.Bases)
	p.Instructions = cleanTravelLines(p.Instructions)
	if !validTravelDate(string(p.DocumentDate)) || !validTravelDate(string(p.DepartureDate)) || !validTravelDate(string(p.ReturnDate)) {
		return travelInvalid("tanggal surat, berangkat, dan kembali wajib valid")
	}
	if p.ReturnDate < p.DepartureDate {
		return travelInvalid("tanggal kembali tidak boleh sebelum tanggal berangkat")
	}
	if p.Origin == "" || p.Destination == "" || p.IssuePlace == "" || p.TripType == "" || p.SignerID <= 0 || len(p.EmployeeIDs) == 0 || len(p.Bases) == 0 || len(p.Instructions) == 0 {
		return travelInvalid("tempat penerbitan, dasar, pelaksana, asal, tujuan, jenis perjalanan, isi penugasan, dan penandatangan wajib diisi")
	}
	seen := map[int64]bool{}
	for _, id := range p.EmployeeIDs {
		if id <= 0 || seen[id] {
			return travelInvalid("pilihan pelaksana tidak valid atau duplikat")
		}
		seen[id] = true
	}
	if len(p.EmployeeIDs) > 100 || len(p.Bases) > 100 || len(p.Instructions) > 100 {
		return travelInvalid("maksimal 100 pelaksana atau poin per surat")
	}
	return nil
}
func ValidateTravelOrder(p *model.TravelOrderPayload) error {
	p.Number = strings.TrimSpace(p.Number)
	p.SheetNumber = strings.TrimSpace(p.SheetNumber)
	p.Code = strings.TrimSpace(p.Code)
	p.IssuePlace = strings.TrimSpace(p.IssuePlace)
	p.SKPD = strings.TrimSpace(p.SKPD)
	p.AccountCode = strings.TrimSpace(p.AccountCode)
	p.FundingSource = strings.TrimSpace(p.FundingSource)
	p.SignerRole = strings.TrimSpace(p.SignerRole)
	if p.SheetNumber == "" {
		p.SheetNumber = "1"
	}
	if p.SignerRole == "" {
		p.SignerRole = "Pejabat Pembuat Komitmen"
	}
	if p.AssignmentLetterID <= 0 || p.EmployeeID <= 0 || p.SignerID <= 0 || p.IssuePlace == "" || p.SKPD == "" || p.FiscalYear < 1900 || p.FiscalYear > 9999 || !validTravelDate(string(p.DocumentDate)) {
		return travelInvalid("surat tugas, pelaksana, tanggal SPD, tempat penerbitan, penandatangan, SKPD, dan tahun anggaran wajib valid")
	}
	if p.SubkegiatanID != nil && *p.SubkegiatanID <= 0 {
		return travelInvalid("subkegiatan tidak valid")
	}
	if p.Followers == nil {
		p.Followers = []model.TravelFollower{}
	}
	if p.Approvals == nil {
		p.Approvals = []model.TravelApproval{}
	}
	if len(p.Followers) > 100 || len(p.Approvals) > 50 {
		return travelInvalid("jumlah pengikut atau tahapan terlalu banyak")
	}
	for i := range p.Followers {
		f := &p.Followers[i]
		f.Name = strings.TrimSpace(f.Name)
		if f.Name == "" || (f.BirthDate != "" && !validTravelDate(f.BirthDate)) {
			return travelInvalid("nama atau tanggal lahir pengikut tidak valid")
		}
	}
	for _, a := range p.Approvals {
		for _, d := range []string{a.ArrivalDate, a.DepartureDate} {
			if d != "" && !validTravelDate(d) {
				return travelInvalid("tanggal pengesahan tidak valid")
			}
		}
		if a.ArrivalDate != "" && a.DepartureDate != "" && a.DepartureDate < a.ArrivalDate {
			return travelInvalid("tanggal berangkat tahapan tidak boleh sebelum tiba")
		}
	}
	if p.ReturnedDate != "" && !validTravelDate(p.ReturnedDate) {
		return travelInvalid("tanggal tiba kembali tidak valid")
	}
	return nil
}

func travelPersonQuery(db *gorm.DB) *gorm.DB {
	return db.Table("arsip_pegawai AS p").Select(`p.id,p.nama AS name,p.nip,p.pangkat_golongan AS rank,p.status,
 COALESCE(j.name,p.jabatan) AS position,COALESCE(b.name,p.bidang) AS bidang,COALESCE(s.name,p.unit) AS unit`).Joins("LEFT JOIN organisasi_jabatan j ON j.id=p.jabatan_id").Joins("LEFT JOIN organisasi_bidang b ON b.id=p.bidang_id").Joins("LEFT JOIN organisasi_seksi s ON s.id=p.seksi_id")
}
func travelPeople(db *gorm.DB) ([]model.TravelPerson, error) {
	items := make([]model.TravelPerson, 0)
	err := travelPersonQuery(db).Order("p.nama,p.id").Scan(&items).Error
	return items, err
}
func travelPerson(db *gorm.DB, id int64, lock bool) (model.TravelPerson, error) {
	var person model.TravelPerson
	if lock {
		var record model.ArsipPegawaiEntity
		if err := db.Clauses(clause.Locking{Strength: "SHARE"}).Where("id=?", id).Take(&record).Error; err != nil {
			return person, travelInvalid("pegawai atau pejabat tidak ditemukan")
		}
	}
	err := travelPersonQuery(db).Where("p.id=?", id).Take(&person).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return person, travelInvalid("pegawai atau pejabat tidak ditemukan")
	}
	return person, err
}
func (r *TravelRepository) Options(ctx context.Context) (model.TravelOptions, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.TravelOptions{}, err
	}
	people, err := travelPeople(db)
	if err != nil {
		return model.TravelOptions{}, err
	}
	sub, err := NewSubkegiatanRepository(r.db).List(ctx)
	return model.TravelOptions{Employees: people, Subkegiatan: sub, Office: r.office}, err
}
func (r *TravelRepository) hydrateAssignments(db *gorm.DB, records []model.TravelAssignment) error {
	if len(records) == 0 {
		return nil
	}
	ids := make([]int64, 0, len(records))
	for _, a := range records {
		ids = append(ids, a.ID)
	}
	var members []model.TravelAssignmentMember
	if err := db.Where("assignment_letter_id IN ?", ids).Order("sort_order,employee_id").Find(&members).Error; err != nil {
		return err
	}
	people, err := travelPeople(db)
	if err != nil {
		return err
	}
	byID := map[int64]model.TravelPerson{}
	for _, p := range people {
		byID[p.ID] = p
	}
	byAssignment := map[int64][]int64{}
	for _, m := range members {
		byAssignment[m.AssignmentLetterID] = append(byAssignment[m.AssignmentLetterID], m.EmployeeID)
	}
	for i := range records {
		a := &records[i]
		a.EmployeeIDs = byAssignment[a.ID]
		a.Employees = []model.TravelPerson{}
		a.Office = r.office
		a.Signer = byID[a.SignerID]
		if a.ActivityExecutionID != nil {
			activity, err := NewActivityRepository(r.db, r.office).execution(db, *a.ActivityExecutionID, false)
			if err != nil {
				return err
			}
			a.Activity = &activity
		}
		for _, id := range a.EmployeeIDs {
			a.Employees = append(a.Employees, byID[id])
		}
		if a.Snapshot != nil {
			a.Office = a.Snapshot.Office
			if a.Snapshot.Activity != nil {
				a.Activity = a.Snapshot.Activity
			}
			a.Signer = a.Snapshot.Signer
			a.Employees = a.Snapshot.Employees
		}
		a.DurationDays = model.TravelDuration(a.DepartureDate, a.ReturnDate)
	}
	return nil
}
func travelAssignmentFilters(db *gorm.DB, p model.TravelListParams) *gorm.DB {
	if p.ActivityExecutionID > 0 {
		db = db.Where("activity_execution_id=?", p.ActivityExecutionID)
	}
	if p.Year != 0 {
		db = db.Where("EXTRACT(YEAR FROM document_date)=?", p.Year)
	}
	if p.Status != "" {
		db = db.Where("status=?", p.Status)
	}
	if p.EmployeeID != 0 {
		db = db.Where("EXISTS(SELECT 1 FROM surat_tugas_pelaksana m WHERE m.assignment_letter_id=surat_tugas.id AND m.employee_id=?)", p.EmployeeID)
	}
	if p.Destination != "" {
		db = db.Where("destination ILIKE ?", "%"+p.Destination+"%")
	}
	if p.Search != "" {
		like := "%" + p.Search + "%"
		db = db.Where(`number ILIKE ? OR destination ILIKE ? OR instructions::text ILIKE ? OR snapshot::text ILIKE ? OR EXISTS(SELECT 1 FROM surat_tugas_pelaksana m JOIN arsip_pegawai p ON p.id=m.employee_id WHERE m.assignment_letter_id=surat_tugas.id AND (p.nama ILIKE ? OR p.nip ILIKE ?))`, like, like, like, like, like, like)
	}
	return db
}
func (r *TravelRepository) ListAssignments(ctx context.Context, p model.TravelListParams) ([]model.TravelAssignment, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}
	records := make([]model.TravelAssignment, 0)
	if err := travelAssignmentFilters(db, p).Order("document_date DESC,id DESC").Find(&records).Error; err != nil {
		return nil, err
	}
	return records, r.hydrateAssignments(db, records)
}
func (r *TravelRepository) assignment(db *gorm.DB, id int64, lock bool) (model.TravelAssignment, error) {
	var a model.TravelAssignment
	q := db
	if lock {
		q = q.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if err := q.Where("id=?", id).Take(&a).Error; err != nil {
		return a, travelError(err)
	}
	records := []model.TravelAssignment{a}
	err := r.hydrateAssignments(db, records)
	return records[0], err
}
func (r *TravelRepository) Assignment(ctx context.Context, id int64) (model.TravelAssignment, error) {
	db, e := r.session(ctx)
	if e != nil {
		return model.TravelAssignment{}, e
	}
	return r.assignment(db, id, false)
}
func (r *TravelRepository) SaveAssignment(ctx context.Context, id int64, p model.TravelAssignmentPayload, user int64) (model.TravelAssignment, error) {
	if err := ValidateTravelAssignment(&p); err != nil {
		return model.TravelAssignment{}, err
	}
	db, err := r.session(ctx)
	if err != nil {
		return model.TravelAssignment{}, err
	}
	var record model.TravelAssignment
	err = db.Transaction(func(tx *gorm.DB) error {
		if p.ActivityExecutionID == nil && id == 0 {
			return travelInvalid("kegiatan pelaksanaan wajib dipilih")
		}
		if p.ActivityExecutionID != nil {
			activity, e := activityRecord(tx, *p.ActivityExecutionID, true)
			if e != nil {
				return e
			}
			if activity.Status == "Dibatalkan" {
				return travelConflict("kegiatan sudah dibatalkan")
			}
		}
		var err error
		if id != 0 {
			record, err = r.assignment(tx, id, true)
			if err != nil {
				return err
			}
			if record.Status != "Draft" {
				return travelConflict("hanya Surat Tugas Draft yang dapat diedit")
			}
		}
		if id != 0 && record.ActivityExecutionID != nil && !sameOrganizationID(record.ActivityExecutionID, p.ActivityExecutionID) {
			return travelConflict("kegiatan Surat Tugas tidak dapat diganti")
		}
		existing := map[int64]bool{}
		for _, employee := range record.EmployeeIDs {
			existing[employee] = true
		}
		for _, employee := range append(append([]int64{}, p.EmployeeIDs...), p.SignerID) {
			person, err := travelPerson(tx, employee, true)
			if err != nil {
				return err
			}
			if person.Status != "Aktif" && !existing[employee] && record.SignerID != employee {
				return travelInvalid("pegawai atau penandatangan nonaktif tidak dapat dipilih")
			}
		}
		if id == 0 {
			record.TravelAudit = model.TravelAudit{Status: "Draft", CreatedBy: user}
		}
		record.TravelAssignmentPayload = p
		record.UpdatedBy = user
		if err := tx.Save(&record).Error; err != nil {
			return err
		}
		id = record.ID
		if err := tx.Where("assignment_letter_id=? AND employee_id NOT IN ?", id, p.EmployeeIDs).Delete(&model.TravelAssignmentMember{}).Error; err != nil {
			return err
		}
		for i, employee := range p.EmployeeIDs {
			m := model.TravelAssignmentMember{AssignmentLetterID: id, EmployeeID: employee, SortOrder: i}
			if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "assignment_letter_id"}, {Name: "employee_id"}}, DoUpdates: clause.AssignmentColumns([]string{"sort_order"})}).Create(&m).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return record, travelError(err)
	}
	return r.Assignment(ctx, id)
}
func completeTravelPerson(p model.TravelPerson) bool {
	return p.ID > 0 && strings.TrimSpace(p.Name) != "" && strings.TrimSpace(p.NIP) != "" && strings.TrimSpace(p.Rank) != "" && strings.TrimSpace(p.Position) != ""
}
func (r *TravelRepository) TransitionAssignment(ctx context.Context, id, user int64, action, reason string) (model.TravelAssignment, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.TravelAssignment{}, err
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		a, err := r.assignment(tx, id, true)
		if err != nil {
			return err
		}
		now := time.Now()
		if action == "finalize" {
			if a.Status != "Draft" {
				return travelConflict("hanya Draft yang dapat difinalisasi")
			}
			if a.Number == "" {
				return travelInvalid("nomor Surat Tugas wajib diisi sebelum finalisasi")
			}
			for _, p := range append(a.Employees, a.Signer) {
				if _, err := travelPerson(tx, p.ID, true); err != nil {
					return err
				}
				if !completeTravelPerson(p) {
					return travelInvalid(fmt.Sprintf("lengkapi nama, NIP, pangkat/golongan, dan jabatan pegawai %s pada master Pegawai", p.Name))
				}
			}
			// Re-read after the employee locks so snapshots use the latest committed data.
			fresh, err := r.assignment(tx, id, false)
			if err != nil {
				return err
			}
			a = fresh
			a.Snapshot = &model.TravelAssignmentSnapshot{Office: a.Office, Employees: a.Employees, Signer: a.Signer, Activity: a.Activity}
			a.Status = "Final"
			a.FinalizedAt = &now
			a.FinalizedBy = &user
		} else if action == "cancel" {
			if a.Status == "Dibatalkan" {
				return travelConflict("dokumen sudah dibatalkan")
			}
			if strings.TrimSpace(reason) == "" {
				return travelInvalid("alasan pembatalan wajib diisi")
			}
			var count int64
			if err := tx.Model(&model.TravelOrder{}).Where("assignment_letter_id=? AND status <> 'Dibatalkan'", id).Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				return travelConflict("batalkan SPD terkait terlebih dahulu")
			}
			if a.Snapshot == nil {
				a.Snapshot = &model.TravelAssignmentSnapshot{Office: a.Office, Employees: a.Employees, Signer: a.Signer, Activity: a.Activity}
			}
			a.Status = "Dibatalkan"
			a.CancelledAt = &now
			a.CancelledBy = &user
			a.CancellationReason = strings.TrimSpace(reason)
		} else {
			return travelInvalid("aksi tidak dikenal")
		}
		a.UpdatedBy = user
		return tx.Save(&a).Error
	})
	if err != nil {
		return model.TravelAssignment{}, travelError(err)
	}
	return r.Assignment(ctx, id)
}
func (r *TravelRepository) DeleteAssignment(ctx context.Context, id int64) error {
	db, e := r.session(ctx)
	if e != nil {
		return e
	}
	return travelError(db.Transaction(func(tx *gorm.DB) error {
		a, e := r.assignment(tx, id, true)
		if e != nil {
			return e
		}
		if a.Status != "Draft" {
			return travelConflict("hanya Surat Tugas Draft yang dapat dihapus")
		}
		var n int64
		if e := tx.Model(&model.TravelOrder{}).Where("assignment_letter_id=?", id).Count(&n).Error; e != nil {
			return e
		}
		if n > 0 {
			return travelConflict("Surat Tugas sudah memiliki SPD dan tidak dapat dihapus")
		}
		return tx.Delete(&a).Error
	}))
}

func (r *TravelRepository) orderDetails(db *gorm.DB, o *model.TravelOrder, a model.TravelAssignment) error {
	if o.Snapshot != nil {
		o.Details = *o.Snapshot
		o.DurationDays = model.TravelDuration(o.Details.DepartureDate, o.Details.ReturnDate)
		return nil
	}
	var employee model.TravelPerson
	for _, p := range a.Employees {
		if p.ID == o.EmployeeID {
			employee = p
		}
	}
	signer, err := travelPerson(db, o.SignerID, false)
	if err != nil {
		return err
	}
	o.Details = model.TravelOrderSnapshot{Office: r.office, Activity: a.Activity, Employee: employee, Signer: signer, AssignmentNumber: a.Number, Origin: a.Origin, Destination: a.Destination, DepartureDate: a.DepartureDate, ReturnDate: a.ReturnDate, Transport: a.Transport, TripType: a.TripType, Purpose: strings.Join(a.Instructions, "\n")}
	if o.SubkegiatanID != nil {
		var sub model.SubkegiatanEntity
		if err := db.Where("id=?", *o.SubkegiatanID).Take(&sub).Error; err != nil {
			return err
		}
		o.Details.Program = sub.Program
		o.Details.Kegiatan = sub.Kegiatan
		o.Details.Subkegiatan = sub.Subkegiatan
	}
	o.DurationDays = model.TravelDuration(a.DepartureDate, a.ReturnDate)
	return nil
}
func (r *TravelRepository) order(db *gorm.DB, id int64, lock bool) (model.TravelOrder, error) {
	var o model.TravelOrder
	q := db
	if lock {
		q = q.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if e := q.Where("id=?", id).Take(&o).Error; e != nil {
		return o, travelError(e)
	}
	if o.Snapshot != nil {
		o.Details = *o.Snapshot
		o.DurationDays = model.TravelDuration(o.Details.DepartureDate, o.Details.ReturnDate)
		return o, nil
	}
	a, e := r.assignment(db, o.AssignmentLetterID, false)
	if e != nil {
		return o, e
	}
	err := r.orderDetails(db, &o, a)
	return o, err
}
func (r *TravelRepository) Order(ctx context.Context, id int64) (model.TravelOrder, error) {
	db, e := r.session(ctx)
	if e != nil {
		return model.TravelOrder{}, e
	}
	return r.order(db, id, false)
}
func (r *TravelRepository) ListOrders(ctx context.Context, p model.TravelListParams) ([]model.TravelOrder, error) {
	db, e := r.session(ctx)
	if e != nil {
		return nil, e
	}
	q := db.Model(&model.TravelOrder{})
	if p.ActivityExecutionID > 0 {
		q = q.Where("activity_execution_id=?", p.ActivityExecutionID)
	}
	if p.Year != 0 {
		q = q.Where("fiscal_year=?", p.Year)
	}
	if p.Status != "" {
		q = q.Where("status=?", p.Status)
	}
	if p.EmployeeID != 0 {
		q = q.Where("employee_id=?", p.EmployeeID)
	}
	if p.Destination != "" {
		q = q.Where("COALESCE(snapshot->>'destination',(SELECT destination FROM surat_tugas a WHERE a.id=spd.assignment_letter_id)) ILIKE ?", "%"+p.Destination+"%")
	}
	if p.Search != "" {
		like := "%" + p.Search + "%"
		q = q.Where(`number ILIKE ? OR snapshot::text ILIKE ? OR EXISTS(SELECT 1 FROM arsip_pegawai p WHERE p.id=spd.employee_id AND (p.nama ILIKE ? OR p.nip ILIKE ?)) OR EXISTS(SELECT 1 FROM surat_tugas a WHERE a.id=spd.assignment_letter_id AND (a.number ILIKE ? OR a.destination ILIKE ? OR a.instructions::text ILIKE ?))`, like, like, like, like, like, like, like)
	}
	records := make([]model.TravelOrder, 0)
	if err := q.Order("document_date DESC,id DESC").Find(&records).Error; err != nil {
		return nil, err
	}
	parents := map[int64]model.TravelAssignment{}
	for i := range records {
		if records[i].Snapshot != nil {
			records[i].Details = *records[i].Snapshot
			records[i].DurationDays = model.TravelDuration(records[i].Details.DepartureDate, records[i].Details.ReturnDate)
			continue
		}
		a, ok := parents[records[i].AssignmentLetterID]
		if !ok {
			var err error
			a, err = r.assignment(db, records[i].AssignmentLetterID, false)
			if err != nil {
				return nil, err
			}
			parents[a.ID] = a
		}
		if err := r.orderDetails(db, &records[i], a); err != nil {
			return nil, err
		}
	}
	return records, nil
}
func (r *TravelRepository) SaveOrder(ctx context.Context, id int64, p model.TravelOrderPayload, user int64) (model.TravelOrder, error) {
	if e := ValidateTravelOrder(&p); e != nil {
		return model.TravelOrder{}, e
	}
	db, e := r.session(ctx)
	if e != nil {
		return model.TravelOrder{}, e
	}
	var record model.TravelOrder
	e = db.Transaction(func(tx *gorm.DB) error {
		// Always lock the parent before the SPD, including lifecycle changes.
		a, err := r.assignment(tx, p.AssignmentLetterID, true)
		if err != nil {
			return err
		}
		if a.Status == "Dibatalkan" {
			return travelConflict("Surat Tugas sudah dibatalkan")
		}
		if a.ActivityExecutionID == nil && id == 0 {
			return travelInvalid("tautkan Surat Tugas sumber ke Kegiatan Pelaksanaan terlebih dahulu")
		}
		if p.ActivityExecutionID != nil && !sameOrganizationID(p.ActivityExecutionID, a.ActivityExecutionID) {
			return travelInvalid("kegiatan SPD tidak sesuai Surat Tugas")
		}
		p.ActivityExecutionID = a.ActivityExecutionID
		if a.Activity != nil {
			if p.SubkegiatanID != nil && *p.SubkegiatanID != a.Activity.SubkegiatanID {
				return travelInvalid("subkegiatan SPD tidak sesuai kegiatan")
			}
			sub := a.Activity.SubkegiatanID
			p.SubkegiatanID = &sub
			p.FiscalYear = a.Activity.FiscalYear
			p.FundingSource = a.Activity.FundingSource
		}
		if id != 0 {
			record, err = r.order(tx, id, true)
			if err != nil {
				return err
			}
			if record.Status != "Draft" {
				return travelConflict("hanya SPD Draft yang dapat diedit")
			}
			if record.AssignmentLetterID != p.AssignmentLetterID {
				return travelConflict("Surat Tugas sumber tidak dapat diganti; buat SPD baru")
			}
		}
		member := false
		for _, employee := range a.EmployeeIDs {
			if employee == p.EmployeeID {
				member = true
			}
		}
		if !member {
			return travelInvalid("pelaksana SPD harus termasuk dalam Surat Tugas yang dipilih")
		}
		signer, err := travelPerson(tx, p.SignerID, true)
		if err != nil {
			return err
		}
		if signer.Status != "Aktif" && record.SignerID != signer.ID {
			return travelInvalid("penandatangan nonaktif tidak dapat dipilih")
		}
		if p.SubkegiatanID != nil {
			var sub model.SubkegiatanEntity
			if err := tx.Clauses(clause.Locking{Strength: "SHARE"}).Where("id=?", *p.SubkegiatanID).Take(&sub).Error; err != nil {
				return travelInvalid("subkegiatan tidak ditemukan")
			}
		}
		if id == 0 {
			record.TravelAudit = model.TravelAudit{Status: "Draft", CreatedBy: user}
		}
		record.TravelOrderPayload = p
		record.UpdatedBy = user
		if err := tx.Save(&record).Error; err != nil {
			return err
		}
		id = record.ID
		return nil
	})
	if e != nil {
		return record, travelError(e)
	}
	return r.Order(ctx, id)
}
func (r *TravelRepository) TransitionOrder(ctx context.Context, id, user int64, action, reason string) (model.TravelOrder, error) {
	db, e := r.session(ctx)
	if e != nil {
		return model.TravelOrder{}, e
	}
	e = db.Transaction(func(tx *gorm.DB) error {
		var parent struct{ AssignmentLetterID int64 }
		if err := tx.Model(&model.TravelOrder{}).Select("assignment_letter_id").Where("id=?", id).Take(&parent).Error; err != nil {
			return travelError(err)
		}
		a, err := r.assignment(tx, parent.AssignmentLetterID, true)
		if err != nil {
			return err
		}
		o, err := r.order(tx, id, true)
		if err != nil {
			return err
		}
		now := time.Now()
		if action == "finalize" {
			if o.Status != "Draft" {
				return travelConflict("hanya Draft yang dapat difinalisasi")
			}
			if a.Status != "Final" {
				return travelConflict("finalisasi Surat Tugas sumber terlebih dahulu")
			}
			if o.Number == "" || o.ExpenseLevel == "" || o.AccountCode == "" || o.FundingSource == "" || o.SubkegiatanID == nil {
				return travelInvalid("nomor SPD, tingkat biaya, subkegiatan, kode rekening, dan sumber dana wajib lengkap sebelum finalisasi")
			}
			signer, err := travelPerson(tx, o.SignerID, true)
			if err != nil {
				return err
			}
			if !completeTravelPerson(signer) || !completeTravelPerson(o.Details.Employee) {
				return travelInvalid("lengkapi identitas pelaksana dan penandatangan pada master Pegawai")
			}
			if err := r.orderDetails(tx, &o, a); err != nil {
				return err
			}
			snapshot := o.Details
			o.Snapshot = &snapshot
			o.Status = "Final"
			o.FinalizedAt = &now
			o.FinalizedBy = &user
		} else if action == "cancel" {
			if o.Status == "Dibatalkan" {
				return travelConflict("dokumen sudah dibatalkan")
			}
			if strings.TrimSpace(reason) == "" {
				return travelInvalid("alasan pembatalan wajib diisi")
			}
			if o.Snapshot == nil {
				snapshot := o.Details
				o.Snapshot = &snapshot
			}
			o.Status = "Dibatalkan"
			o.CancelledAt = &now
			o.CancelledBy = &user
			o.CancellationReason = strings.TrimSpace(reason)
		} else {
			return travelInvalid("aksi tidak dikenal")
		}
		o.UpdatedBy = user
		return tx.Save(&o).Error
	})
	if e != nil {
		return model.TravelOrder{}, travelError(e)
	}
	return r.Order(ctx, id)
}
func (r *TravelRepository) DeleteOrder(ctx context.Context, id int64) error {
	db, e := r.session(ctx)
	if e != nil {
		return e
	}
	return travelError(db.Transaction(func(tx *gorm.DB) error {
		o, e := r.order(tx, id, true)
		if e != nil {
			return e
		}
		if o.Status != "Draft" {
			return travelConflict("hanya SPD Draft yang dapat dihapus")
		}
		return tx.Delete(&o).Error
	}))
}

// Linking is metadata-only: existing Final snapshots are never rewritten.
func (r *TravelRepository) LinkActivity(ctx context.Context, id, activityID, user int64) (model.TravelAssignment, error) {
	db, e := r.session(ctx)
	if e != nil {
		return model.TravelAssignment{}, e
	}
	e = db.Transaction(func(tx *gorm.DB) error {
		a, e := activityRecord(tx, activityID, true)
		if e != nil {
			return e
		}
		if a.Status == "Dibatalkan" {
			return travelConflict("kegiatan sudah dibatalkan")
		}
		var t model.TravelAssignment
		if e := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id=?", id).Take(&t).Error; e != nil {
			return e
		}
		if t.ActivityExecutionID != nil && *t.ActivityExecutionID != activityID {
			return travelConflict("Surat Tugas sudah terkait kegiatan lain")
		}
		if e := tx.Model(&t).Updates(map[string]any{"activity_execution_id": activityID, "updated_by": user, "updated_at": time.Now()}).Error; e != nil {
			return e
		}
		return tx.Model(&model.TravelOrder{}).Where("assignment_letter_id=?", id).Updates(map[string]any{"activity_execution_id": activityID, "updated_by": user, "updated_at": time.Now()}).Error
	})
	if e != nil {
		return model.TravelAssignment{}, travelError(e)
	}
	return r.Assignment(ctx, id)
}
