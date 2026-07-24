package controller

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"dukcapil-pbd-be/internal/security"

	"github.com/labstack/echo"
)

var (
	optimaInfoYearPattern       = regexp.MustCompile(`^\d{4}$`)
	optimaInfoSlugPattern       = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	optimaInfoStripTagPattern   = regexp.MustCompile(`<[^>]+>`)
	optimaInfoScriptPattern     = regexp.MustCompile(`(?is)<(?:script|style|iframe|object|embed)[^>]*>.*?</(?:script|style|iframe|object|embed)>`)
	optimaInfoOnAttrPattern     = regexp.MustCompile(`(?i)\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')`)
	optimaInfoJSProtocolPattern = regexp.MustCompile(`(?i)(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')`)
	optimaInfoWhitespacePattern = regexp.MustCompile(`\s+`)
)

type OptimaInfoStore interface {
	ListAdmin(ctx context.Context, params model.OptimaInfoAdminListParams) (model.OptimaInfoAdminListResponse, error)
	Detail(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error)
	Create(ctx context.Context, input model.OptimaInfoMutation) (model.OptimaInfoDetail, error)
	Update(ctx context.Context, id int64, input model.OptimaInfoMutation) (model.OptimaInfoDetail, bool, error)
	Delete(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error)
	Publish(ctx context.Context, id int64, actorUserID *int64, actorName string) (model.OptimaInfoDetail, bool, error)
	Unpublish(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error)
	Archive(ctx context.Context, id int64) (model.OptimaInfoDetail, bool, error)
	PublicList(ctx context.Context, params model.OptimaInfoPublicListParams) (model.OptimaInfoPublicListResponse, error)
	PublicDetailBySlug(ctx context.Context, slug string) (model.OptimaInfoDetail, bool, error)
	CreateContentImage(ctx context.Context, articleID int64, input model.StoredFileInput) (model.StoredFile, bool, error)
	DeleteContentImage(ctx context.Context, articleID int64, fileID int64) (model.StoredFile, bool, error)
}

type OptimaInfoController struct {
	store OptimaInfoStore
	files *fileasset.Service
}

func NewOptimaInfoController(store OptimaInfoStore, files ...*fileasset.Service) *OptimaInfoController {
	var service *fileasset.Service
	if len(files) > 0 {
		service = files[0]
	}
	return &OptimaInfoController{store: store, files: service}
}

func (o *OptimaInfoController) List(c echo.Context) error {
	response, err := o.store.ListAdmin(c.Request().Context(), model.OptimaInfoAdminListParams{
		Search:   c.QueryParam("search"),
		Category: c.QueryParam("category"),
		Status:   c.QueryParam("status"),
		Year:     c.QueryParam("year"),
		Page:     parsePositiveDocumentQueryInt(c.QueryParam("page"), 1),
		Limit:    parsePositiveDocumentQueryInt(c.QueryParam("limit"), 10),
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "daftar informasi gagal dimuat")
	}
	return jsonData(c, http.StatusOK, response)
}

func (o *OptimaInfoController) Detail(c echo.Context) error {
	article, _, err := o.detailByID(c)
	if err != nil {
		return err
	}
	return jsonData(c, http.StatusOK, article)
}

func (o *OptimaInfoController) Preview(c echo.Context) error {
	article, _, err := o.detailByID(c)
	if err != nil {
		return err
	}
	return jsonData(c, http.StatusOK, article)
}

func (o *OptimaInfoController) Create(c echo.Context) error {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	payload, mutation, cleanup, err := parseOptimaInfoMutation(c, nil, claims, o.files)
	if err != nil {
		return err
	}
	defer cleanup(false)
	if shouldRequireOptimaInfoPublishValidation(c) {
		if validationErr := validateOptimaInfoPublishable(payload, model.OptimaInfoDetail{}); validationErr != nil {
			return validationErr
		}
	}

	article, createErr := o.store.Create(c.Request().Context(), mutation)
	if createErr != nil {
		if errors.Is(createErr, repository.ErrOptimaInfoSlugExists) {
			return echo.NewHTTPError(http.StatusConflict, "slug informasi sudah digunakan")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "informasi gagal disimpan")
	}
	cleanup(true)
	return jsonData(c, http.StatusCreated, article)
}

