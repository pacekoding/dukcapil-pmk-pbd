package model

import "time"

type AspirasiJenis string

const (
	AspirasiJenisSaran    AspirasiJenis = "Saran"
	AspirasiJenisMasukan  AspirasiJenis = "Masukan"
	AspirasiJenisKeluhan  AspirasiJenis = "Keluhan"
	AspirasiJenisPendapat AspirasiJenis = "Pendapat"
	AspirasiJenisLainnya  AspirasiJenis = "Lainnya"
)

func (j AspirasiJenis) Valid() bool {
	switch j {
	case AspirasiJenisSaran,
		AspirasiJenisMasukan,
		AspirasiJenisKeluhan,
		AspirasiJenisPendapat,
		AspirasiJenisLainnya:
		return true
	default:
		return false
	}
}

type AspirasiStatus string

const (
	AspirasiStatusBaru    AspirasiStatus = "Baru"
	AspirasiStatusDibaca  AspirasiStatus = "Dibaca"
	AspirasiStatusSelesai AspirasiStatus = "Selesai"
)

func (s AspirasiStatus) Valid() bool {
	switch s {
	case AspirasiStatusBaru, AspirasiStatusDibaca, AspirasiStatusSelesai:
		return true
	default:
		return false
	}
}

type Aspirasi struct {
	ID        int64          `json:"id"`
	Jenis     AspirasiJenis  `json:"jenis"`
	Judul     string         `json:"judul"`
	Isi       string         `json:"isi"`
	Status    AspirasiStatus `json:"status"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

type AspirasiPayload struct {
	Jenis AspirasiJenis `json:"jenis"`
	Judul string        `json:"judul"`
	Isi   string        `json:"isi"`
}

type AspirasiStatusPayload struct {
	Status AspirasiStatus `json:"status"`
}

type AspirasiListResponse struct {
	Items []Aspirasi `json:"items"`
}

type AspirasiEntity struct {
	ID        int64          `gorm:"primaryKey;column:id"`
	Jenis     AspirasiJenis  `gorm:"column:jenis"`
	Judul     string         `gorm:"column:judul"`
	Isi       string         `gorm:"column:isi"`
	Status    AspirasiStatus `gorm:"column:status"`
	CreatedAt time.Time      `gorm:"column:created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at"`
}

func (AspirasiEntity) TableName() string {
	return "aspirasiku_messages"
}

func (a AspirasiEntity) ToAspirasi() Aspirasi {
	return Aspirasi{
		ID:        a.ID,
		Jenis:     a.Jenis,
		Judul:     a.Judul,
		Isi:       a.Isi,
		Status:    a.Status,
		CreatedAt: a.CreatedAt,
		UpdatedAt: a.UpdatedAt,
	}
}
