package model

import "time"

type KategoriUsaha string

const (
	KategoriPertanian      KategoriUsaha = "Pertanian"
	KategoriPerikanan      KategoriUsaha = "Perikanan"
	KategoriPerikananDarat KategoriUsaha = "Perikanan Darat"
	KategoriPerikananLaut  KategoriUsaha = "Perikanan Laut"
	KategoriPeternakan     KategoriUsaha = "Peternakan"
	KategoriPerkebunan     KategoriUsaha = "Perkebunan"
	KategoriPariwisata     KategoriUsaha = "Pariwisata"
	KategoriPerdagangan    KategoriUsaha = "Perdagangan"
	KategoriKerajinan      KategoriUsaha = "Kerajinan"
	KategoriJasa           KategoriUsaha = "Jasa"
	KategoriLainnya        KategoriUsaha = "Lainnya"
)

type KelompokBinaan struct {
	ID            int64         `json:"id"`
	Kode          string        `json:"kode"`
	KabupatenKota string        `json:"kabupatenKota"`
	Distrik       string        `json:"distrik"`
	Kampung       string        `json:"kampung"`
	NamaKelompok  string        `json:"namaKelompok"`
	KategoriUsaha KategoriUsaha `json:"kategoriUsaha"`
	JenisUsaha    string        `json:"jenisUsaha"`
	Komoditas     string        `json:"komoditas"`
	JumlahAnggota int64         `json:"jumlahAnggota"`
	DanaAlokasi   int64         `json:"danaAlokasi"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`
}

type KelompokBinaanPayload struct {
	Kode          string        `json:"kode"`
	KabupatenKota string        `json:"kabupatenKota"`
	Distrik       string        `json:"distrik"`
	Kampung       string        `json:"kampung"`
	NamaKelompok  string        `json:"namaKelompok"`
	KategoriUsaha KategoriUsaha `json:"kategoriUsaha"`
	JenisUsaha    string        `json:"jenisUsaha"`
	Komoditas     string        `json:"komoditas"`
	JumlahAnggota int64         `json:"jumlahAnggota"`
	DanaAlokasi   int64         `json:"danaAlokasi"`
}

type KelompokBinaanListResponse struct {
	Items []KelompokBinaan `json:"items"`
}

type KampungOption struct {
	KabupatenKota string `json:"kabupatenKota"`
	Distrik       string `json:"distrik"`
	Kampung       string `json:"kampung"`
}

type KelompokBinaanOptionsResponse struct {
	KabupatenKota []string        `json:"kabupatenKota"`
	Kampung       []KampungOption `json:"kampung"`
}

type KelompokBinaanEntity struct {
	ID            int64         `gorm:"primaryKey;column:id"`
	Kode          string        `gorm:"column:kode"`
	KabupatenKota string        `gorm:"column:kabupaten_kota"`
	Distrik       string        `gorm:"column:distrik"`
	Kampung       string        `gorm:"column:kampung"`
	NamaKelompok  string        `gorm:"column:nama_kelompok"`
	KategoriUsaha KategoriUsaha `gorm:"column:kategori_usaha"`
	JenisUsaha    string        `gorm:"column:jenis_usaha"`
	Komoditas     string        `gorm:"column:komoditas"`
	JumlahAnggota int64         `gorm:"column:jumlah_anggota"`
	DanaAlokasi   int64         `gorm:"column:dana_alokasi"`
	CreatedAt     time.Time     `gorm:"column:created_at"`
	UpdatedAt     time.Time     `gorm:"column:updated_at"`
}

func (KelompokBinaanEntity) TableName() string {
	return "kelompok_binaan"
}

func (s KelompokBinaanEntity) ToKelompokBinaan() KelompokBinaan {
	return KelompokBinaan(s)
}
