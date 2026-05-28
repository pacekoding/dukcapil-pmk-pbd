package model

import "time"

type KegiatanEntity struct {
	ID              int                         `gorm:"primaryKey;column:id"`
	Nama            string                      `gorm:"column:nama"`
	Jenis           string                      `gorm:"column:jenis"`
	Tanggal         string                      `gorm:"column:tanggal"`
	Lokasi          string                      `gorm:"column:lokasi"`
	Status          string                      `gorm:"column:status"`
	Bidang          string                      `gorm:"column:bidang"`
	PenanggungJawab string                      `gorm:"column:penanggung_jawab"`
	Peserta         int                         `gorm:"column:peserta"`
	Progres         int                         `gorm:"column:progres"`
	Deskripsi       string                      `gorm:"column:deskripsi"`
	CreatedAt       time.Time                   `gorm:"column:created_at"`
	UpdatedAt       time.Time                   `gorm:"column:updated_at"`
	Dokumentasi     []KegiatanDokumentasiEntity `gorm:"foreignKey:KegiatanID"`
}

func (KegiatanEntity) TableName() string {
	return "kegiatan"
}

func (k KegiatanEntity) ToKegiatan() Kegiatan {
	dokumentasi := make([]KegiatanDokumentasiItem, 0, len(k.Dokumentasi))
	for _, item := range k.Dokumentasi {
		dokumentasi = append(dokumentasi, item.ToDokumentasiItem())
	}

	return Kegiatan{
		ID:              k.ID,
		Nama:            k.Nama,
		Jenis:           k.Jenis,
		Tanggal:         k.Tanggal,
		Lokasi:          k.Lokasi,
		Status:          k.Status,
		Bidang:          k.Bidang,
		PenanggungJawab: k.PenanggungJawab,
		Peserta:         k.Peserta,
		Progres:         k.Progres,
		Deskripsi:       k.Deskripsi,
		Dokumentasi:     dokumentasi,
	}
}

type KegiatanDokumentasiEntity struct {
	ID         int       `gorm:"primaryKey;column:id"`
	KegiatanID int       `gorm:"column:kegiatan_id"`
	URL        string    `gorm:"column:url"`
	Caption    string    `gorm:"column:caption"`
	FileName   string    `gorm:"column:file_name"`
	UploadedAt time.Time `gorm:"column:uploaded_at"`
}

func (KegiatanDokumentasiEntity) TableName() string {
	return "kegiatan_dokumentasi"
}

func (d KegiatanDokumentasiEntity) ToDokumentasiItem() KegiatanDokumentasiItem {
	return KegiatanDokumentasiItem{
		ID:         d.ID,
		URL:        d.URL,
		Caption:    d.Caption,
		UploadedAt: formatJSONTime(d.UploadedAt),
		FileName:   d.FileName,
	}
}
