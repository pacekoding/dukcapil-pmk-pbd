package model

import (
	"time"

	"github.com/lib/pq"
)

type IdmData struct {
	SangatTertinggal int `json:"sangatTertinggal"`
	Tertinggal       int `json:"tertinggal"`
	Berkembang       int `json:"berkembang"`
	Maju             int `json:"maju"`
	Mandiri          int `json:"mandiri"`
}

type BumdesData struct {
	Jumlah     int `json:"jumlah"`
	Aktif      int `json:"aktif"`
	TidakAktif int `json:"tidakAktif"`
	Bersama    int `json:"bersama"`
}

type PopulationRegistrationData struct {
	PenerbitanKk    int `json:"penerbitanKk"`
	PerubahanKk     int `json:"perubahanKk"`
	Kia             int `json:"kia"`
	NikWni          int `json:"nikWni"`
	PerekamanKtpEl  int `json:"perekamanKtpEl"`
	PencetakanKtpEl int `json:"pencetakanKtpEl"`
}

type OapData struct {
	LuasWilayah  float64 `json:"luasWilayah"`
	JumlahOap    int     `json:"jumlahOap"`
	JumlahNonOap int     `json:"jumlahNonOap"`
	JumlahJiwa   int     `json:"jumlahJiwa"`
}

type DataWilayahOapPayload struct {
	LuasWilayah  float64 `json:"luasWilayah"`
	JumlahOap    int     `json:"jumlahOap"`
	JumlahNonOap int     `json:"jumlahNonOap"`
}

type DataWilayahDukcapilPayload struct {
	Registration PopulationRegistrationData `json:"registration"`
	Civil        CivilRegistrationData      `json:"civil"`
	Oap          DataWilayahOapPayload      `json:"oap"`
}

type CivilRegistrationData struct {
	AktaKelahiran  int `json:"aktaKelahiran"`
	AktaKematian   int `json:"aktaKematian"`
	AktaPerkawinan int `json:"aktaPerkawinan"`
	AktaPerceraian int `json:"aktaPerceraian"`
}

type RegionData struct {
	ID           string                     `json:"id"`
	Name         string                     `json:"name"`
	ShortName    string                     `json:"shortName"`
	Type         string                     `json:"type"`
	MapLabel     string                     `json:"mapLabel"`
	Idm          IdmData                    `json:"idm"`
	Bumdes       BumdesData                 `json:"bumdes"`
	Registration PopulationRegistrationData `json:"registration"`
	Oap          OapData                    `json:"oap"`
	Civil        CivilRegistrationData      `json:"civil"`
}

type DataWilayahResponse struct {
	TahunAnggaran string       `json:"tahunAnggaran"`
	Regions       []RegionData `json:"regions"`
	UpdatedAt     *time.Time   `json:"updatedAt,omitempty"`
}

type DataWilayahWebsiteSettings struct {
	FeaturedTahunAnggaran  string   `json:"featuredTahunAnggaran"`
	PublishedTahunAnggaran []string `json:"publishedTahunAnggaran"`
}

type DataWilayahWebsiteSettingsResponse struct {
	FeaturedTahunAnggaran  string   `json:"featuredTahunAnggaran"`
	PublishedTahunAnggaran []string `json:"publishedTahunAnggaran"`
	AvailableTahunAnggaran []string `json:"availableTahunAnggaran"`
}

type DataWilayahWebsiteSettingsPayload struct {
	FeaturedTahunAnggaran  string   `json:"featuredTahunAnggaran"`
	PublishedTahunAnggaran []string `json:"publishedTahunAnggaran"`
}

