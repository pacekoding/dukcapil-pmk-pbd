package model

import (
	"time"

	"github.com/lib/pq"
)

type CapaianKendala struct {
	ID               int64          `json:"id"`
	KelompokID       int64          `json:"kelompokId"`
	Kelompok         KelompokBinaan `json:"kelompok"`
	NamaCapaian      string         `json:"namaCapaian"`
	TahunBinaan      string         `json:"tahunBinaan"`
	DeskripsiCapaian string         `json:"deskripsiCapaian"`
	KendalaHambatan  string         `json:"kendalaHambatan"`
	DokumentasiURLs  []string       `json:"dokumentasiUrls"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
}

type CapaianKendalaPayload struct {
	KelompokID       int64    `json:"kelompokId"`
	NamaCapaian      string   `json:"namaCapaian"`
	TahunBinaan      string   `json:"tahunBinaan"`
	DeskripsiCapaian string   `json:"deskripsiCapaian"`
	KendalaHambatan  string   `json:"kendalaHambatan"`
	DokumentasiURLs  []string `json:"dokumentasiUrls"`
}

type CapaianKendalaListResponse struct {
	Items []CapaianKendala `json:"items"`
}

type CapaianKendalaEntity struct {
	ID               int64                `gorm:"primaryKey;column:id"`
	KelompokID       int64                `gorm:"column:kelompok_id"`
	Kelompok         KelompokBinaanEntity `gorm:"foreignKey:KelompokID;references:ID"`
	NamaCapaian      string               `gorm:"column:nama_capaian"`
	TahunBinaan      string               `gorm:"column:tahun_binaan"`
	DeskripsiCapaian string               `gorm:"column:deskripsi_capaian"`
	KendalaHambatan  string               `gorm:"column:kendala_hambatan"`
	DokumentasiURLs  pq.StringArray       `gorm:"type:text[];column:dokumentasi_urls"`
	CreatedAt        time.Time            `gorm:"column:created_at"`
	UpdatedAt        time.Time            `gorm:"column:updated_at"`
}

func (CapaianKendalaEntity) TableName() string {
	return "capaian_kendala"
}

func (s CapaianKendalaEntity) ToCapaianKendala() CapaianKendala {
	dokumentasiURLs := make([]string, len(s.DokumentasiURLs))
	copy(dokumentasiURLs, s.DokumentasiURLs)

	return CapaianKendala{
		ID:               s.ID,
		KelompokID:       s.KelompokID,
		Kelompok:         s.Kelompok.ToKelompokBinaan(),
		NamaCapaian:      s.NamaCapaian,
		TahunBinaan:      s.TahunBinaan,
		DeskripsiCapaian: s.DeskripsiCapaian,
		KendalaHambatan:  s.KendalaHambatan,
		DokumentasiURLs:  dokumentasiURLs,
		CreatedAt:        s.CreatedAt,
		UpdatedAt:        s.UpdatedAt,
	}
}
