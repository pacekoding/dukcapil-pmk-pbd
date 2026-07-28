package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type OutgoingLetterRepository struct {
	db *gorm.DB
}

func NewOutgoingLetterRepository(db *gorm.DB) *OutgoingLetterRepository {
	return &OutgoingLetterRepository{db: db}
}

func (r *OutgoingLetterRepository) List(ctx context.Context, filter model.OutgoingLetterListFilter) (model.OutgoingLetterListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OutgoingLetterListResponse{}, err
	}

	page, limit := normalizePage(filter.Page, filter.Limit)
	query := r.applyFilter(db.Model(&model.OutgoingLetterEntity{}), filter)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return model.OutgoingLetterListResponse{}, fmt.Errorf("count outgoing letters: %w", err)
	}

	var records []model.OutgoingLetterEntity
	if err := query.
		Order("created_at DESC, id DESC").
		Limit(limit).
		Offset((page - 1) * limit).
		Find(&records).Error; err != nil {
		return model.OutgoingLetterListResponse{}, fmt.Errorf("list outgoing letters: %w", err)
	}

	items := make([]model.OutgoingLetter, 0, len(records))
	for _, record := range records {
		items = append(items, record.ToOutgoingLetter())
	}

	return model.OutgoingLetterListResponse{
		Items: items,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (r *OutgoingLetterRepository) Detail(ctx context.Context, id int64) (model.OutgoingLetter, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OutgoingLetter{}, false, err
	}

	record, found, err := r.find(ctx, db, id)
	if err != nil || !found {
		return model.OutgoingLetter{}, found, err
	}
	return record.ToOutgoingLetter(), true, nil
}

func (r *OutgoingLetterRepository) Create(ctx context.Context, payload model.OutgoingLetterPayload, userID int64) (model.OutgoingLetter, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OutgoingLetter{}, err
	}

	letterDate, err := parseLetterDate(payload.LetterDate)
	if err != nil {
		return model.OutgoingLetter{}, err
	}

	record := payloadToOutgoingLetterEntity(payload, letterDate, userID)
	if err := db.Create(&record).Error; err != nil {
		return model.OutgoingLetter{}, fmt.Errorf("create outgoing letter: %w", err)
	}

	return record.ToOutgoingLetter(), nil
}

func (r *OutgoingLetterRepository) Update(ctx context.Context, id int64, payload model.OutgoingLetterPayload, userID int64) (model.OutgoingLetter, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OutgoingLetter{}, false, err
	}

	letterDate, err := parseLetterDate(payload.LetterDate)
	if err != nil {
		return model.OutgoingLetter{}, false, err
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		var record model.OutgoingLetterEntity
		if err := tx.First(&record, "id = ?", id).Error; err != nil {
			return err
		}
		applyOutgoingLetterPayload(&record, payload, letterDate, userID)
		return tx.Save(&record).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.OutgoingLetter{}, false, nil
	}
	if err != nil {
		return model.OutgoingLetter{}, false, fmt.Errorf("update outgoing letter: %w", err)
	}

	record, found, err := r.find(ctx, db, id)
	if err != nil || !found {
		return model.OutgoingLetter{}, found, err
	}
	return record.ToOutgoingLetter(), true, nil
}

func (r *OutgoingLetterRepository) Delete(ctx context.Context, id int64) (bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return false, err
	}

	result := db.Delete(&model.OutgoingLetterEntity{}, "id = ?", id)
	if result.Error != nil {
		return false, fmt.Errorf("delete outgoing letter: %w", result.Error)
	}

	return result.RowsAffected > 0, nil
}

func (r *OutgoingLetterRepository) applyFilter(db *gorm.DB, filter model.OutgoingLetterListFilter) *gorm.DB {
	if filter.Status.Valid() {
		db = db.Where("status = ?", filter.Status)
	}
	if filter.LetterType.Valid() {
		db = db.Where("letter_type = ?", filter.LetterType)
	}
	if strings.TrimSpace(filter.Year) != "" {
		year, err := time.Parse("2006", strings.TrimSpace(filter.Year))
		if err == nil {
			db = db.Where("letter_date >= ? AND letter_date < ?", year, year.AddDate(1, 0, 0))
		}
	}
	if query := strings.TrimSpace(filter.Query); query != "" {
		like := "%" + query + "%"
		db = db.Where(
			"letter_number ILIKE ? OR subject ILIKE ? OR recipient ILIKE ? OR to_text ILIKE ?",
			like,
			like,
			like,
			like,
		)
	}
	return db
}

