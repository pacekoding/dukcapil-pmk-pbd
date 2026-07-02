package model

import "time"

type SubkegiatanBidang string

const (
	SubkegiatanBidangDukcapil SubkegiatanBidang = "dukcapil"
	SubkegiatanBidangPMK      SubkegiatanBidang = "pmk"
	SubkegiatanBidangUmum     SubkegiatanBidang = "umum"
)

type Subkegiatan struct {
	ID            int64             `json:"id"`
	TahunAnggaran string            `json:"tahunAnggaran"`
	Kode          string            `json:"kode"`
	Nama          string            `json:"nama"`
	Bidang        SubkegiatanBidang `json:"bidang"`
	SSDItems      []SSD             `json:"ssdItems"`
}

type SubkegiatanPayload struct {
	Kode   string            `json:"kode"`
	Nama   string            `json:"nama"`
	Bidang SubkegiatanBidang `json:"bidang"`
	SSDIDs []int64           `json:"ssdIds"`
}

type SubkegiatanImportPayload struct {
	Row      int
	Kode     string
	Nama     string
	Bidang   SubkegiatanBidang
	SSDCodes []string
}

type SubkegiatanListResponse struct {
	TahunAnggaran string        `json:"tahunAnggaran"`
	Items         []Subkegiatan `json:"items"`
}

type SubkegiatanImportResult struct {
	TahunAnggaran string `json:"tahunAnggaran"`
	Total         int    `json:"total"`
	Created       int    `json:"created"`
	Updated       int    `json:"updated"`
}

type SubkegiatanEntity struct {
	ID            int64             `gorm:"primaryKey;column:id"`
	TahunAnggaran string            `gorm:"column:tahun_anggaran"`
	Kode          string            `gorm:"column:kode"`
	Nama          string            `gorm:"column:nama"`
	Bidang        SubkegiatanBidang `gorm:"column:bidang"`
	CreatedAt     time.Time         `gorm:"column:created_at"`
	UpdatedAt     time.Time         `gorm:"column:updated_at"`
}

func (SubkegiatanEntity) TableName() string {
	return "subkegiatan"
}

func (s SubkegiatanEntity) ToSubkegiatan() Subkegiatan {
	return Subkegiatan{
		ID:            s.ID,
		TahunAnggaran: s.TahunAnggaran,
		Kode:          s.Kode,
		Nama:          s.Nama,
		Bidang:        s.Bidang,
		SSDItems:      []SSD{},
	}
}
