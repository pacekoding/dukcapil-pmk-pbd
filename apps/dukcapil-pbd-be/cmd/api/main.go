package main

import (
	"context"
	"log"
	"os"
	"time"

	"dukcapil-pbd-be/internal/controller"
	"dukcapil-pbd-be/internal/database"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/repository"
	"dukcapil-pbd-be/internal/router"
	"dukcapil-pbd-be/internal/security"
)

func main() {
	port := env("PORT", "8080")
	allowedOrigin := env("CORS_ALLOWED_ORIGIN", "*")
	databaseURL := database.PostgresURL()
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required for admin login")
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
	initCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := database.Migrate(initCtx, databaseURL); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}
	if err := repository.SeedDefaultAdminUsers(initCtx, db); err != nil {
		log.Fatalf("admin user seed failed: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	dashboardRepo := repository.NewDashboardRepository(db)
	dataWilayahRepo := repository.NewDataWilayahRepository(db)
	ssdRepo := repository.NewSSDRepository(db)
	subkegiatanRepo := repository.NewSubkegiatanRepository(db)
	realisasiRepo := repository.NewRealisasiSubkegiatanRepository(db)
	tokenManager := security.NewManager(env("JWT_SECRET", "dev-secret-change-me"), 24*time.Hour)
	authMiddleware := authmiddleware.NewAuthMiddleware(tokenManager)

	e := router.New(router.Config{
		AllowedOrigin:  allowedOrigin,
		Health:         controller.NewHealthController(db),
		Auth:           controller.NewAuthController(userRepo, tokenManager),
		Dashboard:      controller.NewDashboardController(dashboardRepo),
		DataWilayah:    controller.NewDataWilayahController(dataWilayahRepo),
		SSD:            controller.NewSSDController(ssdRepo),
		Subkegiatan:    controller.NewSubkegiatanController(subkegiatanRepo),
		Realisasi:      controller.NewRealisasiSubkegiatanController(realisasiRepo),
		Users:          controller.NewUserController(userRepo),
		Website:        controller.NewWebsiteController(),
		AuthMiddleware: authMiddleware,
	})

	log.Printf("dukcapil-pbd-be listening on :%s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
