package repository

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"
)

const (
	defaultPejabat = "Drs. Yohanis Kocu, M.Si"
	defaultNIP     = "19870909 202001 1 001"
)

var unitKerjaByBidang = map[string]string{
	"Dukcapil":    "Bidang Pelayanan Pendaftaran Penduduk",
	"PMK":         "Bidang Pemberdayaan Masyarakat Kampung",
	"Sekretariat": "Sekretariat Dinas",
}

func defaultTorData() model.TorDocument {
	return model.TorDocument{
		Tahun:           2026,
		Kementerian:     "Pemerintah Provinsi Papua Barat Daya",
		Dinas:           "Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung",
		UnitKerja:       "Bidang Pelayanan Pendaftaran Penduduk",
		Judul:           "Sosialisasi Administrasi Kependudukan dan Pelayanan Dokumen Kependudukan",
		IKU:             "Meningkatnya cakupan kepemilikan dokumen kependudukan masyarakat",
		TargetIKU:       "95% Kepemilikan Dokumen Kependudukan",
		IKK:             "Meningkatnya kualitas pelayanan administrasi kependudukan",
		TargetIKK:       "50 Kampung mendapatkan sosialisasi dan pendampingan",
		LatarBelakang:   "Dalam rangka meningkatkan kualitas pelayanan administrasi kependudukan dan penguatan kapasitas aparatur kampung, diperlukan kegiatan sosialisasi dan pendampingan teknis kepada masyarakat dan operator distrik.",
		Lokasi:          "Aula Dinas Dukcapil & PMK Papua Barat Daya",
		Tanggal:         "Senin, 22 Mei 2026",
		Waktu:           "09.00 WIT - Selesai",
		Peserta:         50,
		PenanggungJawab: "Kepala Dinas Dukcapil & PMK Papua Barat Daya",
		Pejabat:         defaultPejabat,
		NIP:             defaultNIP,
		Tujuan: []string{
			"Meningkatkan pemahaman masyarakat terkait administrasi kependudukan.",
			"Meningkatkan kualitas pelayanan dokumen kependudukan.",
			"Meningkatkan kapasitas operator kampung dan distrik.",
			"Mendukung tertib administrasi kependudukan di Papua Barat Daya.",
		},
		Sasaran: []string{
			"Aparatur distrik dan kampung",
			"Operator SIAK",
			"Tokoh masyarakat dan tokoh adat",
			"Masyarakat umum",
		},
		Outputs: []string{
			"Pelaksanaan kegiatan sosialisasi administrasi kependudukan",
			"Peningkatan pemahaman peserta",
			"Laporan pelaksanaan kegiatan",
			"Pendataan masyarakat terkait dokumen kependudukan",
		},
		Rundown: []model.TorRundownItem{
			{Waktu: "08.30 - 09.00", Kegiatan: "Registrasi Peserta", Keterangan: "Panitia"},
			{Waktu: "09.00 - 09.30", Kegiatan: "Pembukaan dan Sambutan", Keterangan: "Kepala Dinas"},
		},
		Biaya: []model.TorBiayaItem{
			{No: 1, Uraian: "Konsumsi Peserta", Volume: "50 Orang", Harga: "Rp150.000", Jumlah: "Rp7.500.000"},
		},
		TotalBiaya: "Rp17.000.000",
	}
}