func (o *OptimaInfoController) Update(c echo.Context) error {
	current, claims, err := o.detailByID(c)
	if err != nil {
		return err
	}

	payload, mutation, cleanup, parseErr := parseOptimaInfoMutation(c, &current, claims, o.files)
	if parseErr != nil {
		return parseErr
	}
	defer cleanup(false)
	if shouldRequireOptimaInfoPublishValidation(c) {
		if validationErr := validateOptimaInfoPublishable(payload, current); validationErr != nil {
			return validationErr
		}
	}

	id, idErr := optimaInfoID(c)
	if idErr != nil {
		return idErr
	}

	updated, found, updateErr := o.store.Update(c.Request().Context(), id, mutation)
	if updateErr != nil {
		if errors.Is(updateErr, repository.ErrOptimaInfoSlugExists) {
			return echo.NewHTTPError(http.StatusConflict, "slug informasi sudah digunakan")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "informasi gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	if current.ThumbnailStorageURL != "" && current.ThumbnailStorageURL != mutation.ThumbnailURL {
		deleteManagedStoredFile(c, o.files, current.ThumbnailStorageURL)
	}
	if current.AttachmentStorageURL != "" && current.AttachmentStorageURL != mutation.AttachmentURL {
		deleteManagedStoredFile(c, o.files, current.AttachmentStorageURL)
	}

	cleanup(true)
	return jsonData(c, http.StatusOK, updated)
}

func (o *OptimaInfoController) Delete(c echo.Context) error {
	article, _, err := o.detailByID(c)
	if err != nil {
		return err
	}

	id, idErr := optimaInfoID(c)
	if idErr != nil {
		return idErr
	}

	deleted, found, deleteErr := o.store.Delete(c.Request().Context(), id)
	if deleteErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "informasi gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	if deleted.ThumbnailStorageURL != "" {
		deleteManagedStoredFile(c, o.files, deleted.ThumbnailStorageURL)
	}
	if article.AttachmentStorageURL != "" {
		deleteManagedStoredFile(c, o.files, article.AttachmentStorageURL)
	}
	for _, image := range article.ContentImages {
		deleteManagedStoredFile(c, o.files, image.StorageKey)
	}
	return c.NoContent(http.StatusNoContent)
}

func (o *OptimaInfoController) Publish(c echo.Context) error {
	article, claims, err := o.detailByID(c)
	if err != nil {
		return err
	}
	if validationErr := validateOptimaInfoPublishable(model.OptimaInfoArticlePayload{
		Title:    article.Title,
		Category: article.Category,
		Content:  article.Content,
	}, article); validationErr != nil {
		return validationErr
	}
	id, idErr := optimaInfoID(c)
	if idErr != nil {
		return idErr
	}
	updated, found, publishErr := o.store.Publish(c.Request().Context(), id, &claims.UserID, claims.Name)
	if publishErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "informasi gagal diterbitkan")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, updated)
}

func (o *OptimaInfoController) Unpublish(c echo.Context) error {
	id, idErr := optimaInfoID(c)
	if idErr != nil {
		return idErr
	}
	updated, found, err := o.store.Unpublish(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "publikasi informasi gagal dibatalkan")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, updated)
}

func (o *OptimaInfoController) Archive(c echo.Context) error {
	id, idErr := optimaInfoID(c)
	if idErr != nil {
		return idErr
	}
	updated, found, err := o.store.Archive(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "informasi gagal diarsipkan")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, updated)
}

func (o *OptimaInfoController) Thumbnail(c echo.Context) error {
	article, _, err := o.detailByID(c)
	if err != nil {
		return err
	}
	return serveManagedStoredFile(
		c,
		o.files,
		article.ThumbnailStorageURL,
		article.ThumbnailMimeType,
		article.ThumbnailOriginalName,
		"inline",
		false,
	)
}

func (o *OptimaInfoController) Attachment(c echo.Context) error {
	article, _, err := o.detailByID(c)
	if err != nil {
		return err
	}
	return serveManagedStoredFile(
		c,
		o.files,
		article.AttachmentStorageURL,
		article.AttachmentMimeType,
		article.AttachmentOriginalName,
		documentRequestDisposition(c, "attachment"),
		false,
	)
}

func (o *OptimaInfoController) UploadContentImage(c echo.Context) error {
	article, claims, err := o.detailByID(c)
	if err != nil {
		return err
	}
	if o.files == nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "gambar informasi wajib diunggah")
	}
	visibility := model.FileVisibilityPrivate
	if article.Status == model.OptimaInfoStatusPublished {
		visibility = model.FileVisibilityPublic
	}
	year := strconv.Itoa(time.Now().Year())
	if !article.CreatedAt.IsZero() {
		year = strconv.Itoa(article.CreatedAt.Year())
	}
	saved, err := o.files.Save(c.Request().Context(), fileasset.SaveRequest{
		Header:            fileHeader,
		Kind:              fileasset.KindImage,
		Visibility:        visibility,
		StorageVisibility: model.FileVisibilityPublic,
		Module:            "optima-info",
		RelatedType:       "optima_info_article",
		Category:          "content-image",
		StorageCategory:   "images",
		Year:              year,
		UploadedBy:        &claims.UserID,
	})
	if err != nil {
		return managedUploadHTTPError(err)
	}

	file, found, err := o.store.CreateContentImage(c.Request().Context(), article.ID, saved)
	if err != nil {
		deleteManagedStoredFile(c, o.files, saved.StorageKey)
		return echo.NewHTTPError(http.StatusInternalServerError, "gambar informasi gagal disimpan")
	}
	if !found {
		deleteManagedStoredFile(c, o.files, saved.StorageKey)
		return echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	return jsonData(c, http.StatusCreated, file)
}

