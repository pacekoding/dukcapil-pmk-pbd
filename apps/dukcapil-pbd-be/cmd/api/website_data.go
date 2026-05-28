package main

import "strconv"

type WebsiteStat struct {
	Label       string `json:"label"`
	Value       string `json:"value"`
	Description string `json:"description"`
}

type KegiatanDokumentasiItem struct {
	ID         int    `json:"id"`
	URL        string `json:"url"`
	Caption    string `json:"caption"`
	UploadedAt string `json:"uploadedAt"`
	FileName   string `json:"fileName,omitempty"`
}

type WebsiteDokumenSummary struct {
	TOR     int `json:"tor"`
	Laporan int `json:"laporan"`
	Total   int `json:"total"`
}

type PublicKegiatanItem struct {
	ID              int                       `json:"id"`
	Nama            string                    `json:"nama"`
	Jenis           string                    `json:"jenis"`
	Tanggal         string                    `json:"tanggal"`
	Lokasi          string                    `json:"lokasi"`
	Status          string                    `json:"status"`
	Bidang          string                    `json:"bidang"`
	PenanggungJawab string                    `json:"penanggungJawab"`
	Peserta         int                       `json:"peserta"`
	Progres         int                       `json:"progres"`
	Deskripsi       string                    `json:"deskripsi"`
	Ringkasan       string                    `json:"ringkasan"`
	Dokumentasi     []KegiatanDokumentasiItem `json:"dokumentasi,omitempty"`
	Dokumen         WebsiteDokumenSummary     `json:"dokumen"`
}

type WebsiteKegiatanResponse struct {
	Items       []PublicKegiatanItem `json:"items"`
	JenisOptions []string            `json:"jenisOptions"`
	Stats       []WebsiteStat        `json:"stats"`
}

var websiteKegiatanItems = []PublicKegiatanItem{
	{
		ID:      1,
		Nama:    "Sosialisasi Administrasi Kependudukan",
		Jenis:   "Sosialisasi",
		Tanggal: "22 Mei 2026",
		Lokasi:  "Aula Dinas Dukcapil & PMK Papua Barat Daya",
		Status:  "Selesai",
		Bidang:  "Dukcapil",
		PenanggungJawab: "Kepala Bidang Pelayanan Pendaftaran Penduduk",
		Peserta: 50,
		Progres: 100,
		Deskripsi: "Sosialisasi administrasi kependudukan dan pelayanan dokumen kependudukan kepada aparatur distrik, kampung, dan masyarakat.\n\nDetail kegiatan mencakup penyampaian prosedur pelayanan, validasi data, dan pemberdayaan layanan administrasi kependudukan.",
		Ringkasan: "Sosialisasi administrasi kependudukan dan pelayanan dokumen kependudukan kepada aparatur distrik, kampung, dan masyarakat.",
		Dokumentasi: []KegiatanDokumentasiItem{
			{ID: 1, URL: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80", Caption: "Pemeriksaan dokumen realisasi Dana Desa Tahap I", UploadedAt: "2026-05-22T11:00:00.000Z", FileName: "dokumen-1.jpg"},
			{ID: 2, URL: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80", Caption: "Klinik dokumen bersama aparatur Kampung Warmare", UploadedAt: "2026-05-20T10:00:00.000Z", FileName: "dokumen-2.jpg"},
		},
		Dokumen: WebsiteDokumenSummary{TOR: 1, Laporan: 1, Total: 2},
	},
	{
		ID:      2,
		Nama:    "Pendampingan Digitalisasi Kampung",
		Jenis:   "Pendampingan",
		Tanggal: "18 Mei 2026",
		Lokasi:  "Kampung Waimuri",
		Status:  "Selesai",
		Bidang:  "PMK",
		PenanggungJawab: "Tim Monitoring dan Evaluasi PMK",
		Peserta: 32,
		Progres: 100,
		Deskripsi: "Pendampingan digitalisasi administrasi kampung termasuk pengelolaan data dan pelaporan program pemberdayaan masyarakat.\n\nKegiatan meliputi pelatihan aplikasi, validasi data, dan koordinasi pelaporan program kampung.",
		Ringkasan: "Pendampingan digitalisasi administrasi kampung untuk pengelolaan data dan pelaporan program pemberdayaan masyarakat.",
		Dokumentasi: []KegiatanDokumentasiItem{
			{ID: 3, URL: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", Caption: "Pelatihan digitalisasi data kampung", UploadedAt: "2026-05-18T09:30:00.000Z", FileName: "pendampingan-1.jpg"},
		},
		Dokumen: WebsiteDokumenSummary{TOR: 1, Laporan: 1, Total: 2},
	},
	{
		ID:      3,
		Nama:    "Monitoring Realisasi Dana Desa Tahap I",
		Jenis:   "Monev",
		Tanggal: "22 Mei 2026",
		Lokasi:  "Distrik Prafi",
		Status:  "Selesai",
		Bidang:  "PMK",
		PenanggungJawab: "Tim Monitoring dan Evaluasi PMK",
		Peserta: 18,
		Progres: 100,
		Deskripsi: "Monitoring realisasi Dana Desa Tahap I meliputi pemeriksaan dokumen, capaian fisik, dan catatan tindak lanjut.\n\nKegiatan mencakup review SPJ, verifikasi administrasi, dan temu lapangan bersama aparat kampung.",
		Ringkasan: "Monitoring realisasi Dana Desa Tahap I dengan pemeriksaan dokumen dan pemantauan capaian fisik di lapangan.",
		Dokumentasi: []KegiatanDokumentasiItem{},
		Dokumen: WebsiteDokumenSummary{TOR: 1, Laporan: 1, Total: 2},
	},
}

func getWebsiteKegiatanData() WebsiteKegiatanResponse {
	items := websiteKegiatanItems
	return WebsiteKegiatanResponse{
		Items:        items,
		JenisOptions: uniqueJenisOptions(items),
		Stats:        websiteStats(items),
	}
}

func getWebsiteKegiatanDetailData(id int) (*PublicKegiatanItem, bool) {
	for _, item := range websiteKegiatanItems {
		if item.ID == id {
			return &item, true
		}
	}
	return nil, false
}

func uniqueJenisOptions(items []PublicKegiatanItem) []string {
	seen := map[string]bool{}
	var result []string
	for _, item := range items {
		if !seen[item.Jenis] {
			seen[item.Jenis] = true
			result = append(result, item.Jenis)
		}
	}
	return result
}

func websiteStats(items []PublicKegiatanItem) []WebsiteStat {
	totalPeserta := 0
	totalDokumen := 0
	for _, item := range items {
		totalPeserta += item.Peserta
		totalDokumen += item.Dokumen.Total
	}
	return []WebsiteStat{
		{Label: "Kegiatan", Value: strconv.Itoa(len(items)), Description: "Kegiatan yang selesai dan dipublikasikan"},
		{Label: "Dokumen", Value: strconv.Itoa(totalDokumen), Description: "TOR dan laporan yang tersedia"},
		{Label: "Peserta", Value: formatNumber(totalPeserta), Description: "Akumulasi peserta kegiatan"},
		{Label: "Selesai", Value: strconv.Itoa(len(items)), Description: "Kegiatan sudah masuk arsip"},
	}
}

func formatNumber(value int) string {
	return strconv.Itoa(value)
}