func defaultLaporanData() model.LaporanPelaksanaanDocument {
	return model.LaporanPelaksanaanDocument{
		Tahun:          2026,
		Kementerian:    "Pemerintah Provinsi Papua Barat Daya",
		Dinas:          "Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung",
		UnitKerja:      "Bidang Pelayanan Pendaftaran Penduduk",
		NomorDokumen:   "470/LPK-DUKCAPIL-PMK/V/2026",
		NamaKegiatan:   "Sosialisasi Administrasi Kependudukan dan Pelayanan Dokumen Kependudukan",
		TanggalLaporan: "Senin, 26 Mei 2026",
		LatarBelakang:  "Laporan pelaksanaan kegiatan ini disusun sebagai bentuk pertanggungjawaban atas pelaksanaan sosialisasi administrasi kependudukan dan pelayanan dokumen kependudukan kepada aparatur distrik, kampung, dan masyarakat.",
		DasarPelaksanaan: []string{
			"Dokumen Pelaksanaan Anggaran Dinas Dukcapil dan PMK Provinsi Papua Barat Daya Tahun Anggaran 2026.",
			"Program peningkatan kualitas pelayanan administrasi kependudukan.",
			"Surat tugas pelaksanaan kegiatan sosialisasi administrasi kependudukan.",
		},
		MaksudTujuan: []string{
			"Melaporkan proses pelaksanaan kegiatan secara tertib dan terukur.",
			"Menyampaikan hasil, capaian, kendala, dan tindak lanjut kegiatan.",
			"Menjadi bahan evaluasi pelaksanaan kegiatan berikutnya.",
		},
		Tanggal:    "Senin, 22 Mei 2026",
		Waktu:      "09.00 WIT - Selesai",
		Lokasi:     "Aula Dinas Dukcapil & PMK Papua Barat Daya",
		Peserta:    50,
		Pelaksana:  "Dinas Dukcapil & PMK Provinsi Papua Barat Daya",
		Narasumber: []string{"Kepala Dinas Dukcapil & PMK Provinsi Papua Barat Daya", "Kepala Bidang Pelayanan Pendaftaran Penduduk", "Operator SIAK Provinsi Papua Barat Daya"},
		Metode:     "Kegiatan dilaksanakan melalui pemaparan materi, diskusi, tanya jawab, dan pendampingan teknis kepada peserta.",
		UraianPelaksanaan: []string{
			"Registrasi peserta dan pembukaan kegiatan oleh panitia.",
			"Penyampaian materi administrasi kependudukan dan pelayanan dokumen kependudukan.",
			"Diskusi teknis mengenai kendala pelayanan di distrik dan kampung.",
			"Penutupan kegiatan dan penyampaian rencana tindak lanjut.",
		},
		HasilPelaksanaan: []string{
			"Peserta memahami alur pelayanan administrasi kependudukan.",
			"Aparatur distrik dan kampung memperoleh pembaruan informasi terkait pelayanan dokumen kependudukan.",
			"Teridentifikasi kebutuhan pendampingan lanjutan untuk beberapa wilayah pelayanan.",
		},
		CapaianOutput: []string{
			"Terlaksananya kegiatan sosialisasi administrasi kependudukan.",
			"Tersampaikannya materi teknis kepada peserta kegiatan.",
			"Tersusunnya laporan pelaksanaan kegiatan.",
		},
		Kendala:      []string{"Sebagian peserta membutuhkan pendampingan lanjutan terkait penggunaan layanan digital.", "Ketersediaan data pendukung dari beberapa kampung belum sepenuhnya lengkap."},
		TindakLanjut: []string{"Melakukan pendampingan teknis lanjutan kepada operator distrik dan kampung.", "Menyusun daftar kebutuhan data dan melakukan koordinasi dengan wilayah terkait."},
		PesertaDetail: []model.LaporanPesertaItem{
			{No: 1, Nama: "Aparatur Distrik dan Kampung", Unsur: "Pemerintahan wilayah", Jumlah: 30},
			{No: 2, Nama: "Operator SIAK", Unsur: "Operator layanan", Jumlah: 10},
			{No: 3, Nama: "Tokoh masyarakat", Unsur: "Masyarakat", Jumlah: 10},
		},
		Dokumentasi: []model.LaporanDokumentasiItem{
			{No: 1, Kegiatan: "Pembukaan kegiatan", Keterangan: "Dilaksanakan oleh Kepala Dinas"},
			{No: 2, Kegiatan: "Penyampaian materi", Keterangan: "Materi administrasi kependudukan"},
			{No: 3, Kegiatan: "Diskusi dan pendampingan", Keterangan: "Sesi tanya jawab peserta"},
		},
		RealisasiBiaya: []model.LaporanBiayaItem{
			{No: 1, Uraian: "Konsumsi Peserta", Volume: "50 Orang", Satuan: "Paket", Biaya: "Rp150.000", Jumlah: "Rp7.500.000"},
			{No: 2, Uraian: "ATK dan Bahan Materi", Volume: "50 Orang", Satuan: "Paket", Biaya: "Rp75.000", Jumlah: "Rp3.750.000"},
		},
		TotalRealisasi:       "Rp11.250.000",
		Lampiran:             []string{"Daftar hadir peserta kegiatan.", "Dokumentasi foto pelaksanaan kegiatan.", "Materi sosialisasi administrasi kependudukan."},
		JabatanPenandatangan: "Penanggung Jawab Kegiatan",
		Pejabat:              defaultPejabat,
		NIP:                  defaultNIP,
	}
}

