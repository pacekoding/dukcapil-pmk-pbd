package model

import "time"

type IdmData struct {
	SangatTertinggal int `json:"sangatTertinggal"`
	Tertinggal       int `json:"tertinggal"`
	Berkembang       int `json:"berkembang"`
	Maju             int `json:"maju"`
	Mandiri          int `json:"mandiri"`
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
	Registration PopulationRegistrationData `json:"registration"`
	Oap          OapData                    `json:"oap"`
	Civil        CivilRegistrationData      `json:"civil"`
}

type DataWilayahResponse struct {
	TahunAnggaran string       `json:"tahunAnggaran"`
	Regions       []RegionData `json:"regions"`
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

func (DataWilayahEntity) TableName() string {
	return "data_wilayah"
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
