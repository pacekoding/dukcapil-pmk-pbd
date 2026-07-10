package model

import "time"

type BumKampungKategori string

const (
	BumKampungKategoriMandiri BumKampungKategori = "BUMKam"
	BumKampungKategoriBersama BumKampungKategori = "BUMKam bersama"
)

type BumKampungStatus string

const (
	BumKampungStatusDokumenBadanHukumTerverifikasi BumKampungStatus = "Dokumen Badan Hukum Terverifikasi"
	BumKampungStatusNamaTerverifikasi              BumKampungStatus = "Nama Terverifikasi"
	BumKampungStatusPerbaikanDokumenBadanHukum     BumKampungStatus = "Perbaikan Dokumen Badan Hukum"
	BumKampungStatusPerbaikanNama                  BumKampungStatus = "Perbaikan Nama"
)

type BumKampung struct {
	ID             int64              `json:"id"`
	TahunAnggaran  string             `json:"tahunAnggaran"`
	KabupatenKota  string             `json:"kabupatenKota"`
	Distrik        string             `json:"distrik"`
	Kampung        string             `json:"kampung"`
	NamaBumKampung string             `json:"namaBumKampung"`
	Kategori       BumKampungKategori `json:"kategori"`
	Status         BumKampungStatus   `json:"status"`
}

type BumKampungPayload struct {
	KabupatenKota  string             `json:"kabupatenKota"`
	Distrik        string             `json:"distrik"`
	Kampung        string             `json:"kampung"`
	NamaBumKampung string             `json:"namaBumKampung"`
	Kategori       BumKampungKategori `json:"kategori"`
	Status         BumKampungStatus   `json:"status"`
}

type BumKampungListResponse struct {
	TahunAnggaran string       `json:"tahunAnggaran"`
	Items         []BumKampung `json:"items"`
}

type BumKampungEntity struct {
	ID             int64              `gorm:"primaryKey;column:id"`
	TahunAnggaran  string             `gorm:"column:tahun_anggaran"`
	KabupatenKota  string             `gorm:"column:kabupaten_kota"`
	Distrik        string             `gorm:"column:distrik"`
	Kampung        string             `gorm:"column:kampung"`
	NamaBumKampung string             `gorm:"column:nama_bum_kampung"`
	Kategori       BumKampungKategori `gorm:"column:kategori"`
	Status         BumKampungStatus   `gorm:"column:status"`
	CreatedAt      time.Time          `gorm:"column:created_at"`
	UpdatedAt      time.Time          `gorm:"column:updated_at"`
}

func (BumKampungEntity) TableName() string {
	return "bum_kampung"
}

func (b BumKampungEntity) ToBumKampung() BumKampung {
	return BumKampung{
		ID:             b.ID,
		TahunAnggaran:  b.TahunAnggaran,
		KabupatenKota:  b.KabupatenKota,
		Distrik:        b.Distrik,
		Kampung:        b.Kampung,
		NamaBumKampung: b.NamaBumKampung,
		Kategori:       b.Kategori,
		Status:         b.Status,
	}
}
