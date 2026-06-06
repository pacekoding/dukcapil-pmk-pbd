package model

import "time"

type RealisasiSubkegiatanPayload struct {
	SubkegiatanID int64  `json:"subkegiatanId"`
	Tanggal       string `json:"tanggal"`
	Nama          string `json:"nama"`
	Lokasi        string `json:"lokasi"`
	Keterangan    string `json:"keterangan"`
}

type RealisasiSubkegiatanItem struct {
	ID              int64           `json:"id"`
	TahunAnggaran   string          `json:"tahunAnggaran"`
	SubkegiatanID   int64           `json:"subkegiatanId"`
	Subkegiatan     *Subkegiatan    `json:"subkegiatan,omitempty"`
	Tanggal         string          `json:"tanggal"`
	Nama            string          `json:"nama"`
	Lokasi          string          `json:"lokasi"`
	Keterangan      string          `json:"keterangan"`
	JumlahFoto      int64           `json:"jumlahFoto"`
	JumlahDokumen   int64           `json:"jumlahDokumen"`
	FotoDokumentasi []RealisasiFile `json:"fotoDokumentasi,omitempty"`
	Dokumen         []RealisasiFile `json:"dokumen,omitempty"`
}

type RealisasiSubkegiatanListResponse struct {
	TahunAnggaran string                     `json:"tahunAnggaran"`
	Items         []RealisasiSubkegiatanItem `json:"items"`
}

type RealisasiFile struct {
	ID           int64  `json:"id"`
	FileName     string `json:"fileName"`
	OriginalName string `json:"originalName"`
	MimeType     string `json:"mimeType"`
	Size         int64  `json:"size"`
	URL          string `json:"url"`
	CreatedAt    string `json:"createdAt"`
}

type RealisasiSubkegiatanEntity struct {
	ID            int64     `gorm:"primaryKey;column:id"`
	TahunAnggaran string    `gorm:"column:tahun_anggaran"`
	SubkegiatanID int64     `gorm:"column:subkegiatan_id"`
	Tanggal       time.Time `gorm:"column:tanggal"`
	Nama          string    `gorm:"column:nama"`
	Lokasi        string    `gorm:"column:lokasi"`
	Keterangan    string    `gorm:"column:keterangan"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}

func (RealisasiSubkegiatanEntity) TableName() string {
	return "realisasi_subkegiatan"
}

type RealisasiFotoEntity struct {
	ID           int64     `gorm:"primaryKey;column:id"`
	RealisasiID  int64     `gorm:"column:realisasi_id"`
	FileName     string    `gorm:"column:file_name"`
	OriginalName string    `gorm:"column:original_name"`
	MimeType     string    `gorm:"column:mime_type"`
	Size         int64     `gorm:"column:size"`
	URL          string    `gorm:"column:url"`
	CreatedAt    time.Time `gorm:"column:created_at"`
}

func (RealisasiFotoEntity) TableName() string {
	return "realisasi_subkegiatan_foto"
}

func (f RealisasiFotoEntity) ToFile() RealisasiFile {
	return RealisasiFile{
		ID:           f.ID,
		FileName:     f.FileName,
		OriginalName: f.OriginalName,
		MimeType:     f.MimeType,
		Size:         f.Size,
		URL:          f.URL,
		CreatedAt:    f.CreatedAt.Format(time.RFC3339),
	}
}

type RealisasiDokumenEntity struct {
	ID           int64     `gorm:"primaryKey;column:id"`
	RealisasiID  int64     `gorm:"column:realisasi_id"`
	FileName     string    `gorm:"column:file_name"`
	OriginalName string    `gorm:"column:original_name"`
	MimeType     string    `gorm:"column:mime_type"`
	Size         int64     `gorm:"column:size"`
	URL          string    `gorm:"column:url"`
	CreatedAt    time.Time `gorm:"column:created_at"`
}

func (RealisasiDokumenEntity) TableName() string {
	return "realisasi_subkegiatan_dokumen"
}

func (d RealisasiDokumenEntity) ToFile() RealisasiFile {
	return RealisasiFile{
		ID:           d.ID,
		FileName:     d.FileName,
		OriginalName: d.OriginalName,
		MimeType:     d.MimeType,
		Size:         d.Size,
		URL:          d.URL,
		CreatedAt:    d.CreatedAt.Format(time.RFC3339),
	}
}
