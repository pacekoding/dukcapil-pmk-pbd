package model

import (
	"math"
	"time"
)

const (
	StatusCapaianTargetBelumDiisi = "Target Belum Diisi"
	StatusCapaianBelumAda         = "Belum Ada Realisasi"
	StatusCapaianBelumTercapai    = "Belum Tercapai"
	StatusCapaianTercapai         = "Tercapai"
	StatusCapaianMelebihiTarget   = "Melebihi Target"
)

type RealisasiSubkegiatanPayload struct {
	SubkegiatanID     int64                   `json:"subkegiatanId"`
	Tanggal           string                  `json:"tanggal"`
	Nama              string                  `json:"nama"`
	Lokasi            string                  `json:"lokasi"`
	Fasilitator       string                  `json:"fasilitator"`
	Narasumber        string                  `json:"narasumber"`
	JabatanNarasumber string                  `json:"jabatanNarasumber"`
	JumlahTamu        int64                   `json:"jumlahTamu"`
	TujuanKegiatan    string                  `json:"tujuanKegiatan"`
	PoinPenting       string                  `json:"poinPenting"`
	HasilKegiatan     string                  `json:"hasilKegiatan"`
	Keterangan        string                  `json:"keterangan"`
	TargetOutput      *float64                `json:"targetOutput"`
	RealisasiOutput   *float64                `json:"realisasiOutput"`
	SatuanOutput      string                  `json:"satuanOutput"`
	Kendala           string                  `json:"kendala"`
	TindakLanjut      string                  `json:"tindakLanjut"`
	CatatanEvaluasi   string                  `json:"catatanEvaluasi"`
	SSDValues         []RealisasiSSDDataInput `json:"ssdValues"`
}

type RealisasiSSDDataInput struct {
	SSDID int64  `json:"ssdId"`
	Nilai string `json:"nilai"`
}

func CalculateCapaian(target *float64, realisasi *float64) *float64 {
	if target == nil || *target <= 0 {
		return nil
	}
	realisasiValue := 0.0
	if realisasi != nil {
		realisasiValue = *realisasi
	}
	value := (realisasiValue / *target) * 100
	rounded := math.Round(value*100) / 100
	return &rounded
}

func GetStatusCapaian(target *float64, realisasi *float64) string {
	if target == nil || *target <= 0 {
		return StatusCapaianTargetBelumDiisi
	}
	if realisasi == nil || *realisasi <= 0 {
		return StatusCapaianBelumAda
	}
	if *realisasi < *target {
		return StatusCapaianBelumTercapai
	}
	if *realisasi == *target {
		return StatusCapaianTercapai
	}
	return StatusCapaianMelebihiTarget
}

type RealisasiSubkegiatanItem struct {
	ID                int64                   `json:"id"`
	TahunAnggaran     string                  `json:"tahunAnggaran"`
	SubkegiatanID     int64                   `json:"subkegiatanId"`
	Subkegiatan       *Subkegiatan            `json:"subkegiatan,omitempty"`
	Tanggal           string                  `json:"tanggal"`
	Nama              string                  `json:"nama"`
	Lokasi            string                  `json:"lokasi"`
	Fasilitator       string                  `json:"fasilitator"`
	Narasumber        string                  `json:"narasumber"`
	JabatanNarasumber string                  `json:"jabatanNarasumber"`
	JumlahTamu        int64                   `json:"jumlahTamu"`
	TujuanKegiatan    string                  `json:"tujuanKegiatan"`
	PoinPenting       string                  `json:"poinPenting"`
	HasilKegiatan     string                  `json:"hasilKegiatan"`
	Keterangan        string                  `json:"keterangan"`
	TargetOutput      *float64                `json:"targetOutput"`
	RealisasiOutput   *float64                `json:"realisasiOutput"`
	SatuanOutput      string                  `json:"satuanOutput"`
	PersentaseCapaian *float64                `json:"persentaseCapaian"`
	StatusCapaian     string                  `json:"statusCapaian"`
	Kendala           string                  `json:"kendala"`
	TindakLanjut      string                  `json:"tindakLanjut"`
	CatatanEvaluasi   string                  `json:"catatanEvaluasi"`
	JumlahFoto        int64                   `json:"jumlahFoto"`
	JumlahDokumen     int64                   `json:"jumlahDokumen"`
	JumlahSSD         int64                   `json:"jumlahSsd"`
	JumlahSSDData     int64                   `json:"jumlahSsdData"`
	SSDValues         []RealisasiSSDDataValue `json:"ssdValues,omitempty"`
	FotoDokumentasi   []RealisasiFile         `json:"fotoDokumentasi,omitempty"`
	Dokumen           []RealisasiFile         `json:"dokumen,omitempty"`
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

type RealisasiSSDDataValue struct {
	SSDID int64  `json:"ssdId"`
	SSD   *SSD   `json:"ssd,omitempty"`
	Nilai string `json:"nilai"`
}

type RealisasiSubkegiatanEntity struct {
	ID                int64     `gorm:"primaryKey;column:id"`
	TahunAnggaran     string    `gorm:"column:tahun_anggaran"`
	SubkegiatanID     int64     `gorm:"column:subkegiatan_id"`
	Tanggal           time.Time `gorm:"column:tanggal"`
	Nama              string    `gorm:"column:nama"`
	Lokasi            string    `gorm:"column:lokasi"`
	Fasilitator       string    `gorm:"column:fasilitator"`
	Narasumber        string    `gorm:"column:narasumber"`
	JabatanNarasumber string    `gorm:"column:jabatan_narasumber"`
	JumlahTamu        int64     `gorm:"column:jumlah_tamu"`
	TujuanKegiatan    string    `gorm:"column:tujuan_kegiatan"`
	PoinPenting       string    `gorm:"column:poin_penting"`
	HasilKegiatan     string    `gorm:"column:hasil_kegiatan"`
	Keterangan        string    `gorm:"column:keterangan"`
	TargetOutput      *float64  `gorm:"column:target_output"`
	RealisasiOutput   *float64  `gorm:"column:realisasi_output"`
	SatuanOutput      string    `gorm:"column:satuan_output"`
	Kendala           string    `gorm:"column:kendala"`
	TindakLanjut      string    `gorm:"column:tindak_lanjut"`
	CatatanEvaluasi   string    `gorm:"column:catatan_evaluasi"`
	CreatedAt         time.Time `gorm:"column:created_at"`
	UpdatedAt         time.Time `gorm:"column:updated_at"`
}

func (RealisasiSubkegiatanEntity) TableName() string {
	return "realisasi_subkegiatan"
}

type RealisasiSSDDataEntity struct {
	RealisasiID   int64     `gorm:"primaryKey;column:realisasi_id"`
	SSDID         int64     `gorm:"primaryKey;column:ssd_id"`
	TahunAnggaran string    `gorm:"column:tahun_anggaran"`
	Nilai         string    `gorm:"column:nilai"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}

func (RealisasiSSDDataEntity) TableName() string {
	return "realisasi_subkegiatan_ssd_data"
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
