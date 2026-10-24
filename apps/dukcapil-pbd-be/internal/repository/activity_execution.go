package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ActivityDocumentKinds = []string{"invitations", "attendance", "minutes", "records", "reports", "receipts"}
var ActivityChecklistKinds = []string{"assignment-letters", "spd", "invitations", "attendance", "minutes", "records", "reports", "photo", "support", "receipts"}

func validActivityKind(kind string) bool {
	for _, v := range ActivityDocumentKinds {
		if v == kind {
			return true
		}
	}
	return false
}

type ActivityRepository struct {
	db     *gorm.DB
	office model.TravelOffice
}

func NewActivityRepository(db *gorm.DB, office model.TravelOffice) *ActivityRepository {
	return &ActivityRepository{db: db, office: office}
}
func (r *ActivityRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}
func ValidateActivity(p *model.ActivityExecutionPayload) error {
	p.Title = strings.TrimSpace(p.Title)
	p.Location = strings.TrimSpace(p.Location)
	p.ActivityType = strings.TrimSpace(p.ActivityType)
	if p.Title == "" || p.Location == "" || p.ActivityType == "" || p.SubkegiatanID <= 0 || p.PPTKEmployeeID <= 0 || p.ResponsibleEmployeeID <= 0 || p.FiscalYear < 1900 || p.FiscalYear > 9999 {
		return travelInvalid("nama, subkegiatan, lokasi, jenis, tahun anggaran, PPTK, dan penanggung jawab wajib diisi")
	}
	if !validTravelDate(string(p.StartDate)) || !validTravelDate(string(p.EndDate)) || p.EndDate < p.StartDate {
		return travelInvalid("tanggal kegiatan tidak valid atau tanggal selesai sebelum mulai")
	}
	switch p.Status {
	case "Draft", "Berjalan", "Selesai", "Dibatalkan":
	case "":
		p.Status = "Draft"
	default:
		return travelInvalid("status kegiatan tidak valid")
	}
	if p.RecommendedDocuments == nil {
		p.RecommendedDocuments = []string{}
	}
	seen := map[string]bool{}
	for _, kind := range p.RecommendedDocuments {
		valid := false
		for _, v := range ActivityChecklistKinds {
			if kind == v {
				valid = true
			}
		}
		if !valid || seen[kind] {
			return travelInvalid("pilihan rekomendasi dokumen tidak valid")
		}
		seen[kind] = true
	}
	return nil
}
func activityRecord(db *gorm.DB, id int64, lock bool) (model.ActivityExecution, error) {
	var a model.ActivityExecution
	q := db
	if lock {
		q = q.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	e := q.Where("id=?", id).Take(&a).Error
	return a, travelError(e)
}
func (r *ActivityRepository) hydrate(db *gorm.DB, a *model.ActivityExecution, checklist bool) error {
	var sub model.SubkegiatanEntity
	if e := db.Where("id=?", a.SubkegiatanID).Take(&sub).Error; e != nil {
		return e
	}
	a.Program = sub.Program
	a.Kegiatan = sub.Kegiatan
	a.Subkegiatan = sub.Subkegiatan
	a.Office = r.office
	var e error
	a.PPTK, e = travelPerson(db, a.PPTKEmployeeID, false)
	if e != nil {
		return e
	}
	a.Responsible, e = travelPerson(db, a.ResponsibleEmployeeID, false)
	if e != nil {
		return e
	}
	if a.KabKotaID != nil {
		var k model.KabKotaEntity
		if e := db.Where("id=?", *a.KabKotaID).Take(&k).Error; e != nil {
			return e
		}
		a.KabKotaName = k.Nama
	}
	a.Checklist = []model.ActivityChecklist{}
	if !checklist {
		return nil
	}
	var counts []struct {
		Kind   string
		Status string
		Count  int64
	}
	q := `SELECT kind,status,COUNT(*) AS count FROM dokumen_kegiatan WHERE activity_execution_id=@id GROUP BY kind,status
 UNION ALL SELECT 'assignment-letters',status,COUNT(*) FROM surat_tugas WHERE activity_execution_id=@id GROUP BY status
 UNION ALL SELECT 'spd',status,COUNT(*) FROM spd WHERE activity_execution_id=@id GROUP BY status
 UNION ALL SELECT kind,'Final',COUNT(*) FROM lampiran_kegiatan WHERE activity_execution_id=@id AND deleted_at IS NULL GROUP BY kind`
	if e := db.Raw(q, map[string]any{"id": a.ID}).Scan(&counts).Error; e != nil {
		return e
	}
	for _, kind := range ActivityChecklistKinds {
		c := model.ActivityChecklist{Kind: kind}
		for _, v := range a.RecommendedDocuments {
			if kind == v {
				c.Recommended = true
			}
		}
		for _, v := range counts {
			if v.Kind == kind {
				if v.Status == "Final" {
					c.FinalCount += v.Count
				}
				if v.Status == "Draft" {
					c.DraftCount += v.Count
				}
			}
		}
		a.Checklist = append(a.Checklist, c)
	}
	return nil
}
func (r *ActivityRepository) execution(db *gorm.DB, id int64, checklist bool) (model.ActivityExecution, error) {
	a, e := activityRecord(db, id, false)
	if e != nil {
		return a, e
	}
	e = r.hydrate(db, &a, checklist)
	return a, e
}
func (r *ActivityRepository) Execution(ctx context.Context, id int64) (model.ActivityExecution, error) {
	db, e := r.session(ctx)
	if e != nil {
		return model.ActivityExecution{}, e
	}
	return r.execution(db, id, true)
}
func (r *ActivityRepository) List(ctx context.Context, p model.ActivityListParams) ([]model.ActivityExecution, error) {
	db, e := r.session(ctx)
	if e != nil {
		return nil, e
	}
	q := db.Model(&model.ActivityExecution{})
	if p.Year > 0 {
		q = q.Where("fiscal_year=?", p.Year)
	}
	if p.Status != "" {
		q = q.Where("status=?", p.Status)
	}
	if p.SubkegiatanID > 0 {
		q = q.Where("subkegiatan_id=?", p.SubkegiatanID)
	}
	if p.ActivityType != "" {
		q = q.Where("activity_type=?", p.ActivityType)
	}
	if p.KabKotaID > 0 {
		q = q.Where("kab_kota_id=?", p.KabKotaID)
	}
	if p.Search != "" {
		like := "%" + p.Search + "%"
		q = q.Where(`title ILIKE @search OR location ILIKE @search OR description ILIKE @search OR EXISTS(SELECT 1 FROM dokumen_kegiatan d WHERE d.activity_execution_id=pelaksanaan_kegiatan.id AND (d.document_number ILIKE @search OR d.content::text ILIKE @search OR d.snapshot::text ILIKE @search)) OR EXISTS(SELECT 1 FROM surat_tugas t WHERE t.activity_execution_id=pelaksanaan_kegiatan.id AND (t.number ILIKE @search OR t.snapshot::text ILIKE @search)) OR EXISTS(SELECT 1 FROM spd o WHERE o.activity_execution_id=pelaksanaan_kegiatan.id AND (o.number ILIKE @search OR o.snapshot::text ILIKE @search)) OR EXISTS(SELECT 1 FROM arsip_pegawai p WHERE (p.id=pelaksanaan_kegiatan.pptk_employee_id OR p.id=pelaksanaan_kegiatan.responsible_employee_id OR p.id IN(SELECT m.employee_id FROM surat_tugas_pelaksana m JOIN surat_tugas t ON t.id=m.assignment_letter_id WHERE t.activity_execution_id=pelaksanaan_kegiatan.id) OR p.id IN(SELECT x.employee_id FROM peserta_dokumen_kegiatan x JOIN dokumen_kegiatan d ON d.id=x.document_id WHERE d.activity_execution_id=pelaksanaan_kegiatan.id)) AND (p.nama ILIKE @search OR p.nip ILIKE @search))`, map[string]any{"search": like})
	}
	items := make([]model.ActivityExecution, 0)
	if e := q.Order("start_date DESC,id DESC").Find(&items).Error; e != nil {
		return nil, e
	}
	for i := range items {
		if e := r.hydrate(db, &items[i], true); e != nil {
			return nil, e
		}
	}
	return items, nil
}
func (r *ActivityRepository) Save(ctx context.Context, id int64, p model.ActivityExecutionPayload, user int64) (model.ActivityExecution, error) {
	if e := ValidateActivity(&p); e != nil {
		return model.ActivityExecution{}, e
	}
	db, e := r.session(ctx)
	if e != nil {
		return model.ActivityExecution{}, e
	}
	var a model.ActivityExecution
	e = db.Transaction(func(tx *gorm.DB) error {
		if id != 0 {
			var e error
			a, e = activityRecord(tx, id, true)
			if e != nil {
				return e
			}
		}
		var sub model.SubkegiatanEntity
		if e := tx.Clauses(clause.Locking{Strength: "SHARE"}).Where("id=?", p.SubkegiatanID).Take(&sub).Error; e != nil {
			return travelInvalid("subkegiatan tidak ditemukan")
		}
		for _, person := range []int64{p.PPTKEmployeeID, p.ResponsibleEmployeeID} {
			v, e := travelPerson(tx, person, true)
			if e != nil {
				return e
			}
			if v.Status != "Aktif" && a.PPTKEmployeeID != person && a.ResponsibleEmployeeID != person {
				return travelInvalid("PPTK atau penanggung jawab nonaktif tidak dapat dipilih")
			}
		}
		if p.KabKotaID != nil {
			var n int64
			if e := tx.Table("kab_kota").Where("id=?", *p.KabKotaID).Count(&n).Error; e != nil {
				return e
			}
			if n == 0 {
				return travelInvalid("kabupaten/kota tidak ditemukan")
			}
		}
		if id == 0 {
			a.CreatedBy = user
		}
		a.ActivityExecutionPayload = p
		a.UpdatedBy = user
		if e := tx.Save(&a).Error; e != nil {
			return e
		}
		id = a.ID
		return nil
	})
	if e != nil {
		return a, travelError(e)
	}
	return r.Execution(ctx, id)
}
func (r *ActivityRepository) Delete(ctx context.Context, id int64) error {
	db, e := r.session(ctx)
	if e != nil {
		return e
	}
	return travelError(db.Transaction(func(tx *gorm.DB) error {
		a, e := activityRecord(tx, id, true)
		if e != nil {
			return e
		}
		if a.Status != "Draft" {
			return travelConflict("hanya kegiatan Draft tanpa dokumen yang dapat dihapus")
		}
		return tx.Delete(&a).Error
	}))
}
func (r *ActivityRepository) Detail(ctx context.Context, id int64) (model.ActivityExecutionDetail, error) {
	a, e := r.Execution(ctx, id)
	if e != nil {
		return model.ActivityExecutionDetail{}, e
	}
	docs, e := r.Documents(ctx, model.ActivityListParams{ActivityExecutionID: id})
	if e != nil {
		return model.ActivityExecutionDetail{}, e
	}
	travel := NewTravelRepository(r.db, r.office)
	as, e := travel.ListAssignments(ctx, model.TravelListParams{ActivityExecutionID: id})
	if e != nil {
		return model.ActivityExecutionDetail{}, e
	}
	orders, e := travel.ListOrders(ctx, model.TravelListParams{ActivityExecutionID: id})
	if e != nil {
		return model.ActivityExecutionDetail{}, e
	}
	files, e := r.Attachments(ctx, id, "")
	return model.ActivityExecutionDetail{Execution: a, Documents: docs, Assignments: as, Orders: orders, Attachments: files}, e
}

func ValidateActivityDocument(p *model.ActivityDocumentPayload) error {
	p.DocumentNumber = strings.TrimSpace(p.DocumentNumber)
	if !validActivityKind(p.Kind) || p.ActivityExecutionID <= 0 || !validTravelDate(string(p.DocumentDate)) {
		return travelInvalid("jenis, kegiatan, dan tanggal dokumen wajib valid")
	}
	c := &p.Content
	if c.EventDate != "" && !validTravelDate(c.EventDate) {
		return travelInvalid("tanggal pelaksanaan dokumen tidak valid")
	}
	if len(p.Participants) > 1000 || len(c.Recipients) > 500 || len(c.Signers) > 100 || len(c.FollowUps) > 500 || len(c.Sections) > 100 || len(c.Goods) > 1000 {
		return travelInvalid("jumlah peserta atau bagian dokumen terlalu banyak")
	}
	for i := range p.Participants {
		v := &p.Participants[i]
		v.ID = 0
		v.DocumentID = 0
		v.SortOrder = i
		if v.EmployeeID == nil && strings.TrimSpace(v.Name) == "" {
			return travelInvalid("nama peserta eksternal wajib diisi")
		}
		if v.EmployeeID != nil && *v.EmployeeID <= 0 {
			return travelInvalid("pegawai peserta tidak valid")
		}
		if v.Quantity < 0 {
			return travelInvalid("jumlah bantuan tidak boleh negatif")
		}
		if v.SignatureFileID != nil {
			return travelInvalid("kolom tanda tangan disediakan untuk tanda tangan manual pada hasil cetak")
		}
		switch v.AttendanceStatus {
		case "":
			v.AttendanceStatus = "Hadir"
		case "Hadir", "Tidak Hadir", "Izin":
		default:
			return travelInvalid("status kehadiran tidak valid")
		}
	}
	for _, f := range c.FollowUps {
		if strings.TrimSpace(f.Description) == "" {
			return travelInvalid("uraian tindak lanjut wajib diisi")
		}
		if f.DueDate != "" && !validTravelDate(f.DueDate) {
			return travelInvalid("target waktu tindak lanjut tidak valid")
		}
		switch f.Status {
		case "Belum Dilaksanakan", "Proses", "Selesai":
		default:
			return travelInvalid("status tindak lanjut tidak valid")
		}
	}
	for _, g := range c.Goods {
		if strings.TrimSpace(g.Name) == "" || g.Quantity < 0 {
			return travelInvalid("data barang/bantuan tidak valid")
		}
	}
	return nil
}
func (r *ActivityRepository) party(db *gorm.DB, p model.ActivityParty) (model.ActivityParty, error) {
	if p.EmployeeID == nil {
		if strings.TrimSpace(p.Name) == "" {
			return p, travelInvalid("nama pihak eksternal wajib diisi")
		}
		return p, nil
	}
	v, e := travelPerson(db, *p.EmployeeID, false)
	if e != nil {
		return p, e
	}
	return model.ActivityParty{EmployeeID: p.EmployeeID, Name: v.Name, NIP: v.NIP, Rank: v.Rank, Position: v.Position, Institution: r.office.AgencyName, Role: p.Role}, nil
}
func (r *ActivityRepository) content(db *gorm.DB, c model.ActivityDocumentContent) (model.ActivityDocumentContent, error) {
	var e error
	if c.Copies == nil {
		c.Copies = []string{}
	}
	if c.Bases == nil {
		c.Bases = []string{}
	}
	if c.Sections == nil {
		c.Sections = []model.ActivitySection{}
	}
	if c.FollowUps == nil {
		c.FollowUps = []model.ActivityFollowUp{}
	}
	if c.Goods == nil {
		c.Goods = []model.ActivityGood{}
	}
	for _, list := range []*[]model.ActivityParty{&c.Recipients, &c.Signers} {
		if *list == nil {
			*list = []model.ActivityParty{}
		}
		for i := range *list {
			(*list)[i], e = r.party(db, (*list)[i])
			if e != nil {
				return c, e
			}
		}
	}
	for i := range c.FollowUps {
		c.FollowUps[i].Responsible, e = r.party(db, c.FollowUps[i].Responsible)
		if e != nil {
			return c, e
		}
	}
	return c, nil
}
func cleanActivityContent(c model.ActivityDocumentContent) model.ActivityDocumentContent {
	for _, list := range []*[]model.ActivityParty{&c.Recipients, &c.Signers} {
		for i := range *list {
			p := &(*list)[i]
			if p.EmployeeID != nil {
				*p = model.ActivityParty{EmployeeID: p.EmployeeID, Role: p.Role}
			}
		}
	}
	for i := range c.FollowUps {
		p := &c.FollowUps[i].Responsible
		if p.EmployeeID != nil {
			*p = model.ActivityParty{EmployeeID: p.EmployeeID, Role: p.Role}
		}
	}
	return c
}
func (r *ActivityRepository) document(db *gorm.DB, id int64, lock bool) (model.ActivityDocument, error) {
	var d model.ActivityDocument
	q := db
	if lock {
		q = q.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if e := q.Where("id=?", id).Take(&d).Error; e != nil {
		return d, travelError(e)
	}
	if d.Snapshot != nil {
		d.Details = *d.Snapshot
		d.Participants = d.Snapshot.Participants
		return d, nil
	}
	a, e := r.execution(db, d.ActivityExecutionID, false)
	if e != nil {
		return d, e
	}
	c, e := r.content(db, d.Content)
	if e != nil {
		return d, e
	}
	participants := make([]model.ActivityParticipant, 0)
	if e := db.Where("document_id=?", id).Order("sort_order,id").Find(&participants).Error; e != nil {
		return d, e
	}
	for i := range participants {
		p := &participants[i]
		if p.EmployeeID != nil {
			v, e := travelPerson(db, *p.EmployeeID, false)
			if e != nil {
				return d, e
			}
			p.Name = v.Name
			p.Rank = v.Rank
			p.Identification = v.NIP
			p.Position = v.Position
			p.Institution = r.office.AgencyName
		}
	}
	d.Participants = participants
	d.Details = model.ActivityDocumentSnapshot{Execution: a, Office: r.office, Content: c, Participants: participants, RelatedDocuments: []model.ActivityDocumentLink{}, Photos: []model.ActivityAttachment{}}
	for key, id := range map[string]*int64{"chair": c.ChairEmployeeID, "notetaker": c.NotetakerEmployeeID} {
		if id != nil {
			v, e := travelPerson(db, *id, false)
			if e != nil {
				return d, e
			}
			if key == "chair" {
				d.Details.Chair = &v
			} else {
				d.Details.Notetaker = &v
			}
		}
	}
	if d.Kind == "reports" {
		var links []model.ActivityDocumentLink
		if e := db.Raw(`SELECT id,kind,document_number AS number,status FROM dokumen_kegiatan WHERE activity_execution_id=? AND id<>? AND status<>'Dibatalkan' UNION ALL SELECT id,'assignment-letters',number,status FROM surat_tugas WHERE activity_execution_id=? AND status<>'Dibatalkan' UNION ALL SELECT id,'spd',number,status FROM spd WHERE activity_execution_id=? AND status<>'Dibatalkan'`, a.ID, id, a.ID, a.ID).Scan(&links).Error; e != nil {
			return d, e
		}
		d.Details.RelatedDocuments = links
		photos, e := r.attachments(db, a.ID, "photo")
		if e != nil {
			return d, e
		}
		d.Details.Photos = photos
	}
	return d, nil
}
func (r *ActivityRepository) Document(ctx context.Context, id int64) (model.ActivityDocument, error) {
	db, e := r.session(ctx)
	if e != nil {
		return model.ActivityDocument{}, e
	}
	return r.document(db, id, false)
}
func (r *ActivityRepository) Documents(ctx context.Context, p model.ActivityListParams) ([]model.ActivityDocument, error) {
	db, e := r.session(ctx)
	if e != nil {
		return nil, e
	}
	q := db.Model(&model.ActivityDocument{})
	if p.Kind != "" {
		if !validActivityKind(p.Kind) {
			return nil, travelInvalid("jenis dokumen tidak valid")
		}
		q = q.Where("kind=?", p.Kind)
	}
	if p.ActivityExecutionID > 0 {
		q = q.Where("activity_execution_id=?", p.ActivityExecutionID)
	}
	if p.Year > 0 {
		q = q.Where("EXTRACT(YEAR FROM document_date)=?", p.Year)
	}
	if p.Status != "" {
		q = q.Where("status=?", p.Status)
	}
	if p.Search != "" {
		like := "%" + p.Search + "%"
		q = q.Where("document_number ILIKE ? OR content::text ILIKE ? OR snapshot::text ILIKE ? OR EXISTS(SELECT 1 FROM pelaksanaan_kegiatan a WHERE a.id=dokumen_kegiatan.activity_execution_id AND (a.title ILIKE ? OR a.location ILIKE ?))", like, like, like, like, like)
	}
	var ids []int64
	if e := q.Order("document_date DESC,id DESC").Pluck("id", &ids).Error; e != nil {
		return nil, e
	}
	out := make([]model.ActivityDocument, 0, len(ids))
	for _, id := range ids {
		d, e := r.document(db, id, false)
		if e != nil {
			return nil, e
		}
		out = append(out, d)
	}
	return out, nil
}
func (r *ActivityRepository) SaveDocument(ctx context.Context, id int64, p model.ActivityDocumentPayload, user int64) (model.ActivityDocument, error) {
	if e := ValidateActivityDocument(&p); e != nil {
		return model.ActivityDocument{}, e
	}
	db, e := r.session(ctx)
	if e != nil {
		return model.ActivityDocument{}, e
	}
	e = db.Transaction(func(tx *gorm.DB) error {
		a, e := activityRecord(tx, p.ActivityExecutionID, true)
		if e != nil {
			return e
		}
		if a.Status == "Dibatalkan" {
			return travelConflict("kegiatan sudah dibatalkan")
		}
		var d model.ActivityDocument
		if id != 0 {
			d, e = r.document(tx, id, true)
			if e != nil {
				return e
			}
			if d.Status != "Draft" {
				return travelConflict("hanya dokumen Draft yang dapat diedit")
			}
			if d.ActivityExecutionID != p.ActivityExecutionID || d.Kind != p.Kind {
				return travelConflict("kegiatan dan jenis dokumen tidak dapat diganti")
			}
		}
		c, e := r.content(tx, p.Content)
		if e != nil {
			return e
		}
		p.Content = cleanActivityContent(c)
		for _, person := range []*int64{c.ChairEmployeeID, c.NotetakerEmployeeID} {
			if person != nil {
				if _, e := travelPerson(tx, *person, true); e != nil {
					return e
				}
			}
		}
		if id == 0 {
			d.TravelAudit = model.TravelAudit{Status: "Draft", CreatedBy: user}
		}
		d.ActivityDocumentPayload = p
		d.UpdatedBy = user
		if e := tx.Save(&d).Error; e != nil {
			return e
		}
		id = d.ID
		if e := tx.Exec("DELETE FROM dokumen_kegiatan_pegawai WHERE document_id=?", id).Error; e != nil {
			return e
		}
		refs := map[int64]bool{}
		addRef := func(v *int64) {
			if v != nil {
				refs[*v] = true
			}
		}
		addRef(c.ChairEmployeeID)
		addRef(c.NotetakerEmployeeID)
		for _, list := range [][]model.ActivityParty{c.Recipients, c.Signers} {
			for _, party := range list {
				addRef(party.EmployeeID)
			}
		}
		for _, f := range c.FollowUps {
			addRef(f.Responsible.EmployeeID)
		}
		for employee := range refs {
			if e := tx.Exec("INSERT INTO dokumen_kegiatan_pegawai(document_id,employee_id) VALUES(?,?)", id, employee).Error; e != nil {
				return e
			}
		}
		if e := tx.Where("document_id=?", id).Delete(&model.ActivityParticipant{}).Error; e != nil {
			return e
		}
		seen := map[int64]bool{}
		for _, v := range p.Participants {
			v.DocumentID = id
			if v.EmployeeID != nil {
				if seen[*v.EmployeeID] {
					return travelInvalid("pegawai peserta tidak boleh duplikat")
				}
				seen[*v.EmployeeID] = true
				if _, e := travelPerson(tx, *v.EmployeeID, true); e != nil {
					return e
				}
				v.Name = ""
				v.Identification = ""
				v.Position = ""
				v.Institution = ""
			}
			if e := tx.Create(&v).Error; e != nil {
				return e
			}
		}
		return nil
	})
	if e != nil {
		return model.ActivityDocument{}, travelError(e)
	}
	return r.Document(ctx, id)
}
func (r *ActivityRepository) TransitionDocument(ctx context.Context, id, user int64, action, reason string) (model.ActivityDocument, error) {
	db, e := r.session(ctx)
	if e != nil {
		return model.ActivityDocument{}, e
	}
	e = db.Transaction(func(tx *gorm.DB) error {
		var parent struct{ ActivityExecutionID int64 }
		if e := tx.Model(&model.ActivityDocument{}).Where("id=?", id).Select("activity_execution_id").Take(&parent).Error; e != nil {
			return travelError(e)
		}
		a, e := activityRecord(tx, parent.ActivityExecutionID, true)
		if e != nil {
			return e
		}
		d, e := r.document(tx, id, true)
		if e != nil {
			return e
		}
		if d.Status == "Dibatalkan" {
			return travelConflict("dokumen sudah dibatalkan")
		}
		now := time.Now()
		if action == "finalize" {
			if d.Status != "Draft" || a.Status == "Dibatalkan" {
				return travelConflict("dokumen atau kegiatan tidak dapat difinalisasi")
			}
			c := d.Details.Content
			if (d.Kind == "invitations" || d.Kind == "records") && d.DocumentNumber == "" {
				return travelInvalid("nomor dokumen wajib diisi sebelum finalisasi")
			}
			if (d.Kind == "attendance" || d.Kind == "receipts") && len(d.Participants) == 0 {
				return travelInvalid("minimal satu peserta atau penerima wajib diisi")
			}
			if d.Kind == "invitations" && (len(c.Recipients) == 0 || strings.TrimSpace(c.Subject) == "" || strings.TrimSpace(c.Time) == "" || strings.TrimSpace(c.Agenda) == "") {
				return travelInvalid("penerima, hal, waktu, dan acara undangan wajib lengkap")
			}
			if d.Kind == "minutes" && (c.ChairEmployeeID == nil || c.NotetakerEmployeeID == nil) {
				return travelInvalid("pimpinan dan notulis wajib dipilih")
			}
			if len(c.Signers) == 0 {
				return travelInvalid("minimal satu penandatangan wajib diisi")
			}
			for _, p := range c.Signers {
				if p.Name == "" || p.Position == "" {
					return travelInvalid("nama dan jabatan penandatangan wajib lengkap")
				}
			}
			d.Status = "Final"
			d.FinalizedAt = &now
			d.FinalizedBy = &user
		} else if action == "cancel" {
			if strings.TrimSpace(reason) == "" {
				return travelInvalid("alasan pembatalan wajib diisi")
			}
			d.Status = "Dibatalkan"
			d.CancelledAt = &now
			d.CancelledBy = &user
			d.CancellationReason = strings.TrimSpace(reason)
		} else {
			return travelInvalid("aksi tidak dikenal")
		}
		if d.Snapshot == nil {
			snapshot := d.Details
			snapshot.RelatedDocuments = []model.ActivityDocumentLink{}
			for _, v := range d.Details.RelatedDocuments {
				if v.Status == "Final" {
					snapshot.RelatedDocuments = append(snapshot.RelatedDocuments, v)
				}
			}
			d.Snapshot = &snapshot
			for _, photo := range snapshot.Photos {
				if e := tx.Table("dokumen_kegiatan_lampiran").Create(map[string]any{"document_id": d.ID, "attachment_id": photo.ID}).Error; e != nil {
					return e
				}
			}
		}
		d.UpdatedBy = user
		return tx.Save(&d).Error
	})
	if e != nil {
		return model.ActivityDocument{}, travelError(e)
	}
	return r.Document(ctx, id)
}
func (r *ActivityRepository) DeleteDocument(ctx context.Context, id int64) error {
	db, e := r.session(ctx)
	if e != nil {
		return e
	}
	return travelError(db.Transaction(func(tx *gorm.DB) error {
		d, e := r.document(tx, id, true)
		if e != nil {
			return e
		}
		if d.Status != "Draft" {
			return travelConflict("hanya dokumen Draft yang dapat dihapus")
		}
		return tx.Delete(&d).Error
	}))
}

func (r *ActivityRepository) Template(ctx context.Context, id int64, kind string) (model.ActivityDocumentPayload, error) {
	if !validActivityKind(kind) {
		return model.ActivityDocumentPayload{}, travelInvalid("jenis dokumen tidak valid")
	}
	detail, e := r.Detail(ctx, id)
	if e != nil {
		return model.ActivityDocumentPayload{}, e
	}
	a := detail.Execution
	today := time.Now().In(time.FixedZone("WIT", 9*3600)).Format("2006-01-02")
	c := model.ActivityDocumentContent{EventDate: string(a.StartDate), Location: a.Location, Subject: a.Title, Agenda: a.Title, RecordType: "Pelaksanaan Kegiatan", Recipients: []model.ActivityParty{}, Signers: []model.ActivityParty{{EmployeeID: &a.ResponsibleEmployeeID, Role: "Penanggung Jawab"}}, Copies: []string{}, Bases: []string{}, Sections: []model.ActivitySection{}, FollowUps: []model.ActivityFollowUp{}, Goods: []model.ActivityGood{}}
	participants := []model.ActivityParticipant{}
	seen := map[int64]bool{}
	add := func(p model.ActivityParticipant) {
		if p.EmployeeID != nil {
			if seen[*p.EmployeeID] {
				return
			}
			seen[*p.EmployeeID] = true
		}
		p.ID = 0
		p.DocumentID = 0
		p.SignatureFileID = nil
		participants = append(participants, p)
	}
	for _, d := range detail.Documents {
		if d.Status == "Dibatalkan" {
			continue
		}
		if d.Kind == "attendance" {
			for _, p := range d.Participants {
				if p.AttendanceStatus == "Hadir" {
					add(p)
				}
			}
		}
	}
	for _, t := range detail.Assignments {
		if t.Status == "Dibatalkan" {
			continue
		}
		for _, id := range t.EmployeeIDs {
			person := id
			add(model.ActivityParticipant{EmployeeID: &person, AttendanceStatus: "Hadir"})
		}
	}
	if kind == "invitations" {
		c.Nature = "Biasa"
		c.Preamble = "Dengan hormat, dalam rangka pelaksanaan kegiatan tersebut, kami mengundang Saudara untuk hadir pada:"
		c.Closing = "Demikian undangan ini disampaikan. Atas perhatian dan kehadiran Saudara, disampaikan terima kasih."
	}
	if kind == "minutes" {
		c.ChairEmployeeID = &a.ResponsibleEmployeeID
		c.NotetakerEmployeeID = &a.PPTKEmployeeID
		for _, key := range []string{"Pembukaan", "Pokok Pembahasan", "Masukan / Pendapat", "Keputusan / Kesimpulan", "Tindak Lanjut", "Penutup"} {
			c.Sections = append(c.Sections, model.ActivitySection{Key: key, Title: key})
		}
	}
	if kind == "records" {
		for _, key := range []string{"Dasar", "Uraian Pelaksanaan", "Hasil", "Kesimpulan"} {
			c.Sections = append(c.Sections, model.ActivitySection{Key: key, Title: key})
		}
	}
	if kind == "reports" {
		sections := []string{"I. PENDAHULUAN", "II. DASAR PELAKSANAAN", "III. MAKSUD DAN TUJUAN", "IV. WAKTU DAN TEMPAT", "V. PESERTA / PELAKSANA", "VI. PELAKSANAAN KEGIATAN", "VII. HASIL KEGIATAN", "VIII. PERMASALAHAN / KENDALA", "IX. TINDAK LANJUT", "X. PENUTUP", "XI. DOKUMENTASI"}
		for i, title := range sections {
			body := ""
			switch i {
			case 0:
				body = a.Title + "\n" + a.Description + "\nProgram: " + a.Program + "\nKegiatan: " + a.Kegiatan + "\nSubkegiatan: " + a.Subkegiatan
			case 3:
				body = string(a.StartDate) + " s.d. " + string(a.EndDate) + "\n" + a.Location
			case 4:
				body = fmt.Sprintf("Tercatat %d peserta/pelaksana pada data kegiatan terkait.", len(participants))
			case 5, 6, 8:
				for _, d := range detail.Documents {
					if d.Status == "Dibatalkan" {
						continue
					}
					if d.Kind == "minutes" || d.Kind == "records" {
						for _, s := range d.Details.Content.Sections {
							if s.Body != "" {
								body += s.Title + ": " + s.Body + "\n"
							}
						}
					}
				}
			case 10:
				for _, f := range detail.Attachments {
					if f.Kind == "photo" {
						body += f.Caption + "\n"
					}
				}
			}
			c.Sections = append(c.Sections, model.ActivitySection{Key: fmt.Sprint(i + 1), Title: title, Body: body})
		}
	}
	if kind == "receipts" {
		participants = []model.ActivityParticipant{}
	}
	return model.ActivityDocumentPayload{ActivityExecutionID: id, Kind: kind, DocumentDate: model.TravelDate(today), Content: c, Participants: participants}, nil
}

func (r *ActivityRepository) attachments(db *gorm.DB, id int64, kind string) ([]model.ActivityAttachment, error) {
	q := db.Where("deleted_at IS NULL")
	if id > 0 {
		q = q.Where("activity_execution_id=?", id)
	}
	if kind != "" {
		q = q.Where("kind=?", kind)
	}
	items := make([]model.ActivityAttachment, 0)
	if e := q.Order("created_at DESC,id DESC").Find(&items).Error; e != nil {
		return nil, e
	}
	for i := range items {
		file, found, e := storedFileByID(db, items[i].FileID)
		if e != nil {
			return nil, e
		}
		if !found {
			return nil, ErrTravelNotFound
		}
		items[i].File = file
	}
	return items, nil
}
func (r *ActivityRepository) Attachments(ctx context.Context, id int64, kind string) ([]model.ActivityAttachment, error) {
	db, e := r.session(ctx)
	if e != nil {
		return nil, e
	}
	return r.attachments(db, id, kind)
}
func ValidateActivityAttachment(p model.ActivityAttachmentPayload) error {
	if p.Kind != "photo" && p.Kind != "support" {
		return travelInvalid("jenis lampiran tidak valid")
	}
	if strings.TrimSpace(p.Category) == "" {
		return travelInvalid("kategori wajib diisi")
	}
	if p.TakenAt != "" && !validTravelDate(p.TakenAt) {
		return travelInvalid("tanggal dokumentasi tidak valid")
	}
	return nil
}
func (r *ActivityRepository) AddAttachment(ctx context.Context, id int64, p model.ActivityAttachmentPayload, input model.StoredFileInput, user int64) (model.ActivityAttachment, error) {
	if e := ValidateActivityAttachment(p); e != nil {
		return model.ActivityAttachment{}, e
	}
	db, e := r.session(ctx)
	if e != nil {
		return model.ActivityAttachment{}, e
	}
	var item model.ActivityAttachment
	e = db.Transaction(func(tx *gorm.DB) error {
		a, e := activityRecord(tx, id, true)
		if e != nil {
			return e
		}
		if a.Status == "Dibatalkan" {
			return travelConflict("kegiatan sudah dibatalkan")
		}
		file, e := createStoredFileRecord(tx, input, id)
		if e != nil {
			return e
		}
		item = model.ActivityAttachment{ActivityExecutionID: id, FileID: file.ID, ActivityAttachmentPayload: p, CreatedBy: user, UpdatedBy: user}
		if e := tx.Create(&item).Error; e != nil {
			return e
		}
		if e := tx.Model(&model.StoredFile{}).Where("id=?", file.ID).Update("related_entity_id", item.ID).Error; e != nil {
			return e
		}
		file.RelatedEntityID = item.ID
		item.File = finalizeStoredFile(file)
		return nil
	})
	return item, travelError(e)
}
func (r *ActivityRepository) UpdateAttachment(ctx context.Context, id int64, p model.ActivityAttachmentPayload, user int64) (model.ActivityAttachment, error) {
	if e := ValidateActivityAttachment(p); e != nil {
		return model.ActivityAttachment{}, e
	}
	db, e := r.session(ctx)
	if e != nil {
		return model.ActivityAttachment{}, e
	}
	var item model.ActivityAttachment
	e = db.Transaction(func(tx *gorm.DB) error {
		var parent model.ActivityAttachment
		if e := tx.Where("id=? AND deleted_at IS NULL", id).Take(&parent).Error; e != nil {
			return e
		}
		if _, e := activityRecord(tx, parent.ActivityExecutionID, true); e != nil {
			return e
		}
		if e := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id=? AND deleted_at IS NULL", id).Take(&item).Error; e != nil {
			return e
		}
		if p.Kind != item.Kind {
			return travelConflict("jenis lampiran tidak dapat diubah")
		}
		item.ActivityAttachmentPayload = p
		item.UpdatedBy = user
		return tx.Save(&item).Error
	})
	if e != nil {
		return item, travelError(e)
	}
	item.File, _, e = storedFileByID(db, item.FileID)
	return item, e
}
func (r *ActivityRepository) DeleteAttachment(ctx context.Context, id, user int64) (string, error) {
	db, e := r.session(ctx)
	if e != nil {
		return "", e
	}
	var key string
	e = db.Transaction(func(tx *gorm.DB) error {
		var f model.ActivityAttachment
		if e := tx.Where("id=? AND deleted_at IS NULL", id).Take(&f).Error; e != nil {
			return e
		}
		if _, e := activityRecord(tx, f.ActivityExecutionID, true); e != nil {
			return e
		}
		if e := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id=? AND deleted_at IS NULL", id).Take(&f).Error; e != nil {
			return e
		}
		var n int64
		if e := tx.Table("dokumen_kegiatan_lampiran").Where("attachment_id=?", id).Count(&n).Error; e != nil {
			return e
		}
		if n > 0 {
			return travelConflict("dokumentasi digunakan oleh dokumen historis dan tidak dapat dihapus")
		}
		file, found, e := storedFileByID(tx, f.FileID)
		if e != nil {
			return e
		}
		if found {
			key = file.StorageKey
		}
		if e := softDeleteStoredFileRecord(tx, f.FileID); e != nil {
			return e
		}
		return tx.Model(&f).Updates(map[string]any{"deleted_at": time.Now(), "updated_at": time.Now(), "updated_by": user}).Error
	})
	return key, travelError(e)
}
