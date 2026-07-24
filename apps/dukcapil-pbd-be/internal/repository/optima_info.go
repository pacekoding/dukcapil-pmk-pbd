package repository

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/url"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

var ErrOptimaInfoSlugExists = errors.New("optima info slug already exists")

type OptimaInfoRepository struct {
	db *gorm.DB
}

func NewOptimaInfoRepository(db *gorm.DB) *OptimaInfoRepository {
	return &OptimaInfoRepository{db: db}
}

func (r *OptimaInfoRepository) ListAdmin(ctx context.Context, params model.OptimaInfoAdminListParams) (model.OptimaInfoAdminListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoAdminListResponse{}, err
	}

	params = normalizeOptimaInfoAdminParams(params)

	var total int64
	if err := r.adminQuery(db, params).Count(&total).Error; err != nil {
		return model.OptimaInfoAdminListResponse{}, fmt.Errorf("count optima info articles: %w", err)
	}

	items := make([]model.OptimaInfoSummary, 0)
	if err := r.adminQuery(db, params).
		Select(optimaInfoSummarySelect()).
		Order(optimaInfoAdminOrder()).
		Offset((params.Page - 1) * params.Limit).
		Limit(params.Limit).
		Scan(&items).Error; err != nil {
		return model.OptimaInfoAdminListResponse{}, fmt.Errorf("list optima info articles: %w", err)
	}
	finalizeOptimaInfoSummaries(items, optimaInfoAdminAssetBuilder)

	stats, err := r.stats(db)
	if err != nil {
		return model.OptimaInfoAdminListResponse{}, err
	}
	categories, err := r.categories(db, false)
	if err != nil {
		return model.OptimaInfoAdminListResponse{}, err
	}

	return model.OptimaInfoAdminListResponse{
		Items: items,
		Meta: model.OptimaInfoMeta{
			Page:       params.Page,
			Limit:      params.Limit,
			Total:      total,
			TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
		},
		Stats:      stats,
		Categories: categories,
	}, nil
}

func (r *OptimaInfoRepository) Detail(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}

	var detail model.OptimaInfoDetail
	err = db.Table("optima_info_articles AS a").
		Where("a.id = ?", id).
		Select(optimaInfoDetailSelectWithAlias("a")).
		Take(&detail).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.OptimaInfoDetail{}, false, nil
		}
		return model.OptimaInfoDetail{}, false, fmt.Errorf("detail optima info article: %w", err)
	}

	finalizeOptimaInfoDetail(&detail, optimaInfoAdminAssetBuilder)
	contentImages, err := storedFilesForEntity(db, "optima-info", "optima_info_article", detail.ID, "content-image", false)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}
	detail.ContentImages = contentImages
	related, err := r.relatedItems(db, detail.ID, detail.Category, false)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}
	detail.Related = related
	return detail, true, nil
}

func (r *OptimaInfoRepository) PublicDetailBySlug(ctx context.Context, slug string) (model.OptimaInfoDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}

	var detail model.OptimaInfoDetail
	err = r.publicQuery(db, model.OptimaInfoPublicListParams{}).
		Where("LOWER(a.slug) = ?", strings.ToLower(strings.TrimSpace(slug))).
		Select(optimaInfoDetailSelectWithAlias("a")).
		Take(&detail).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.OptimaInfoDetail{}, false, nil
		}
		return model.OptimaInfoDetail{}, false, fmt.Errorf("public optima info detail: %w", err)
	}

	finalizeOptimaInfoDetail(&detail, optimaInfoPublicAssetBuilder)
	contentImages, err := storedFilesForEntity(db, "optima-info", "optima_info_article", detail.ID, "content-image", true)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}
	detail.ContentImages = contentImages
	related, err := r.relatedItems(db, detail.ID, detail.Category, true)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}
	detail.Related = related
	return detail, true, nil
}

