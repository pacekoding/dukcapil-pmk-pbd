package repository_test

import (
	"archive/zip"
	"bytes"
	"context"
	"dukcapil-pbd-be/internal/controller"
	"dukcapil-pbd-be/internal/database"
	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"dukcapil-pbd-be/internal/router"
	"dukcapil-pbd-be/internal/security"
	"dukcapil-pbd-be/internal/storage"
	appmigrations "dukcapil-pbd-be/migrations"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/labstack/echo"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"mime/multipart"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

func activityHTTP(t *testing.T, e *echo.Echo, token, method, path string, p any, want int, out any) {
	t.Helper()
	var body []byte
	if p != nil {
		body, _ = json.Marshal(p)
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	if rec.Code != want {
		t.Fatalf("%s %s: %d wanted %d: %s", method, path, rec.Code, want, rec.Body)
	}
	if out != nil {
		var envelope struct {
			Data json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &envelope); err != nil {
			t.Fatal(err)
		}
		if err := json.Unmarshal(envelope.Data, out); err != nil {
			t.Fatal(err)
		}
	}
}
func TestActivityExecutionIntegration(t *testing.T) {
	url := os.Getenv("ACTIVITY_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set ACTIVITY_TEST_DATABASE_URL to an empty disposable PostgreSQL database")
	}
	db, err := gorm.Open(postgres.Open(url), &gorm.Config{TranslateError: true, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := db.DB()
	defer raw.Close()
	var n int64
	db.Raw("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'").Scan(&n)
	if n != 0 {
		t.Fatal("activity integration database must be empty")
	}
	ctx := context.Background()
	if err := database.Migrate(ctx, url); err != nil {
		t.Fatal(err)
	}
	must := func(e error) {
		t.Helper()
		if e != nil {
			t.Fatal(e)
		}
	}
	exec := func(q string, args ...any) { t.Helper(); must(db.Exec(q, args...).Error) }
	exec("INSERT INTO admin_users(username,full_name,role,password_hash,is_active) VALUES('activity-test','User Uji','admin_pmk','test',true)")
	var user model.AdminUserEntity
	must(db.Where("username='activity-test'").Take(&user).Error)
	people := []model.ArsipPegawaiEntity{{NIP: "199001012020011001", Nama: "Pegawai Pelaksana Uji", Jabatan: "Analis Kebijakan", PangkatGolongan: "Penata / III.c", Status: "Aktif"}, {NIP: "197503032000011003", Nama: "Pejabat Penandatangan Uji", Jabatan: "Kepala Dinas", PangkatGolongan: "Pembina Utama Muda / IV.c", Status: "Aktif"}}
	for i := range people {
		must(db.Create(&people[i]).Error)
	}
	sub := model.SubkegiatanEntity{Bidang: "Sekretariat", Program: "Program Administrasi Uji", Kegiatan: "Kegiatan Pemberdayaan Uji", Subkegiatan: "Subkegiatan Monitoring Uji", Kinerja: "Kinerja", Indikator: "Indikator", Satuan: "Dokumen", DefinisiOperasional: "Uji"}
	must(db.Create(&sub).Error)
	office := model.DefaultTravelOffice()
	repo := repository.NewActivityRepository(db, office)
	travel := repository.NewTravelRepository(db, office)
	local, err := storage.NewLocal(t.TempDir())
	must(err)
	files, err := fileasset.New(local, 2<<20)
	must(err)
	tokens := security.NewManager("activity-test-key", time.Hour)
	e := router.New(router.Config{Activities: controller.NewActivityController(repo, travel, files), Travel: controller.NewTravelController(travel), StoredFiles: controller.NewStoredFileController(repository.NewStoredFileRepository(db), local), AuthMiddleware: authmiddleware.NewAuthMiddleware(tokens)})
	token, err := tokens.Issue(model.User{ID: user.ID, Role: model.RoleAdminPMK}, "2026")
	must(err)
	p := model.ActivityExecutionPayload{SubkegiatanID: sub.ID, Title: "Monitoring dan Evaluasi Pemberdayaan Kampung", Description: "Monitoring lapangan dan koordinasi tindak lanjut.", StartDate: "2026-10-26", EndDate: "2026-10-28", Location: "Kabupaten Sorong", FiscalYear: 2026, FundingSource: "APBD", PPTKEmployeeID: people[0].ID, ResponsibleEmployeeID: people[1].ID, ActivityType: "Monitoring dan Evaluasi", Status: "Draft", RecommendedDocuments: []string{"assignment-letters", "spd", "records", "reports", "photo"}}
	var a model.ActivityExecution
	activityHTTP(t, e, token, "POST", "/api/v1/activity-executions", p, 201, &a)
	t.Run("all roles CRUD and anonymous denied", func(t *testing.T) {
		for _, role := range []model.Role{model.RoleSuperAdmin, model.RoleAdminDukcapil, model.RoleAdminPMK, model.RoleAdminSekretariat} {
			tok, err := tokens.Issue(model.User{ID: user.ID, Role: role}, "2026")
			must(err)
			activityHTTP(t, e, tok, "GET", "/api/v1/activity-executions?year=all", nil, 200, nil)
			var other model.ActivityExecution
			activityHTTP(t, e, tok, "POST", "/api/v1/activity-executions", p, 201, &other)
			activityHTTP(t, e, tok, "PUT", fmt.Sprintf("/api/v1/activity-executions/%d", other.ID), p, 200, nil)
			draft, err := repo.Template(ctx, other.ID, "attendance")
			must(err)
			var d model.ActivityDocument
			activityHTTP(t, e, tok, "POST", "/api/v1/activity-documents", draft, 201, &d)
			activityHTTP(t, e, tok, "PUT", fmt.Sprintf("/api/v1/activity-documents/%d", d.ID), draft, 200, nil)
			activityHTTP(t, e, tok, "GET", fmt.Sprintf("/api/v1/activity-documents/%d", d.ID), nil, 200, nil)
			activityHTTP(t, e, tok, "DELETE", fmt.Sprintf("/api/v1/activity-documents/%d", d.ID), nil, 204, nil)
			activityHTTP(t, e, tok, "DELETE", fmt.Sprintf("/api/v1/activity-executions/%d", other.ID), nil, 204, nil)
		}
		for _, path := range []string{"/api/v1/activity-executions", "/api/v1/activity-documents", "/api/v1/activity-attachments", "/api/v1/activity-files/1/download"} {
			activityHTTP(t, e, "", "GET", path, nil, 401, nil)
		}
	})
	st, err := travel.SaveAssignment(ctx, 0, model.TravelAssignmentPayload{ActivityExecutionID: &a.ID, Number: "800/UJI-ST/2026", DocumentDate: "2026-10-24", IssuePlace: "Sorong", Bases: []string{"Dokumen Pelaksanaan Anggaran"}, Instructions: []string{a.Title}, EmployeeIDs: []int64{people[0].ID}, Origin: "Kota Sorong", Destination: a.Location, DepartureDate: a.StartDate, ReturnDate: a.EndDate, TripType: "Dalam Daerah", Transport: "Kendaraan Dinas", SignerID: people[1].ID}, user.ID)
	must(err)
	st, err = travel.TransitionAssignment(ctx, st.ID, user.ID, "finalize", "")
	must(err)
	op := model.TravelOrderPayload{AssignmentLetterID: st.ID, EmployeeID: people[0].ID, Number: "800/UJI-SPD/2026", DocumentDate: "2026-10-24", IssuePlace: "Sorong", SignerID: people[1].ID, SignerRole: "Pengguna Anggaran", ExpenseLevel: "Sesuai standar biaya", AccountCode: "5.1.02.04.01.0001", SKPD: office.AgencyName, FiscalYear: 2026, Followers: []model.TravelFollower{}, Approvals: []model.TravelApproval{}}
	spd, err := travel.SaveOrder(ctx, 0, op, user.ID)
	must(err)
	if spd.ActivityExecutionID == nil || *spd.SubkegiatanID != sub.ID || spd.FundingSource != "APBD" {
		t.Fatal("SPD must derive activity and budget")
	}
	spd, err = travel.TransitionOrder(ctx, spd.ID, user.ID, "finalize", "")
	must(err)
	upload := func(kind, name string, data []byte, want int) model.ActivityAttachment {
		t.Helper()
		var b bytes.Buffer
		w := multipart.NewWriter(&b)
		w.WriteField("kind", kind)
		w.WriteField("category", "Dokumentasi / Materi")
		w.WriteField("caption", "Pembukaan kegiatan monitoring lapangan")
		w.WriteField("takenAt", "2026-10-26")
		f, _ := w.CreateFormFile("file", name)
		f.Write(data)
		w.Close()
		req := httptest.NewRequest("POST", fmt.Sprintf("/api/v1/activity-executions/%d/attachments", a.ID), &b)
		req.Header.Set("Content-Type", w.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != want {
			t.Fatalf("upload %s: %d %s", name, rec.Code, rec.Body)
		}
		var envelope struct {
			Data model.ActivityAttachment `json:"data"`
		}
		json.Unmarshal(rec.Body.Bytes(), &envelope)
		return envelope.Data
	}
	png, _ := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=")
	photo := upload("photo", "dokumentasi.png", png, 201)
	support := upload("support", "materi.pdf", []byte("%PDF-1.4\nDokumen uji"), 201)
	pkg := func(part, main string) []byte {
		var b bytes.Buffer
		z := zip.NewWriter(&b)
		for name, body := range map[string]string{"[Content_Types].xml": fmt.Sprintf(`<Types><Override PartName="/%s" ContentType="%s"/></Types>`, part, main), "_rels/.rels": "<Relationships/>", part: "<document/>"} {
			w, _ := z.Create(name)
			w.Write([]byte(body))
		}
		z.Close()
		return b.Bytes()
	}
	upload("support", "materi.docx", pkg("word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"), 201)
	upload("support", "penerima.xlsx", pkg("xl/workbook.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"), 201)
	upload("photo", "ditolak.docx", pkg("word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"), 400)
	t.Run("private downloads all roles and file deletion", func(t *testing.T) {
		for _, role := range []model.Role{model.RoleSuperAdmin, model.RoleAdminDukcapil, model.RoleAdminPMK, model.RoleAdminSekretariat} {
			tok, err := tokens.Issue(model.User{ID: user.ID, Role: role}, "2025")
			must(err)
			for _, method := range []string{"GET", "HEAD"} {
				req := httptest.NewRequest(method, fmt.Sprintf("/api/v1/activity-files/%d/download", photo.FileID), nil)
				req.Header.Set("Authorization", "Bearer "+tok)
				req.Header.Set("Range", "bytes=0-7")
				rec := httptest.NewRecorder()
				e.ServeHTTP(rec, req)
				if rec.Code != 206 {
					t.Fatalf("download role %s: %d %s", role, rec.Code, rec.Body)
				}
			}
		}
		activityHTTP(t, e, "", "GET", "/uploads/private/activity-execution/test.png", nil, 404, nil)
		activityHTTP(t, e, token, "DELETE", fmt.Sprintf("/api/v1/activity-attachments/%d", support.ID), nil, 204, nil)
		activityHTTP(t, e, token, "GET", fmt.Sprintf("/api/v1/activity-files/%d/download", support.FileID), nil, 404, nil)
	})
	fixtures := map[string]any{"assignment": st, "order": spd}
	finals := []model.ActivityDocument{}
	for _, kind := range repository.ActivityDocumentKinds {
		t.Run(kind+" CRUD final snapshot", func(t *testing.T) {
			payload, err := repo.Template(ctx, a.ID, kind)
			must(err)
			payload.DocumentNumber = "UJI-" + kind + "/2026"
			payload.Content.Time = "09.00 WIT s.d. selesai"
			payload.Content.Recipients = []model.ActivityParty{{EmployeeID: &people[0].ID}, {Name: "Kepala Kampung Uji", Position: "Kepala Kampung", Institution: "Pemerintah Kampung", Address: "Sorong"}}
			payload.Content.Signers = append(payload.Content.Signers, model.ActivityParty{Name: "Pihak Penerima Uji", Position: "Kepala Kampung", Role: "Pihak Kedua"})
			for j := range payload.Content.Sections {
				payload.Content.Sections[j].Body += "\nPelaksanaan berjalan sesuai agenda. Hasil koordinasi menjadi bahan tindak lanjut bersama."
			}
			payload.Participants = []model.ActivityParticipant{{EmployeeID: &people[0].ID, Name: "TIDAK BOLEH DISIMPAN", AttendanceStatus: "Hadir"}, {Name: "Peserta Kampung Uji", Position: "Perwakilan Kampung", Institution: "Kampung Uji", Phone: "081234567890", Address: "Jl. Kampung Uji", Village: "Kampung Uji", KabKota: "Kabupaten Sorong", AssistanceType: "Peralatan", Quantity: 2, Unit: "Unit", AttendanceStatus: "Hadir", Notes: "Peserta eksternal"}}
			if kind == "minutes" {
				payload.Content.FollowUps = []model.ActivityFollowUp{{Description: "Melengkapi data monitoring", Responsible: model.ActivityParty{EmployeeID: &people[0].ID}, DueDate: "2026-11-01", Status: "Proses"}}
			}
			if kind == "records" {
				payload.Content.RecordType = "Serah Terima"
				payload.Content.Goods = []model.ActivityGood{{Name: "Peralatan kegiatan", Quantity: 2, Unit: "Unit", Condition: "Baik"}}
			}
			var d model.ActivityDocument
			activityHTTP(t, e, token, "POST", "/api/v1/activity-documents", payload, 201, &d)
			activityHTTP(t, e, token, "PUT", fmt.Sprintf("/api/v1/activity-documents/%d", d.ID), payload, 200, &d)
			if d.Participants[0].Name != people[0].Nama {
				t.Fatal("participant not resolved")
			}
			var persisted model.ActivityParticipant
			must(db.Where("document_id=? AND employee_id IS NOT NULL", d.ID).Take(&persisted).Error)
			if persisted.Name != "" {
				t.Fatal("duplicated master participant")
			}
			activityHTTP(t, e, token, "POST", fmt.Sprintf("/api/v1/activity-documents/%d/finalize", d.ID), map[string]string{}, 200, &d)
			if d.Snapshot == nil || d.FinalizedBy == nil || d.Snapshot.Content.Signers[0].Name != people[1].Nama {
				t.Fatal("missing snapshot")
			}
			activityHTTP(t, e, token, "PUT", fmt.Sprintf("/api/v1/activity-documents/%d", d.ID), payload, 409, nil)
			activityHTTP(t, e, token, "DELETE", fmt.Sprintf("/api/v1/activity-documents/%d", d.ID), nil, 409, nil)
			fixtures[kind] = d
			finals = append(finals, d)
		})
	}
	t.Run("autofill protected photos cancellation search", func(t *testing.T) {
		template, err := repo.Template(ctx, a.ID, "reports")
		must(err)
		if len(template.Content.Sections) != 11 || !strings.Contains(template.Content.Sections[0].Body, sub.Program) || !strings.Contains(template.Content.Sections[10].Body, photo.Caption) || len(template.Participants) < 2 {
			t.Fatal("report autofill incomplete")
		}
		activityHTTP(t, e, token, "DELETE", fmt.Sprintf("/api/v1/activity-attachments/%d", photo.ID), nil, 409, nil)
		photo.Caption = "Caption berubah"
		activityHTTP(t, e, token, "PUT", fmt.Sprintf("/api/v1/activity-attachments/%d", photo.ID), photo.ActivityAttachmentPayload, 200, nil)
		if finals[4].Snapshot.Photos[0].Caption == photo.Caption {
			t.Fatal("snapshot caption changed")
		}
		activityHTTP(t, e, token, "DELETE", fmt.Sprintf("/api/v1/activity-executions/%d", a.ID), nil, 409, nil)
		for _, term := range []string{"UJI-records/2026", "Pegawai Pelaksana", "Monitoring", "Kabupaten Sorong"} {
			found, err := repo.List(ctx, model.ActivityListParams{Year: 2026, Search: term, SubkegiatanID: sub.ID, ActivityType: p.ActivityType})
			must(err)
			if len(found) != 1 {
				t.Fatalf("search %s: %d", term, len(found))
			}
		}
		id := finals[0].ID
		activityHTTP(t, e, token, "POST", fmt.Sprintf("/api/v1/activity-documents/%d/cancel", id), map[string]string{"reason": ""}, 400, nil)
		activityHTTP(t, e, token, "POST", fmt.Sprintf("/api/v1/activity-documents/%d/cancel", id), map[string]string{"reason": "Jadwal berubah"}, 200, nil)
		fresh, err := repo.Execution(ctx, a.ID)
		must(err)
		if len(fresh.Checklist) != 10 {
			t.Fatal("missing checklist")
		}
		for _, c := range fresh.Checklist {
			if c.Kind == "invitations" && c.FinalCount != 0 {
				t.Fatal("cancelled counted final")
			}
		}
	})
	if path := os.Getenv("ACTIVITY_FIXTURE_OUTPUT"); path != "" {
		b, err := json.MarshalIndent(fixtures, "", "  ")
		must(err)
		must(os.WriteFile(path, b, 0600))
	}
	t.Run("snapshot survives master edits", func(t *testing.T) {
		exec("UPDATE arsip_pegawai SET nama='Nama Baru',jabatan='Jabatan Baru' WHERE id=?", people[0].ID)
		exec("UPDATE arsip_pegawai SET nama='Pejabat Baru' WHERE id=?", people[1].ID)
		exec("UPDATE subkegiatan SET program='Program Berubah' WHERE id=?", sub.ID)
		p.Title = "Nama kegiatan berubah"
		_, err := repo.Save(ctx, a.ID, p, user.ID)
		must(err)
		for _, d := range finals {
			fresh, err := repo.Document(ctx, d.ID)
			must(err)
			if fresh.Details.Execution.Title == p.Title || fresh.Participants[0].Name != "Pegawai Pelaksana Uji" || fresh.Details.Content.Signers[0].Name != "Pejabat Penandatangan Uji" {
				t.Fatal("snapshot changed")
			}
		}
	})
	t.Run("legacy link preserves final JSON", func(t *testing.T) {
		exec("UPDATE surat_tugas SET activity_execution_id=NULL,snapshot=snapshot-'activity' WHERE id=?", st.ID)
		exec("UPDATE spd SET activity_execution_id=NULL,snapshot=snapshot-'activity' WHERE id=?", spd.ID)
		var before, after string
		must(db.Raw("SELECT snapshot::text FROM surat_tugas WHERE id=?", st.ID).Scan(&before).Error)
		activityHTTP(t, e, token, "POST", fmt.Sprintf("/api/v1/travel/assignment-letters/%d/link-activity", st.ID), map[string]int64{"activityExecutionId": a.ID}, 200, nil)
		must(db.Raw("SELECT snapshot::text FROM surat_tugas WHERE id=?", st.ID).Scan(&after).Error)
		if before != after {
			t.Fatal("legacy snapshot changed")
		}
		order, err := travel.Order(ctx, spd.ID)
		must(err)
		if order.ActivityExecutionID == nil || *order.ActivityExecutionID != a.ID {
			t.Fatal("SPD not linked")
		}
		other, err := repo.Save(ctx, 0, p, user.ID)
		must(err)
		if _, err := travel.LinkActivity(ctx, st.ID, other.ID, user.ID); !errors.Is(err, repository.ErrTravelConflict) {
			t.Fatal("moved linked archive")
		}
		op.ActivityExecutionID = &other.ID
		op.Number = "MISMATCH"
		if _, err := travel.SaveOrder(ctx, 0, op, user.ID); !errors.Is(err, repository.ErrTravelInvalid) {
			t.Fatalf("activity mismatch: %v", err)
		}
	})
	t.Run("rollback35 preserves34 archives and masters", func(t *testing.T) {
		source, err := iofs.New(appmigrations.FS, ".")
		must(err)
		m, err := migrate.NewWithSourceInstance("iofs", source, url)
		must(err)
		defer m.Close()
		must(m.Steps(-1))
		var count int64
		must(db.Model(&model.TravelAssignment{}).Count(&count).Error)
		if count != 1 {
			t.Fatal("rollback lost travel")
		}
		must(db.Model(&model.ArsipPegawaiEntity{}).Count(&count).Error)
		if count != 2 {
			t.Fatal("rollback lost employees")
		}
		must(m.Up())
		version, dirty, err := m.Version()
		must(err)
		if version != 35 || dirty {
			t.Fatal("bad migration status")
		}
	})
}
