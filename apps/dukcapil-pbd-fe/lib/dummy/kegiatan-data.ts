import type {
  Kegiatan,
  KegiatanBidang,
  KegiatanJenis,
  KegiatanSelectOption,
  KegiatanStatus,
  KegiatanStatusFilterOption,
} from "@/types/kegiatan";

export type {
  Kegiatan,
  KegiatanBidang,
  KegiatanJenis,
  KegiatanPayload,
  KegiatanSelectOption,
  KegiatanStatus,
  KegiatanStatusFilterOption,
} from "@/types/kegiatan";

export const kegiatanData: Kegiatan[] = [
  {
    id: 1,
    nama: "Sosialisasi Administrasi Kependudukan",
    jenis: "Sosialisasi",
    tanggal: "10 Mei 2026",
    lokasi: "Kampung Waimuri",
    status: "Berjalan",
    bidang: "Dukcapil",
    penanggungJawab: "Kabid Pelayanan Pendaftaran Penduduk",
    peserta: 84,
    progres: 65,
    deskripsi: `Sosialisasi layanan administrasi kependudukan dan aktivasi identitas kependudukan digital untuk warga kampung.

Detail Sosialisasi:
- Tema Sosialisasi: Aktivasi Identitas Kependudukan Digital dan pembaruan data keluarga
- Sasaran Peserta: Aparatur distrik, aparat kampung, tokoh masyarakat, dan warga Kampung Waimuri
- Narasumber: Kepala Bidang Pelayanan Pendaftaran Penduduk dan Operator SIAK Provinsi
- Media/Bahan Sosialisasi: Materi presentasi, leaflet layanan adminduk, banner kegiatan, dan daftar layanan prioritas
- Indikator Keberhasilan: Minimal 70 warga memahami alur layanan dan 50 akun IKD berhasil diaktivasi`,
  },
  {
    id: 2,
    nama: "Bimtek Operator SIAK",
    jenis: "Bimtek",
    tanggal: "15 Mei 2026",
    lokasi: "Distrik Manokwari Selatan",
    status: "Berjalan",
    bidang: "Dukcapil",
    penanggungJawab: "Subkoordinator Sistem Informasi Administrasi Kependudukan",
    peserta: 32,
    progres: 45,
    deskripsi: `Bimbingan teknis operator dalam pemutakhiran data, pencatatan layanan, dan pelaporan SIAK.

Detail Bimtek:
- Kompetensi yang Dilatih: Pemutakhiran biodata, pencatatan pelayanan harian, validasi anomali, dan pelaporan SIAK
- Kurikulum/Modul: Pengantar regulasi adminduk, simulasi input data, koreksi data bermasalah, dan penyusunan laporan layanan
- Instruktur/Fasilitator: Administrator Database Kependudukan Provinsi dan Tim Teknis SIAK
- Metode Praktik: Simulasi aplikasi, studi kasus data ganda, praktik input mandiri, dan klinik tanya jawab
- Evaluasi Peserta: Pre-test, post-test, observasi praktik input, dan rekap nilai kompetensi operator`,
  },
  {
    id: 3,
    nama: "Pendampingan Pengelolaan Kampung",
    jenis: "Pendampingan",
    tanggal: "20 Mei 2026",
    lokasi: "Kampung Warmare",
    status: "Selesai",
    bidang: "PMK",
    penanggungJawab: "Kabid Pemberdayaan Masyarakat Kampung",
    peserta: 46,
    progres: 100,
    deskripsi: `Pendampingan tata kelola administrasi kampung, penguatan kapasitas aparatur, dan verifikasi dokumen program.

Detail Pendampingan:
- Objek/Kelompok Dampingan: Aparatur Kampung Warmare, sekretariat kampung, dan pengelola administrasi pembangunan kampung
- Masalah/Kebutuhan Awal: Dokumen perencanaan belum seragam, arsip kegiatan belum tertata, dan verifikasi program perlu didampingi
- Metode Pendampingan: Klinik dokumen, review berkas, asistensi langsung, dan simulasi penyusunan matriks tindak lanjut
- Rencana Kunjungan: Kunjungan awal, sesi review dokumen, validasi perbaikan, dan penutupan hasil pendampingan
- Output Pendampingan: Daftar dokumen tervalidasi, catatan isu, matriks perbaikan, dan komitmen tindak lanjut kampung
- Tindak Lanjut: Monitoring pemenuhan dokumen pendukung dan koordinasi lanjutan dengan distrik`,
    dokumentasi: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
        caption: "Klinik dokumen bersama aparatur Kampung Warmare",
        uploadedAt: "2026-05-20T10:00:00.000Z",
        fileName: "pendampingan-warmare.jpg",
      },
      {
        id: 2,
        url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
        caption: "Pemeriksaan dokumen realisasi Dana Desa Tahap I",
        uploadedAt: "2026-05-22T11:00:00.000Z",
        fileName: "monev-dana-desa.jpg",
      },
    ],
  },
  {
    id: 4,
    nama: "Monitoring Dana Desa Tahap I",
    jenis: "Monev",
    tanggal: "22 Mei 2026",
    lokasi: "Distrik Prafi",
    status: "Selesai",
    bidang: "PMK",
    penanggungJawab: "Tim Monitoring dan Evaluasi PMK",
    peserta: 18,
    progres: 100,
    deskripsi: `Monitoring realisasi Dana Desa tahap pertama meliputi pemeriksaan dokumen, capaian fisik, dan catatan tindak lanjut.

Detail Monev:
- Objek Monitoring: Realisasi Dana Desa Tahap I pada Kampung di Distrik Prafi
- Indikator dan Target Evaluasi: Realisasi fisik minimal 60%, kelengkapan SPJ, kesesuaian RAB, dan bukti dokumentasi kegiatan
- Metode Pengumpulan Data: Review dokumen, wawancara aparat kampung, observasi lapangan, dan checklist capaian fisik
- Dokumen yang Diperiksa: RAB, SPJ, buku kas, daftar hadir musyawarah, foto kegiatan, dan berita acara
- Rencana Temuan/Rekomendasi: Catatan deviasi realisasi, rekomendasi perbaikan administrasi, PIC tindak lanjut, dan tenggat penyelesaian`,
    dokumentasi: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
        caption: "Pemeriksaan dokumen realisasi Dana Desa Tahap I",
        uploadedAt: "2026-05-22T11:00:00.000Z",
        fileName: "monev-dana-desa.jpg",
      },
      {
        id: 2,
        url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
        caption: "Klinik dokumen bersama aparatur Kampung Warmare",
        uploadedAt: "2026-05-20T10:00:00.000Z",
        fileName: "pendampingan-warmare.jpg",
      },
    ],
  },
  {
    id: 5,
    nama: "Rapat Koordinasi Program",
    jenis: "Rapat",
    tanggal: "25 Mei 2026",
    lokasi: "Aula Dinas Dukcapil",
    status: "Berjalan",
    bidang: "Sekretariat",
    penanggungJawab: "Sekretaris Dinas",
    peserta: 27,
    progres: 70,
    deskripsi: `Rapat koordinasi lintas bidang untuk penyelarasan jadwal kegiatan, kebutuhan dokumen, dan target pelaporan.

Detail Rapat:
- Agenda Rapat: Sinkronisasi jadwal kegiatan, kebutuhan dokumen TOR dan laporan, pembagian PIC, dan target pelaporan bulanan
- Peserta/Undangan: Sekretariat, Bidang Dukcapil, Bidang PMK, pejabat perencana, dan operator pelaporan
- Pimpinan Rapat: Sekretaris Dinas
- Bahan Pembahasan: Matriks kegiatan, daftar dokumen belum lengkap, rekap realisasi anggaran, dan kalender pelaksanaan
- Keputusan yang Diharapkan: Jadwal final kegiatan lintas bidang dan daftar penanggung jawab dokumen per kegiatan
- Tindak Lanjut: Distribusi notulen, update matriks monitoring, dan pengumpulan dokumen pendukung dari masing-masing bidang`,
  },
];

