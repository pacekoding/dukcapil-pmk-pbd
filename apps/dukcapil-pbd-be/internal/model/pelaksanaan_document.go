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
	SumberAplikasi    string
	Bidang            string
	Search            string
	SubkegiatanPrefix string
	Page              int
	Limit             int
}

type PelaksanaanDocumentPayload struct {
	File           *StoredFileInput
	SumberAplikasi string
	Bidang         string
	SubkegiatanID  *int64
	Nama           string
	OriginalName   string
	MimeType       string
	Size           int64
	URL            string
	IsDokumenDSSD  bool
}

type UpdatePelaksanaanDocumentPayload struct {
	SubkegiatanID *int64 `json:"subkegiatan_id"`
	Nama          string `json:"nama"`
	IsDokumenDSSD bool   `json:"is_dokumen_dssd"`
}

type PelaksanaanDocumentItem struct {
	ID              int64     `json:"id" gorm:"column:id"`
	SumberAplikasi  string    `json:"sumberAplikasi" gorm:"column:sumber_aplikasi"`
	Bidang          string    `json:"bidang" gorm:"column:bidang"`
	Nama            string    `json:"nama" gorm:"column:nama"`
	SubkegiatanID   *int64    `json:"subkegiatanId" gorm:"column:subkegiatan_id"`
	SubkegiatanCode *string   `json:"subkegiatanCode" gorm:"column:subkegiatan_code"`
	SubkegiatanName *string   `json:"subkegiatanName" gorm:"column:subkegiatan_name"`
	StoredFileName  string    `json:"storedFileName" gorm:"column:stored_file_name"`
	FileID          *int64    `json:"fileId,omitempty" gorm:"column:file_id"`
	ChecksumSHA256  string    `json:"checksumSha256,omitempty" gorm:"column:checksum_sha256"`
	FileType        string    `json:"fileType" gorm:"-"`
	MimeType        string    `json:"mimeType" gorm:"column:mime_type"`
	FileSize        int64     `json:"fileSize" gorm:"column:file_size"`
	StorageURL      string    `json:"-" gorm:"column:storage_url"`
	DownloadURL     string    `json:"downloadUrl" gorm:"-"`
	PreviewURL      string    `json:"previewUrl,omitempty" gorm:"-"`
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
	ID               int64     `gorm:"primaryKey;column:id"`
	TahunAnggaran    string    `gorm:"column:tahun_anggaran"`
	SumberAplikasi   string    `gorm:"column:sumber_aplikasi"`
	Bidang           string    `gorm:"column:bidang"`
	SubkegiatanID    *int64    `gorm:"column:subkegiatan_id"`
	PegawaiID        *int64    `gorm:"column:pegawai_id"`
	Nama             string    `gorm:"column:nama"`
	OriginalName     string    `gorm:"column:original_name"`
	MimeType         string    `gorm:"column:mime_type"`
	Size             int64     `gorm:"column:size"`
	URL              string    `gorm:"column:url"`
	FileID           *int64    `gorm:"column:file_id"`
	IsDokumenDSSD    bool      `gorm:"column:is_dokumen_dssd"`
	Kategori         string    `gorm:"column:kategori"`
	NomorDokumen     string    `gorm:"column:nomor_dokumen"`
	TahunDokumen     string    `gorm:"column:tahun_dokumen"`
	StatusVerifikasi string    `gorm:"column:status_verifikasi"`
	CreatedAt        time.Time `gorm:"column:created_at"`
}

func (PelaksanaanDocumentEntity) TableName() string {
	return "arsip"
}
