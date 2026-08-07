package model

import "time"

type MacekuPKKLevel string

const (
	MacekuPKKLevelProvinsi  MacekuPKKLevel = "PKK Provinsi"
	MacekuPKKLevelKabupaten MacekuPKKLevel = "PKK Kabupaten/Kota"
	MacekuPKKLevelDistrik   MacekuPKKLevel = "PKK Kecamatan/Distrik"
	MacekuPKKLevelKampung   MacekuPKKLevel = "PKK Desa/Kampung"
)

type MacekuPKKArchiveCategory string

const (
	MacekuPKKArchiveProgramKerja    MacekuPKKArchiveCategory = "Program Kerja"
	MacekuPKKArchiveLKPJ            MacekuPKKArchiveCategory = "LKPJ"
	MacekuPKKArchiveLaporanKegiatan MacekuPKKArchiveCategory = "Laporan Kegiatan"
	MacekuPKKArchiveSuratKeputusan  MacekuPKKArchiveCategory = "Surat Keputusan"
	MacekuPKKArchiveKepengurusan    MacekuPKKArchiveCategory = "Data Kepengurusan"
	MacekuPKKArchiveAdministrasi    MacekuPKKArchiveCategory = "Administrasi"
	MacekuPKKArchiveDokumentasi     MacekuPKKArchiveCategory = "Dokumentasi"
	MacekuPKKArchiveLainnya         MacekuPKKArchiveCategory = "Lainnya"
)

type MacekuPKKProfilePayload struct {
	Name               string `json:"name"`
	KabupatenKota      string `json:"kabupatenKota"`
	Distrik            string `json:"distrik"`
	Kampung            string `json:"kampung"`
	SecretariatAddress string `json:"secretariatAddress"`
	Chairperson        string `json:"chairperson"`
	Secretary          string `json:"secretary"`
	Phone              string `json:"phone"`
	Email              string `json:"email"`
	ManagementPeriod   string `json:"managementPeriod"`
	Description        string `json:"description"`
	IsActive           bool   `json:"isActive"`
}

type MacekuPKKProfileMutation struct {
	Payload          MacekuPKKProfilePayload
	Level            MacekuPKKLevel
	LogoFile         *StoredFileInput
	LogoURL          string
	LogoOriginalName string
	LogoMimeType     string
	LogoSize         int64
	ActorUserID      *int64
}

type MacekuPKKProfileListParams struct {
	Search        string
	Level         string
	KabupatenKota string
	Distrik       string
	Kampung       string
	Status        string
	Page          int
	Limit         int
	RegionScope   UserRegionScope
}

type MacekuPKKListResponse struct {
	Items []MacekuPKKProfileSummary `json:"items"`
	Meta  MacekuPKKMeta             `json:"meta"`
}

type MacekuPKKMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

type MacekuPKKProfileSummary struct {
	ID               int64          `json:"id" gorm:"column:id"`
	Name             string         `json:"name" gorm:"column:name"`
	Level            MacekuPKKLevel `json:"level" gorm:"column:level"`
	KabupatenKota    string         `json:"kabupatenKota" gorm:"column:kabupaten_kota"`
	Distrik          string         `json:"distrik" gorm:"column:distrik"`
	Kampung          string         `json:"kampung" gorm:"column:kampung"`
	Chairperson      string         `json:"chairperson" gorm:"column:chairperson"`
	ManagementPeriod string         `json:"managementPeriod" gorm:"column:management_period"`
	DocumentCount    int64          `json:"documentCount" gorm:"column:document_count"`
	IsActive         bool           `json:"isActive" gorm:"column:is_active"`
	UpdatedAt        time.Time      `json:"updatedAt" gorm:"column:updated_at"`
}