func torPDFSections() []string {
	return []string{
		"Cover dan informasi kegiatan",
		"A. Latar Belakang",
		"B. Tujuan Kegiatan",
		"C. Sasaran Kegiatan",
		"D. Output Kegiatan",
		"E. Waktu dan Tempat",
		"F. Rundown Kegiatan",
		"G. Rincian Biaya",
		"H. Penutup dan tanda tangan",
	}
}

func laporanPDFSections() []string {
	return []string{
		"Cover dan identitas laporan",
		"A. Pendahuluan",
		"B. Pelaksanaan Kegiatan",
		"C. Hasil Pelaksanaan",
		"D. Peserta dan Dokumentasi",
		"E. Realisasi Biaya",
		"F. Penutup dan tanda tangan",
	}
}

func buildTorPreviewData(document model.Dokumen, kegiatan *model.Kegiatan) model.TorDocument {
	data := defaultTorData()
	detailRows := parseDetailRows(kegiatan)
	title := kegiatanOrDocumentTitle(document, kegiatan)
	lists := makeTorLists(kegiatan, detailRows)

	data.Tahun = time.Now().Year()
	data.Judul = title
	data.JenisKegiatan = document.JenisKegiatan
	data.TanggalDokumen = formatDateForDisplay(document.Tanggal)
	data.DibuatOleh = document.DibuatOleh
	data.DetailKegiatan = detailRows
	data.Tujuan = lists.tujuan
	data.Sasaran = lists.sasaran
	data.Outputs = lists.outputs
	data.Rundown = makeGenericRundown(kegiatan)
	data.Biaya = makeGenericBiaya(kegiatan)
	data.TotalBiaya = makeTotalBiaya(kegiatan)

	if kegiatan != nil {
		data.UnitKerja = unitKerjaByBidang[kegiatan.Bidang]
		data.Bidang = kegiatan.Bidang
		data.Status = kegiatan.Status
		data.LatarBelakang = cleanSummary(kegiatan.Deskripsi)
		data.Lokasi = kegiatan.Lokasi
		data.Tanggal = formatDateForDisplay(kegiatan.Tanggal)
		data.Peserta = kegiatan.Peserta
		data.PenanggungJawab = kegiatan.PenanggungJawab
	}

	return data
}

