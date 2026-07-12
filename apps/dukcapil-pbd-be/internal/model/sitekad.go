package model

import "time"

type SitekadKategoriUsaha string

const (
	SitekadKategoriPertanian   SitekadKategoriUsaha = "Pertanian"
	SitekadKategoriPerikanan   SitekadKategoriUsaha = "Perikanan"
	SitekadKategoriPeternakan  SitekadKategoriUsaha = "Peternakan"
	SitekadKategoriPerkebunan  SitekadKategoriUsaha = "Perkebunan"
	SitekadKategoriPariwisata  SitekadKategoriUsaha = "Pariwisata"
	SitekadKategoriPerdagangan SitekadKategoriUsaha = "Perdagangan"
	SitekadKategoriKerajinan   SitekadKategoriUsaha = "Kerajinan"
	SitekadKategoriJasa        SitekadKategoriUsaha = "Jasa"
	SitekadKategoriLainnya     SitekadKategoriUsaha = "Lainnya"
)

type SitekadPotensiKampung struct {
	ID              int64                `json:"id"`
	Kode            string               `json:"kode"`
	KabupatenKota   string               `json:"kabupatenKota"`
	Kampung         string               `json:"kampung"`
	KategoriUsaha   SitekadKategoriUsaha `json:"kategoriUsaha"`
	DanaAlokasi     int64                `json:"danaAlokasi"`
	CapaianUtama    string               `json:"capaianUtama"`
	KendalaLapangan string               `json:"kendalaLapangan"`
	CreatedAt       time.Time            `json:"createdAt"`
	UpdatedAt       time.Time            `json:"updatedAt"`
}

type SitekadPotensiKampungPayload struct {
	Kode            string               `json:"kode"`
	KabupatenKota   string               `json:"kabupatenKota"`
	Kampung         string               `json:"kampung"`
	KategoriUsaha   SitekadKategoriUsaha `json:"kategoriUsaha"`
	DanaAlokasi     int64                `json:"danaAlokasi"`
	CapaianUtama    string               `json:"capaianUtama"`
	KendalaLapangan string               `json:"kendalaLapangan"`
}

type SitekadPotensiKampungListResponse struct {
	Items []SitekadPotensiKampung `json:"items"`
}

type SitekadKampungOption struct {
	KabupatenKota string `json:"kabupatenKota"`
	Distrik       string `json:"distrik"`
	Kampung       string `json:"kampung"`
}

type SitekadOptionsResponse struct {
	KabupatenKota []string               `json:"kabupatenKota"`
	Kampung       []SitekadKampungOption `json:"kampung"`
}

type SitekadPotensiKampungEntity struct {
	ID              int64                `gorm:"primaryKey;column:id"`
	Kode            string               `gorm:"column:kode"`
	KabupatenKota   string               `gorm:"column:kabupaten_kota"`
	Kampung         string               `gorm:"column:kampung"`
	KategoriUsaha   SitekadKategoriUsaha `gorm:"column:kategori_usaha"`
	DanaAlokasi     int64                `gorm:"column:dana_alokasi"`
	CapaianUtama    string               `gorm:"column:capaian_utama"`
	KendalaLapangan string               `gorm:"column:kendala_lapangan"`
	CreatedAt       time.Time            `gorm:"column:created_at"`
	UpdatedAt       time.Time            `gorm:"column:updated_at"`
}

func (SitekadPotensiKampungEntity) TableName() string {
	return "sitekad_potensi_kampung"
}

func (s SitekadPotensiKampungEntity) ToSitekadPotensiKampung() SitekadPotensiKampung {
	return SitekadPotensiKampung{
		ID:              s.ID,
		Kode:            s.Kode,
		KabupatenKota:   s.KabupatenKota,
		Kampung:         s.Kampung,
		KategoriUsaha:   s.KategoriUsaha,
		DanaAlokasi:     s.DanaAlokasi,
		CapaianUtama:    s.CapaianUtama,
		KendalaLapangan: s.KendalaLapangan,
		CreatedAt:       s.CreatedAt,
		UpdatedAt:       s.UpdatedAt,
	}
}
