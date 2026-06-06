package model

import "time"

type SSD struct {
	ID                  int64         `json:"id"`
	TahunAnggaran       string        `json:"tahunAnggaran"`
	Kode                string        `json:"kode"`
	Uraian              string        `json:"uraian"`
	Satuan              string        `json:"satuan"`
	DefinisiOperasional string        `json:"definisiOperasional"`
	IsActive            bool          `json:"isActive"`
	JumlahVariabel      int           `json:"jumlahVariabel"`
	JumlahIndikator     int           `json:"jumlahIndikator"`
	Variables           []SSDVariable `json:"variables"`
}

type SSDPayload struct {
	Kode                string                `json:"kode"`
	Uraian              string                `json:"uraian"`
	Satuan              string                `json:"satuan"`
	DefinisiOperasional string                `json:"definisiOperasional"`
	Variables           []SSDVariablePayload  `json:"variables"`
	Indicators          []SSDIndicatorPayload `json:"indicators"`
}

type SSDVariable struct {
	ID                int64  `json:"id"`
	SSDID             int64  `json:"ssdId"`
	TahunAnggaran     string `json:"tahunAnggaran"`
	SortOrder         int    `json:"sortOrder"`
	NamaVariabel      string `json:"namaVariabel"`
	KonsepDasar       string `json:"konsepDasar"`
	DefinisiVariabel  string `json:"definisiVariabel"`
	ReferensiWaktu    string `json:"referensiWaktu"`
	KalimatPertanyaan string `json:"kalimatPertanyaan"`
}

type SSDVariablePayload struct {
	NamaVariabel      string `json:"namaVariabel"`
	KonsepDasar       string `json:"konsepDasar"`
	DefinisiVariabel  string `json:"definisiVariabel"`
	ReferensiWaktu    string `json:"referensiWaktu"`
	KalimatPertanyaan string `json:"kalimatPertanyaan"`
}

type SSDIndicator struct {
	ID                   int64   `json:"id"`
	SSDID                int64   `json:"ssdId"`
	TahunAnggaran        string  `json:"tahunAnggaran"`
	SortOrder            int     `json:"sortOrder"`
	NamaIndikator        string  `json:"namaIndikator"`
	KonsepIndikator      string  `json:"konsepIndikator"`
	LevelEstimasiHasil   string  `json:"levelEstimasiHasil"`
	UkuranIndikator      string  `json:"ukuranIndikator"`
	SatuanIndikator      string  `json:"satuanIndikator"`
	KlasifikasiPenyajian string  `json:"klasifikasiPenyajian"`
	DefinisiIndikator    string  `json:"definisiIndikator"`
	MetodeRumus          string  `json:"metodeRumus"`
	InterpretasiHasil    string  `json:"interpretasiHasil"`
	VariableIDs          []int64 `json:"variableIds"`
}

type SSDIndicatorPayload struct {
	NamaIndikator        string  `json:"namaIndikator"`
	KonsepIndikator      string  `json:"konsepIndikator"`
	LevelEstimasiHasil   string  `json:"levelEstimasiHasil"`
	UkuranIndikator      string  `json:"ukuranIndikator"`
	SatuanIndikator      string  `json:"satuanIndikator"`
	KlasifikasiPenyajian string  `json:"klasifikasiPenyajian"`
	DefinisiIndikator    string  `json:"definisiIndikator"`
	MetodeRumus          string  `json:"metodeRumus"`
	InterpretasiHasil    string  `json:"interpretasiHasil"`
	VariableIDs          []int64 `json:"variableIds"`
}

type SSDDetail struct {
	SSD
	Variables  []SSDVariable  `json:"variables"`
	Indicators []SSDIndicator `json:"indicators"`
}

type SSDStatusPayload struct {
	IsActive bool `json:"isActive"`
}

type SSDListResponse struct {
	TahunAnggaran string `json:"tahunAnggaran"`
	Items         []SSD  `json:"items"`
}

type SSDImportResult struct {
	TahunAnggaran string `json:"tahunAnggaran"`
	Total         int    `json:"total"`
	Created       int    `json:"created"`
	Updated       int    `json:"updated"`
}

type SSDEntity struct {
	ID                  int64     `gorm:"primaryKey;column:id"`
	TahunAnggaran       string    `gorm:"column:tahun_anggaran"`
	Kode                string    `gorm:"column:kode"`
	Uraian              string    `gorm:"column:uraian"`
	Satuan              string    `gorm:"column:satuan"`
	DefinisiOperasional string    `gorm:"column:definisi_operasional"`
	IsActive            bool      `gorm:"column:is_active"`
	CreatedAt           time.Time `gorm:"column:created_at"`
	UpdatedAt           time.Time `gorm:"column:updated_at"`
}

func (SSDEntity) TableName() string {
	return "ssd"
}

