package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"

	"gorm.io/gorm"
)

type DashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) *DashboardRepository {
	return &DashboardRepository{db: db}
}

func (r *DashboardRepository) Overview(ctx context.Context, tahunAnggaran string) (model.DashboardOverview, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.DashboardOverview{}, err
	}

	tahunAnggaran = strings.TrimSpace(tahunAnggaran)
	overview := model.DashboardOverview{TahunAnggaran: tahunAnggaran}

	var wilayahSummary struct {
		TotalWilayah int64
		TotalOrang   int64
		TotalOAP     int64
		TotalKtpEl   int64
		TotalDesaIDM int64
	}
	if err := db.Model(&model.DataWilayahEntity{}).
		Select(`
			COUNT(*) AS total_wilayah,
			COALESCE(SUM(oap_jumlah_jiwa), 0) AS total_orang,
			COALESCE(SUM(oap_jumlah_oap), 0) AS total_oap,
			COALESCE(SUM(registration_pencetakan_ktp_el), 0) AS total_ktp_el,
			COALESCE(SUM(idm_sangat_tertinggal + idm_tertinggal + idm_berkembang + idm_maju + idm_mandiri), 0) AS total_desa_idm
		`).
		Where("tahun_anggaran = ?", tahunAnggaran).
		Scan(&wilayahSummary).Error; err != nil {
		return model.DashboardOverview{}, fmt.Errorf("dashboard wilayah summary: %w", err)
	}

	var subkegiatanCount int64
	if err := db.Model(&model.SubkegiatanEntity{}).
		Where("tahun_anggaran = ?", tahunAnggaran).
		Count(&subkegiatanCount).Error; err != nil {
		return model.DashboardOverview{}, fmt.Errorf("dashboard subkegiatan count: %w", err)
	}

	var ssdSummary struct {
		TotalSSD    int64
		ActiveSSD   int64
		InactiveSSD int64
	}
	if err := db.Model(&model.SSDEntity{}).
		Select(`
			COUNT(*) AS total_ssd,
			COALESCE(SUM(CASE WHEN is_active THEN 1 ELSE 0 END), 0) AS active_ssd,
			COALESCE(SUM(CASE WHEN is_active THEN 0 ELSE 1 END), 0) AS inactive_ssd
		`).
		Where("tahun_anggaran = ?", tahunAnggaran).
		Scan(&ssdSummary).Error; err != nil {
		return model.DashboardOverview{}, fmt.Errorf("dashboard ssd summary: %w", err)
	}

	var realisasiSummary struct {
		TotalRealisasi int64
		TotalFoto      int64
		TotalDokumen   int64
	}
	if err := db.Table("realisasi_subkegiatan AS r").
		Select(`
			COUNT(DISTINCT r.id) AS total_realisasi,
			COALESCE(SUM(f.foto_count), 0) AS total_foto,
			COALESCE(SUM(d.dokumen_count), 0) AS total_dokumen
		`).
		Joins(`LEFT JOIN (
			SELECT realisasi_id, COUNT(*) AS foto_count
			FROM realisasi_subkegiatan_foto
			GROUP BY realisasi_id
		) AS f ON f.realisasi_id = r.id`).
		Joins(`LEFT JOIN (
			SELECT realisasi_id, COUNT(*) AS dokumen_count
			FROM realisasi_subkegiatan_dokumen
			GROUP BY realisasi_id
		) AS d ON d.realisasi_id = r.id`).
		Where("r.tahun_anggaran = ?", tahunAnggaran).
		Scan(&realisasiSummary).Error; err != nil {
		return model.DashboardOverview{}, fmt.Errorf("dashboard realisasi summary: %w", err)
	}

	overview.Stats = []model.DashboardStat{
		{
			Title:       "Total Orang",
			Value:       formatDashboardNumber(wilayahSummary.TotalOrang),
			Icon:        "users",
			Color:       "bg-blue-50 text-blue-600",
			Description: "Akumulasi penduduk seluruh kabupaten/kota",
		},
		{
			Title:       "Total OAP",
			Value:       formatDashboardNumber(wilayahSummary.TotalOAP),
			Icon:        "userRound",
			Color:       "bg-emerald-50 text-emerald-600",
			Description: "Orang Asli Papua terdata",
		},
		{
			Title:       "Pencetakan KTP-EL",
			Value:       formatDashboardNumber(wilayahSummary.TotalKtpEl),
			Icon:        "idCard",
			Color:       "bg-amber-50 text-amber-600",
			Description: "Total layanan pencetakan KTP-EL",
		},
		{
			Title:       "Total Desa IDM",
			Value:       formatDashboardNumber(wilayahSummary.TotalDesaIDM),
			Icon:        "building2",
			Color:       "bg-slate-100 text-slate-700",
			Description: "Total desa/kampung pada data IDM",
		},
		{
			Title:       "Subkegiatan",
			Value:       formatDashboardNumber(subkegiatanCount),
			Icon:        "listChecks",
			Color:       "bg-cyan-50 text-cyan-700",
			Description: "Master subkegiatan tahun berjalan",
		},
		{
			Title:       "Total Data SSD",
			Value:       formatDashboardNumber(ssdSummary.TotalSSD),
			Icon:        "database",
			Color:       "bg-sky-50 text-sky-700",
			Description: "Mengetahui jumlah data sektoral yang tersedia",
		},
		{
			Title:       "SSD Aktif/Nonaktif",
			Value:       fmt.Sprintf("%s / %s", formatDashboardNumber(ssdSummary.ActiveSSD), formatDashboardNumber(ssdSummary.InactiveSSD)),
			Icon:        "fileText",
			Color:       "bg-teal-50 text-teal-700",
			Description: "Melihat data yang masih digunakan",
		},
		{
			Title:       "Realisasi",
			Value:       formatDashboardNumber(realisasiSummary.TotalRealisasi),
			Icon:        "clipboardList",
			Color:       "bg-indigo-50 text-indigo-700",
			Description: "Jumlah realisasi subkegiatan",
		},
		{
			Title:       "Foto Dokumentasi",
			Value:       formatDashboardNumber(realisasiSummary.TotalFoto),
			Icon:        "image",
			Color:       "bg-rose-50 text-rose-700",
			Description: "Total foto dokumentasi realisasi",
		},
		{
			Title:       "Dokumen Pendukung",
			Value:       formatDashboardNumber(realisasiSummary.TotalDokumen),
			Icon:        "fileText",
			Color:       "bg-violet-50 text-violet-700",
			Description: "TOR, laporan, dan dokumen lain",
		},
	}

	var recentRecords []struct {
		ID              int64
		Nama            string
		Lokasi          string
		Tanggal         time.Time
		Keterangan      string
		SubkegiatanKode string
		SubkegiatanNama string
		JumlahFoto      int64
		JumlahDokumen   int64
	}
	if err := db.Table("realisasi_subkegiatan AS r").
		Select(`
			r.id,
			r.nama,
			r.lokasi,
			r.tanggal,
			r.keterangan,
			s.kode AS subkegiatan_kode,
			s.nama AS subkegiatan_nama,
			COALESCE(f.foto_count, 0) AS jumlah_foto,
			COALESCE(d.dokumen_count, 0) AS jumlah_dokumen
		`).
		Joins("LEFT JOIN subkegiatan AS s ON s.id = r.subkegiatan_id").
		Joins(`LEFT JOIN (
			SELECT realisasi_id, COUNT(*) AS foto_count
			FROM realisasi_subkegiatan_foto
			GROUP BY realisasi_id
		) AS f ON f.realisasi_id = r.id`).
		Joins(`LEFT JOIN (
			SELECT realisasi_id, COUNT(*) AS dokumen_count
			FROM realisasi_subkegiatan_dokumen
			GROUP BY realisasi_id
		) AS d ON d.realisasi_id = r.id`).
		Where("r.tahun_anggaran = ?", tahunAnggaran).
		Order("r.tanggal DESC, r.id DESC").
		Limit(5).
		Scan(&recentRecords).Error; err != nil {
		return model.DashboardOverview{}, fmt.Errorf("dashboard recent realisasi: %w", err)
	}

	overview.Activities = make([]model.DashboardActivity, 0, len(recentRecords))
	for _, record := range recentRecords {
		description := record.SubkegiatanKode
		if record.SubkegiatanNama != "" {
			description = fmt.Sprintf("%s - %s", record.SubkegiatanKode, record.SubkegiatanNama)
		}
		if description == "" {
			description = "Realisasi subkegiatan"
		}
		status := fmt.Sprintf("%d foto / %d dokumen", record.JumlahFoto, record.JumlahDokumen)
		overview.Activities = append(overview.Activities, model.DashboardActivity{
			Title:       record.Nama,
			Location:    emptyDashboardValue(record.Lokasi, "Lokasi belum diisi"),
			Status:      status,
			Time:        record.Tanggal.Format("2006-01-02"),
			Icon:        "clipboardList",
			Color:       "bg-indigo-50 text-indigo-700",
			Description: description,
		})
	}

	return overview, nil
}

func (r *DashboardRepository) session(ctx context.Context) (*gorm.DB, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	return r.db.WithContext(ctx), nil
}

func formatDashboardNumber(value int64) string {
	return formatIntID(value)
}

func formatIntID(value int64) string {
	s := fmt.Sprintf("%d", value)
	if len(s) <= 3 {
		return s
	}
	var out []byte
	prefix := len(s) % 3
	if prefix == 0 {
		prefix = 3
	}
	out = append(out, s[:prefix]...)
	for i := prefix; i < len(s); i += 3 {
		out = append(out, '.')
		out = append(out, s[i:i+3]...)
	}
	return string(out)
}

func emptyDashboardValue(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}
