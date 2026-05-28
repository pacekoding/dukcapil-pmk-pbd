package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var ErrUsernameAlreadyExists = errors.New("username already exists")

type UserRepository struct {
	db *gorm.DB
}

type defaultAdminUser struct {
	Username string
	Name     string
	Role     model.Role
	Password string
}

var defaultAdminUsers = []defaultAdminUser{
	{
		Username: "superadmin",
		Name:     "Super Admin",
		Role:     model.RoleSuperAdmin,
		Password: "superadmin123",
	},
	{
		Username: "admin_dukcapil",
		Name:     "Admin Dukcapil",
		Role:     model.RoleAdminDukcapil,
		Password: "dukcapil123",
	},
	{
		Username: "admin_pmk",
		Name:     "Admin PMK",
		Role:     model.RoleAdminPMK,
		Password: "pmk123",
	},
	{
		Username: "admin_sekretariat",
		Name:     "Admin Sekretariat",
		Role:     model.RoleAdminSekretariat,
		Password: "sekretariat123",
	},
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func SeedDefaultAdminUsers(ctx context.Context, db *gorm.DB) error {
	if db == nil {
		return fmt.Errorf("database connection is required")
	}

	tx := db.WithContext(ctx)
	for _, user := range defaultAdminUsers {
		var existing model.AdminUserEntity
		err := tx.Where("LOWER(username) = ?", normalizeUsername(user.Username)).First(&existing).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("find default admin user %s: %w", user.Username, err)
		}

		if err == nil {
			if err := tx.Model(&model.AdminUserEntity{}).
				Where("id = ?", existing.ID).
				Updates(map[string]any{
					"full_name":  user.Name,
					"role":       user.Role,
					"updated_at": gorm.Expr("NOW()"),
				}).Error; err != nil {
				return fmt.Errorf("update default admin user %s: %w", user.Username, normalizeWriteError(err))
			}
			continue
		}

		passwordHash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password for %s: %w", user.Username, err)
		}

		record := model.AdminUserEntity{
			Username:     strings.TrimSpace(user.Username),
			FullName:     strings.TrimSpace(user.Name),
			Role:         user.Role,
			PasswordHash: string(passwordHash),
			IsActive:     true,
		}
		if err := tx.Create(&record).Error; err != nil {
			return fmt.Errorf("seed admin user %s: %w", user.Username, normalizeWriteError(err))
		}
	}

	return nil
}

func (r *UserRepository) Authenticate(ctx context.Context, username, password string) (model.User, bool, error) {
	if strings.TrimSpace(username) == "" || password == "" {
		return model.User{}, false, nil
	}

	record, found, err := r.findActiveByUsername(ctx, username)
	if err != nil || !found {
		return model.User{}, found, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(record.PasswordHash), []byte(password)); err != nil {
		return model.User{}, false, nil
	}

	return record.ToUser(), true, nil
}

func (r *UserRepository) List(ctx context.Context) ([]model.AdminUser, error) {
	db, err := r.session(ctx)
	if err != nil {
		return nil, err
	}

	var records []model.AdminUserEntity
	if err := db.Order("username ASC").Find(&records).Error; err != nil {
		return nil, fmt.Errorf("list admin users: %w", err)
	}

	users := make([]model.AdminUser, 0, len(records))
	for _, record := range records {
		users = append(users, record.ToAdminUser())
	}
	return users, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (model.AdminUser, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.AdminUser{}, false, err
	}

	record, found, err := findAdminUserByID(db, id)
	if err != nil || !found {
		return model.AdminUser{}, found, err
	}

	return record.ToAdminUser(), true, nil
}

func (r *UserRepository) UsernameExists(ctx context.Context, username string, exceptID int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	query := db.Model(&model.AdminUserEntity{}).Where("LOWER(username) = ?", normalizeUsername(username))
	if exceptID > 0 {
		query = query.Where("id <> ?", exceptID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, fmt.Errorf("check username exists: %w", err)
	}

	return count > 0, nil
}

func (r *UserRepository) Create(ctx context.Context, request model.CreateAdminUserRequest) (model.AdminUser, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.AdminUser{}, err
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		return model.AdminUser{}, fmt.Errorf("hash password: %w", err)
	}

	record := model.AdminUserEntity{
		Username:     strings.TrimSpace(request.Username),
		FullName:     strings.TrimSpace(request.Name),
		Role:         request.Role,
		PasswordHash: string(passwordHash),
		IsActive:     request.IsActive,
	}
	if err := db.Create(&record).Error; err != nil {
		return model.AdminUser{}, fmt.Errorf("create admin user: %w", normalizeWriteError(err))
	}

	return record.ToAdminUser(), nil
}