type DataWilayahEntity struct {
	TahunAnggaran               string    `gorm:"primaryKey;column:tahun_anggaran"`
	ID                          string    `gorm:"primaryKey;column:id"`
	SortOrder                   int       `gorm:"column:sort_order"`
	Name                        string    `gorm:"column:name"`
	ShortName                   string    `gorm:"column:short_name"`
	RegionType                  string    `gorm:"column:region_type"`
	MapLabel                    string    `gorm:"column:map_label"`
	IdmSangatTertinggal         int       `gorm:"column:idm_sangat_tertinggal"`
	IdmTertinggal               int       `gorm:"column:idm_tertinggal"`
	IdmBerkembang               int       `gorm:"column:idm_berkembang"`
	IdmMaju                     int       `gorm:"column:idm_maju"`
	IdmMandiri                  int       `gorm:"column:idm_mandiri"`
	BumdesJumlah                int       `gorm:"column:bumdes_jumlah"`
	BumdesAktif                 int       `gorm:"column:bumdes_aktif"`
	BumdesTidakAktif            int       `gorm:"column:bumdes_tidak_aktif"`
	BumdesBersama               int       `gorm:"column:bumdes_bersama"`
	RegistrationPenerbitanKk    int       `gorm:"column:registration_penerbitan_kk"`
	RegistrationPerubahanKk     int       `gorm:"column:registration_perubahan_kk"`
	RegistrationKia             int       `gorm:"column:registration_kia"`
	RegistrationNikWni          int       `gorm:"column:registration_nik_wni"`
	RegistrationPerekamanKtpEl  int       `gorm:"column:registration_perekaman_ktp_el"`
	RegistrationPencetakanKtpEl int       `gorm:"column:registration_pencetakan_ktp_el"`
	OapLuasWilayah              float64   `gorm:"column:oap_luas_wilayah"`
	OapJumlahOap                int       `gorm:"column:oap_jumlah_oap"`
	OapJumlahNonOap             int       `gorm:"column:oap_jumlah_non_oap"`
	OapJumlahJiwa               int       `gorm:"column:oap_jumlah_jiwa"`
	CivilAktaKelahiran          int       `gorm:"column:civil_akta_kelahiran"`
	CivilAktaKematian           int       `gorm:"column:civil_akta_kematian"`
	CivilAktaPerkawinan         int       `gorm:"column:civil_akta_perkawinan"`
	CivilAktaPerceraian         int       `gorm:"column:civil_akta_perceraian"`
	CreatedAt                   time.Time `gorm:"column:created_at"`
	UpdatedAt                   time.Time `gorm:"column:updated_at"`
}

type DataWilayahPublicSettingsEntity struct {
	ID                     int            `gorm:"primaryKey;column:id"`
	FeaturedTahunAnggaran  string         `gorm:"column:featured_tahun_anggaran"`
	PublishedTahunAnggaran pq.StringArray `gorm:"type:text[];column:published_tahun_anggaran"`
	CreatedAt              time.Time      `gorm:"column:created_at"`
	UpdatedAt              time.Time      `gorm:"column:updated_at"`
}

func (DataWilayahEntity) TableName() string {
	return "data_wilayah"
}

func (DataWilayahPublicSettingsEntity) TableName() string {
	return "data_wilayah_public_settings"
}

func (d DataWilayahEntity) ToRegionData() RegionData {
	return RegionData{
		ID:        d.ID,
		Name:      d.Name,
		ShortName: d.ShortName,
		Type:      d.RegionType,
		MapLabel:  d.MapLabel,
		Idm: IdmData{
			SangatTertinggal: d.IdmSangatTertinggal,
			Tertinggal:       d.IdmTertinggal,
			Berkembang:       d.IdmBerkembang,
			Maju:             d.IdmMaju,
			Mandiri:          d.IdmMandiri,
		},
		Bumdes: BumdesData{
			Jumlah:     d.BumdesJumlah,
			Aktif:      d.BumdesAktif,
			TidakAktif: d.BumdesTidakAktif,
			Bersama:    d.BumdesBersama,
		},
		Registration: PopulationRegistrationData{
			PenerbitanKk:    d.RegistrationPenerbitanKk,
			PerubahanKk:     d.RegistrationPerubahanKk,
			Kia:             d.RegistrationKia,
			NikWni:          d.RegistrationNikWni,
			PerekamanKtpEl:  d.RegistrationPerekamanKtpEl,
			PencetakanKtpEl: d.RegistrationPencetakanKtpEl,
		},
		Oap: OapData{
			LuasWilayah:  d.OapLuasWilayah,
			JumlahOap:    d.OapJumlahOap,
			JumlahNonOap: d.OapJumlahNonOap,
			JumlahJiwa:   d.OapJumlahJiwa,
		},
		Civil: CivilRegistrationData{
			AktaKelahiran:  d.CivilAktaKelahiran,
			AktaKematian:   d.CivilAktaKematian,
			AktaPerkawinan: d.CivilAktaPerkawinan,
			AktaPerceraian: d.CivilAktaPerceraian,
		},
	}
}

func (d DataWilayahPublicSettingsEntity) ToWebsiteSettings() DataWilayahWebsiteSettings {
	return DataWilayahWebsiteSettings{
		FeaturedTahunAnggaran:  d.FeaturedTahunAnggaran,
		PublishedTahunAnggaran: append([]string(nil), d.PublishedTahunAnggaran...),
	}
}