export const kegiatanStatusFilterOptions: KegiatanStatusFilterOption[] = [
  {
    value: "all",
    label: "Semua Status",
  },
  {
    value: "Berjalan",
    label: "Berjalan",
  },
  {
    value: "Selesai",
    label: "Selesai",
  },
  {
    value: "Draft",
    label: "Draft",
  },
];

export const kegiatanJenisOptions: KegiatanSelectOption<KegiatanJenis>[] = [
  {
    value: "Sosialisasi",
    label: "Sosialisasi",
  },
  {
    value: "Bimtek",
    label: "Bimtek",
  },
  {
    value: "Pendampingan",
    label: "Pendampingan",
  },
  {
    value: "Monev",
    label: "Monev",
  },
  {
    value: "Rapat",
    label: "Rapat",
  },
];

export const kegiatanFormJenisOptions = kegiatanJenisOptions;

export const bidangOptions: KegiatanSelectOption<KegiatanBidang>[] = [
  {
    value: "Dukcapil",
    label: "Dukcapil",
  },
  {
    value: "PMK",
    label: "PMK",
  },
  {
    value: "Sekretariat",
    label: "Sekretariat",
  },
];

export const kecamatanOptions = [
  {
    value: "sorong",
    label: "Sorong",
  },
  {
    value: "rajaampat",
    label: "Raja Ampat",
  },
];

export const kegiatanStatusFormOptions: KegiatanSelectOption<KegiatanStatus>[] = [
  {
    value: "Draft",
    label: "Draft",
  },
  {
    value: "Berjalan",
    label: "Berjalan",
  },
  {
    value: "Selesai",
    label: "Selesai",
  },
];