func (r *OptimaInfoRepository) Create(ctx context.Context, input model.OptimaInfoMutation) (model.OptimaInfoDetail, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoDetail{}, err
	}

	slug := strings.ToLower(strings.TrimSpace(input.Payload.Slug))
	exists, err := r.slugExists(db, slug, 0)
	if err != nil {
		return model.OptimaInfoDetail{}, err
	}
	if exists {
		return model.OptimaInfoDetail{}, ErrOptimaInfoSlugExists
	}

	entity := model.OptimaInfoArticleEntity{
		Title:                  strings.TrimSpace(input.Payload.Title),
		Slug:                   slug,
		Category:               strings.TrimSpace(input.Payload.Category),
		Summary:                strings.TrimSpace(input.Payload.Summary),
		Content:                strings.TrimSpace(input.Payload.Content),
		ThumbnailURL:           strings.TrimSpace(input.ThumbnailURL),
		ThumbnailOriginalName:  strings.TrimSpace(input.ThumbnailOriginalName),
		ThumbnailMimeType:      strings.TrimSpace(input.ThumbnailMimeType),
		ThumbnailSize:          input.ThumbnailSize,
		AttachmentURL:          strings.TrimSpace(input.AttachmentURL),
		AttachmentOriginalName: strings.TrimSpace(input.AttachmentOriginalName),
		AttachmentMimeType:     strings.TrimSpace(input.AttachmentMimeType),
		AttachmentSize:         input.AttachmentSize,
		ExternalURL:            strings.TrimSpace(input.Payload.ExternalURL),
		DisplayOrder:           input.Payload.DisplayOrder,
		IsFeatured:             input.Payload.IsFeatured,
		Status:                 model.OptimaInfoStatusDraft,
		StartDate:              input.StartDate,
		EndDate:                input.EndDate,
		AuthorUserID:           input.AuthorUserID,
		AuthorName:             strings.TrimSpace(input.AuthorName),
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&entity).Error; err != nil {
			return err
		}
		updates := map[string]any{}
		if input.ThumbnailFile != nil {
			file, err := createStoredFileRecord(tx, *input.ThumbnailFile, entity.ID)
			if err != nil {
				return err
			}
			entity.ThumbnailFileID = &file.ID
			updates["thumbnail_file_id"] = file.ID
		}
		if input.AttachmentFile != nil {
			file, err := createStoredFileRecord(tx, *input.AttachmentFile, entity.ID)
			if err != nil {
				return err
			}
			entity.AttachmentFileID = &file.ID
			updates["attachment_file_id"] = file.ID
		}
		if len(updates) > 0 {
			if err := tx.Table("optima_info_articles").Where("id = ?", entity.ID).Updates(updates).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return model.OptimaInfoDetail{}, fmt.Errorf("create optima info article: %w", err)
	}

	detail, found, err := r.Detail(ctx, entity.ID)
	if err != nil {
		return model.OptimaInfoDetail{}, err
	}
	if !found {
		return model.OptimaInfoDetail{}, fmt.Errorf("created optima info article not found")
	}
	return detail, nil
}