func buildLaporanPreviewData(document model.Dokumen, kegiatan *model.Kegiatan) model.LaporanPelaksanaanDocument {
	data := defaultLaporanData()
	detailRows := parseDetailRows(kegiatan)
	resultLists := makeLaporanResultLists(kegiatan, detailRows)
	title := kegiatanOrDocumentTitle(document, kegiatan)
	peserta := data.Peserta
	if kegiatan != nil {
		peserta = kegiatan.Peserta
	}

	data.Tahun = time.Now().Year()
	data.NomorDokumen = fmt.Sprintf("470/LPK-%d/DUKCAPIL-PMK/%d", document.ID, time.Now().Year())
	data.NamaKegiatan = title
	data.JenisKegiatan = document.JenisKegiatan
	data.DibuatOleh = document.DibuatOleh
	data.TanggalLaporan = formatDateForDisplay(document.Tanggal)
	data.DetailKegiatan = detailRows
	data.Peserta = peserta
	data.HasilPelaksanaan = resultLists.hasilPelaksanaan
	data.CapaianOutput = resultLists.capaianOutput
	data.Kendala = resultLists.kendala
	data.TindakLanjut = resultLists.tindakLanjut
	data.UraianPelaksanaan = rundownAsSentences(makeGenericRundown(kegiatan))
	data.Dokumentasi = rundownAsDocumentation(makeGenericRundown(kegiatan))
	data.RealisasiBiaya = biayaAsRealisasi(makeGenericBiaya(kegiatan))
	data.TotalRealisasi = makeTotalBiaya(kegiatan)
	data.JabatanPenandatangan = data.Pelaksana

	if kegiatan != nil {
		data.UnitKerja = unitKerjaByBidang[kegiatan.Bidang]
		data.Bidang = kegiatan.Bidang
		data.Status = kegiatan.Status
		data.LatarBelakang = cleanSummary(kegiatan.Deskripsi)
		data.Tanggal = formatDateForDisplay(kegiatan.Tanggal)
		data.Lokasi = kegiatan.Lokasi
		data.Pelaksana = kegiatan.PenanggungJawab
		data.JabatanPenandatangan = kegiatan.PenanggungJawab
		data.Narasumber = compactList([]string{
			getDetailValue(detailRows, "Narasumber"),
			getDetailValue(detailRows, "Instruktur/Fasilitator"),
			getDetailValue(detailRows, "Pimpinan Rapat"),
			kegiatan.PenanggungJawab,
		})[:min(3, len(compactList([]string{
			getDetailValue(detailRows, "Narasumber"),
			getDetailValue(detailRows, "Instruktur/Fasilitator"),
			getDetailValue(detailRows, "Pimpinan Rapat"),
			kegiatan.PenanggungJawab,
		})))]
		data.Metode = firstNonEmpty(
			getDetailValue(detailRows, "Metode"),
			getDetailValue(detailRows, "Metode Praktik"),
			getDetailValue(detailRows, "Metode Pendampingan"),
			getDetailValue(detailRows, "Metode Pengumpulan Data"),
			data.Metode,
		)
		data.PesertaDetail = []model.LaporanPesertaItem{
			{No: 1, Nama: firstNonEmpty(getDetailValue(detailRows, "Sasaran"), getDetailValue(detailRows, "Peserta/Undangan"), "Peserta kegiatan"), Unsur: kegiatan.Bidang, Jumlah: peserta},
		}
	}

	return data
}

type torLists struct {
	tujuan  []string
	sasaran []string
	outputs []string
}

type laporanLists struct {
	hasilPelaksanaan []string
	capaianOutput    []string
	kendala          []string
	tindakLanjut     []string
}

func parseDetailRows(kegiatan *model.Kegiatan) []string {
	if kegiatan == nil {
		return nil
	}

	var rows []string
	for _, line := range strings.Split(kegiatan.Deskripsi, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "- ") {
			rows = append(rows, strings.TrimSpace(strings.TrimPrefix(line, "- ")))
		}
	}
	return rows
}

func getDetailValue(detailRows []string, keyword string) string {
	for _, row := range detailRows {
		if strings.HasPrefix(strings.ToLower(row), strings.ToLower(keyword)) {
			parts := strings.SplitN(row, ":", 2)
			if len(parts) == 2 {
				return strings.TrimSpace(parts[1])
			}
		}
	}
	return ""
}

func cleanSummary(description string) string {
	parts := strings.Split(description, "\n\nDetail ")
	if strings.TrimSpace(parts[0]) != "" {
		return strings.TrimSpace(parts[0])
	}
	return strings.TrimSpace(description)
}

func kegiatanOrDocumentTitle(document model.Dokumen, kegiatan *model.Kegiatan) string {
	if kegiatan != nil && kegiatan.Nama != "" {
		return kegiatan.Nama
	}
	return document.NamaKegiatan
}