func (r *UserRepository) Update(ctx context.Context, id int64, request model.UpdateAdminUserRequest) (model.AdminUser, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.AdminUser{}, false, err
	}

	var record model.AdminUserEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.AdminUserEntity{}).
			Where("id = ?", id).
			Updates(map[string]any{
				"username":   strings.TrimSpace(request.Username),
				"full_name":  strings.TrimSpace(request.Name),
				"role":       request.Role,
				"is_active":  request.IsActive,
				"updated_at": gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return normalizeWriteError(result.Error)
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		return tx.First(&record, "id = ?", id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.AdminUser{}, false, nil
	}
	if err != nil {
		return model.AdminUser{}, false, fmt.Errorf("update admin user: %w", err)
	}

	return record.ToAdminUser(), true, nil
}

func (r *UserRepository) Delete(ctx context.Context, id int64) (model.AdminUser, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.AdminUser{}, false, err
	}

	var record model.AdminUserEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&record, "id = ?", id).Error; err != nil {
			return err
		}
		return tx.Delete(&record).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.AdminUser{}, false, nil
	}
	if err != nil {
		return model.AdminUser{}, false, fmt.Errorf("delete admin user: %w", err)
	}

	return record.ToAdminUser(), true, nil
}

func (r *UserRepository) ResetPassword(ctx context.Context, id int64, newPassword string) (model.AdminUser, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.AdminUser{}, false, err
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return model.AdminUser{}, false, fmt.Errorf("hash password: %w", err)
	}

	var record model.AdminUserEntity
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.AdminUserEntity{}).
			Where("id = ?", id).
			Updates(map[string]any{
				"password_hash": string(passwordHash),
				"updated_at":    gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		return tx.First(&record, "id = ?", id).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.AdminUser{}, false, nil
	}
	if err != nil {
		return model.AdminUser{}, false, fmt.Errorf("reset admin user password: %w", err)
	}

	return record.ToAdminUser(), true, nil
}

func (r *UserRepository) ChangePassword(ctx context.Context, username, currentPassword, newPassword string) (bool, error) {
	record, found, err := r.findActiveByUsername(ctx, username)
	if err != nil || !found {
		return found, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(record.PasswordHash), []byte(currentPassword)); err != nil {
		return false, nil
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return false, fmt.Errorf("hash password: %w", err)
	}

	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Model(&model.AdminUserEntity{}).
		Where("id = ? AND is_active = ?", record.ID, true).
		Updates(map[string]any{
			"password_hash": string(passwordHash),
			"updated_at":    gorm.Expr("NOW()"),
		})
	if result.Error != nil {
		return false, fmt.Errorf("change password: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *UserRepository) findActiveByUsername(ctx context.Context, username string) (model.AdminUserEntity, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.AdminUserEntity{}, false, err
	}

	var record model.AdminUserEntity
	err = db.
		Where("LOWER(username) = ?", normalizeUsername(username)).
		Where("is_active = ?", true).
		First(&record).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.AdminUserEntity{}, false, nil
	}
	if err != nil {
		return model.AdminUserEntity{}, false, fmt.Errorf("find admin user: %w", err)
	}

	return record, true, nil
}

func (r *UserRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func findAdminUserByID(db *gorm.DB, id int64) (model.AdminUserEntity, bool, error) {
	var record model.AdminUserEntity
	err := db.First(&record, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.AdminUserEntity{}, false, nil
	}
	if err != nil {
		return model.AdminUserEntity{}, false, fmt.Errorf("find admin user by id: %w", err)
	}

	return record, true, nil
}

func normalizeUsername(username string) string {
	return strings.ToLower(strings.TrimSpace(username))
}

func normalizeWriteError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return ErrUsernameAlreadyExists
	}
	return err
}
