package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	gormpostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func OpenPostgres(ctx context.Context) (*gorm.DB, error) {
	databaseURL := PostgresURL()
	if databaseURL == "" {
		log.Println("DATABASE_URL is empty, running without database connection")
		return nil, nil
	}

	db, err := gorm.Open(gormpostgres.Open(databaseURL), &gorm.Config{
		TranslateError: true,
	})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql database: %w", err)
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	deadline := time.Now().Add(30 * time.Second)
	for {
		pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		err = sqlDB.PingContext(pingCtx)
		cancel()
		if err == nil {
			log.Println("database connected")
			return db, nil
		}

		if time.Now().After(deadline) {
			sqlDB.Close()
			return nil, fmt.Errorf("ping database: %w", err)
		}

		time.Sleep(2 * time.Second)
	}
}

func SQLDB(db *gorm.DB) (*sql.DB, error) {
	if db == nil {
		return nil, fmt.Errorf("database connection is required")
	}

	return db.DB()
}

func PostgresURL() string {
	return os.Getenv("DATABASE_URL")
}