func (r *OptimaInfoRepository) Update(ctx context.Context, id int64, input model.OptimaInfoMutation) (model.OptimaInfoDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}

	slug := strings.ToLower(strings.TrimSpace(input.Payload.Slug))
	exists, err := r.slugExists(db, slug, id)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}
	if exists {
		return model.OptimaInfoDetail{}, false, ErrOptimaInfoSlugExists
	}

	updates := map[string]any{
		"title":                    strings.TrimSpace(input.Payload.Title),
		"slug":                     slug,
		"category":                 strings.TrimSpace(input.Payload.Category),
		"summary":                  strings.TrimSpace(input.Payload.Summary),
		"content":                  strings.TrimSpace(input.Payload.Content),
		"thumbnail_url":            strings.TrimSpace(input.ThumbnailURL),
		"thumbnail_original_name":  strings.TrimSpace(input.ThumbnailOriginalName),
		"thumbnail_mime_type":      strings.TrimSpace(input.ThumbnailMimeType),
		"thumbnail_size":           input.ThumbnailSize,
		"attachment_url":           strings.TrimSpace(input.AttachmentURL),
		"attachment_original_name": strings.TrimSpace(input.AttachmentOriginalName),
		"attachment_mime_type":     strings.TrimSpace(input.AttachmentMimeType),
		"attachment_size":          input.AttachmentSize,
		"external_url":             strings.TrimSpace(input.Payload.ExternalURL),
		"display_order":            input.Payload.DisplayOrder,
		"is_featured":              input.Payload.IsFeatured,
		"start_date":               input.StartDate,
		"end_date":                 input.EndDate,
		"updated_at":               gorm.Expr("NOW()"),
	}

	found := true
	err = db.Transaction(func(tx *gorm.DB) error {
		var current model.OptimaInfoArticleEntity
		if err := tx.Where("id = ?", id).Take(&current).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				found = false
				return nil
			}
			return err
		}

		if input.ThumbnailFile != nil {
			file, err := createStoredFileRecord(tx, *input.ThumbnailFile, id)
			if err != nil {
				return err
			}
			updates["thumbnail_file_id"] = file.ID
			if current.ThumbnailFileID != nil {
				if err := softDeleteStoredFileRecord(tx, *current.ThumbnailFileID); err != nil {
					return err
				}
			}
		} else if input.Payload.RemoveThumbnail {
			updates["thumbnail_file_id"] = nil
			if current.ThumbnailFileID != nil {
				if err := softDeleteStoredFileRecord(tx, *current.ThumbnailFileID); err != nil {
					return err
				}
			}
		}

		if input.AttachmentFile != nil {
			file, err := createStoredFileRecord(tx, *input.AttachmentFile, id)
			if err != nil {
				return err
			}
			updates["attachment_file_id"] = file.ID
			if current.AttachmentFileID != nil {
				if err := softDeleteStoredFileRecord(tx, *current.AttachmentFileID); err != nil {
					return err
				}
			}
		} else if input.Payload.RemoveAttachment {
			updates["attachment_file_id"] = nil
			if current.AttachmentFileID != nil {
				if err := softDeleteStoredFileRecord(tx, *current.AttachmentFileID); err != nil {
					return err
				}
			}
		}

		return tx.Table("optima_info_articles").Where("id = ?", id).Updates(updates).Error
	})
	if err != nil {
		return model.OptimaInfoDetail{}, false, fmt.Errorf("update optima info article: %w", err)
	}
	if !found {
		return model.OptimaInfoDetail{}, false, nil
	}
	return r.Detail(ctx, id)
}

func (r *OptimaInfoRepository) Delete(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error) {
	detail, found, err := r.Detail(ctx, id)
	if err != nil || !found {
		return detail, found, err
	}

	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := softDeleteStoredFilesForEntity(tx, "optima-info", "optima_info_article", id); err != nil {
			return err
		}
		result := tx.Table("optima_info_articles").Where("id = ?", id).Delete(&model.OptimaInfoArticleEntity{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.OptimaInfoDetail{}, false, nil
	}
	if err != nil {
		return model.OptimaInfoDetail{}, false, fmt.Errorf("delete optima info article: %w", err)
	}
	return detail, true, nil
}

func (r *OptimaInfoRepository) Publish(ctx context.Context, id int64, actorUserID *int64, actorName string) (model.OptimaInfoDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Table("optima_info_articles").
			Where("id = ?", id).
			Updates(map[string]any{
				"status":               model.OptimaInfoStatusPublished,
				"published_by_user_id": actorUserID,
				"published_by_name":    strings.TrimSpace(actorName),
				"published_at":         gorm.Expr("NOW()"),
				"updated_at":           gorm.Expr("NOW()"),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return updateStoredFileVisibilityForEntity(
			tx,
			"optima-info",
			"optima_info_article",
			id,
			model.FileVisibilityPublic,
		)
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.OptimaInfoDetail{}, false, nil
		}
		return model.OptimaInfoDetail{}, false, fmt.Errorf("publish optima info article: %w", err)
	}
	return r.Detail(ctx, id)
}

func (r *OptimaInfoRepository) Unpublish(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error) {
	return r.updateStatus(ctx, id, map[string]any{
		"status":               model.OptimaInfoStatusDraft,
		"published_by_user_id": nil,
		"published_by_name":    "",
		"published_at":         nil,
		"updated_at":           gorm.Expr("NOW()"),
	}, model.FileVisibilityPrivate, "unpublish")
}

func (r *OptimaInfoRepository) Archive(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error) {
	return r.updateStatus(ctx, id, map[string]any{
		"status":     model.OptimaInfoStatusArchived,
		"updated_at": gorm.Expr("NOW()"),
	}, model.FileVisibilityPrivate, "archive")
}

func (r *OptimaInfoRepository) PublicList(ctx context.Context, params model.OptimaInfoPublicListParams) (model.OptimaInfoPublicListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoPublicListResponse{}, err
	}

	params = normalizeOptimaInfoPublicParams(params)

	var total int64
	if err := r.publicQuery(db, params).Count(&total).Error; err != nil {
		return model.OptimaInfoPublicListResponse{}, fmt.Errorf("count public optima info articles: %w", err)
	}

	items := make([]model.OptimaInfoSummary, 0)
	if err := r.publicQuery(db, params).
		Select(optimaInfoSummarySelectWithAlias("a")).
		Order(optimaInfoPublicOrder()).
		Offset((params.Page - 1) * params.Limit).
		Limit(params.Limit).
		Scan(&items).Error; err != nil {
		return model.OptimaInfoPublicListResponse{}, fmt.Errorf("list public optima info articles: %w", err)
	}
	finalizeOptimaInfoSummaries(items, optimaInfoPublicAssetBuilder)

	featured := make([]model.OptimaInfoSummary, 0)
	if err := r.publicQuery(db, model.OptimaInfoPublicListParams{}).
		Where("a.is_featured = TRUE").
		Select(optimaInfoSummarySelectWithAlias("a")).
		Order(optimaInfoPublicOrder()).
		Limit(4).
		Scan(&featured).Error; err != nil {
		return model.OptimaInfoPublicListResponse{}, fmt.Errorf("list featured optima info articles: %w", err)
	}
	finalizeOptimaInfoSummaries(featured, optimaInfoPublicAssetBuilder)

	categories, err := r.categories(db, true)
	if err != nil {
		return model.OptimaInfoPublicListResponse{}, err
	}

	return model.OptimaInfoPublicListResponse{
		Items:    items,
		Featured: featured,
		Meta: model.OptimaInfoMeta{
			Page:       params.Page,
			Limit:      params.Limit,
			Total:      total,
			TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
		},
		Categories: categories,
	}, nil
}

