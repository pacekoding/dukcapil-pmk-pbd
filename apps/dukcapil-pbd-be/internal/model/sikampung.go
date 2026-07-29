package model

import "time"

type SikampungStatusIDM string

const (
	SikampungStatusIDMMandiri          SikampungStatusIDM = "Mandiri"
	SikampungStatusIDMMaju             SikampungStatusIDM = "Maju"
	SikampungStatusIDMBerkembang       SikampungStatusIDM = "Berkembang"
	SikampungStatusIDMTertinggal       SikampungStatusIDM = "Tertinggal"
	SikampungStatusIDMSangatTertinggal SikampungStatusIDM = "Sangat Tertinggal"
)

func (s SikampungStatusIDM) Valid() bool {
	switch s {
	case SikampungStatusIDMMandiri,
		SikampungStatusIDMMaju,
		SikampungStatusIDMBerkembang,
		SikampungStatusIDMTertinggal,
		SikampungStatusIDMSangatTertinggal:
		return true
	default:
		return false
	}
}

type SikampungData struct {
	ID            int64              `json:"id"`
	TahunAnggaran string             `json:"tahunAnggaran"`
	KodeDesa      string             `json:"kodeDesa"`
	Desa          string             `json:"desa"`
	Distrik       string             `json:"distrik"`
	Kabupaten     string             `json:"kabupaten"`
	IKS           float64            `json:"iks"`
	IKE           float64            `json:"ike"`
	IKL           float64            `json:"ikl"`
	NilaiIDM      float64            `json:"nilaiIdm"`
	StatusIDM     SikampungStatusIDM `json:"statusIdm"`
	CreatedAt     string             `json:"createdAt"`
	UpdatedAt     string             `json:"updatedAt"`
}

type SikampungPayload struct {
	KodeDesa  string             `json:"kodeDesa"`
	Desa      string             `json:"desa"`
	Distrik   string             `json:"distrik"`
	Kabupaten string             `json:"kabupaten"`
	IKS       float64            `json:"iks"`
	IKE       float64            `json:"ike"`
	IKL       float64            `json:"ikl"`
	NilaiIDM  float64            `json:"nilaiIdm"`
	StatusIDM SikampungStatusIDM `json:"statusIdm"`
}

type SikampungListResponse struct {
	TahunAnggaran string          `json:"tahunAnggaran"`
	Items         []SikampungData `json:"items"`
}

type SikampungEntity struct {
	ID            int64              `gorm:"primaryKey;column:id"`
	TahunAnggaran string             `gorm:"column:tahun_anggaran"`
	KodeDesa      string             `gorm:"column:kode_desa"`
	Desa          string             `gorm:"column:desa"`
	Distrik       string             `gorm:"column:distrik"`
	Kabupaten     string             `gorm:"column:kabupaten"`
	IKS           float64            `gorm:"column:iks"`
	IKE           float64            `gorm:"column:ike"`
	IKL           float64            `gorm:"column:ikl"`
	NilaiIDM      float64            `gorm:"column:nilai_idm"`
	StatusIDM     SikampungStatusIDM `gorm:"column:status_idm"`
	CreatedAt     time.Time          `gorm:"column:created_at"`
	UpdatedAt     time.Time          `gorm:"column:updated_at"`
}

func (SikampungEntity) TableName() string {
	return "sikampung_data"
}

func (s SikampungEntity) ToSikampungData() SikampungData {
	return SikampungData{
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
