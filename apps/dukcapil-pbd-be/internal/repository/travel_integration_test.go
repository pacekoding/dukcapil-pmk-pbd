package repository_test

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"testing"

	"dukcapil-pbd-be/internal/database"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	appmigrations "dukcapil-pbd-be/migrations"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestTravelIntegration(t *testing.T) {
	url := os.Getenv("TRAVEL_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TRAVEL_TEST_DATABASE_URL to an empty disposable PostgreSQL database")
	}
	db, err := gorm.Open(postgres.Open(url), &gorm.Config{TranslateError: true, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	raw, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer raw.Close()
	var n int64
	if err := db.Raw("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'").Scan(&n).Error; err != nil {
		t.Fatal(err)
	}
	if n != 0 {
		t.Fatal("travel integration database must be empty")
	}
	ctx := context.Background()
	if err := database.Migrate(ctx, url); err != nil {
		t.Fatal(err)
	}
	exec := func(q string, args ...any) {
		t.Helper()
		if err := db.Exec(q, args...).Error; err != nil {
			t.Fatal(err)
		}
	}
	exec("INSERT INTO admin_users(username,full_name,role,password_hash,is_active) VALUES ('travel-test','User Uji','admin_pmk','test',true)")
	var user model.AdminUserEntity
	db.Where("username='travel-test'").Take(&user)
	var people []model.ArsipPegawaiEntity
	for i, name := range []string{"Pegawai Uji Satu", "Pegawai Uji Dua", "Pejabat Uji"} {
		p := model.ArsipPegawaiEntity{NIP: []string{"199001012020011001", "199102022021011002", "197503032000011003"}[i], Nama: name, Jabatan: []string{"Analis Kebijakan", "Pengadministrasi Perkantoran", "Kepala Dinas"}[i], PangkatGolongan: "Penata Tk. I / III.d", Status: "Aktif"}
		if err := db.Create(&p).Error; err != nil {
			t.Fatal(err)
		}
		people = append(people, p)
	}
	sub := model.SubkegiatanEntity{Bidang: "Sekretariat", Program: "Program Uji", Kegiatan: "Kegiatan Uji", Subkegiatan: "Subkegiatan Uji", Kinerja: "Kinerja", Indikator: "Indikator", Satuan: "Dokumen", DefinisiOperasional: "Uji"}
	if err := db.Create(&sub).Error; err != nil {
		t.Fatal(err)
	}
	activities := repository.NewActivityRepository(db, model.DefaultTravelOffice())
	activity, err := activities.Save(ctx, 0, model.ActivityExecutionPayload{SubkegiatanID: sub.ID, Title: "Kegiatan Perjalanan Uji", StartDate: "2026-10-26", EndDate: "2026-10-28", Location: "Kabupaten Sorong", FiscalYear: 2026, FundingSource: "APBD", PPTKEmployeeID: people[0].ID, ResponsibleEmployeeID: people[2].ID, ActivityType: "Perjalanan Dinas", Status: "Draft"}, user.ID)
	if err != nil {
		t.Fatal(err)
	}
	repo := repository.NewTravelRepository(db, model.DefaultTravelOffice())
	p := model.TravelAssignmentPayload{ActivityExecutionID: &activity.ID, Number: "800/UJI-ST/2026", DocumentDate: "2026-10-24", IssuePlace: "Sorong", Bases: []string{"Surat undangan koordinasi administrasi", "Dokumen Pelaksanaan Anggaran"}, Instructions: []string{"Melaksanakan koordinasi administrasi kependudukan dan pemberdayaan masyarakat kampung.", "Menyampaikan laporan hasil pelaksanaan tugas kepada pimpinan."}, EmployeeIDs: []int64{people[0].ID, people[1].ID}, Origin: "Kota Sorong", Destination: "Kabupaten Sorong", DepartureDate: "2026-10-26", ReturnDate: "2026-10-28", TripType: "Dalam Daerah", Transport: "Kendaraan Dinas", SignerID: people[2].ID}
	a, err := repo.SaveAssignment(ctx, 0, p, user.ID)
	if err != nil {
		t.Fatal(err)
	}
	t.Run("assignment multiple members and CRUD filters", func(t *testing.T) {
		if len(a.Employees) != 2 || a.DurationDays != 2 || a.CreatedBy != user.ID {
			t.Fatalf("assignment=%+v", a)
		}
		p.Instructions = append(p.Instructions, "Melakukan perjalanan sesuai ketentuan yang berlaku.")
		var e error
		a, e = repo.SaveAssignment(ctx, a.ID, p, user.ID)
		if e != nil {
			t.Fatal(e)
		}
		items, e := repo.ListAssignments(ctx, model.TravelListParams{Year: 2026, Status: "Draft", Search: "Pegawai Uji", EmployeeID: people[0].ID, Destination: "Sorong"})
		if e != nil || len(items) != 1 {
			t.Fatalf("filters=%d %v", len(items), e)
		}
		items, e = repo.ListAssignments(ctx, model.TravelListParams{Year: 2025})
		if e != nil || len(items) != 0 {
			t.Fatal("year filter failed")
		}
		invalid := p
		invalid.ReturnDate = "2026-10-01"
		if _, e := repo.SaveAssignment(ctx, 0, invalid, user.ID); !errors.Is(e, repository.ErrTravelInvalid) {
			t.Fatalf("date validation=%v", e)
		}
		invalid = p
		invalid.EmployeeIDs = []int64{999999}
		invalid.Number = ""
		if _, e := repo.SaveAssignment(ctx, 0, invalid, user.ID); !errors.Is(e, repository.ErrTravelInvalid) {
			t.Fatalf("invalid member=%v", e)
		}
		if _, e := repo.SaveAssignment(ctx, 0, p, user.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatalf("duplicate number=%v", e)
		}
	})
	op := model.TravelOrderPayload{AssignmentLetterID: a.ID, EmployeeID: people[0].ID, Number: "800/UJI-SPD/2026", SheetNumber: "1", Code: "UJI", DocumentDate: "2026-10-24", IssuePlace: "Sorong", SignerID: people[2].ID, SignerRole: "Pejabat Pembuat Komitmen", ExpenseLevel: "Sesuai standar biaya daerah", SKPD: model.DefaultTravelOffice().AgencyName, SubkegiatanID: &sub.ID, AccountCode: "5.1.02.04.01.0001", FundingSource: "APBD", FiscalYear: 2026, Followers: []model.TravelFollower{{Name: "Pengikut Uji", BirthDate: "2010-05-20", Description: "Pengikut sesuai penugasan"}}, Approvals: []model.TravelApproval{{ArrivalPlace: "Kabupaten Sorong", ArrivalDate: "2026-10-26", DeparturePlace: "Kabupaten Sorong", Destination: "Kota Sorong", DepartureDate: "2026-10-28", ArrivalOfficerPosition: "Kepala", DepartureOfficerPosition: "Kepala"}}, ReturnedPlace: "Kota Sorong", ReturnedDate: "2026-10-28", ReturnOfficerPosition: "Kepala Dinas"}
	o, err := repo.SaveOrder(ctx, 0, op, user.ID)
	if err != nil {
		t.Fatal(err)
	}
	t.Run("SPD derives assignment and relational budget", func(t *testing.T) {
		if o.Details.Employee.ID != people[0].ID || o.Details.Destination != a.Destination || o.Details.Purpose == "" || o.Details.Program != sub.Program || o.DurationDays != 2 || len(o.Followers) != 1 || len(o.Approvals) != 1 {
			t.Fatalf("order=%+v", o)
		}
		if e := repo.DeleteAssignment(ctx, a.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatalf("parent delete=%v", e)
		}
		bad := op
		bad.EmployeeID = people[2].ID
		bad.Number = ""
		if _, e := repo.SaveOrder(ctx, 0, bad, user.ID); !errors.Is(e, repository.ErrTravelInvalid) {
			t.Fatalf("wrong member=%v", e)
		}
		if _, e := repo.TransitionOrder(ctx, o.ID, user.ID, "finalize", ""); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatalf("draft parent finalization=%v", e)
		}
		op.Notes = "Keterangan pengujian"
		updated, e := repo.SaveOrder(ctx, o.ID, op, user.ID)
		if e != nil || updated.Notes != op.Notes {
			t.Fatalf("edit SPD=%v", e)
		}
		invalid := p
		invalid.EmployeeIDs = []int64{people[1].ID}
		if _, e := repo.SaveAssignment(ctx, a.ID, invalid, user.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatalf("remove linked member=%v", e)
		}
	})
	a, err = repo.TransitionAssignment(ctx, a.ID, user.ID, "finalize", "")
	if err != nil {
		t.Fatal(err)
	}
	o, err = repo.TransitionOrder(ctx, o.ID, user.ID, "finalize", "")
	if err != nil {
		t.Fatal(err)
	}
	if path := os.Getenv("TRAVEL_FIXTURE_OUTPUT"); path != "" {
		bytes, e := json.MarshalIndent(map[string]any{"assignment": a, "order": o}, "", "  ")
		if e != nil {
			t.Fatal(e)
		}
		if e := os.WriteFile(path, bytes, 0600); e != nil {
			t.Fatal(e)
		}
	}
	t.Run("final snapshots and immutability", func(t *testing.T) {
		if a.Snapshot == nil || o.Snapshot == nil || a.FinalizedBy == nil || o.FinalizedAt == nil {
			t.Fatal("missing final snapshots/audit")
		}
		if e := repo.DeleteAssignment(ctx, a.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatal("deleted final assignment")
		}
		if e := repo.DeleteOrder(ctx, o.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatal("deleted final SPD")
		}
		if _, e := repo.SaveAssignment(ctx, a.ID, p, user.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatal("edited final assignment")
		}
		if _, e := repo.SaveOrder(ctx, o.ID, op, user.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatal("edited final SPD")
		}
		exec("UPDATE arsip_pegawai SET nama='Nama Berubah',jabatan='Jabatan Baru',pangkat_golongan='Pembina / IV.a' WHERE id=?", people[0].ID)
		exec("UPDATE arsip_pegawai SET nama='Pejabat Baru',jabatan='Jabatan Pimpinan Baru' WHERE id=?", people[2].ID)
		exec("UPDATE subkegiatan SET program='Program Baru' WHERE id=?", sub.ID)
		fresh, e := repo.Assignment(ctx, a.ID)
		if e != nil || fresh.Employees[0].Name != "Pegawai Uji Satu" || fresh.Signer.Name != "Pejabat Uji" {
			t.Fatalf("assignment snapshot changed: %+v %v", fresh, e)
		}
		order, e := repo.Order(ctx, o.ID)
		if e != nil || order.Details.Employee.Name != "Pegawai Uji Satu" || order.Details.Signer.Name != "Pejabat Uji" || order.Details.Program != "Program Uji" {
			t.Fatalf("SPD snapshot changed: %+v %v", order, e)
		}
		items, e := repo.ListOrders(ctx, model.TravelListParams{Year: 2026, Status: "Final", Search: "Pegawai Uji Satu", Destination: "Sorong"})
		if e != nil || len(items) != 1 {
			t.Fatalf("SPD filters=%d %v", len(items), e)
		}
	})
	t.Run("cancellation requires reason and preserves history", func(t *testing.T) {
		if _, e := repo.TransitionAssignment(ctx, a.ID, user.ID, "cancel", "uji"); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatal("cancelled parent with active SPD")
		}
		if _, e := repo.TransitionOrder(ctx, o.ID, user.ID, "cancel", ""); !errors.Is(e, repository.ErrTravelInvalid) {
			t.Fatal("accepted missing cancellation reason")
		}
		cancelled, e := repo.TransitionOrder(ctx, o.ID, user.ID, "cancel", "Kegiatan ditunda")
		if e != nil || cancelled.CancelledBy == nil || cancelled.CancellationReason != "Kegiatan ditunda" || cancelled.Snapshot == nil {
			t.Fatalf("cancel SPD=%v", e)
		}
		if e := repo.DeleteOrder(ctx, o.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatal("deleted cancelled SPD")
		}
		cancelledAssignment, e := repo.TransitionAssignment(ctx, a.ID, user.ID, "cancel", "Kegiatan ditunda")
		if e != nil || cancelledAssignment.CancelledAt == nil {
			t.Fatalf("cancel assignment=%v", e)
		}
		if _, e := repo.SaveOrder(ctx, 0, op, user.ID); !errors.Is(e, repository.ErrTravelConflict) {
			t.Fatal("created SPD under cancelled parent")
		}
	})
	t.Run("unlinked drafts deletable and options minimal", func(t *testing.T) {
		p.Number = ""
		draft, e := repo.SaveAssignment(ctx, 0, p, user.ID)
		if e != nil {
			t.Fatal(e)
		}
		op.Number = ""
		op.AssignmentLetterID = draft.ID
		draftOrder, e := repo.SaveOrder(ctx, 0, op, user.ID)
		if e != nil {
			t.Fatal(e)
		}
		if e := repo.DeleteOrder(ctx, draftOrder.ID); e != nil {
			t.Fatal(e)
		}
		if e := repo.DeleteAssignment(ctx, draft.ID); e != nil {
			t.Fatal(e)
		}
		opts, e := repo.Options(ctx)
		if e != nil || len(opts.Employees) != 3 || len(opts.Subkegiatan) != 1 {
			t.Fatalf("options=%+v %v", opts, e)
		}
	})
	t.Run("migration rollback and reapply preserve existing master data", func(t *testing.T) {
		source, err := iofs.New(appmigrations.FS, ".")
		if err != nil {
			t.Fatal(err)
		}
		m, err := migrate.NewWithSourceInstance("iofs", source, url)
		if err != nil {
			t.Fatal(err)
		}
		defer m.Close()
		if err := m.Steps(-1); err != nil {
			t.Fatal(err)
		}
		var count int64
		if err := db.Model(&model.ArsipPegawaiEntity{}).Count(&count).Error; err != nil || count != 3 {
			t.Fatalf("master employee data changed: %d %v", count, err)
		}
		if err := m.Up(); err != nil {
			t.Fatal(err)
		}
		version, dirty, err := m.Version()
		if err != nil || version != 35 || dirty {
			t.Fatalf("migration status %d %v %v", version, dirty, err)
		}
	})

}
