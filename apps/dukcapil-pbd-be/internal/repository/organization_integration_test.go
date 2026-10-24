package repository_test

import (
	"context"
	"errors"
	"os"
	"testing"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	appmigrations "dukcapil-pbd-be/migrations"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Requires an EMPTY disposable database; never use the application database.
func TestOrganizationIntegration(t *testing.T) {
	url := os.Getenv("ORGANIZATION_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set ORGANIZATION_TEST_DATABASE_URL to an empty disposable PostgreSQL database")
	}
	ctx := context.Background()
	db, err := gorm.Open(postgres.Open(url), &gorm.Config{TranslateError: true, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer sqlDB.Close()
	var tables int64
	if err := db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'").Scan(&tables).Error; err != nil {
		t.Fatal(err)
	}
	if tables != 0 {
		t.Fatal("integration database must be empty")
	}
	source, err := iofs.New(appmigrations.FS, ".")
	if err != nil {
		t.Fatal(err)
	}
	m, err := migrate.NewWithSourceInstance("iofs", source, url)
	if err != nil {
		t.Fatal(err)
	}
	defer m.Close()
	if err := m.Migrate(32); err != nil {
		t.Fatal(err)
	}
	exec := func(sql string, args ...any) {
		t.Helper()
		if err := db.Exec(sql, args...).Error; err != nil {
			t.Fatal(err)
		}
	}
	exec(`INSERT INTO arsip_pegawai(nip, nama, bidang, unit, jabatan) VALUES
        ('legacy-1', 'Lama 1', '  Bidang   Layanan ', ' Seksi  Data ', ' Pengelola   Sistem '),
        ('legacy-2', 'Lama 2', E'\t bidang  layanan \n', E'\t seksi data \n', E'\n pengelola sistem \t'),
        ('legacy-3', 'Lama 3', 'Bidang Layanan', '', 'Kepala Bidang'),
        ('legacy-4', 'Tanpa Induk', E'\t  \n', 'Seksi Lama', 'Jabatan Lama')`)
	if err := m.Migrate(33); err != nil {
		t.Fatal(err)
	}
	org := repository.NewOrganizationRepository(db)
	employees := repository.NewArsipPegawaiRepository(db)
	ptr := func(id int64) *int64 { return &id }
	list := func(kind model.OrganizationKind, p model.OrganizationListParams) []model.OrganizationItem {
		t.Helper()
		items, err := org.List(ctx, kind, p)
		if err != nil {
			t.Fatal(err)
		}
		return items
	}
	save := func(kind model.OrganizationKind, id int64, p model.OrganizationPayload) model.OrganizationItem {
		t.Helper()
		item, err := org.Save(ctx, kind, id, p)
		if err != nil {
			t.Fatal(err)
		}
		return item
	}
	payload := func(name string, bidang, seksi *int64) model.OrganizationPayload {
		return model.OrganizationPayload{Name: name, BidangID: bidang, SeksiID: seksi, IsActive: true}
	}
	t.Run("migration normalizes and maps without losing original text", func(t *testing.T) {
		fields := list(model.OrganizationFields, model.OrganizationListParams{})
		if len(fields) != 1 || fields[0].SectionCount != 1 {
			t.Fatalf("fields = %+v", fields)
		}
		if len(list(model.OrganizationSections, model.OrganizationListParams{})) != 1 || len(list(model.OrganizationPositions, model.OrganizationListParams{})) != 2 {
			t.Fatal("backfill did not deduplicate hierarchy")
		}
		var mapped, original int64
		db.Raw("SELECT COUNT(*) FROM arsip_pegawai WHERE bidang_id IS NOT NULL AND jabatan_id IS NOT NULL").Scan(&mapped)
		db.Raw("SELECT COUNT(*) FROM arsip_pegawai WHERE nip='legacy-1' AND bidang='  Bidang   Layanan ' AND unit=' Seksi  Data ' AND jabatan=' Pengelola   Sistem '").Scan(&original)
		if mapped != 3 || original != 1 {
			t.Fatalf("mapped=%d original=%d", mapped, original)
		}
		var orphan model.ArsipPegawaiEntity
		db.Where("nip = ?", "legacy-4").Take(&orphan)
		if orphan.Unit != "Seksi Lama" || orphan.Jabatan != "Jabatan Lama" || orphan.BidangID != nil {
			t.Fatal("incomplete legacy record changed")
		}
	})

	field := save(model.OrganizationFields, 0, payload("Bidang Baru", nil, nil))
	second := save(model.OrganizationFields, 0, payload("Bidang Lain", nil, nil))
	section := save(model.OrganizationSections, 0, payload("Seksi Baru", ptr(field.ID), nil))
	otherSection := save(model.OrganizationSections, 0, payload("Seksi Lain", ptr(second.ID), nil))
	position := save(model.OrganizationPositions, 0, payload("Analis", ptr(field.ID), ptr(section.ID)))
	direct := save(model.OrganizationPositions, 0, payload("Kepala Bidang", ptr(field.ID), nil))
	t.Run("duplicates and invalid parent relationships rejected", func(t *testing.T) {
		for _, entry := range []struct {
			kind model.OrganizationKind
			p    model.OrganizationPayload
		}{
			{model.OrganizationFields, payload("  bidang   baru ", nil, nil)},
			{model.OrganizationSections, payload(" seksi   baru ", ptr(field.ID), nil)},
			{model.OrganizationPositions, payload("ANALIS", ptr(field.ID), ptr(section.ID))},
			{model.OrganizationPositions, payload("KEPALA BIDANG", ptr(field.ID), nil)},
		} {
			if _, err := org.Save(ctx, entry.kind, 0, entry.p); !errors.Is(err, repository.ErrOrganizationDuplicate) {
				t.Fatalf("duplicate error = %v", err)
			}
		}
		for _, p := range []model.OrganizationPayload{payload("Invalid", ptr(999999), nil), payload("Invalid", ptr(field.ID), ptr(otherSection.ID))} {
			kind := model.OrganizationPositions
			if p.SeksiID == nil {
				kind = model.OrganizationSections
			}
			if _, err := org.Save(ctx, kind, 0, p); !errors.Is(err, repository.ErrOrganizationInvalid) {
				t.Fatalf("invalid parent error = %v", err)
			}
		}
	})
	t.Run("query filters hierarchy including direct positions", func(t *testing.T) {
		sections := list(model.OrganizationSections, model.OrganizationListParams{BidangID: ptr(field.ID)})
		positions := list(model.OrganizationPositions, model.OrganizationListParams{BidangID: ptr(field.ID), SeksiID: ptr(section.ID)})
		directOnly := list(model.OrganizationPositions, model.OrganizationListParams{BidangID: ptr(field.ID), SeksiID: ptr(0)})
		if len(sections) != 1 || len(positions) != 2 || len(directOnly) != 1 || directOnly[0].ID != direct.ID {
			t.Fatal("incorrect hierarchy filtering")
		}
	})
	employeePayload := model.ArsipPegawaiPayload{NIP: "new-employee", Name: "Pegawai Baru", BidangID: ptr(field.ID), SeksiID: ptr(section.ID), JabatanID: ptr(position.ID), Bidang: "forged label", Position: "forged position"}
	employee, err := employees.Create(ctx, employeePayload)
	if err != nil {
		t.Fatal(err)
	}
	t.Run("employees persist IDs and resolve authoritative labels", func(t *testing.T) {
		if employee.BidangID == nil || *employee.BidangID != field.ID || employee.SeksiID == nil || *employee.SeksiID != section.ID || employee.JabatanID == nil || *employee.JabatanID != position.ID || employee.Bidang != field.Name || employee.Position != position.Name {
			t.Fatalf("employee = %+v", employee)
		}
		p := payload("Analis Diperbarui", ptr(field.ID), ptr(section.ID))
		position = save(model.OrganizationPositions, position.ID, p)
		record, found, err := employees.Detail(ctx, employee.ID)
		if err != nil || !found || record.Position != p.Name {
			t.Fatalf("renamed label not resolved: %+v %v", record, err)
		}
		records, err := employees.List(ctx, model.ArsipPegawaiListParams{Search: "Analis Diperbarui"})
		if err != nil || len(records) != 1 {
			t.Fatalf("search uses stale labels: %v %v", records, err)
		}
	})
	t.Run("invalid employee combinations rejected on create and update", func(t *testing.T) {
		for _, p := range []model.ArsipPegawaiPayload{
			{NIP: "bad-1", Name: "Invalid", BidangID: ptr(field.ID), SeksiID: ptr(otherSection.ID), JabatanID: ptr(position.ID)},
			{NIP: "bad-2", Name: "Invalid", BidangID: ptr(second.ID), JabatanID: ptr(position.ID)},
			{NIP: "bad-3", Name: "Invalid", BidangID: ptr(field.ID), JabatanID: ptr(position.ID)},
			{NIP: "bad-4", Name: "Invalid", Bidang: "Free text", Position: "Free text"},
		} {
			if _, err := employees.Create(ctx, p); !errors.Is(err, repository.ErrOrganizationInvalid) {
				t.Fatalf("create invalid error = %v", err)
			}
			if _, _, err := employees.Update(ctx, employee.ID, p); !errors.Is(err, repository.ErrOrganizationInvalid) {
				t.Fatalf("update invalid error = %v", err)
			}
		}
	})
	t.Run("used masters cannot be deleted or moved", func(t *testing.T) {
		for _, item := range []struct {
			kind model.OrganizationKind
			id   int64
		}{{model.OrganizationFields, field.ID}, {model.OrganizationSections, section.ID}, {model.OrganizationPositions, position.ID}} {
			if err := org.Delete(ctx, item.kind, item.id); !errors.Is(err, repository.ErrOrganizationUsed) {
				t.Fatalf("delete used error = %v", err)
			}
		}
		if _, err := org.Save(ctx, model.OrganizationPositions, position.ID, payload(position.Name, ptr(second.ID), nil)); !errors.Is(err, repository.ErrOrganizationUsed) {
			t.Fatalf("move used error = %v", err)
		}
	})
	t.Run("inactive choices excluded on create and retained on edit", func(t *testing.T) {
		for _, item := range []struct {
			kind   model.OrganizationKind
			record model.OrganizationItem
		}{{model.OrganizationFields, field}, {model.OrganizationSections, section}, {model.OrganizationPositions, position}} {
			p := payload(item.record.Name, item.record.BidangID, item.record.SeksiID)
			p.IsActive = false
			save(item.kind, item.record.ID, p)
		}
		active := true
		if len(list(model.OrganizationSections, model.OrganizationListParams{BidangID: ptr(field.ID), Active: &active})) != 0 || len(list(model.OrganizationPositions, model.OrganizationListParams{BidangID: ptr(field.ID), Active: &active})) != 0 {
			t.Fatal("inactive ancestor leaked active children")
		}
		employeePayload.NIP = "inactive-new"
		if _, err := employees.Create(ctx, employeePayload); !errors.Is(err, repository.ErrOrganizationInvalid) {
			t.Fatalf("inactive create error = %v", err)
		}
		employeePayload.NIP = "new-employee"
		employeePayload.Name = "Nama Diperbarui"
		updated, found, err := employees.Update(ctx, employee.ID, employeePayload)
		if err != nil || !found || updated.Name != employeePayload.Name || updated.JabatanID == nil || *updated.JabatanID != position.ID {
			t.Fatalf("retain inactive: %+v %v", updated, err)
		}
		record, found, err := employees.Detail(ctx, employee.ID)
		if err != nil || !found || record.Position != position.Name {
			t.Fatalf("inactive labels missing: %+v %v", record, err)
		}
		// Reactivate and assign a direct position, preserving a valid optional section.
		save(model.OrganizationFields, field.ID, payload(field.Name, nil, nil))
		save(model.OrganizationSections, section.ID, payload(section.Name, ptr(field.ID), nil))
		employeePayload.JabatanID = ptr(direct.ID)
		updated, found, err = employees.Update(ctx, employee.ID, employeePayload)
		if err != nil || !found || updated.JabatanID == nil || *updated.JabatanID != direct.ID {
			t.Fatalf("change employee relation: %+v %v", updated, err)
		}
		employeePayload.SeksiID = nil
		updated, found, err = employees.Update(ctx, employee.ID, employeePayload)
		if err != nil || !found || updated.SeksiID != nil || updated.Unit != "" {
			t.Fatalf("clear optional section: %+v %v", updated, err)
		}
	})
	t.Run("unused masters may be deleted", func(t *testing.T) {
		unused := save(model.OrganizationPositions, 0, payload("Sementara", ptr(second.ID), nil))
		if err := org.Delete(ctx, model.OrganizationPositions, unused.ID); err != nil {
			t.Fatal(err)
		}
		if err := org.Delete(ctx, model.OrganizationPositions, unused.ID); !errors.Is(err, repository.ErrOrganizationNotFound) {
			t.Fatalf("missing delete error = %v", err)
		}
	})
	t.Run("rollback keeps latest employee labels and migration can be reapplied", func(t *testing.T) {
		if err := m.Steps(-1); err != nil {
			t.Fatal(err)
		}
		var count int64
		db.Raw("SELECT COUNT(*) FROM arsip_pegawai WHERE nip = 'new-employee' AND jabatan = ?", direct.Name).Scan(&count)
		if count != 1 {
			t.Fatal("rollback lost latest labels")
		}
		if err := m.Migrate(33); err != nil {
			t.Fatal(err)
		}
		records, err := employees.List(ctx, model.ArsipPegawaiListParams{})
		if err != nil || len(records) != 5 {
			t.Fatalf("reapply lost employees: %d %v", len(records), err)
		}
	})
}