func (s SSDEntity) ToSSD() SSD {
	return SSD{
		ID:                  s.ID,
		TahunAnggaran:       s.TahunAnggaran,
		Kode:                s.Kode,
		Uraian:              s.Uraian,
		Satuan:              s.Satuan,
		DefinisiOperasional: s.DefinisiOperasional,
		IsActive:            s.IsActive,
		JumlahVariabel:      0,
		JumlahIndikator:     0,
		Variables:           []SSDVariable{},
	}
}

type SSDVariableEntity struct {
	ID                 int64     `gorm:"primaryKey;column:id"`
	SSDID              int64     `gorm:"column:ssd_id"`
	TahunAnggaran      string    `gorm:"column:tahun_anggaran"`
	SortOrder          int       `gorm:"column:sort_order"`
	NamaVariabel       string    `gorm:"column:nama_variabel"`
	AliasKodeTeknis    string    `gorm:"column:alias_kode_teknis"`
	TipeDataKomputer   string    `gorm:"column:tipe_data_komputer"`
	ReferensiWaktu     string    `gorm:"column:referensi_waktu"`
	KonsepDasar        string    `gorm:"column:konsep_dasar"`
	DefinisiVariabel   string    `gorm:"column:definisi_variabel"`
	ReferensiPemilihan string    `gorm:"column:referensi_pemilihan"`
	KlasifikasiIsian   string    `gorm:"column:klasifikasi_isian"`
	AturanValidasi     string    `gorm:"column:aturan_validasi"`
	KalimatPertanyaan  string    `gorm:"column:kalimat_pertanyaan"`
	CreatedAt          time.Time `gorm:"column:created_at"`
	UpdatedAt          time.Time `gorm:"column:updated_at"`
}

func (SSDVariableEntity) TableName() string {
	return "ssd_variables"
}

func (s SSDVariableEntity) ToSSDVariable() SSDVariable {
	return SSDVariable{
		ID:                s.ID,
		SSDID:             s.SSDID,
		TahunAnggaran:     s.TahunAnggaran,
		SortOrder:         s.SortOrder,
		NamaVariabel:      s.NamaVariabel,
		KonsepDasar:       s.KonsepDasar,
		DefinisiVariabel:  s.DefinisiVariabel,
		ReferensiWaktu:    s.ReferensiWaktu,
		KalimatPertanyaan: s.KalimatPertanyaan,
	}
}

type SSDIndicatorEntity struct {
	ID                   int64     `gorm:"primaryKey;column:id"`
	SSDID                int64     `gorm:"column:ssd_id"`
	VariableID           int64     `gorm:"column:variable_id"`
	TahunAnggaran        string    `gorm:"column:tahun_anggaran"`
	SortOrder            int       `gorm:"column:sort_order"`
	NamaIndikator        string    `gorm:"column:nama_indikator"`
	KonsepIndikator      string    `gorm:"column:konsep_indikator"`
	LevelEstimasiHasil   string    `gorm:"column:level_estimasi_hasil"`
	UkuranIndikator      string    `gorm:"column:ukuran_indikator"`
	SatuanIndikator      string    `gorm:"column:satuan_indikator"`
	KlasifikasiPenyajian string    `gorm:"column:klasifikasi_penyajian"`
	DefinisiIndikator    string    `gorm:"column:definisi_indikator"`
	MetodeRumus          string    `gorm:"column:metode_rumus"`
	InterpretasiHasil    string    `gorm:"column:interpretasi_hasil"`
	CreatedAt            time.Time `gorm:"column:created_at"`
	UpdatedAt            time.Time `gorm:"column:updated_at"`
}

func (SSDIndicatorEntity) TableName() string {
	return "ssd_indicators"
}

func (s SSDIndicatorEntity) ToSSDIndicator() SSDIndicator {
	return SSDIndicator{
		ID:                   s.ID,
		SSDID:                s.SSDID,
		TahunAnggaran:        s.TahunAnggaran,
		SortOrder:            s.SortOrder,
		NamaIndikator:        s.NamaIndikator,
		KonsepIndikator:      s.KonsepIndikator,
		LevelEstimasiHasil:   s.LevelEstimasiHasil,
		UkuranIndikator:      s.UkuranIndikator,
		SatuanIndikator:      s.SatuanIndikator,
		KlasifikasiPenyajian: s.KlasifikasiPenyajian,
		DefinisiIndikator:    s.DefinisiIndikator,
		MetodeRumus:          s.MetodeRumus,
		InterpretasiHasil:    s.InterpretasiHasil,
		VariableIDs:          []int64{},
	}
}

type SSDIndicatorVariableEntity struct {
	IndicatorID   int64     `gorm:"column:indicator_id"`
	VariableID    int64     `gorm:"column:variable_id"`
	TahunAnggaran string    `gorm:"column:tahun_anggaran"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (SSDIndicatorVariableEntity) TableName() string {
	return "ssd_indicator_variables"
}

type SubkegiatanSSDEntity struct {
	SubkegiatanID int64     `gorm:"column:subkegiatan_id"`
	SSDID         int64     `gorm:"column:ssd_id"`
	TahunAnggaran string    `gorm:"column:tahun_anggaran"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (SubkegiatanSSDEntity) TableName() string {
	return "subkegiatan_ssd"
}
