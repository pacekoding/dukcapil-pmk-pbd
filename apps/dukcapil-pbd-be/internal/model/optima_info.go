package model

import "time"

type OptimaInfoStatus string

const (
	OptimaInfoStatusDraft     OptimaInfoStatus = "Draft"
	OptimaInfoStatusPublished OptimaInfoStatus = "Published"
	OptimaInfoStatusArchived  OptimaInfoStatus = "Archived"
)

func (s OptimaInfoStatus) Valid() bool {
	switch s {
	case OptimaInfoStatusDraft, OptimaInfoStatusPublished, OptimaInfoStatusArchived:
		return true
	default:
		return false
	}
}

type OptimaInfoArticlePayload struct {
	Title            string `json:"title"`
	Slug             string `json:"slug"`
	Category         string `json:"category"`
	Summary          string `json:"summary"`
	Content          string `json:"content"`
	ExternalURL      string `json:"externalUrl"`
	DisplayOrder     int    `json:"displayOrder"`
	IsFeatured       bool   `json:"isFeatured"`
	RemoveThumbnail  bool   `json:"removeThumbnail"`
	RemoveAttachment bool   `json:"removeAttachment"`
}

type OptimaInfoMutation struct {
	Payload                OptimaInfoArticlePayload
	StartDate              *time.Time
	EndDate                *time.Time
	ThumbnailFile          *StoredFileInput
	AttachmentFile         *StoredFileInput
	ThumbnailURL           string
	ThumbnailOriginalName  string
	ThumbnailMimeType      string
	ThumbnailSize          int64
	AttachmentURL          string
	AttachmentOriginalName string
	AttachmentMimeType     string
	AttachmentSize         int64
	AuthorUserID           *int64
	AuthorName             string
}

type OptimaInfoAdminListParams struct {
	Search   string
	Category string
	Status   string
	Year     string
	Page     int
	Limit    int
}

type OptimaInfoPublicListParams struct {
	Search   string
	Category string
	Page     int
	Limit    int
}

type OptimaInfoMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

type OptimaInfoStats struct {
	Total     int64 `json:"total"`
	Draft     int64 `json:"draft"`
	Published int64 `json:"published"`
	Archived  int64 `json:"archived"`
}

type OptimaInfoSummary struct {
	ID                    int64            `json:"id" gorm:"column:id"`
	Title                 string           `json:"title" gorm:"column:title"`
	Slug                  string           `json:"slug" gorm:"column:slug"`
	Category              string           `json:"category" gorm:"column:category"`
	Summary               string           `json:"summary" gorm:"column:summary"`
	Status                OptimaInfoStatus `json:"status" gorm:"column:status"`
	DisplayOrder          int              `json:"displayOrder" gorm:"column:display_order"`
	IsFeatured            bool             `json:"isFeatured" gorm:"column:is_featured"`
	AuthorName            string           `json:"authorName" gorm:"column:author_name"`
	PublishedByName       string           `json:"publishedByName" gorm:"column:published_by_name"`
	PublishedAt           string           `json:"publishedAt" gorm:"column:published_at"`
	StartDate             string           `json:"startDate" gorm:"column:start_date"`
	EndDate               string           `json:"endDate" gorm:"column:end_date"`
	UpdatedAt             time.Time        `json:"updatedAt" gorm:"column:updated_at"`
	CreatedAt             time.Time        `json:"createdAt" gorm:"column:created_at"`
	ThumbnailURL          string           `json:"thumbnailUrl" gorm:"-"`
	ThumbnailFileID       *int64           `json:"thumbnailFileId,omitempty" gorm:"column:thumbnail_file_id"`
	ThumbnailStorageURL   string           `json:"-" gorm:"column:thumbnail_url"`
	AttachmentDownloadURL string           `json:"attachmentDownloadUrl,omitempty" gorm:"-"`
	AttachmentFileID      *int64           `json:"attachmentFileId,omitempty" gorm:"column:attachment_file_id"`
	AttachmentStorageURL  string           `json:"-" gorm:"column:attachment_url"`
}

type OptimaInfoRelatedItem struct {
	ID                  int64     `json:"id" gorm:"column:id"`
	Title               string    `json:"title" gorm:"column:title"`
	Slug                string    `json:"slug" gorm:"column:slug"`
	Category            string    `json:"category" gorm:"column:category"`
	Summary             string    `json:"summary" gorm:"column:summary"`
	PublishedAt         string    `json:"publishedAt" gorm:"column:published_at"`
	ThumbnailURL        string    `json:"thumbnailUrl" gorm:"-"`
	ThumbnailFileID     *int64    `json:"thumbnailFileId,omitempty" gorm:"column:thumbnail_file_id"`
	ThumbnailStorageURL string    `json:"-" gorm:"column:thumbnail_url"`
	UpdatedAt           time.Time `json:"updatedAt" gorm:"column:updated_at"`
}