func (o *OptimaInfoController) DeleteContentImage(c echo.Context) error {
	article, _, err := o.detailByID(c)
	if err != nil {
		return err
	}
	fileID, err := storedFileID(c)
	if err != nil {
		return err
	}
	file, found, err := o.store.DeleteContentImage(c.Request().Context(), article.ID, fileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "gambar informasi gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "gambar informasi tidak ditemukan")
	}
	deleteManagedStoredFile(c, o.files, file.StorageKey)
	return c.NoContent(http.StatusNoContent)
}

func (o *OptimaInfoController) PublicList(c echo.Context) error {
	response, err := o.store.PublicList(c.Request().Context(), model.OptimaInfoPublicListParams{
		Search:   c.QueryParam("search"),
		Category: c.QueryParam("category"),
		Page:     parsePositiveDocumentQueryInt(c.QueryParam("page"), 1),
		Limit:    parsePositiveDocumentQueryInt(c.QueryParam("limit"), 9),
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "informasi publik gagal dimuat")
	}
	return jsonData(c, http.StatusOK, response)
}

func (o *OptimaInfoController) PublicDetail(c echo.Context) error {
	article, err := o.publicDetailBySlug(c)
	if err != nil {
		return err
	}
	return jsonData(c, http.StatusOK, article)
}

func (o *OptimaInfoController) PublicThumbnail(c echo.Context) error {
	article, err := o.publicDetailBySlug(c)
	if err != nil {
		return err
	}
	return serveManagedStoredFile(
		c,
		o.files,
		article.ThumbnailStorageURL,
		article.ThumbnailMimeType,
		article.ThumbnailOriginalName,
		"inline",
		true,
	)
}

func (o *OptimaInfoController) PublicAttachment(c echo.Context) error {
	article, err := o.publicDetailBySlug(c)
	if err != nil {
		return err
	}
	return serveManagedStoredFile(
		c,
		o.files,
		article.AttachmentStorageURL,
		article.AttachmentMimeType,
		article.AttachmentOriginalName,
		documentRequestDisposition(c, "attachment"),
		true,
	)
}

func (o *OptimaInfoController) detailByID(c echo.Context) (model.OptimaInfoDetail, security.Claims, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return model.OptimaInfoDetail{}, security.Claims{}, echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}
	id, err := optimaInfoID(c)
	if err != nil {
		return model.OptimaInfoDetail{}, security.Claims{}, err
	}
	article, found, detailErr := o.store.Detail(c.Request().Context(), id)
	if detailErr != nil {
		return model.OptimaInfoDetail{}, security.Claims{}, echo.NewHTTPError(http.StatusInternalServerError, "informasi gagal dimuat")
	}
	if !found {
		return model.OptimaInfoDetail{}, security.Claims{}, echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	return article, claims, nil
}

func (o *OptimaInfoController) publicDetailBySlug(c echo.Context) (model.OptimaInfoDetail, error) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		return model.OptimaInfoDetail{}, echo.NewHTTPError(http.StatusBadRequest, "slug informasi tidak valid")
	}
	article, found, err := o.store.PublicDetailBySlug(c.Request().Context(), slug)
	if err != nil {
		return model.OptimaInfoDetail{}, echo.NewHTTPError(http.StatusInternalServerError, "informasi publik gagal dimuat")
	}
	if !found {
		return model.OptimaInfoDetail{}, echo.NewHTTPError(http.StatusNotFound, "informasi tidak ditemukan")
	}
	return article, nil
}

