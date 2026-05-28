package model

import "time"

type DokumenEntity struct {
	ID            int       `gorm:"primaryKey;column:id"`
	NamaKegiatan  string    `gorm:"column:nama_kegiatan"`
	JenisKegiatan string    `gorm:"column:jenis_kegiatan"`
	JenisDokumen  string    `gorm:"column:jenis_dokumen"`
	Tanggal       string    `gorm:"column:tanggal"`
	DibuatOleh    string    `gorm:"column:dibuat_oleh"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}

func (DokumenEntity) TableName() string {
	return "dokumen"
}

func (d DokumenEntity) ToDokumen() Dokumen {
	return Dokumen{
		ID:            d.ID,
		NamaKegiatan:  d.NamaKegiatan,
		JenisKegiatan: d.JenisKegiatan,
		JenisDokumen:  d.JenisDokumen,
		Tanggal:       d.Tanggal,
		DibuatOleh:    d.DibuatOleh,
	}
}