func (r *OptimaInfoRepository) CreateContentImage(
	ctx context.Context,
	articleID int64,
	input model.StoredFileInput,
) (model.StoredFile, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.StoredFile{}, false, err
	}

	var file model.StoredFile
	found := true
	err = db.Transaction(func(tx *gorm.DB) error {
		var status model.OptimaInfoStatus
		if err := tx.Table("optima_info_articles").Where("id = ?", articleID).Pluck("status", &status).Error; err != nil {
			return err
		}
		if status == "" {
			found = false
			return nil
		}
		if status == model.OptimaInfoStatusPublished {
			input.Visibility = model.FileVisibilityPublic
		} else {
			input.Visibility = model.FileVisibilityPrivate
		}
		created, err := createStoredFileRecord(tx, input, articleID)
		if err != nil {
			return err
		}
		file = created
		return nil
	})
	if err != nil {
		return model.StoredFile{}, false, fmt.Errorf("create optima info content image: %w", err)
	}
	if !found {
		return model.StoredFile{}, false, nil
	}
	return finalizeStoredFile(file, false), true, nil
}

func (r *OptimaInfoRepository) DeleteContentImage(
	ctx context.Context,
	articleID int64,
	fileID int64,
) (model.StoredFile, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.StoredFile{}, false, err
	}

	var file model.StoredFile
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Table("stored_files").
			Where(`
				id = ?
				AND module = 'optima-info'
				AND related_entity_type = 'optima_info_article'
				AND related_entity_id = ?
				AND category = 'content-image'
				AND deleted_at IS NULL
			`, fileID, articleID).
			Take(&file)
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		}
		if result.Error != nil {
			return result.Error
		}
		return softDeleteStoredFileRecord(tx, fileID)
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.StoredFile{}, false, nil
	}
	if err != nil {
		return model.StoredFile{}, false, fmt.Errorf("delete optima info content image: %w", err)
	}
	return finalizeStoredFile(file, false), true, nil
}

