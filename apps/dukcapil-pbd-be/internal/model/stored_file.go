package model

import "time"

type FileVisibility string

const (
	FileVisibilityPublic  FileVisibility = "public"
	FileVisibilityPrivate FileVisibility = "private"
)

type StoredFileInput struct {
	Module           string
	RelatedType      string
	Category         string
	OriginalFilename string
	StoredFilename   string
	StorageKey       string
	MimeType         string
	FileSize         int64
	ChecksumSHA256   string
	Visibility       FileVisibility
	UploadedBy       *int64
}

type StoredFile struct {
	ID                int64          `json:"id" gorm:"column:id"`
	Module            string         `json:"module" gorm:"column:module"`
	RelatedEntityType string         `json:"relatedEntityType" gorm:"column:related_entity_type"`
	RelatedEntityID   int64          `json:"relatedEntityId" gorm:"column:related_entity_id"`
	Category          string         `json:"category" gorm:"column:category"`
	OriginalFilename  string         `json:"originalFilename" gorm:"column:original_filename"`
	StoredFilename    string         `json:"storedFilename" gorm:"column:stored_filename"`
	StorageKey        string         `json:"-" gorm:"column:storage_key"`
	MimeType          string         `json:"mimeType" gorm:"column:mime_type"`
	FileSize          int64          `json:"fileSize" gorm:"column:file_size"`
	ChecksumSHA256    string         `json:"checksumSha256" gorm:"column:checksum_sha256"`
	Visibility        FileVisibility `json:"visibility" gorm:"column:visibility"`
	UploadedBy        *int64         `json:"uploadedBy,omitempty" gorm:"column:uploaded_by"`
	PreviewURL        string         `json:"previewUrl" gorm:"-"`
	DownloadURL       string         `json:"downloadUrl" gorm:"-"`
	PublicPreviewURL  string         `json:"publicPreviewUrl,omitempty" gorm:"-"`
	PublicDownloadURL string         `json:"publicDownloadUrl,omitempty" gorm:"-"`
	CreatedAt         time.Time      `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt         time.Time      `json:"updatedAt" gorm:"column:updated_at"`
	DeletedAt         *time.Time     `json:"-" gorm:"column:deleted_at"`
}

func (StoredFile) TableName() string {
	return "stored_files"
}
