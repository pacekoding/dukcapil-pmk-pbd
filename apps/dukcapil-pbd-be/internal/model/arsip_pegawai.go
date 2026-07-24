package model

import "time"

type ArsipPegawaiDocumentCategory string

const (
	ArsipPegawaiDocumentIjazah     ArsipPegawaiDocumentCategory = "Ijazah"
	ArsipPegawaiDocumentSK         ArsipPegawaiDocumentCategory = "SK"
	ArsipPegawaiDocumentSPMT       ArsipPegawaiDocumentCategory = "SPMT"
	ArsipPegawaiDocumentSertifikat ArsipPegawaiDocumentCategory = "Sertifikat"
	ArsipPegawaiDocumentLainnya    ArsipPegawaiDocumentCategory = "Lainnya"
)

type ArsipPegawaiListParams struct {
	Search string
}

type ArsipPegawaiPayload struct {
	NIP         string `json:"nip"`
	NIK         string `json:"nik"`
	Name        string `json:"name"`
	Position    string `json:"position"`
	Unit        string `json:"unit"`
	Rank        string `json:"rank"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	BankAccount string `json:"bankAccount"`
	Address     string `json:"address"`
	Status      string `json:"status"`
	PhotoColor  string `json:"photoColor"`
}

type ArsipPegawaiDocumentPayload struct {
	File          *StoredFileInput
	PegawaiID     int64
	TahunAnggaran string
	Bidang        string
	Title         string
	Category      string
	Number        string
	Year          string
	Status        string
	OriginalName  string
	MimeType      string
	Size          int64
	URL           string
}

type ArsipPegawaiItem struct {
	ID          int64                  `json:"id" gorm:"column:id"`
	NIP         string                 `json:"nip" gorm:"column:nip"`
	NIK         string                 `json:"nik" gorm:"column:nik"`
	Name        string                 `json:"name" gorm:"column:name"`
	Position    string                 `json:"position" gorm:"column:position"`
	Unit        string                 `json:"unit" gorm:"column:unit"`
	Rank        string                 `json:"rank" gorm:"column:rank"`
	Email       string                 `json:"email" gorm:"column:email"`
	Phone       string                 `json:"phone" gorm:"column:phone"`
	BankAccount string                 `json:"bankAccount" gorm:"column:bank_account"`
	Address     string                 `json:"address" gorm:"column:address"`
	Status      string                 `json:"status" gorm:"column:status"`
	PhotoColor  string                 `json:"photoColor" gorm:"column:photo_color"`
	Documents   []ArsipPegawaiDocument `json:"documents" gorm:"-"`
}

type ArsipPegawaiDocument struct {
	ID             int64     `json:"id" gorm:"column:id"`
	PegawaiID      int64     `json:"pegawaiId" gorm:"column:pegawai_id"`
	Bidang         string    `json:"bidang" gorm:"column:bidang"`
	Title          string    `json:"title" gorm:"column:title"`
	Category       string    `json:"category" gorm:"column:category"`
	Number         string    `json:"number" gorm:"column:number"`
	Year           string    `json:"year" gorm:"column:year"`
	FileType       string    `json:"fileType" gorm:"-"`
	MimeType       string    `json:"mimeType" gorm:"column:mime_type"`
	FileSize       int64     `json:"fileSize" gorm:"column:file_size"`
	Status         string    `json:"status" gorm:"column:status"`
	StoredFileName string    `json:"storedFileName" gorm:"column:stored_file_name"`
	FileID         *int64    `json:"fileId,omitempty" gorm:"column:file_id"`
	ChecksumSHA256 string    `json:"checksumSha256,omitempty" gorm:"column:checksum_sha256"`
	StorageURL     string    `json:"-" gorm:"column:storage_url"`
	DownloadURL    string    `json:"downloadUrl" gorm:"-"`
	PreviewURL     string    `json:"previewUrl,omitempty" gorm:"-"`
	UploadedAt     time.Time `json:"uploadedAt" gorm:"column:uploaded_at"`
}

type ArsipPegawaiEntity struct {
	ID              int64     `gorm:"primaryKey;column:id"`
	NIP             string    `gorm:"column:nip"`
	NIK             string    `gorm:"column:nik"`
	Nama            string    `gorm:"column:nama"`
	Jabatan         string    `gorm:"column:jabatan"`
	Unit            string    `gorm:"column:unit"`
	PangkatGolongan string    `gorm:"column:pangkat_golongan"`
	Email           string    `gorm:"column:email"`
	Telepon         string    `gorm:"column:telepon"`
	NoRekening      string    `gorm:"column:no_rekening"`
	Alamat          string    `gorm:"column:alamat"`
	Status          string    `gorm:"column:status"`
	PhotoColor      string    `gorm:"column:photo_color"`
	CreatedAt       time.Time `gorm:"column:created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at"`
}

func (ArsipPegawaiEntity) TableName() string {
	return "arsip_pegawai"
}
