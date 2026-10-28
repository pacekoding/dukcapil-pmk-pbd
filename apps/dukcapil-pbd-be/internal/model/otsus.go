package model

import "time"

const (
	OtsusStatusBelumMulai = "BELUM_MULAI"
	OtsusStatusBerjalan   = "BERJALAN"
	OtsusStatusSelesai    = "SELESAI"
	OtsusDPAAwal          = "AWAL"
	OtsusDPAPergeseran    = "PERGESERAN"
	OtsusDPAPerubahan     = "PERUBAHAN"
)

type OtsusPayload struct {
	SubkegiatanID int64  `json:"subkegiatanId"`
	Pagu          int64  `json:"pagu"`
	Realisasi     int64  `json:"realisasi"`
	Status        string `json:"status"`
	Keterangan    string `json:"keterangan"`
}

type OtsusLabel struct {
	ID                 int64  `json:"id" gorm:"primaryKey"`
	TahunAnggaran      string `json:"tahunAnggaran" gorm:"column:tahun_anggaran"`
	OtsusPayload       `gorm:"embedded"`
	CreatedBy          int64     `json:"createdBy"`
	UpdatedBy          int64     `json:"updatedBy"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
	Bidang             string    `json:"bidang" gorm:"-"`
	Program            string    `json:"program" gorm:"-"`
	Kegiatan           string    `json:"kegiatan" gorm:"-"`
	Subkegiatan        string    `json:"subkegiatan" gorm:"-"`
	DocumentationCount int64     `json:"documentationCount" gorm:"-"`
	DPACount           int64     `json:"dpaCount" gorm:"-"`
	HasLPJ             bool      `json:"hasLpj" gorm:"-"`
}

func (OtsusLabel) TableName() string { return "labelisasi_otsus" }

type OtsusDocumentation struct {
	ID           int64      `json:"id" gorm:"primaryKey"`
	OtsusLabelID int64      `json:"otsusLabelId"`
	FileID       int64      `json:"fileId"`
	Caption      string     `json:"caption"`
	CreatedBy    int64      `json:"createdBy"`
	CreatedAt    time.Time  `json:"createdAt"`
	File         StoredFile `json:"file" gorm:"-"`
}

func (OtsusDocumentation) TableName() string { return "dokumentasi_otsus" }

type OtsusLPJ struct {
	ID           int64      `json:"id" gorm:"primaryKey"`
	OtsusLabelID int64      `json:"otsusLabelId"`
	FileID       int64      `json:"fileId"`
	CreatedBy    int64      `json:"createdBy"`
	UpdatedBy    int64      `json:"updatedBy"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	File         StoredFile `json:"file" gorm:"-"`
}

func (OtsusLPJ) TableName() string { return "lpj_otsus" }

type OtsusDPAVersion struct {
	ID           int64      `json:"id" gorm:"primaryKey"`
	OtsusLabelID int64      `json:"otsusLabelId"`
	Jenis        string     `json:"jenis"`
	Versi        int        `json:"versi"`
	FileID       int64      `json:"fileId"`
	Catatan      string     `json:"catatan"`
	UploadedBy   int64      `json:"uploadedBy"`
	UploadedAt   time.Time  `json:"uploadedAt"`
	File         StoredFile `json:"file" gorm:"-"`
}

func (OtsusDPAVersion) TableName() string { return "versi_dpa_otsus" }

type OtsusDetail struct {
	Label          OtsusLabel           `json:"label"`
	Documentations []OtsusDocumentation `json:"documentations"`
	LPJ            *OtsusLPJ            `json:"lpj"`
	DPAVersions    []OtsusDPAVersion    `json:"dpaVersions"`
}
