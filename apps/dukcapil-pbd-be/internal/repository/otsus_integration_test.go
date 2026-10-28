package repository_test

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"

	"dukcapil-pbd-be/internal/database"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestOtsusIntegration(t *testing.T) {
	url := os.Getenv("OTSUS_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set OTSUS_TEST_DATABASE_URL to an empty disposable PostgreSQL database")
	}
	db, err := gorm.Open(postgres.Open(url), &gorm.Config{TranslateError: true, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := db.DB()
	defer raw.Close()
	var count int64
	db.Raw("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'").Scan(&count)
	if count != 0 {
		t.Fatal("Otsus integration database must be empty")
	}
	if err := database.Migrate(context.Background(), url); err != nil {
		t.Fatal(err)
	}
	must := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	must(db.Exec("INSERT INTO admin_users(username,full_name,role,password_hash,is_active) VALUES('otsus-test','User Otsus','admin_pmk','test',true)").Error)
	var user model.AdminUserEntity
	must(db.Where("username='otsus-test'").Take(&user).Error)
	sub := model.SubkegiatanEntity{Bidang: "Bidang Uji", Program: "Program Uji", Kegiatan: "Kegiatan Uji", Subkegiatan: "Bantuan Usaha OAP", Kinerja: "Kinerja", Indikator: "Indikator", Satuan: "Paket", DefinisiOperasional: "Uji"}
	must(db.Create(&sub).Error)
	repo := repository.NewOtsusRepository(db)
	ctx := context.Background()
	payload := model.OtsusPayload{SubkegiatanID: sub.ID, Pagu: 260000000, Realisasi: 130000000, Status: model.OtsusStatusBerjalan, Keterangan: "Berjalan"}
	created, err := repo.Save(ctx, 0, "2026", payload, user.ID)
	must(err)
	if created.Label.ID == 0 {
		t.Fatal("create returned no ID")
	}
	if _, err = repo.Save(ctx, 0, "2026", payload, user.ID); !errors.Is(err, repository.ErrOtsusConflict) {
		t.Fatalf("duplicate error=%v", err)
	}
	bad := payload
	bad.Realisasi = bad.Pagu + 1
	if _, err = repo.Save(ctx, 0, "2025", bad, user.ID); !errors.Is(err, repository.ErrOtsusInvalid) {
		t.Fatalf("over budget error=%v", err)
	}
	items, err := repo.List(ctx, "2026", "")
	must(err)
	if len(items) != 1 {
		t.Fatalf("2026 items=%d", len(items))
	}
	items, err = repo.List(ctx, "2025", "")
	must(err)
	if len(items) != 0 {
		t.Fatalf("2025 items=%d", len(items))
	}
	if items == nil {
		t.Fatal("empty list should be a non-nil slice")
	}
	emptyDetail, err := repo.Detail(ctx, created.Label.ID, "2026")
	must(err)
	if emptyDetail.Documentations == nil || emptyDetail.DPAVersions == nil {
		t.Fatal("empty detail collections should be non-nil slices")
	}
	input := func(category string, sequence int) model.StoredFileInput {
		name := fmt.Sprintf("%s-%d.pdf", category, sequence)
		return model.StoredFileInput{Module: "otsus", RelatedType: "otsus_dpa", Category: category, OriginalFilename: name, StoredFilename: name, StorageKey: fmt.Sprintf("private/otsus/%s/2026/%d.pdf", category, sequence), MimeType: "application/pdf", FileSize: 10, ChecksumSHA256: "", Visibility: model.FileVisibilityPrivate, UploadedBy: &user.ID}
	}
	first, err := repo.AddDPAVersion(ctx, created.Label.ID, "2026", model.OtsusDPAAwal, "Awal", input("dpa", 1), user.ID)
	must(err)
	second, err := repo.AddDPAVersion(ctx, created.Label.ID, "2026", model.OtsusDPAPergeseran, "Pergeseran", input("dpa", 2), user.ID)
	must(err)
	if first.Versi != 1 || second.Versi != 2 {
		t.Fatalf("versions=%d,%d", first.Versi, second.Versi)
	}
	detail, err := repo.Detail(ctx, created.Label.ID, "2026")
	must(err)
	if len(detail.DPAVersions) != 2 || detail.DPAVersions[0].Versi != 2 || detail.DPAVersions[1].Versi != 1 {
		t.Fatalf("DPA history=%+v", detail.DPAVersions)
	}
}
