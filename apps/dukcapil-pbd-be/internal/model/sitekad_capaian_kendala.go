package model

import (
	"time"

	"github.com/lib/pq"
)

type SitekadCapaianKendala struct {
	ID               int64                 `json:"id"`
	KelompokID       int64                 `json:"kelompokId"`
	Kelompok         SitekadPotensiKampung `json:"kelompok"`
	NamaCapaian      string                `json:"namaCapaian"`
	TahunBinaan      string                `json:"tahunBinaan"`
	DeskripsiCapaian string                `json:"deskripsiCapaian"`
	KendalaHambatan  string                `json:"kendalaHambatan"`
	DokumentasiURLs  []string              `json:"dokumentasiUrls"`
	CreatedAt        time.Time             `json:"createdAt"`
	UpdatedAt        time.Time             `json:"updatedAt"`
}

type SitekadCapaianKendalaPayload struct {
	KelompokID       int64    `json:"kelompokId"`
	NamaCapaian      string   `json:"namaCapaian"`
	TahunBinaan      string   `json:"tahunBinaan"`
	DeskripsiCapaian string   `json:"deskripsiCapaian"`
	KendalaHambatan  string   `json:"kendalaHambatan"`
	DokumentasiURLs  []string `json:"dokumentasiUrls"`
}

type SitekadCapaianKendalaListResponse struct {
	Items []SitekadCapaianKendala `json:"items"`
}

type SitekadCapaianKendalaEntity struct {
	ID               int64                       `gorm:"primaryKey;column:id"`
	KelompokID       int64                       `gorm:"column:kelompok_id"`
	Kelompok         SitekadPotensiKampungEntity `gorm:"foreignKey:KelompokID;references:ID"`
	NamaCapaian      string                      `gorm:"column:nama_capaian"`
	TahunBinaan      string                      `gorm:"column:tahun_binaan"`
	DeskripsiCapaian string                      `gorm:"column:deskripsi_capaian"`
	KendalaHambatan  string                      `gorm:"column:kendala_hambatan"`
	DokumentasiURLs  pq.StringArray              `gorm:"type:text[];column:dokumentasi_urls"`
	CreatedAt        time.Time                   `gorm:"column:created_at"`
	UpdatedAt        time.Time                   `gorm:"column:updated_at"`
}

func (SitekadCapaianKendalaEntity) TableName() string {
	return "sitekad_capaian_kendala"
}

func (s SitekadCapaianKendalaEntity) ToSitekadCapaianKendala() SitekadCapaianKendala {
	dokumentasiURLs := make([]string, len(s.DokumentasiURLs))
	copy(dokumentasiURLs, s.DokumentasiURLs)

	return SitekadCapaianKendala{
		ID:               s.ID,
		KelompokID:       s.KelompokID,
		Kelompok:         s.Kelompok.ToSitekadPotensiKampung(),
		NamaCapaian:      s.NamaCapaian,
		TahunBinaan:      s.TahunBinaan,
		DeskripsiCapaian: s.DeskripsiCapaian,
		KendalaHambatan:  s.KendalaHambatan,
		DokumentasiURLs:  dokumentasiURLs,
		CreatedAt:        s.CreatedAt,
		UpdatedAt:        s.UpdatedAt,
	}
}