func parseOptimaInfoMutation(
	c echo.Context,
	current *model.OptimaInfoDetail,
	claims security.Claims,
	files *fileasset.Service,
) (model.OptimaInfoArticlePayload, model.OptimaInfoMutation, func(bool), error) {
	payload := model.OptimaInfoArticlePayload{
		Title:            strings.TrimSpace(c.FormValue("title")),
		Slug:             strings.TrimSpace(c.FormValue("slug")),
		Category:         strings.TrimSpace(c.FormValue("category")),
		Summary:          strings.TrimSpace(c.FormValue("summary")),
		Content:          sanitizeOptimaInfoHTML(c.FormValue("content")),
		ExternalURL:      strings.TrimSpace(c.FormValue("externalUrl")),
		DisplayOrder:     parseOptimaInfoDisplayOrder(c.FormValue("displayOrder")),
		IsFeatured:       parseDocumentBoolForm(c.FormValue("isFeatured")),
		RemoveThumbnail:  parseDocumentBoolForm(c.FormValue("removeThumbnail")),
		RemoveAttachment: parseDocumentBoolForm(c.FormValue("removeAttachment")),
	}
	if payload.Slug == "" {
		payload.Slug = slugifyOptimaInfo(payload.Title)
	}
	if payload.Slug == "" {
		payload.Slug = fmt.Sprintf("draft-%d", time.Now().Unix())
	}
	if !optimaInfoSlugPattern.MatchString(payload.Slug) {
		return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, echo.NewHTTPError(http.StatusBadRequest, "slug informasi tidak valid")
	}
	if payload.DisplayOrder < 0 {
		return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, echo.NewHTTPError(http.StatusBadRequest, "urutan tampil tidak valid")
	}
	if externalURL := strings.TrimSpace(payload.ExternalURL); externalURL != "" {
		if _, err := url.ParseRequestURI(externalURL); err != nil {
			return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, echo.NewHTTPError(http.StatusBadRequest, "tautan eksternal tidak valid")
		}
	}

	startDate, err := parseOptimaInfoDate(c.FormValue("startDate"))
	if err != nil {
		return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, err
	}
	endDate, err := parseOptimaInfoDate(c.FormValue("endDate"))
	if err != nil {
		return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, err
	}
	if startDate != nil && endDate != nil && startDate.After(*endDate) {
		return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, echo.NewHTTPError(http.StatusBadRequest, "tanggal mulai tayang tidak boleh melebihi tanggal berakhir")
	}

	visibility := model.FileVisibilityPrivate
	if current != nil && current.Status == model.OptimaInfoStatusPublished {
		visibility = model.FileVisibilityPublic
	}
	uploadYear := strconv.Itoa(time.Now().Year())
	if current != nil && !current.CreatedAt.IsZero() {
		uploadYear = strconv.Itoa(current.CreatedAt.Year())
	}

	var cleanupPaths []string
	cleanupCommitted := false
	cleanup := func(success bool) {
		if success {
			cleanupCommitted = true
			return
		}
		if cleanupCommitted {
			return
		}
		cleanupCommitted = true
		for _, path := range cleanupPaths {
			deleteManagedStoredFile(c, files, path)
		}
	}

	var thumbnail *model.StoredFileInput
	if !payload.RemoveThumbnail {
		thumbnail, err = saveOptimaInfoOptionalUpload(
			c,
			files,
			"thumbnail",
			fileasset.KindImage,
			"thumbnail",
			"images",
			uploadYear,
			visibility,
			&claims.UserID,
		)
		if err != nil {
			cleanup(false)
			return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, err
		}
		if thumbnail != nil {
			cleanupPaths = append(cleanupPaths, thumbnail.StorageKey)
		}
	}
	var attachment *model.StoredFileInput
	if !payload.RemoveAttachment {
		attachment, err = saveOptimaInfoOptionalUpload(
			c,
			files,
			"attachment",
			fileasset.KindPDF,
			"attachment",
			"documents",
			uploadYear,
			visibility,
			&claims.UserID,
		)
		if err != nil {
			cleanup(false)
			return model.OptimaInfoArticlePayload{}, model.OptimaInfoMutation{}, nil, err
		}
		if attachment != nil {
			cleanupPaths = append(cleanupPaths, attachment.StorageKey)
		}
	}

	mutation := model.OptimaInfoMutation{
		Payload:        payload,
		StartDate:      startDate,
		EndDate:        endDate,
		ThumbnailFile:  thumbnail,
		AttachmentFile: attachment,
		AuthorUserID:   &claims.UserID,
		AuthorName:     claims.Name,
	}
	if current != nil {
		mutation.ThumbnailURL = current.ThumbnailStorageURL
		mutation.ThumbnailOriginalName = current.ThumbnailOriginalName
		mutation.ThumbnailMimeType = current.ThumbnailMimeType
		mutation.ThumbnailSize = current.ThumbnailSize
		mutation.AttachmentURL = current.AttachmentStorageURL
		mutation.AttachmentOriginalName = current.AttachmentOriginalName
		mutation.AttachmentMimeType = current.AttachmentMimeType
		mutation.AttachmentSize = current.AttachmentSize
	}
	if payload.RemoveThumbnail {
		mutation.ThumbnailURL = ""
		mutation.ThumbnailOriginalName = ""
		mutation.ThumbnailMimeType = ""
		mutation.ThumbnailSize = 0
	} else if thumbnail != nil {
		mutation.ThumbnailURL = thumbnail.StorageKey
		mutation.ThumbnailOriginalName = thumbnail.OriginalFilename
		mutation.ThumbnailMimeType = thumbnail.MimeType
		mutation.ThumbnailSize = thumbnail.FileSize
	}
	if payload.RemoveAttachment {
		mutation.AttachmentURL = ""
		mutation.AttachmentOriginalName = ""
		mutation.AttachmentMimeType = ""
		mutation.AttachmentSize = 0
	} else if attachment != nil {
		mutation.AttachmentURL = attachment.StorageKey
		mutation.AttachmentOriginalName = attachment.OriginalFilename
		mutation.AttachmentMimeType = attachment.MimeType
		mutation.AttachmentSize = attachment.FileSize
	}

	return payload, mutation, cleanup, nil
}

