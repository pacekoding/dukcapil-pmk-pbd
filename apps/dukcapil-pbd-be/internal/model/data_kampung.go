package model

import "time"

type DataKampungStatusIDM string

const (
	DataKampungStatusIDMMandiri          DataKampungStatusIDM = "Mandiri"
	DataKampungStatusIDMMaju             DataKampungStatusIDM = "Maju"
	DataKampungStatusIDMBerkembang       DataKampungStatusIDM = "Berkembang"
	DataKampungStatusIDMTertinggal       DataKampungStatusIDM = "Tertinggal"
	DataKampungStatusIDMSangatTertinggal DataKampungStatusIDM = "Sangat Tertinggal"
)

func (s DataKampungStatusIDM) Valid() bool {
	switch s {
	case DataKampungStatusIDMMandiri,
		DataKampungStatusIDMMaju,
		DataKampungStatusIDMBerkembang,
		DataKampungStatusIDMTertinggal,
		DataKampungStatusIDMSangatTertinggal:
		return true
	default:
		return false
	}
}

type DataKampungData struct {
	ID            int64                `json:"id"`
	TahunAnggaran string               `json:"tahunAnggaran"`
	KodeDesa      string               `json:"kodeDesa"`
	Desa          string               `json:"desa"`
	Distrik       string               `json:"distrik"`
	Kabupaten     string               `json:"kabupaten"`
	IKS           float64              `json:"iks"`
	IKE           float64              `json:"ike"`
	IKL           float64              `json:"ikl"`
	NilaiIDM      float64              `json:"nilaiIdm"`
	StatusIDM     DataKampungStatusIDM `json:"statusIdm"`
	CreatedAt     string               `json:"createdAt"`
	UpdatedAt     string               `json:"updatedAt"`
}

type DataKampungPayload struct {
	KodeDesa  string               `json:"kodeDesa"`
	Desa      string               `json:"desa"`
	Distrik   string               `json:"distrik"`
	Kabupaten string               `json:"kabupaten"`
	IKS       float64              `json:"iks"`
	IKE       float64              `json:"ike"`
	IKL       float64              `json:"ikl"`
	NilaiIDM  float64              `json:"nilaiIdm"`
	StatusIDM DataKampungStatusIDM `json:"statusIdm"`
}

type DataKampungListParams struct {
	TahunAnggaran string
	Search        string
	Page          int
	PageSize      int
}

type DataKampungListResponse struct {
	TahunAnggaran string            `json:"tahunAnggaran"`
	Items         []DataKampungData `json:"items"`
	Page          int               `json:"page"`
	PageSize      int               `json:"pageSize"`
	Total         int64             `json:"total"`
}

type DataKampungEntity struct {
	ID            int64                `gorm:"primaryKey;column:id"`
	TahunAnggaran string               `gorm:"column:tahun_anggaran"`
	KodeDesa      string               `gorm:"column:kode_desa"`
	Desa          string               `gorm:"column:desa"`
	Distrik       string               `gorm:"column:distrik"`
	Kabupaten     string               `gorm:"column:kabupaten"`
	IKS           float64              `gorm:"column:iks"`
	IKE           float64              `gorm:"column:ike"`
	IKL           float64              `gorm:"column:ikl"`
	NilaiIDM      float64              `gorm:"column:nilai_idm"`
	StatusIDM     DataKampungStatusIDM `gorm:"column:status_idm"`
	CreatedAt     time.Time            `gorm:"column:created_at"`
	UpdatedAt     time.Time            `gorm:"column:updated_at"`
}

func (DataKampungEntity) TableName() string {
	return "data_kampung"
}

func (s DataKampungEntity) ToDataKampungData() DataKampungData {
	return DataKampungData{
		ID:            s.ID,
		TahunAnggaran: s.TahunAnggaran,
		KodeDesa:      s.KodeDesa,
		Desa:          s.Desa,
		Distrik:       s.Distrik,
		Kabupaten:     s.Kabupaten,
		IKS:           s.IKS,
		IKE:           s.IKE,
		IKL:           s.IKL,
		NilaiIDM:      s.NilaiIDM,
		StatusIDM:     s.StatusIDM,
		CreatedAt:     formatJSONTime(s.CreatedAt),
		UpdatedAt:     formatJSONTime(s.UpdatedAt),
	}
}
