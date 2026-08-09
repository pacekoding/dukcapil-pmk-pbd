package model

import "time"

type SitekadKategoriUsaha string

const (
	SitekadKategoriPertanian      SitekadKategoriUsaha = "Pertanian"
	SitekadKategoriPerikanan      SitekadKategoriUsaha = "Perikanan"
	SitekadKategoriPerikananDarat SitekadKategoriUsaha = "Perikanan Darat"
	SitekadKategoriPerikananLaut  SitekadKategoriUsaha = "Perikanan Laut"
	SitekadKategoriPeternakan     SitekadKategoriUsaha = "Peternakan"
	SitekadKategoriPerkebunan     SitekadKategoriUsaha = "Perkebunan"
	SitekadKategoriPariwisata     SitekadKategoriUsaha = "Pariwisata"
	SitekadKategoriPerdagangan    SitekadKategoriUsaha = "Perdagangan"
	SitekadKategoriKerajinan      SitekadKategoriUsaha = "Kerajinan"
	SitekadKategoriJasa           SitekadKategoriUsaha = "Jasa"
	SitekadKategoriLainnya        SitekadKategoriUsaha = "Lainnya"
)

type SitekadPotensiKampung struct {
	ID            int64                `json:"id"`
	Kode          string               `json:"kode"`
	KabupatenKota string               `json:"kabupatenKota"`
	Distrik       string               `json:"distrik"`
	Kampung       string               `json:"kampung"`
	NamaKelompok  string               `json:"namaKelompok"`
	KategoriUsaha SitekadKategoriUsaha `json:"kategoriUsaha"`
	Komoditas     string               `json:"komoditas"`
	JumlahAnggota int64                `json:"jumlahAnggota"`
	DanaAlokasi   int64                `json:"danaAlokasi"`
	CreatedAt     time.Time            `json:"createdAt"`
	UpdatedAt     time.Time            `json:"updatedAt"`
}

type SitekadPotensiKampungPayload struct {
	Kode          string               `json:"kode"`
	KabupatenKota string               `json:"kabupatenKota"`
	Distrik       string               `json:"distrik"`
	Kampung       string               `json:"kampung"`
	NamaKelompok  string               `json:"namaKelompok"`
	KategoriUsaha SitekadKategoriUsaha `json:"kategoriUsaha"`
	Komoditas     string               `json:"komoditas"`
	JumlahAnggota int64                `json:"jumlahAnggota"`
	DanaAlokasi   int64                `json:"danaAlokasi"`
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
	ID            int64                `gorm:"primaryKey;column:id"`
	Kode          string               `gorm:"column:kode"`
	KabupatenKota string               `gorm:"column:kabupaten_kota"`
	Distrik       string               `gorm:"column:distrik"`
	Kampung       string               `gorm:"column:kampung"`
	NamaKelompok  string               `gorm:"column:nama_kelompok"`
	KategoriUsaha SitekadKategoriUsaha `gorm:"column:kategori_usaha"`
	Komoditas     string               `gorm:"column:komoditas"`
	JumlahAnggota int64                `gorm:"column:jumlah_anggota"`
	DanaAlokasi   int64                `gorm:"column:dana_alokasi"`
	CreatedAt     time.Time            `gorm:"column:created_at"`
	UpdatedAt     time.Time            `gorm:"column:updated_at"`
}

func (SitekadPotensiKampungEntity) TableName() string {
	return "sitekad_potensi_kampung"
}

func (s SitekadPotensiKampungEntity) ToSitekadPotensiKampung() SitekadPotensiKampung {
	return SitekadPotensiKampung{
		ID:            s.ID,
		Kode:          s.Kode,
		KabupatenKota: s.KabupatenKota,
		Distrik:       s.Distrik,
		Kampung:       s.Kampung,
		NamaKelompok:  s.NamaKelompok,
		KategoriUsaha: s.KategoriUsaha,
		Komoditas:     s.Komoditas,
		JumlahAnggota: s.JumlahAnggota,
		DanaAlokasi:   s.DanaAlokasi,
		CreatedAt:     s.CreatedAt,
		UpdatedAt:     s.UpdatedAt,
	}
}
