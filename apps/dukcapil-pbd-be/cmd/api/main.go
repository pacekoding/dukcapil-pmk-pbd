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
	ssdRepo := repository.NewSSDRepository(db)
	subkegiatanRepo := repository.NewSubkegiatanRepository(db)
	pelaksanaanDocumentRepo := repository.NewPelaksanaanDocumentRepository(db)
	arsipPegawaiRepo := repository.NewArsipPegawaiRepository(db)
	bumKampungRepo := repository.NewBumKampungRepository(db)
	sikampungRepo := repository.NewSikampungRepository(db)
	sitekadRepo := repository.NewSitekadRepository(db)
	aspirasikuRepo := repository.NewAspirasikuRepository(db)
	macekuPkkRepo := repository.NewMacekuPKKRepository(db)
	optimaInfoRepo := repository.NewOptimaInfoRepository(db)
	storedFileRepo := repository.NewStoredFileRepository(db)
	kabKotaRepo := repository.NewKabKotaRepository(db)
	portalAppRepo := repository.NewPortalAppRepository(db)
	outgoingLetterRepo := repository.NewOutgoingLetterRepository(db)
	tokenManager := security.NewManager(env("JWT_SECRET", "dev-secret-change-me"), 24*time.Hour)
	authMiddleware := authmiddleware.NewAuthMiddleware(tokenManager)

	e := router.New(router.Config{
		AllowedOrigin:   allowedOrigin,
		MaxUploadSizeMB: maxUploadSizeMB,
		Health:          controller.NewHealthController(db),
		Auth:            controller.NewAuthController(userRepo, tokenManager),
		DataWilayah:     controller.NewDataWilayahController(dataWilayahRepo),
		SSD:             controller.NewSSDController(ssdRepo),
		Subkegiatan:     controller.NewSubkegiatanController(subkegiatanRepo),
		Documents:       controller.NewPelaksanaanDocumentController(pelaksanaanDocumentRepo, fileService),
		ArsipPegawai:    controller.NewArsipPegawaiController(arsipPegawaiRepo, fileService),
		BumKampung:      controller.NewBumKampungController(bumKampungRepo),
		Sikampung:       controller.NewSikampungController(sikampungRepo),
		Sitekad:         controller.NewSitekadController(sitekadRepo),
		Aspirasiku:      controller.NewAspirasikuController(aspirasikuRepo),
		MacekuPKK:       controller.NewMacekuPKKController(macekuPkkRepo, fileService),
		OptimaInfo:      controller.NewOptimaInfoController(optimaInfoRepo, fileService),
		StoredFiles:     controller.NewStoredFileController(storedFileRepo, storageService),
		KabKota:         controller.NewKabKotaController(kabKotaRepo),
		Users:           controller.NewUserController(userRepo),
		Website:         controller.NewWebsiteController(),
		PortalApps:      controller.NewPortalAppController(portalAppRepo),
		OutgoingLetters: controller.NewOutgoingLetterController(outgoingLetterRepo),
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