func (r *OutgoingLetterRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *OutgoingLetterRepository) find(ctx context.Context, db *gorm.DB, id int64) (model.OutgoingLetterEntity, bool, error) {
	var record model.OutgoingLetterEntity
	if err := db.WithContext(ctx).First(&record, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.OutgoingLetterEntity{}, false, nil
		}
		return model.OutgoingLetterEntity{}, false, fmt.Errorf("find outgoing letter: %w", err)
	}
	return record, true, nil
}

func normalizePage(page int, limit int) (int, int) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func parseLetterDate(value string) (time.Time, error) {
	parsed, err := time.Parse("2006-01-02", strings.TrimSpace(value))
	if err != nil {
		return time.Time{}, fmt.Errorf("tanggal surat tidak valid")
	}
	return parsed, nil
}

func payloadToOutgoingLetterEntity(payload model.OutgoingLetterPayload, letterDate time.Time, userID int64) model.OutgoingLetterEntity {
	return model.OutgoingLetterEntity{
		LetterType:        payload.LetterType,
		Classification:    payload.Classification,
		LetterNumber:      strings.TrimSpace(payload.LetterNumber),
		LetterDate:        letterDate,
		Recipient:         strings.TrimSpace(payload.Recipient),
		Subject:           strings.TrimSpace(payload.Subject),
		OpeningText:       strings.TrimSpace(payload.OpeningText),
		SectionAAA:        payload.SectionAAA,
		SectionBBB:        strings.TrimSpace(payload.SectionBBB),
		SectionCCC:        strings.TrimSpace(payload.SectionCCC),
		SectionDDD:        strings.TrimSpace(payload.SectionDDD),
		SenderAgency:      strings.TrimSpace(payload.SenderAgency),
		FromText:          strings.TrimSpace(payload.FromText),
		ToText:            strings.TrimSpace(payload.ToText),
		CopyTo:            trimStrings(payload.CopyTo),
		SignatoryName:     strings.TrimSpace(payload.SignatoryName),
		SignatoryPosition: strings.TrimSpace(payload.SignatoryPosition),
		SignatoryRank:     strings.TrimSpace(payload.SignatoryRank),
		SignatoryNIP:      strings.TrimSpace(payload.SignatoryNIP),
		Status:            payload.Status,
		CreatedBy:         userID,
		UpdatedBy:         userID,
	}
}

func applyOutgoingLetterPayload(record *model.OutgoingLetterEntity, payload model.OutgoingLetterPayload, letterDate time.Time, userID int64) {
	record.LetterType = payload.LetterType
	record.Classification = payload.Classification
	record.LetterNumber = strings.TrimSpace(payload.LetterNumber)
	record.LetterDate = letterDate
	record.Recipient = strings.TrimSpace(payload.Recipient)
	record.Subject = strings.TrimSpace(payload.Subject)
	record.OpeningText = strings.TrimSpace(payload.OpeningText)
	record.SectionAAA = payload.SectionAAA
	record.SectionBBB = strings.TrimSpace(payload.SectionBBB)
	record.SectionCCC = strings.TrimSpace(payload.SectionCCC)
	record.SectionDDD = strings.TrimSpace(payload.SectionDDD)
	record.SenderAgency = strings.TrimSpace(payload.SenderAgency)
	record.FromText = strings.TrimSpace(payload.FromText)
	record.ToText = strings.TrimSpace(payload.ToText)
	record.CopyTo = trimStrings(payload.CopyTo)
	record.SignatoryName = strings.TrimSpace(payload.SignatoryName)
	record.SignatoryPosition = strings.TrimSpace(payload.SignatoryPosition)
	record.SignatoryRank = strings.TrimSpace(payload.SignatoryRank)
	record.SignatoryNIP = strings.TrimSpace(payload.SignatoryNIP)
	record.Status = payload.Status
	record.UpdatedBy = userID
	record.UpdatedAt = time.Now()
}

func trimStrings(values []string) []string {
	items := make([]string, 0, len(values))
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			items = append(items, trimmed)
		}
	}
	return items
}
