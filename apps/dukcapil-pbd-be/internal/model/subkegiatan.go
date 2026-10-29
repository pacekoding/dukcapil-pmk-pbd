package model

import "time"

type Subkegiatan struct {
	ID                  int64  `json:"id"`
	Bidang              string `json:"bidang"`
	Program             string `json:"program"`
	Kegiatan            string `json:"kegiatan"`
	Subkegiatan         string `json:"subkegiatan"`
	Kinerja             string `json:"kinerja"`
	Indikator           string `json:"indikator"`
	Satuan              string `json:"satuan"`
	DefinisiOperasional string `json:"definisiOperasional"`
}

type SubkegiatanPayload struct {
	Bidang              string `json:"bidang"`
	Program             string `json:"program"`
	Kegiatan            string `json:"kegiatan"`
	Subkegiatan         string `json:"subkegiatan"`
	Kinerja             string `json:"kinerja"`
	Indikator           string `json:"indikator"`
	Satuan              string `json:"satuan"`
	DefinisiOperasional string `json:"definisiOperasional"`
}

type SubkegiatanListParams struct {
	Search   string
	Page     int
	PageSize int
}

type SubkegiatanListResponse struct {
	Items    []Subkegiatan `json:"items"`
	Page     int           `json:"page"`
	PageSize int           `json:"pageSize"`
	Total    int64         `json:"total"`
}

type SubkegiatanImportRow struct {
	Row                 int    `json:"row"`
	Bidang              string `json:"bidang"`
	Program             string `json:"program"`
	Kegiatan            string `json:"kegiatan"`
	Subkegiatan         string `json:"subkegiatan"`
	Kinerja             string `json:"kinerja"`
	Indikator           string `json:"indikator"`
	Satuan              string `json:"satuan"`
	DefinisiOperasional string `json:"definisiOperasional"`
	Status              string `json:"status"`
	Message             string `json:"message,omitempty"`
}

func (r SubkegiatanImportRow) Payload() SubkegiatanPayload {
	return SubkegiatanPayload{Bidang: r.Bidang, Program: r.Program, Kegiatan: r.Kegiatan,
		Subkegiatan: r.Subkegiatan, Kinerja: r.Kinerja, Indikator: r.Indikator,
		Satuan: r.Satuan, DefinisiOperasional: r.DefinisiOperasional}
}

type SubkegiatanImportPreview struct {
	TotalRows    int                    `json:"totalRows"`
	ValidRows    int                    `json:"validRows"`
	ExistingRows int                    `json:"existingRows"`
	ErrorRows    int                    `json:"errorRows"`
	Rows         []SubkegiatanImportRow `json:"rows"`
}

type SubkegiatanImportResult struct {
	ImportedRows int `json:"importedRows"`
	SkippedRows  int `json:"skippedRows"`
}

type SubkegiatanEntity struct {
	ID                  int64     `gorm:"primaryKey;column:id"`
	Bidang              string    `gorm:"column:bidang"`
	Program             string    `gorm:"column:program"`
	Kegiatan            string    `gorm:"column:kegiatan"`
	Subkegiatan         string    `gorm:"column:subkegiatan"`
	Kinerja             string    `gorm:"column:kinerja"`
	Indikator           string    `gorm:"column:indikator"`
	Satuan              string    `gorm:"column:satuan"`
	DefinisiOperasional string    `gorm:"column:definisi_operasional"`
	CreatedAt           time.Time `gorm:"column:created_at"`
	UpdatedAt           time.Time `gorm:"column:updated_at"`
}

func (SubkegiatanEntity) TableName() string {
	return "subkegiatan"
}

func (s SubkegiatanEntity) ToSubkegiatan() Subkegiatan {
	return Subkegiatan{
		ID:                  s.ID,
		Bidang:              s.Bidang,
		Program:             s.Program,
		Kegiatan:            s.Kegiatan,
		Subkegiatan:         s.Subkegiatan,
		Kinerja:             s.Kinerja,
		Indikator:           s.Indikator,
		Satuan:              s.Satuan,
		DefinisiOperasional: s.DefinisiOperasional,
	}
}