func (r *OptimaInfoRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func (r *OptimaInfoRepository) stats(db *gorm.DB) (model.OptimaInfoStats, error) {
	var stats model.OptimaInfoStats
	err := db.Table("optima_info_articles").
		Select(`
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status = 'Draft') AS draft,
			COUNT(*) FILTER (WHERE status = 'Published') AS published,
			COUNT(*) FILTER (WHERE status = 'Archived') AS archived
		`).
		Scan(&stats).Error
	if err != nil {
		return model.OptimaInfoStats{}, fmt.Errorf("optima info stats: %w", err)
	}
	return stats, nil
}

func (r *OptimaInfoRepository) categories(db *gorm.DB, publicOnly bool) ([]string, error) {
	query := db.Table("optima_info_articles")
	if publicOnly {
		query = query.Where(`
			status = ? AND
			(start_date IS NULL OR start_date <= CURRENT_DATE) AND
			(end_date IS NULL OR end_date >= CURRENT_DATE)
		`, model.OptimaInfoStatusPublished)
	}
	categories := make([]string, 0)
	if err := query.
		Where("BTRIM(category) <> ''").
		Distinct("category").
		Order("category ASC").
		Pluck("category", &categories).Error; err != nil {
		return nil, fmt.Errorf("list optima info categories: %w", err)
	}
	return categories, nil
}

func (r *OptimaInfoRepository) relatedItems(db *gorm.DB, currentID int64, category string, publicOnly bool) ([]model.OptimaInfoRelatedItem, error) {
	query := db.Table("optima_info_articles")
	if publicOnly {
		query = query.Where(`
			status = ? AND
			(start_date IS NULL OR start_date <= CURRENT_DATE) AND
			(end_date IS NULL OR end_date >= CURRENT_DATE)
		`, model.OptimaInfoStatusPublished)
	}
	query = query.Where("id <> ?", currentID)
	if strings.TrimSpace(category) != "" {
		query = query.Where("LOWER(category) = ?", strings.ToLower(strings.TrimSpace(category)))
	}

	items := make([]model.OptimaInfoRelatedItem, 0)
	if err := query.
		Select(`
			id,
			title,
			slug,
			category,
			summary,
			COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS published_at,
			updated_at,
			thumbnail_url,
			thumbnail_file_id
		`).
		Order("published_at DESC NULLS LAST, updated_at DESC, id DESC").
		Limit(3).
		Scan(&items).Error; err != nil {
		return nil, fmt.Errorf("list related optima info articles: %w", err)
	}
	for index := range items {
		switch {
		case items[index].ThumbnailFileID != nil && *items[index].ThumbnailFileID > 0:
			items[index].ThumbnailURL = fmt.Sprintf(
				"/api/backend/website/files/%d/preview",
				*items[index].ThumbnailFileID,
			)
		case strings.TrimSpace(items[index].ThumbnailStorageURL) != "":
			items[index].ThumbnailURL = optimaInfoPublicThumbnailPath(items[index].Slug)
		}
	}
	return items, nil
}

func (r *OptimaInfoRepository) adminQuery(db *gorm.DB, params model.OptimaInfoAdminListParams) *gorm.DB {
	query := db.Table("optima_info_articles")
	search := strings.ToLower(strings.TrimSpace(params.Search))
	if search != "" {
		like := "%" + search + "%"
		query = query.Where(`
			LOWER(title) LIKE ? OR
			LOWER(slug) LIKE ? OR
			LOWER(category) LIKE ? OR
			LOWER(summary) LIKE ? OR
			LOWER(author_name) LIKE ?
		`, like, like, like, like, like)
	}
	if category := strings.TrimSpace(params.Category); category != "" {
		query = query.Where("LOWER(category) = ?", strings.ToLower(category))
	}
	if status := strings.TrimSpace(params.Status); status != "" {
		query = query.Where("status = ?", status)
	}
	if year := strings.TrimSpace(params.Year); year != "" {
		query = query.Where("TO_CHAR(COALESCE(published_at, created_at), 'YYYY') = ?", year)
	}
	return query
}

func (r *OptimaInfoRepository) publicQuery(db *gorm.DB, params model.OptimaInfoPublicListParams) *gorm.DB {
	query := db.Table("optima_info_articles AS a").
		Where(`
			a.status = ? AND
			(a.start_date IS NULL OR a.start_date <= CURRENT_DATE) AND
			(a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
		`, model.OptimaInfoStatusPublished)
	search := strings.ToLower(strings.TrimSpace(params.Search))
	if search != "" {
		like := "%" + search + "%"
		query = query.Where(`
			LOWER(a.title) LIKE ? OR
			LOWER(a.category) LIKE ? OR
			LOWER(a.summary) LIKE ? OR
			LOWER(a.content) LIKE ?
		`, like, like, like, like)
	}
	if category := strings.TrimSpace(params.Category); category != "" {
		query = query.Where("LOWER(a.category) = ?", strings.ToLower(category))
	}
	return query
}

func (r *OptimaInfoRepository) slugExists(db *gorm.DB, slug string, excludeID int64) (bool, error) {
	var count int64
	query := db.Table("optima_info_articles").Where("LOWER(slug) = ?", strings.ToLower(strings.TrimSpace(slug)))
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, fmt.Errorf("check optima info slug: %w", err)
	}
	return count > 0, nil
}