func makeTorLists(kegiatan *model.Kegiatan, detailRows []string) torLists {
	jenis := "Kegiatan"
	if kegiatan != nil {
		jenis = kegiatan.Jenis
	}

	sasaran := firstNonEmpty(
		getDetailValue(detailRows, "Sasaran"),
		getDetailValue(detailRows, "Peserta/Undangan"),
		getDetailValue(detailRows, "Objek/Kelompok"),
		getDetailValue(detailRows, "Objek Monitoring"),
	)
	output := firstNonEmpty(
		getDetailValue(detailRows, "Output"),
		getDetailValue(detailRows, "Indikator"),
		getDetailValue(detailRows, "Keputusan"),
		getDetailValue(detailRows, "Evaluasi"),
	)

	var peserta string
	if kegiatan != nil {
		peserta = fmt.Sprintf("%d peserta kegiatan", kegiatan.Peserta)
	}

	var bidang string
	if kegiatan != nil && kegiatan.Bidang != "" {
		bidang = "Unit kerja bidang " + kegiatan.Bidang
	}

	return torLists{
		tujuan: compactList([]string{
			fmt.Sprintf("Melaksanakan %s secara tertib, terukur, dan terdokumentasi.", strings.ToLower(jenis)),
			withPrefix(output, "Mencapai target: ", "."),
			"Menjadi dasar penyusunan dokumen pelaksanaan dan pelaporan kegiatan.",
		}),
		sasaran: compactList([]string{firstNonEmpty(sasaran, peserta), bidang}),
		outputs: compactList([]string{
			firstNonEmpty(output, fmt.Sprintf("Terlaksananya %s sesuai rencana.", strings.ToLower(jenis))),
			"Tersedianya dokumentasi dan laporan pelaksanaan kegiatan.",
			withPrefix(getDetailValue(detailRows, "Tindak Lanjut"), "Tindak lanjut: ", "."),
		}),
	}
}

func makeLaporanResultLists(kegiatan *model.Kegiatan, detailRows []string) laporanLists {
	jenis := "kegiatan"
	status := ""
	if kegiatan != nil {
		jenis = kegiatan.Jenis
		status = kegiatan.Status
	}
	indikator := firstNonEmpty(getDetailValue(detailRows, "Indikator"), getDetailValue(detailRows, "Output"), getDetailValue(detailRows, "Keputusan"))

	return laporanLists{
		hasilPelaksanaan: compactList([]string{
			fmt.Sprintf("%s telah dilaksanakan sesuai jadwal dan lokasi yang direncanakan.", jenis),
			withPrefix(indikator, "Capaian utama: ", "."),
			withPrefix(status, "Status kegiatan saat laporan dibuat: ", "."),
		}),
		capaianOutput: compactList([]string{
			firstNonEmpty(indikator, fmt.Sprintf("Terlaksananya %s dan tersedianya dokumentasi kegiatan.", strings.ToLower(jenis))),
			"Data kegiatan tercatat dalam sistem monitoring Dukcapil PMK.",
		}),
		kendala:      []string{"Kendala pelaksanaan dicatat sebagai bahan evaluasi dan perbaikan kegiatan berikutnya."},
		tindakLanjut: compactList([]string{firstNonEmpty(getDetailValue(detailRows, "Tindak Lanjut"), "Melakukan koordinasi lanjutan dengan pihak terkait."), "Menyusun dokumentasi dan arsip pendukung kegiatan."}),
	}
}

