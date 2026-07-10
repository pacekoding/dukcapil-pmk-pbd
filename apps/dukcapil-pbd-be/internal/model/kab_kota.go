package model

import "time"

type KabKota struct {
	ID          int64  `json:"id"`
	KodeWilayah string `json:"kodeWilayah"`
	Nama        string `json:"nama"`
	Provinsi    string `json:"provinsi"`
}

type KabKotaPayload struct {
	KodeWilayah string `json:"kodeWilayah"`
	Nama        string `json:"nama"`
	Provinsi    string `json:"provinsi"`
}

type KabKotaEntity struct {
	ID          int64     `gorm:"primaryKey;column:id"`
	KodeWilayah string    `gorm:"column:kode_wilayah"`
	Nama        string    `gorm:"column:nama"`
	Provinsi    string    `gorm:"column:provinsi"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

func (KabKotaEntity) TableName() string {
	return "kab_kota"
}

func (k KabKotaEntity) ToKabKota() KabKota {
	return KabKota{
		ID:          k.ID,
		KodeWilayah: k.KodeWilayah,
		Nama:        k.Nama,
		Provinsi:    k.Provinsi,
	}
}