func (r *OptimaInfoRepository) updateStatus(
	ctx context.Context,
	id int64,
	updates map[string]any,
	visibility model.FileVisibility,
	action string,
) (model.OptimaInfoDetail, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.OptimaInfoDetail{}, false, err
	}

	found := true
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Table("optima_info_articles").Where("id = ?", id).Updates(updates)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			found = false
			return nil
		}
		return updateStoredFileVisibilityForEntity(
			tx,
			"optima-info",
			"optima_info_article",
			id,
			visibility,
		)
	})
	if err != nil {
		return model.OptimaInfoDetail{}, false, fmt.Errorf("%s optima info article: %w", action, err)
	}
	if !found {
		return model.OptimaInfoDetail{}, false, nil
	}
	return r.Detail(ctx, id)
}

func normalizeOptimaInfoAdminParams(params model.OptimaInfoAdminListParams) model.OptimaInfoAdminListParams {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Limit > 100 {
		params.Limit = 100
	}
	return params
}

func normalizeOptimaInfoPublicParams(params model.OptimaInfoPublicListParams) model.OptimaInfoPublicListParams {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 9
	}
	if params.Limit > 100 {
		params.Limit = 100
	}
	return params
}

func optimaInfoSummarySelect() string {
	return optimaInfoSummarySelectWithAlias("")
}

func optimaInfoSummarySelectWithAlias(alias string) string {
	prefix := alias
	if prefix != "" {
		prefix += "."
	}
	return fmt.Sprintf(`
		%[1]sid,
		%[1]stitle,
		%[1]sslug,
		%[1]scategory,
		%[1]ssummary,
		%[1]sstatus,
		%[1]sdisplay_order,
		%[1]sis_featured,
		%[1]sauthor_name,
		%[1]spublished_by_name,
		COALESCE(TO_CHAR(%[1]spublished_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS published_at,
		COALESCE(TO_CHAR(%[1]sstart_date, 'YYYY-MM-DD'), '') AS start_date,
		COALESCE(TO_CHAR(%[1]send_date, 'YYYY-MM-DD'), '') AS end_date,
		%[1]supdated_at,
		%[1]screated_at,
		%[1]sthumbnail_url,
		%[1]sthumbnail_file_id,
		%[1]sattachment_url,
		%[1]sattachment_file_id
	`, prefix)
}

func optimaInfoDetailSelect() string {
	return optimaInfoDetailSelectWithAlias("")
}