type OptimaInfoDetail struct {
	ID                     int64                   `json:"id" gorm:"column:id"`
	Title                  string                  `json:"title" gorm:"column:title"`
	Slug                   string                  `json:"slug" gorm:"column:slug"`
	Category               string                  `json:"category" gorm:"column:category"`
	Summary                string                  `json:"summary" gorm:"column:summary"`
	Content                string                  `json:"content" gorm:"column:content"`
	Status                 OptimaInfoStatus        `json:"status" gorm:"column:status"`
	ExternalURL            string                  `json:"externalUrl" gorm:"column:external_url"`
	DisplayOrder           int                     `json:"displayOrder" gorm:"column:display_order"`
	IsFeatured             bool                    `json:"isFeatured" gorm:"column:is_featured"`
	AuthorName             string                  `json:"authorName" gorm:"column:author_name"`
	PublishedByName        string                  `json:"publishedByName" gorm:"column:published_by_name"`
	PublishedAt            string                  `json:"publishedAt" gorm:"column:published_at"`
	StartDate              string                  `json:"startDate" gorm:"column:start_date"`
	EndDate                string                  `json:"endDate" gorm:"column:end_date"`
	CreatedAt              time.Time               `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt              time.Time               `json:"updatedAt" gorm:"column:updated_at"`
	ThumbnailURL           string                  `json:"thumbnailUrl" gorm:"-"`
	ThumbnailFileID        *int64                  `json:"thumbnailFileId,omitempty" gorm:"column:thumbnail_file_id"`
	ThumbnailStorageURL    string                  `json:"-" gorm:"column:thumbnail_url"`
	ThumbnailOriginalName  string                  `json:"thumbnailOriginalName" gorm:"column:thumbnail_original_name"`
	ThumbnailMimeType      string                  `json:"thumbnailMimeType" gorm:"column:thumbnail_mime_type"`
	ThumbnailSize          int64                   `json:"thumbnailSize" gorm:"column:thumbnail_size"`
	ThumbnailChecksum      string                  `json:"thumbnailChecksumSha256,omitempty" gorm:"column:thumbnail_checksum_sha256"`
	AttachmentDownloadURL  string                  `json:"attachmentDownloadUrl" gorm:"-"`
	AttachmentFileID       *int64                  `json:"attachmentFileId,omitempty" gorm:"column:attachment_file_id"`
	AttachmentStorageURL   string                  `json:"-" gorm:"column:attachment_url"`
	AttachmentOriginalName string                  `json:"attachmentOriginalName" gorm:"column:attachment_original_name"`
	AttachmentMimeType     string                  `json:"attachmentMimeType" gorm:"column:attachment_mime_type"`
	AttachmentSize         int64                   `json:"attachmentSize" gorm:"column:attachment_size"`
	AttachmentChecksum     string                  `json:"attachmentChecksumSha256,omitempty" gorm:"column:attachment_checksum_sha256"`
	ContentImages          []StoredFile            `json:"contentImages" gorm:"-"`
	Related                []OptimaInfoRelatedItem `json:"related" gorm:"-"`
}

type OptimaInfoAdminListResponse struct {
	Items      []OptimaInfoSummary `json:"items"`
	Meta       OptimaInfoMeta      `json:"meta"`
	Stats      OptimaInfoStats     `json:"stats"`
	Categories []string            `json:"categories"`
}

type OptimaInfoPublicListResponse struct {
	Items      []OptimaInfoSummary `json:"items"`
	Featured   []OptimaInfoSummary `json:"featured"`
	Meta       OptimaInfoMeta      `json:"meta"`
	Categories []string            `json:"categories"`
}

type OptimaInfoArticleEntity struct {
	ID                     int64            `gorm:"primaryKey;column:id"`
	Title                  string           `gorm:"column:title"`
	Slug                   string           `gorm:"column:slug"`
	Category               string           `gorm:"column:category"`
	Summary                string           `gorm:"column:summary"`
	Content                string           `gorm:"column:content"`
	ThumbnailURL           string           `gorm:"column:thumbnail_url"`
	ThumbnailFileID        *int64           `gorm:"column:thumbnail_file_id"`
	ThumbnailOriginalName  string           `gorm:"column:thumbnail_original_name"`
	ThumbnailMimeType      string           `gorm:"column:thumbnail_mime_type"`
	ThumbnailSize          int64            `gorm:"column:thumbnail_size"`
	AttachmentURL          string           `gorm:"column:attachment_url"`
	AttachmentFileID       *int64           `gorm:"column:attachment_file_id"`
	AttachmentOriginalName string           `gorm:"column:attachment_original_name"`
	AttachmentMimeType     string           `gorm:"column:attachment_mime_type"`
	AttachmentSize         int64            `gorm:"column:attachment_size"`
	ExternalURL            string           `gorm:"column:external_url"`
	DisplayOrder           int              `gorm:"column:display_order"`
	IsFeatured             bool             `gorm:"column:is_featured"`
	Status                 OptimaInfoStatus `gorm:"column:status"`
	StartDate              *time.Time       `gorm:"column:start_date"`
	EndDate                *time.Time       `gorm:"column:end_date"`
	AuthorUserID           *int64           `gorm:"column:author_user_id"`
	AuthorName             string           `gorm:"column:author_name"`
	PublishedByUserID      *int64           `gorm:"column:published_by_user_id"`
	PublishedByName        string           `gorm:"column:published_by_name"`
	PublishedAt            *time.Time       `gorm:"column:published_at"`
	CreatedAt              time.Time        `gorm:"column:created_at"`
	UpdatedAt              time.Time        `gorm:"column:updated_at"`
}

func (OptimaInfoArticleEntity) TableName() string {
	return "optima_info_articles"
}
