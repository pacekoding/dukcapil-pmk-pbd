package database

import (
	"context"
	"errors"
	"fmt"
	"os"

	appmigrations "dukcapil-pbd-be/migrations"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

func Migrate(ctx context.Context, databaseURL string) error {
	if databaseURL == "" {
		return fmt.Errorf("database URL is required")
	}
	if err := ctx.Err(); err != nil {
		return err
	}

	sourceDriver, err := iofs.New(appmigrations.FS, ".")
	if err != nil {
		return fmt.Errorf("open migration source: %w", err)
	}
	latestVersion, err := latestMigrationVersion(sourceDriver)
	if err != nil {
		return err
	}

	migrator, err := migrate.NewWithSourceInstance("iofs", sourceDriver, databaseURL)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	migrationErr := normalizeConsolidatedMigrationVersion(migrator, latestVersion)
	if migrationErr == nil {
		migrationErr = migrator.Up()
	}
	sourceErr, databaseErr := migrator.Close()
	if migrationErr != nil && !errors.Is(migrationErr, migrate.ErrNoChange) {
		return fmt.Errorf("run migration: %w", migrationErr)
	}
	if sourceErr != nil {
		return fmt.Errorf("close migration source: %w", sourceErr)
	}
	if databaseErr != nil {
		return fmt.Errorf("close migration database: %w", databaseErr)
	}

	if err := ctx.Err(); err != nil {
		return err
	}
	return nil
}

func latestMigrationVersion(driver source.Driver) (uint, error) {
	version, err := driver.First()
	if err != nil {
		return 0, fmt.Errorf("read first migration version: %w", err)
	}

	for {
		nextVersion, err := driver.Next(version)
		if errors.Is(err, os.ErrNotExist) {
			return version, nil
		}
		if err != nil {
			return 0, fmt.Errorf("read next migration version: %w", err)
		}
		version = nextVersion
	}
}

func normalizeConsolidatedMigrationVersion(migrator *migrate.Migrate, latestVersion uint) error {
	currentVersion, _, err := migrator.Version()
	if errors.Is(err, migrate.ErrNilVersion) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("read current migration version: %w", err)
	}
	if currentVersion <= latestVersion {
		return nil
	}

	if err := migrator.Force(int(latestVersion)); err != nil {
		return fmt.Errorf(
			"normalize migration version from %d to %d: %w",
			currentVersion,
			latestVersion,
			err,
		)
	}
	return nil
}