func optimaInfoDetailSelectWithAlias(alias string) string {
	prefix := alias
	if prefix != "" {
		prefix += "."
	}
	return fmt.Sprintf(`
		%[1]sid,
		%[1]stitle,
		%[1]sslug,
		%[1]scategory,
		%[1]ssummary,
		%[1]scontent,
		%[1]sstatus,
		%[1]sexternal_url,
		%[1]sdisplay_order,
		%[1]sis_featured,
		%[1]sauthor_name,
		%[1]spublished_by_name,
		COALESCE(TO_CHAR(%[1]spublished_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS published_at,
		COALESCE(TO_CHAR(%[1]sstart_date, 'YYYY-MM-DD'), '') AS start_date,
		COALESCE(TO_CHAR(%[1]send_date, 'YYYY-MM-DD'), '') AS end_date,
		%[1]screated_at,
		%[1]supdated_at,
		%[1]sthumbnail_file_id,
		COALESCE(
			(SELECT f.storage_key FROM stored_files f WHERE f.id = %[1]sthumbnail_file_id AND f.deleted_at IS NULL),
			%[1]sthumbnail_url
		) AS thumbnail_url,
		COALESCE(
			(SELECT f.original_filename FROM stored_files f WHERE f.id = %[1]sthumbnail_file_id AND f.deleted_at IS NULL),
			%[1]sthumbnail_original_name
		) AS thumbnail_original_name,
		COALESCE(
			(SELECT f.mime_type FROM stored_files f WHERE f.id = %[1]sthumbnail_file_id AND f.deleted_at IS NULL),
			%[1]sthumbnail_mime_type
		) AS thumbnail_mime_type,
		COALESCE(
			(SELECT f.file_size FROM stored_files f WHERE f.id = %[1]sthumbnail_file_id AND f.deleted_at IS NULL),
			%[1]sthumbnail_size
		) AS thumbnail_size,
		COALESCE(
			(SELECT f.checksum_sha256 FROM stored_files f WHERE f.id = %[1]sthumbnail_file_id AND f.deleted_at IS NULL),
			''
		) AS thumbnail_checksum_sha256,
		%[1]sattachment_file_id,
		COALESCE(
			(SELECT f.storage_key FROM stored_files f WHERE f.id = %[1]sattachment_file_id AND f.deleted_at IS NULL),
			%[1]sattachment_url
		) AS attachment_url,
		COALESCE(
			(SELECT f.original_filename FROM stored_files f WHERE f.id = %[1]sattachment_file_id AND f.deleted_at IS NULL),
			%[1]sattachment_original_name
		) AS attachment_original_name,
		COALESCE(
			(SELECT f.mime_type FROM stored_files f WHERE f.id = %[1]sattachment_file_id AND f.deleted_at IS NULL),
			%[1]sattachment_mime_type
		) AS attachment_mime_type,
		COALESCE(
			(SELECT f.file_size FROM stored_files f WHERE f.id = %[1]sattachment_file_id AND f.deleted_at IS NULL),
			%[1]sattachment_size
		) AS attachment_size,
		COALESCE(
			(SELECT f.checksum_sha256 FROM stored_files f WHERE f.id = %[1]sattachment_file_id AND f.deleted_at IS NULL),
			''
		) AS attachment_checksum_sha256
	`, prefix)
}

func optimaInfoAdminOrder() string {
	return "display_order ASC, updated_at DESC, id DESC"
}

func optimaInfoPublicOrder() string {
	return "is_featured DESC, display_order ASC, published_at DESC, updated_at DESC, id DESC"
}

type optimaInfoAssetBuilder struct {
	thumbnail func(id int64, slug string) string
	attach    func(id int64, slug string) string
	public    bool
}

var optimaInfoAdminAssetBuilder = optimaInfoAssetBuilder{
	thumbnail: func(id int64, _ string) string {
		return fmt.Sprintf("/api/backend/optima-info/%d/thumbnail", id)
	},
	attach: func(id int64, _ string) string {
		return fmt.Sprintf("/api/backend/optima-info/%d/attachment", id)
	},
}

var optimaInfoPublicAssetBuilder = optimaInfoAssetBuilder{
	thumbnail: func(_ int64, slug string) string {
		return optimaInfoPublicThumbnailPath(slug)
	},
	attach: func(_ int64, slug string) string {
		return optimaInfoPublicAttachmentPath(slug)
	},
	public: true,
}

func optimaInfoPublicThumbnailPath(slug string) string {
	return fmt.Sprintf("/api/backend/website/informasi/%s/thumbnail", strings.TrimSpace(slug))
}

func optimaInfoPublicAttachmentPath(slug string) string {
	return fmt.Sprintf("/api/backend/website/informasi/%s/attachment", strings.TrimSpace(slug))
}