func makeGenericRundown(kegiatan *model.Kegiatan) []model.TorRundownItem {
	jenis := "Kegiatan"
	slug := ""
	penanggungJawab := "Penanggung jawab kegiatan"
	lokasi := "Lokasi kegiatan"
	if kegiatan != nil {
		jenis = kegiatan.Jenis
		slug = kegiatanSlug(kegiatan.Jenis)
		penanggungJawab = kegiatan.PenanggungJawab
		lokasi = kegiatan.Lokasi
	}

	switch slug {
	case "bimtek":
		return []model.TorRundownItem{
			{Waktu: "08.30 - 09.00", Kegiatan: "Registrasi dan Pre-test", Keterangan: "Panitia"},
			{Waktu: "09.00 - 10.30", Kegiatan: "Pemaparan Modul Teknis", Keterangan: "Instruktur"},
			{Waktu: "10.30 - 12.00", Kegiatan: "Praktik dan Simulasi Aplikasi", Keterangan: "Fasilitator"},
			{Waktu: "12.00 - 12.30", Kegiatan: "Post-test dan Evaluasi", Keterangan: "Panitia"},
		}
	case "pendampingan":
		return []model.TorRundownItem{
			{Waktu: "09.00 - 09.30", Kegiatan: "Identifikasi Kebutuhan Dampingan", Keterangan: penanggungJawab},
			{Waktu: "09.30 - 11.00", Kegiatan: "Review Dokumen dan Klinik Perbaikan", Keterangan: "Tim pendamping"},
			{Waktu: "11.00 - 12.00", Kegiatan: "Penyusunan Matriks Tindak Lanjut", Keterangan: "Aparatur kampung dan pendamping"},
		}
	case "monev":
		return []model.TorRundownItem{
			{Waktu: "09.00 - 09.30", Kegiatan: "Pembukaan dan Penyampaian Instrumen Monev", Keterangan: "Tim Monev"},
			{Waktu: "09.30 - 11.30", Kegiatan: "Pemeriksaan Dokumen dan Observasi Lapangan", Keterangan: "Tim Monev"},
			{Waktu: "11.30 - 12.30", Kegiatan: "Rekap Temuan dan Rekomendasi", Keterangan: "Tim Monev dan objek monitoring"},
		}
	case "rapat":
		return []model.TorRundownItem{
			{Waktu: "09.00 - 09.15", Kegiatan: "Pembukaan Rapat", Keterangan: penanggungJawab},
			{Waktu: "09.15 - 10.30", Kegiatan: "Pembahasan Agenda dan Bahan Rapat", Keterangan: "Peserta rapat"},
			{Waktu: "10.30 - 11.30", Kegiatan: "Perumusan Keputusan dan Tindak Lanjut", Keterangan: "Pimpinan rapat"},
		}
	default:
		return []model.TorRundownItem{
			{Waktu: "08.30 - 09.00", Kegiatan: "Registrasi Peserta", Keterangan: "Panitia"},
			{Waktu: "09.00 - 09.30", Kegiatan: "Pembukaan", Keterangan: penanggungJawab},
			{Waktu: "09.30 - 11.30", Kegiatan: "Pelaksanaan " + jenis, Keterangan: lokasi},
			{Waktu: "11.30 - 12.00", Kegiatan: "Diskusi, Evaluasi, dan Penutup", Keterangan: "Panitia dan peserta"},
		}
	}
}

func makeGenericBiaya(kegiatan *model.Kegiatan) []model.TorBiayaItem {
	peserta := 0
	slug := ""
	if kegiatan != nil {
		peserta = kegiatan.Peserta
		slug = kegiatanSlug(kegiatan.Jenis)
	}
	volume := "Sesuai kebutuhan"
	if peserta > 0 {
		volume = fmt.Sprintf("%d Orang", peserta)
	}

	switch slug {
	case "monev":
		return []model.TorBiayaItem{{No: 1, Uraian: "Transportasi Tim Monev", Volume: "1 Tim", Harga: "Rp2.500.000", Jumlah: "Rp2.500.000"}, {No: 2, Uraian: "Penggandaan Instrumen dan Dokumen", Volume: volume, Harga: "Rp50.000", Jumlah: rupiah(peserta * 50000)}}
	case "rapat":
		return []model.TorBiayaItem{{No: 1, Uraian: "Konsumsi Rapat", Volume: volume, Harga: "Rp125.000", Jumlah: rupiah(peserta * 125000)}, {No: 2, Uraian: "Penggandaan Bahan Rapat", Volume: volume, Harga: "Rp35.000", Jumlah: rupiah(peserta * 35000)}}
	case "bimtek":
		return []model.TorBiayaItem{{No: 1, Uraian: "Honor Instruktur/Fasilitator", Volume: "2 Orang", Harga: "Rp1.000.000", Jumlah: "Rp2.000.000"}, {No: 2, Uraian: "Konsumsi dan Modul Peserta", Volume: volume, Harga: "Rp225.000", Jumlah: rupiah(peserta * 225000)}}
	case "pendampingan":
		return []model.TorBiayaItem{{No: 1, Uraian: "Transportasi Tim Pendamping", Volume: "1 Tim", Harga: "Rp2.000.000", Jumlah: "Rp2.000.000"}, {No: 2, Uraian: "Konsumsi dan Klinik Dokumen", Volume: volume, Harga: "Rp120.000", Jumlah: rupiah(peserta * 120000)}}
	default:
		return []model.TorBiayaItem{{No: 1, Uraian: "Konsumsi Peserta", Volume: volume, Harga: "Rp150.000", Jumlah: rupiah(peserta * 150000)}, {No: 2, Uraian: "ATK dan Bahan Kegiatan", Volume: volume, Harga: "Rp75.000", Jumlah: rupiah(peserta * 75000)}}
	}
}

