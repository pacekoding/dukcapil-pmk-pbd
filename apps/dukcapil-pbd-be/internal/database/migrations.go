package database

import (
	"context"
	"errors"
	"fmt"

	appmigrations "dukcapil-pbd-be/migrations"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
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

	migrator, err := migrate.NewWithSourceInstance("iofs", sourceDriver, databaseURL)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	migrationErr := migrator.Up()
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