type MacekuPKKProfileDetail struct {
	ID                 int64              `json:"id" gorm:"column:id"`
	Name               string             `json:"name" gorm:"column:name"`
	Level              MacekuPKKLevel     `json:"level" gorm:"column:level"`
	KabupatenKota      string             `json:"kabupatenKota" gorm:"column:kabupaten_kota"`
	Distrik            string             `json:"distrik" gorm:"column:distrik"`
	Kampung            string             `json:"kampung" gorm:"column:kampung"`
	SecretariatAddress string             `json:"secretariatAddress" gorm:"column:secretariat_address"`
	Chairperson        string             `json:"chairperson" gorm:"column:chairperson"`
	Secretary          string             `json:"secretary" gorm:"column:secretary"`
	Phone              string             `json:"phone" gorm:"column:phone"`
	Email              string             `json:"email" gorm:"column:email"`
	ManagementPeriod   string             `json:"managementPeriod" gorm:"column:management_period"`
	Description        string             `json:"description" gorm:"column:description"`
	LogoOriginalName   string             `json:"logoOriginalName" gorm:"column:logo_original_name"`
	LogoMimeType       string             `json:"logoMimeType" gorm:"column:logo_mime_type"`
	LogoSize           int64              `json:"logoSize" gorm:"column:logo_size"`
	LogoFileID         *int64             `json:"logoFileId,omitempty" gorm:"column:logo_file_id"`
	LogoChecksum       string             `json:"logoChecksumSha256,omitempty" gorm:"column:logo_checksum_sha256"`
	LogoPreviewURL     string             `json:"logoPreviewUrl" gorm:"-"`
	LogoStorageURL     string             `json:"-" gorm:"column:logo_storage_url"`
	DocumentCount      int64              `json:"documentCount" gorm:"column:document_count"`
	IsActive           bool               `json:"isActive" gorm:"column:is_active"`
	CreatedAt          time.Time          `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt          time.Time          `json:"updatedAt" gorm:"column:updated_at"`
	Archives           []MacekuPKKArchive `json:"archives" gorm:"-"`
}

type MacekuPKKArchivePayload struct {
	ProfileID        int64
	Title            string
	Category         MacekuPKKArchiveCategory
	DocumentYear     string
	DocumentNumber   string
	DocumentDate     *time.Time
	Description      string
	File             *StoredFileInput
	FileURL          string
	OriginalName     string
	MimeType         string
	Size             int64
	UploadedByUserID *int64
	UploadedByName   string
}

type UpdateMacekuPKKArchivePayload struct {
	Title          string                   `json:"title"`
	Category       MacekuPKKArchiveCategory `json:"category"`
	DocumentYear   string                   `json:"documentYear"`
	DocumentNumber string                   `json:"documentNumber"`
	DocumentDate   string                   `json:"documentDate"`
	Description    string                   `json:"description"`
}

type MacekuPKKArchive struct {
	ID             int64                    `json:"id" gorm:"column:id"`
	ProfileID      int64                    `json:"profileId" gorm:"column:profile_id"`
	Title          string                   `json:"title" gorm:"column:title"`
	Category       MacekuPKKArchiveCategory `json:"category" gorm:"column:category"`
	DocumentYear   string                   `json:"documentYear" gorm:"column:document_year"`
	DocumentNumber string                   `json:"documentNumber" gorm:"column:document_number"`
	DocumentDate   string                   `json:"documentDate" gorm:"column:document_date"`
	Description    string                   `json:"description" gorm:"column:description"`
	FileType       string                   `json:"fileType" gorm:"-"`
	MimeType       string                   `json:"mimeType" gorm:"column:mime_type"`
	FileSize       int64                    `json:"fileSize" gorm:"column:file_size"`
	OriginalName   string                   `json:"originalName" gorm:"column:original_name"`
	UploadedByName string                   `json:"uploadedByName" gorm:"column:uploaded_by_name"`
	FileID         *int64                   `json:"fileId,omitempty" gorm:"column:file_id"`
	ChecksumSHA256 string                   `json:"checksumSha256,omitempty" gorm:"column:checksum_sha256"`
	StorageURL     string                   `json:"-" gorm:"column:storage_url"`
	DownloadURL    string                   `json:"downloadUrl" gorm:"-"`
	PreviewURL     string                   `json:"previewUrl" gorm:"-"`
	UploadedAt     time.Time                `json:"uploadedAt" gorm:"column:uploaded_at"`
	UpdatedAt      time.Time                `json:"updatedAt" gorm:"column:updated_at"`
}

type MacekuPKKOptionsResponse struct {
	KabupatenKota []string                 `json:"kabupatenKota"`
	Distrik       []MacekuPKKDistrikOption `json:"distrik"`
	Kampung       []MacekuPKKKampungOption `json:"kampung"`
}

type MacekuPKKDistrikOption struct {
	KabupatenKota string `json:"kabupatenKota"`
	Distrik       string `json:"distrik"`
}

type MacekuPKKKampungOption struct {
	KabupatenKota string `json:"kabupatenKota"`
	Distrik       string `json:"distrik"`
	Kampung       string `json:"kampung"`
}
