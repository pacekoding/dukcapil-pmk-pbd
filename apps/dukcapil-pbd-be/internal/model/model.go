package model

type HealthResponse struct {
	Status   string `json:"status"`
	Service  string `json:"service"`
	Time     string `json:"time"`
	Database string `json:"database,omitempty"`
}

type DashboardStat struct {
	Title string `json:"title"`
	Value string `json:"value"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
	Trend string `json:"trend"`
}

type DashboardActivity struct {
	Title    string `json:"title"`
	Location string `json:"location"`
	Status   string `json:"status"`
	Time     string `json:"time"`
	Icon     string `json:"icon"`
	Color    string `json:"color"`
}

type DashboardOverview struct {
	TahunAnggaran string              `json:"tahunAnggaran"`
	Stats         []DashboardStat     `json:"stats"`
	Activities    []DashboardActivity `json:"activities"`
}

type KegiatanDokumentasiItem struct {
	ID         int    `json:"id"`
	URL        string `json:"url"`
	Caption    string `json:"caption"`
	UploadedAt string `json:"uploadedAt"`
	FileName   string `json:"fileName,omitempty"`
}

type KegiatanDokumentasiPayload struct {
	URL      string `json:"url"`
	Caption  string `json:"caption"`
	FileName string `json:"fileName,omitempty"`
}

type Kegiatan struct {
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
	Dokumentasi     []KegiatanDokumentasiItem `json:"dokumentasi,omitempty"`
}

type KegiatanSelectOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type KegiatanStatusFilterOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type KegiatanListOptions struct {
	BidangOptions       []KegiatanSelectOption       `json:"bidangOptions"`
	JenisOptions        []KegiatanSelectOption       `json:"jenisOptions"`
	StatusFilterOptions []KegiatanStatusFilterOption `json:"statusFilterOptions"`
	StatusFormOptions   []KegiatanSelectOption       `json:"statusFormOptions"`
}

type KegiatanListResponse struct {
	Items   []Kegiatan          `json:"items"`
	Options KegiatanListOptions `json:"options"`
}

type Dokumen struct {
	ID            int    `json:"id"`
	NamaKegiatan  string `json:"namaKegiatan"`
	JenisKegiatan string `json:"jenisKegiatan"`
	JenisDokumen  string `json:"jenisDokumen"`
	Tanggal       string `json:"tanggal"`
	DibuatOleh    string `json:"dibuatOleh"`
}

type DokumenTypeOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type DokumenListResponse struct {
	Documents            []Dokumen `json:"documents"`
	JenisKegiatanOptions []string  `json:"jenisKegiatanOptions"`
	JenisDokumenOptions  []string  `json:"jenisDokumenOptions"`
}

type TorRundownItem struct {
	Waktu      string `json:"waktu"`
	Kegiatan   string `json:"kegiatan"`
	Keterangan string `json:"keterangan"`
}

type TorBiayaItem struct {
	No     int    `json:"no"`
	Uraian string `json:"uraian"`
	Volume string `json:"volume"`
	Harga  string `json:"harga"`
	Jumlah string `json:"jumlah"`
}

type TorDocument struct {
	Tahun           int              `json:"tahun"`
	Kementerian     string           `json:"kementerian"`
	Dinas           string           `json:"dinas"`
	UnitKerja       string           `json:"unitKerja"`
	Judul           string           `json:"judul"`
	JenisKegiatan   string           `json:"jenisKegiatan,omitempty"`
	Bidang          string           `json:"bidang,omitempty"`
	Status          string           `json:"status,omitempty"`
	TanggalDokumen  string           `json:"tanggalDokumen,omitempty"`
	DibuatOleh      string           `json:"dibuatOleh,omitempty"`
	DetailKegiatan  []string         `json:"detailKegiatan,omitempty"`
	IKU             string           `json:"iku"`
	TargetIKU       string           `json:"targetIku"`
	IKK             string           `json:"ikk"`
	TargetIKK       string           `json:"targetIkk"`
	LatarBelakang   string           `json:"latarBelakang"`
	Lokasi          string           `json:"lokasi"`
	Tanggal         string           `json:"tanggal"`
	Waktu           string           `json:"waktu"`
	Peserta         int              `json:"peserta"`
	PenanggungJawab string           `json:"penanggungJawab"`
	Pejabat         string           `json:"pejabat"`
	NIP             string           `json:"nip"`
	Tujuan          []string         `json:"tujuan"`
	Sasaran         []string         `json:"sasaran"`
	Outputs         []string         `json:"outputs"`
	Rundown         []TorRundownItem `json:"rundown"`
	Biaya           []TorBiayaItem   `json:"biaya"`
	TotalBiaya      string           `json:"totalBiaya"`
}

type LaporanPesertaItem struct {
	No     int    `json:"no"`
	Nama   string `json:"nama"`
	Unsur  string `json:"unsur"`
	Jumlah int    `json:"jumlah"`
}

type LaporanBiayaItem struct {
	No     int    `json:"no"`
	Uraian string `json:"uraian"`
	Volume string `json:"volume"`
	Satuan string `json:"satuan"`
	Biaya  string `json:"biaya"`
	Jumlah string `json:"jumlah"`
}

type LaporanDokumentasiItem struct {
	No         int    `json:"no"`
	Kegiatan   string `json:"kegiatan"`
	Keterangan string `json:"keterangan"`
}

type LaporanPelaksanaanDocument struct {
	Tahun                int                      `json:"tahun"`
	Kementerian          string                   `json:"kementerian"`
	Dinas                string                   `json:"dinas"`
	UnitKerja            string                   `json:"unitKerja"`
	NomorDokumen         string                   `json:"nomorDokumen"`
	NamaKegiatan         string                   `json:"namaKegiatan"`
	JenisKegiatan        string                   `json:"jenisKegiatan,omitempty"`
	Bidang               string                   `json:"bidang,omitempty"`
	Status               string                   `json:"status,omitempty"`
	DibuatOleh           string                   `json:"dibuatOleh,omitempty"`
	DetailKegiatan       []string                 `json:"detailKegiatan,omitempty"`
	TanggalLaporan       string                   `json:"tanggalLaporan"`
	LatarBelakang        string                   `json:"latarBelakang"`
	DasarPelaksanaan     []string                 `json:"dasarPelaksanaan"`
	MaksudTujuan         []string                 `json:"maksudTujuan"`
	Tanggal              string                   `json:"tanggal"`
	Waktu                string                   `json:"waktu"`
	Lokasi               string                   `json:"lokasi"`
	Peserta              int                      `json:"peserta"`
	Pelaksana            string                   `json:"pelaksana"`
	Narasumber           []string                 `json:"narasumber"`
	Metode               string                   `json:"metode"`
	UraianPelaksanaan    []string                 `json:"uraianPelaksanaan"`
	HasilPelaksanaan     []string                 `json:"hasilPelaksanaan"`
	CapaianOutput        []string                 `json:"capaianOutput"`
	Kendala              []string                 `json:"kendala"`
	TindakLanjut         []string                 `json:"tindakLanjut"`
	PesertaDetail        []LaporanPesertaItem     `json:"pesertaDetail"`
	Dokumentasi          []LaporanDokumentasiItem `json:"dokumentasi"`
	RealisasiBiaya       []LaporanBiayaItem       `json:"realisasiBiaya"`
	TotalRealisasi       string                   `json:"totalRealisasi"`
	Lampiran             []string                 `json:"lampiran"`
	JabatanPenandatangan string                   `json:"jabatanPenandatangan"`
	Pejabat              string                   `json:"pejabat"`
	NIP                  string                   `json:"nip"`
}

type DokumenFormMeta struct {
	DokumenTypeOptions     []DokumenTypeOption        `json:"dokumenTypeOptions"`
	KegiatanOptions        []KegiatanOption           `json:"kegiatanOptions"`
	TorData                TorDocument                `json:"torData"`
	TorPDFSections         []string                   `json:"torPdfSections"`
	LaporanPelaksanaanData LaporanPelaksanaanDocument `json:"laporanPelaksanaanData"`
	LaporanPDFSections     []string                   `json:"laporanPdfSections"`
}

type KegiatanOption struct {
	ID      int    `json:"id"`
	Nama    string `json:"nama"`
	Jenis   string `json:"jenis,omitempty"`
	Tanggal string `json:"tanggal,omitempty"`
}

type DokumenPreviewData struct {
	Document               Dokumen                    `json:"document"`
	TorData                TorDocument                `json:"torData"`
	LaporanPelaksanaanData LaporanPelaksanaanDocument `json:"laporanPelaksanaanData"`
}

type WebsiteStat struct {
	Label       string `json:"label"`
	Value       string `json:"value"`
	Description string `json:"description"`
}

type WebsiteHighlight struct {
	Title       string `json:"title"`
	Description string `json:"description"`
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
	Dokumentasi     []KegiatanDokumentasiItem `json:"dokumentasi,omitempty"`
	Ringkasan       string                    `json:"ringkasan"`
	Dokumen         WebsiteDokumenSummary     `json:"dokumen"`
}

type WebsiteHomeResponse struct {
	Hero struct {
		Eyebrow     string `json:"eyebrow"`
		Title       string `json:"title"`
		Description string `json:"description"`
	} `json:"hero"`
	Stats          []WebsiteStat        `json:"stats"`
	Highlights     []WebsiteHighlight   `json:"highlights"`
	LatestKegiatan []PublicKegiatanItem `json:"latestKegiatan"`
	ProfileSummary struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	} `json:"profileSummary"`
}

type WebsiteKegiatanResponse struct {
	Items        []PublicKegiatanItem `json:"items"`
	JenisOptions []string             `json:"jenisOptions"`
	Stats        []WebsiteStat        `json:"stats"`
}

type StrukturOrganisasiItem struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type ContactItem struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type WebsiteProfileResponse struct {
	Title       string                   `json:"title"`
	Description string                   `json:"description"`
	Visi        string                   `json:"visi"`
	Misi        []string                 `json:"misi"`
	Tugas       []string                 `json:"tugas"`
	Struktur    []StrukturOrganisasiItem `json:"struktur"`
	Wilayah     []string                 `json:"wilayah"`
	Contacts    []ContactItem            `json:"contacts"`
}