func finalizeOptimaInfoSummaries(items []model.OptimaInfoSummary, builder optimaInfoAssetBuilder) {
	for index := range items {
		if items[index].ThumbnailFileID != nil && *items[index].ThumbnailFileID > 0 {
			if builder.public {
				items[index].ThumbnailURL = fmt.Sprintf("/api/backend/website/files/%d/preview", *items[index].ThumbnailFileID)
			} else {
				items[index].ThumbnailURL = fmt.Sprintf("/api/backend/files/%d/preview", *items[index].ThumbnailFileID)
			}
		} else if assetURL := optimaInfoBrowserAssetURL(items[index].ThumbnailStorageURL); assetURL != "" {
			items[index].ThumbnailURL = assetURL
		} else if strings.TrimSpace(items[index].ThumbnailStorageURL) != "" {
			items[index].ThumbnailURL = builder.thumbnail(items[index].ID, items[index].Slug)
		}
		if items[index].AttachmentFileID != nil && *items[index].AttachmentFileID > 0 {
			if builder.public {
				items[index].AttachmentDownloadURL = fmt.Sprintf("/api/backend/website/files/%d/download", *items[index].AttachmentFileID)
			} else {
				items[index].AttachmentDownloadURL = fmt.Sprintf("/api/backend/files/%d/download", *items[index].AttachmentFileID)
			}
		} else if assetURL := optimaInfoBrowserAssetURL(items[index].AttachmentStorageURL); assetURL != "" {
			items[index].AttachmentDownloadURL = assetURL
		} else if strings.TrimSpace(items[index].AttachmentStorageURL) != "" {
			items[index].AttachmentDownloadURL = builder.attach(items[index].ID, items[index].Slug)
		}
	}
}

func finalizeOptimaInfoDetail(detail *model.OptimaInfoDetail, builder optimaInfoAssetBuilder) {
	if detail == nil {
		return
	}
	if detail.ThumbnailFileID != nil && *detail.ThumbnailFileID > 0 {
		if builder.public {
			detail.ThumbnailURL = fmt.Sprintf("/api/backend/website/files/%d/preview", *detail.ThumbnailFileID)
		} else {
			detail.ThumbnailURL = fmt.Sprintf("/api/backend/files/%d/preview", *detail.ThumbnailFileID)
		}
	} else if assetURL := optimaInfoBrowserAssetURL(detail.ThumbnailStorageURL); assetURL != "" {
		detail.ThumbnailURL = assetURL
	} else if strings.TrimSpace(detail.ThumbnailStorageURL) != "" {
		detail.ThumbnailURL = builder.thumbnail(detail.ID, detail.Slug)
	}
	if detail.AttachmentFileID != nil && *detail.AttachmentFileID > 0 {
		if builder.public {
			detail.AttachmentDownloadURL = fmt.Sprintf("/api/backend/website/files/%d/download", *detail.AttachmentFileID)
		} else {
			detail.AttachmentDownloadURL = fmt.Sprintf("/api/backend/files/%d/download", *detail.AttachmentFileID)
		}
	} else if assetURL := optimaInfoBrowserAssetURL(detail.AttachmentStorageURL); assetURL != "" {
		detail.AttachmentDownloadURL = assetURL
	} else if strings.TrimSpace(detail.AttachmentStorageURL) != "" {
		detail.AttachmentDownloadURL = builder.attach(detail.ID, detail.Slug)
	}
}

func optimaInfoBrowserAssetURL(storageURL string) string {
	trimmed := strings.TrimSpace(storageURL)
	if trimmed == "" {
		return ""
	}
	if parsed, err := url.Parse(trimmed); err == nil && parsed.Path != "" && parsed.Scheme != "" {
		trimmed = parsed.Path
	}
	trimmed = strings.TrimPrefix(trimmed, "/")
	switch {
	case strings.HasPrefix(trimmed, "api/backend/optima-info/"):
		return "/" + trimmed
	case strings.HasPrefix(trimmed, "api/backend/op_info/"):
		return "/api/backend/optima-info/" + strings.TrimPrefix(trimmed, "api/backend/op_info/")
	case strings.HasPrefix(trimmed, "api/v1/optima-info/"):
		return "/api/backend/optima-info/" + strings.TrimPrefix(trimmed, "api/v1/optima-info/")
	case strings.HasPrefix(trimmed, "api/v1/op_info/"):
		return "/api/backend/optima-info/" + strings.TrimPrefix(trimmed, "api/v1/op_info/")
	default:
		return ""
	}
}
