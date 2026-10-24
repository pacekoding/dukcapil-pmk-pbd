package main

import (
	"context"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/controller"
	"dukcapil-pbd-be/internal/database"
	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"dukcapil-pbd-be/internal/router"
	"dukcapil-pbd-be/internal/security"
	"dukcapil-pbd-be/internal/storage"
)

func main() {
	port := env("PORT", "8080")
	allowedOrigin := env("CORS_ALLOWED_ORIGIN", "*")
	databaseURL := database.PostgresURL()
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required for admin login")
	}
	storageService, err := storage.NewLocal(env("STORAGE_ROOT", "storage/uploads"))
	if err != nil {
		log.Fatalf("file storage startup check failed: %v", err)
	}
	maxUploadSizeMB := positiveEnvInt("MAX_UPLOAD_SIZE_MB", 20)
	fileService, err := fileasset.New(storageService, int64(maxUploadSizeMB)*1024*1024)
	if err != nil {
		log.Fatalf("file upload service initialization failed: %v", err)
	}

	db, err := database.OpenPostgres(context.Background())
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	if db != nil {
		sqlDB, err := database.SQLDB(db)
		if err != nil {
			log.Fatalf("database instance failed: %v", err)
		}
		defer sqlDB.Close()
	}
	migrationCtx, cancelMigration := context.WithTimeout(context.Background(), 30*time.Second)
	if err := database.Migrate(migrationCtx, databaseURL); err != nil {
		cancelMigration()
		log.Fatalf("database migration failed: %v", err)
	}
	cancelMigration()

	seedCtx, cancelSeed := context.WithTimeout(context.Background(), 30*time.Second)
	if err := repository.SeedDefaultAdminUsers(seedCtx, db); err != nil {
		cancelSeed()
		log.Fatalf("admin user seed failed: %v", err)
	}
	cancelSeed()

	reconcileCtx, cancelReconcile := context.WithTimeout(context.Background(), 2*time.Minute)
	if err := repository.ReconcileStoredFileMetadata(reconcileCtx, db, storageService); err != nil {
		cancelReconcile()
		log.Fatalf("stored file metadata reconciliation failed: %v", err)
	}
	cancelReconcile()

	userRepo := repository.NewUserRepository(db)
	dataWilayahRepo := repository.NewDataWilayahRepository(db)
	arsipPegawaiRepo := repository.NewArsipPegawaiRepository(db)
	bumKampungRepo := repository.NewBumKampungRepository(db)
	sikampungRepo := repository.NewSikampungRepository(db)
	sitekadRepo := repository.NewSitekadRepository(db)
	storedFileRepo := repository.NewStoredFileRepository(db)
	kabKotaRepo := repository.NewKabKotaRepository(db)
	subkegiatanRepo := repository.NewSubkegiatanRepository(db)
	tokenManager := security.NewManager(env("JWT_SECRET", "dev-secret-change-me"), 24*time.Hour)
	authMiddleware := authmiddleware.NewAuthMiddleware(tokenManager)

	office := model.DefaultTravelOffice()
	office.GovernmentName = env("OFFICE_GOVERNMENT_NAME", office.GovernmentName)
	office.ProvinceName = env("OFFICE_PROVINCE_NAME", office.ProvinceName)
	office.AgencyName = env("OFFICE_AGENCY_NAME", office.AgencyName)
	office.Address = env("OFFICE_ADDRESS", office.Address)
	office.Phone = env("OFFICE_PHONE", office.Phone)
	office.Email = env("OFFICE_EMAIL", office.Email)
	office.Website = env("OFFICE_WEBSITE", office.Website)
	e := router.New(router.Config{
		AllowedOrigin:   allowedOrigin,
		Travel:          controller.NewTravelController(repository.NewTravelRepository(db, office)),
		Activities:      controller.NewActivityController(repository.NewActivityRepository(db, office), repository.NewTravelRepository(db, office), fileService),
		MaxUploadSizeMB: maxUploadSizeMB,
		Health:          controller.NewHealthController(db),
		Auth:            controller.NewAuthController(userRepo, tokenManager),
		DataWilayah:     controller.NewDataWilayahController(dataWilayahRepo),
		ArsipPegawai:    controller.NewArsipPegawaiController(arsipPegawaiRepo, fileService),
		BumKampung:      controller.NewBumKampungController(bumKampungRepo),
		Sikampung:       controller.NewSikampungController(sikampungRepo),
		Sitekad:         controller.NewSitekadController(sitekadRepo, fileService),
		StoredFiles:     controller.NewStoredFileController(storedFileRepo, storageService),
		KabKota:         controller.NewKabKotaController(kabKotaRepo),
		Subkegiatan:     controller.NewSubkegiatanController(subkegiatanRepo),
		Organization:    controller.NewOrganizationController(repository.NewOrganizationRepository(db)),
		Users:           controller.NewUserController(userRepo),
		Website:         controller.NewWebsiteController(),
		AuthMiddleware:  authMiddleware,
	})

	log.Printf("dukcapil-pbd-be listening on :%s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}

func positiveEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 || parsed > 1024 {
		log.Printf("%s tidak valid; menggunakan nilai default %d", key, fallback)
		return fallback
	}
	return parsed
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