func makeTotalBiaya(kegiatan *model.Kegiatan) string {
	if kegiatan == nil || kegiatan.Peserta <= 0 {
		return "-"
	}

	switch kegiatanSlug(kegiatan.Jenis) {
	case "monev":
		return rupiah(2500000 + kegiatan.Peserta*50000)
	case "rapat":
		return rupiah(kegiatan.Peserta * 160000)
	case "bimtek":
		return rupiah(2000000 + kegiatan.Peserta*225000)
	case "pendampingan":
		return rupiah(2000000 + kegiatan.Peserta*120000)
	default:
		return rupiah(kegiatan.Peserta * 225000)
	}
}

func kegiatanSlug(jenis string) string {
	switch strings.ToLower(jenis) {
	case "sosialisasi":
		return "sosialisasi"
	case "bimtek":
		return "bimtek"
	case "pendampingan":
		return "pendampingan"
	case "monev":
		return "monev"
	case "rapat":
		return "rapat"
	default:
		return ""
	}
}

func formatDateForDisplay(value string) string {
	if _, err := time.Parse("2006-01-02", value); err != nil {
		return value
	}

	date, _ := time.Parse("2006-01-02", value)
	months := []string{"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}
	return fmt.Sprintf("%d %s %d", date.Day(), months[int(date.Month())-1], date.Year())
}

func compactList(items []string) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}

func firstNonEmpty(items ...string) string {
	for _, item := range items {
		if strings.TrimSpace(item) != "" {
			return strings.TrimSpace(item)
		}
	}
	return ""
}

func withPrefix(value, prefix, suffix string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	return prefix + value + suffix
}

func rupiah(value int) string {
	if value <= 0 {
		return "-"
	}
	return "Rp" + formatThousands(value)
}

func formatThousands(value int) string {
	raw := strconv.Itoa(value)
	var result []byte
	for index, digit := range raw {
		if index > 0 && (len(raw)-index)%3 == 0 {
			result = append(result, '.')
		}
		result = append(result, byte(digit))
	}
	return string(result)
}

func rundownAsSentences(items []model.TorRundownItem) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		result = append(result, fmt.Sprintf("%s (%s) - %s", item.Kegiatan, item.Waktu, item.Keterangan))
	}
	return result
}

func rundownAsDocumentation(items []model.TorRundownItem) []model.LaporanDokumentasiItem {
	result := make([]model.LaporanDokumentasiItem, 0, len(items))
	for index, item := range items {
		if index == 0 {
			continue
		}
		result = append(result, model.LaporanDokumentasiItem{No: len(result) + 1, Kegiatan: item.Kegiatan, Keterangan: item.Keterangan})
	}
	return result
}

func biayaAsRealisasi(items []model.TorBiayaItem) []model.LaporanBiayaItem {
	result := make([]model.LaporanBiayaItem, 0, len(items))
	for _, item := range items {
		result = append(result, model.LaporanBiayaItem{No: item.No, Uraian: item.Uraian, Volume: item.Volume, Satuan: "Paket", Biaya: item.Harga, Jumlah: item.Jumlah})
	}
	return result
}
