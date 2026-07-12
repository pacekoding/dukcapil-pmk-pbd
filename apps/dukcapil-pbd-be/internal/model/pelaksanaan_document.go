package model

import "time"

type PelaksanaanDocumentFileType string

const (
	PelaksanaanDocumentTypePDF   PelaksanaanDocumentFileType = "pdf"
	PelaksanaanDocumentTypeWord  PelaksanaanDocumentFileType = "word"
	PelaksanaanDocumentTypeExcel PelaksanaanDocumentFileType = "excel"
	PelaksanaanDocumentTypeImage PelaksanaanDocumentFileType = "image"
)

type PelaksanaanDocumentListParams struct {
	TahunAnggaran     string
	Search            string
	SubkegiatanPrefix string
	Page              int
	Limit             int
}

type PelaksanaanDocumentPayload struct {
	SubkegiatanID *int64
	Nama          string
	OriginalName  string
	MimeType      string
	Size          int64
	URL           string
	IsDokumenDSSD bool
}

type UpdatePelaksanaanDocumentPayload struct {
	SubkegiatanID *int64 `json:"subkegiatan_id"`
	Nama          string `json:"nama"`
	IsDokumenDSSD bool   `json:"is_dokumen_dssd"`
}

type PelaksanaanDocumentItem struct {
	ID              int64     `json:"id" gorm:"column:id"`
	Nama            string    `json:"nama" gorm:"column:nama"`
	SubkegiatanID   *int64    `json:"subkegiatanId" gorm:"column:subkegiatan_id"`
	SubkegiatanCode *string   `json:"subkegiatanCode" gorm:"column:subkegiatan_code"`
	SubkegiatanName *string   `json:"subkegiatanName" gorm:"column:subkegiatan_name"`
	StoredFileName  string    `json:"storedFileName" gorm:"column:stored_file_name"`
	FileType        string    `json:"fileType" gorm:"-"`
	MimeType        string    `json:"mimeType" gorm:"column:mime_type"`
	FileSize        int64     `json:"fileSize" gorm:"column:file_size"`
	StorageURL      string    `json:"-" gorm:"column:storage_url"`
	DownloadURL     string    `json:"downloadUrl" gorm:"-"`
	IsDokumenDSSD   bool      `json:"isDokumenDssd" gorm:"column:is_dokumen_dssd"`
	TanggalUpload   time.Time `json:"tanggalUpload" gorm:"column:tanggal_upload"`
}

type PelaksanaanDocumentMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

type PelaksanaanDocumentListResponse struct {
	Data []PelaksanaanDocumentItem `json:"data"`
	Meta PelaksanaanDocumentMeta   `json:"meta"`
}

type PelaksanaanDocumentEntity struct {
	ID            int64     `gorm:"primaryKey;column:id"`
	TahunAnggaran string    `gorm:"column:tahun_anggaran"`
	SubkegiatanID *int64    `gorm:"column:subkegiatan_id"`
	Nama          string    `gorm:"column:nama"`
	OriginalName  string    `gorm:"column:original_name"`
	MimeType      string    `gorm:"column:mime_type"`
	Size          int64     `gorm:"column:size"`
	URL           string    `gorm:"column:url"`
	IsDokumenDSSD bool      `gorm:"column:is_dokumen_dssd"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (PelaksanaanDocumentEntity) TableName() string {
	return "pelaksanaan_documents"
}
