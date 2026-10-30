package model

import "time"

type PublicOtsusListParams struct {
	Year, Search, KabupatenKota, Status, SumberDana, Sort string
	Page, PageSize                                        int
}

type PublicOtsusFunding struct {
	SumberDana string `json:"sumberDana"`
	Jumlah     int64  `json:"jumlah"`
	Pagu       int64  `json:"pagu"`
	Realisasi  int64  `json:"realisasi"`
}

type PublicOtsusSummary struct {
	Total      int64                `json:"total"`
	Selesai    int64                `json:"selesai"`
	Berjalan   int64                `json:"berjalan"`
	BelumMulai int64                `json:"belumMulai"`
	Pagu       int64                `json:"pagu"`
	Realisasi  int64                `json:"realisasi"`
	Foto       int64                `json:"foto"`
	Dokumen    int64                `json:"dokumen"`
	Funding    []PublicOtsusFunding `json:"funding" gorm:"-"`
	UpdatedAt  time.Time            `json:"updatedAt"`
}

type PublicOtsusItem struct {
	ID              int64     `json:"id"`
	TahunAnggaran   string    `json:"tahunAnggaran"`
	KodeSubkegiatan string    `json:"kodeSubkegiatan"`
	NamaSubkegiatan string    `json:"namaSubkegiatan"`
	Program         string    `json:"program"`
	Kegiatan        string    `json:"kegiatan"`
	Bidang          string    `json:"bidang"`
	KabupatenKota   string    `json:"kabupatenKota"`
	SumberDana      string    `json:"sumberDana"`
	Pagu            int64     `json:"pagu"`
	Realisasi       int64     `json:"realisasi"`
	Status          string    `json:"status"`
	JumlahFoto      int64     `json:"jumlahFoto"`
	JumlahDokumen   int64     `json:"jumlahDokumen"`
	ThumbnailURL    string    `json:"thumbnailUrl,omitempty"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type PublicOtsusListResponse struct {
	Year       string             `json:"year"`
	Years      []string           `json:"years"`
	Summary    PublicOtsusSummary `json:"summary"`
	Items      []PublicOtsusItem  `json:"items"`
	Kabupaten  []string           `json:"kabupaten"`
	Page       int                `json:"page"`
	PageSize   int                `json:"pageSize"`
	Total      int64              `json:"total"`
	TotalPages int                `json:"totalPages"`
}

type PublicOtsusFile struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Type        string `json:"type"`
	Version     int    `json:"version,omitempty"`
	MimeType    string `json:"mimeType"`
	FileSize    int64  `json:"fileSize"`
	PreviewURL  string `json:"previewUrl"`
	DownloadURL string `json:"downloadUrl"`
	Caption     string `json:"caption,omitempty"`
	CreatedAt   string `json:"createdAt,omitempty"`
}

type PublicOtsusDetail struct {
	Item       PublicOtsusItem   `json:"item"`
	Keterangan string            `json:"keterangan"`
	Photos     []PublicOtsusFile `json:"photos"`
	Documents  []PublicOtsusFile `json:"documents"`
}
