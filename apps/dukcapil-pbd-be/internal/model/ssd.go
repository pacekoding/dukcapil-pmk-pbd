package model

import "time"

type SSD struct {
	ID                  int64  `json:"id"`
	TahunAnggaran       string `json:"tahunAnggaran"`
	Kode                string `json:"kode"`
	Uraian              string `json:"uraian"`
	Satuan              string `json:"satuan"`
	DefinisiOperasional string `json:"definisiOperasional"`
	IsActive            bool   `json:"isActive"`
}

type SSDPayload struct {
	Kode                string `json:"kode"`
	Uraian              string `json:"uraian"`
	Satuan              string `json:"satuan"`
	DefinisiOperasional string `json:"definisiOperasional"`
}

type SSDDetail struct {
	SSD
}

type SSDStatusPayload struct {
	IsActive bool `json:"isActive"`
}

type SSDListResponse struct {
	TahunAnggaran string `json:"tahunAnggaran"`
	Items         []SSD  `json:"items"`
}

type SSDImportResult struct {
	TahunAnggaran string `json:"tahunAnggaran"`
	Total         int    `json:"total"`
	Created       int    `json:"created"`
	Updated       int    `json:"updated"`
}

type SSDEntity struct {
	ID                  int64     `gorm:"primaryKey;column:id"`
	TahunAnggaran       string    `gorm:"column:tahun_anggaran"`
	Kode                string    `gorm:"column:kode"`
	Uraian              string    `gorm:"column:uraian"`
	Satuan              string    `gorm:"column:satuan"`
	DefinisiOperasional string    `gorm:"column:definisi_operasional"`
	IsActive            bool      `gorm:"column:is_active"`
	CreatedAt           time.Time `gorm:"column:created_at"`
	UpdatedAt           time.Time `gorm:"column:updated_at"`
}

func (SSDEntity) TableName() string {
	return "ssd"
}

func (s SSDEntity) ToSSD() SSD {
	return SSD{
		ID:                  s.ID,
		TahunAnggaran:       s.TahunAnggaran,
		Kode:                s.Kode,
		Uraian:              s.Uraian,
		Satuan:              s.Satuan,
		DefinisiOperasional: s.DefinisiOperasional,
		IsActive:            s.IsActive,
	}
}

type SubkegiatanSSDEntity struct {
	SubkegiatanID int64     `gorm:"column:subkegiatan_id"`
	SSDID         int64     `gorm:"column:ssd_id"`
	TahunAnggaran string    `gorm:"column:tahun_anggaran"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (SubkegiatanSSDEntity) TableName() string {
	return "subkegiatan_ssd"
}