func validateOptimaInfoPublishable(payload model.OptimaInfoArticlePayload, article model.OptimaInfoDetail) error {
	if strings.TrimSpace(payload.Title) == "" && strings.TrimSpace(article.Title) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "judul informasi wajib diisi sebelum diterbitkan")
	}
	if strings.TrimSpace(payload.Category) == "" && strings.TrimSpace(article.Category) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kategori informasi wajib diisi sebelum diterbitkan")
	}
	content := payload.Content
	if content == "" {
		content = article.Content
	}
	if strings.TrimSpace(stripOptimaInfoHTML(content)) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "isi informasi wajib diisi sebelum diterbitkan")
	}
	return nil
}

func shouldRequireOptimaInfoPublishValidation(c echo.Context) bool {
	switch strings.ToLower(strings.TrimSpace(c.FormValue("intent"))) {
	case "preview", "publish":
		return true
	default:
		return false
	}
}

func sanitizeOptimaInfoHTML(value string) string {
	sanitized := strings.TrimSpace(value)
	if sanitized == "" {
		return ""
	}
	sanitized = optimaInfoScriptPattern.ReplaceAllString(sanitized, "")
	sanitized = optimaInfoOnAttrPattern.ReplaceAllString(sanitized, "")
	sanitized = optimaInfoJSProtocolPattern.ReplaceAllString(sanitized, `$1="#"`)
	sanitized = strings.ReplaceAll(sanitized, "\x00", "")
	return sanitized
}

func stripOptimaInfoHTML(value string) string {
	withoutTags := optimaInfoStripTagPattern.ReplaceAllString(value, " ")
	return strings.TrimSpace(optimaInfoWhitespacePattern.ReplaceAllString(withoutTags, " "))
}

func slugifyOptimaInfo(value string) string {
	lowered := strings.ToLower(strings.TrimSpace(value))
	if lowered == "" {
		return ""
	}
	replacer := regexp.MustCompile(`[^a-z0-9]+`)
	slug := replacer.ReplaceAllString(lowered, "-")
	return strings.Trim(slug, "-")
}

func parseOptimaInfoDate(value string) (*time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "format tanggal informasi tidak valid")
	}
	return &parsed, nil
}

func parseOptimaInfoDisplayOrder(value string) int {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return 0
	}
	return parsed
}

func optimaInfoID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}
	return id, nil
}

func saveOptimaInfoOptionalUpload(
	c echo.Context,
	files *fileasset.Service,
	fieldName string,
	kind fileasset.Kind,
	category string,
	storageCategory string,
	year string,
	visibility model.FileVisibility,
	uploadedBy *int64,
) (*model.StoredFileInput, error) {
	fileHeader, err := c.FormFile(fieldName)
	if err != nil {
		if errors.Is(err, http.ErrMissingFile) {
			return nil, nil
		}
		return nil, nil
	}
	if fileHeader == nil {
		return nil, nil
	}
	if files == nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}
	saved, err := files.Save(c.Request().Context(), fileasset.SaveRequest{
		Header:            fileHeader,
		Kind:              kind,
		Visibility:        visibility,
		StorageVisibility: model.FileVisibilityPublic,
		Module:            "optima-info",
		RelatedType:       "optima_info_article",
		Category:          category,
		StorageCategory:   storageCategory,
		Year:              year,
		UploadedBy:        uploadedBy,
	})
	if err != nil {
		return nil, managedUploadHTTPError(err)
	}
	return &saved, nil
}
