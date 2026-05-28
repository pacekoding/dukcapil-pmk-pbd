import type { LaporanPelaksanaanDocument } from "@/types/laporan";

export const laporanPelaksanaanData: LaporanPelaksanaanDocument = {
  tahun: 2026,

  kementerian: "Pemerintah Provinsi Papua Barat Daya",

  dinas:
    "Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung",

  unitKerja: "Bidang Pelayanan Pendaftaran Penduduk",

  nomorDokumen: "470/LPK-DUKCAPIL-PMK/V/2026",

  namaKegiatan:
    "Sosialisasi Administrasi Kependudukan dan Pelayanan Dokumen Kependudukan",

  tanggalLaporan: "Senin, 26 Mei 2026",

  latarBelakang:
    "Laporan pelaksanaan kegiatan ini disusun sebagai bentuk pertanggungjawaban atas pelaksanaan sosialisasi administrasi kependudukan dan pelayanan dokumen kependudukan kepada aparatur distrik, kampung, dan masyarakat.",

  dasarPelaksanaan: [
    "Dokumen Pelaksanaan Anggaran Dinas Dukcapil dan PMK Provinsi Papua Barat Daya Tahun Anggaran 2026.",
    "Program peningkatan kualitas pelayanan administrasi kependudukan.",
    "Surat tugas pelaksanaan kegiatan sosialisasi administrasi kependudukan.",
  ],

  maksudTujuan: [
    "Melaporkan proses pelaksanaan kegiatan secara tertib dan terukur.",
    "Menyampaikan hasil, capaian, kendala, dan tindak lanjut kegiatan.",
    "Menjadi bahan evaluasi pelaksanaan kegiatan berikutnya.",
  ],

  tanggal: "Senin, 22 Mei 2026",

  waktu: "09.00 WIT - Selesai",

  lokasi: "Aula Dinas Dukcapil & PMK Papua Barat Daya",

  peserta: 50,

  pelaksana: "Dinas Dukcapil & PMK Provinsi Papua Barat Daya",

  narasumber: [
    "Kepala Dinas Dukcapil & PMK Provinsi Papua Barat Daya",
    "Kepala Bidang Pelayanan Pendaftaran Penduduk",
    "Operator SIAK Provinsi Papua Barat Daya",
  ],

  metode:
    "Kegiatan dilaksanakan melalui pemaparan materi, diskusi, tanya jawab, dan pendampingan teknis kepada peserta.",

  uraianPelaksanaan: [
    "Registrasi peserta dan pembukaan kegiatan oleh panitia.",
    "Penyampaian materi administrasi kependudukan dan pelayanan dokumen kependudukan.",
    "Diskusi teknis mengenai kendala pelayanan di distrik dan kampung.",
    "Penutupan kegiatan dan penyampaian rencana tindak lanjut.",
  ],

  hasilPelaksanaan: [
    "Peserta memahami alur pelayanan administrasi kependudukan.",
    "Aparatur distrik dan kampung memperoleh pembaruan informasi terkait pelayanan dokumen kependudukan.",
    "Teridentifikasi kebutuhan pendampingan lanjutan untuk beberapa wilayah pelayanan.",
  ],

  capaianOutput: [
    "Terlaksananya kegiatan sosialisasi administrasi kependudukan.",
    "Tersampaikannya materi teknis kepada peserta kegiatan.",
    "Tersusunnya laporan pelaksanaan kegiatan.",
  ],

  kendala: [
    "Sebagian peserta membutuhkan pendampingan lanjutan terkait penggunaan layanan digital.",
    "Ketersediaan data pendukung dari beberapa kampung belum sepenuhnya lengkap.",
  ],

  tindakLanjut: [
    "Melakukan pendampingan teknis lanjutan kepada operator distrik dan kampung.",
    "Menyusun daftar kebutuhan data dan melakukan koordinasi dengan wilayah terkait.",
  ],

  pesertaDetail: [
    {
      no: 1,
      nama: "Aparatur Distrik dan Kampung",
      unsur: "Pemerintahan wilayah",
      jumlah: 30,
    },
    {
      no: 2,
      nama: "Operator SIAK",
      unsur: "Operator layanan",
      jumlah: 10,
    },
    {
      no: 3,
      nama: "Tokoh masyarakat",
      unsur: "Masyarakat",
      jumlah: 10,
    },
  ],

  dokumentasi: [
    {
      no: 1,
      kegiatan: "Pembukaan kegiatan",
      keterangan: "Dilaksanakan oleh Kepala Dinas",
    },
    {
      no: 2,
      kegiatan: "Penyampaian materi",
      keterangan: "Materi administrasi kependudukan",
    },
    {
      no: 3,
      kegiatan: "Diskusi dan pendampingan",
      keterangan: "Sesi tanya jawab peserta",
    },
  ],

  realisasiBiaya: [
    {
      no: 1,
      uraian: "Konsumsi Peserta",
      volume: "50 Orang",
      satuan: "Paket",
      biaya: "Rp150.000",
      jumlah: "Rp7.500.000",
    },
    {
      no: 2,
      uraian: "ATK dan Bahan Materi",
      volume: "50 Orang",
      satuan: "Paket",
      biaya: "Rp75.000",
      jumlah: "Rp3.750.000",
    },
  ],

  totalRealisasi: "Rp11.250.000",

  lampiran: [
    "Daftar hadir peserta kegiatan.",
    "Dokumentasi foto pelaksanaan kegiatan.",
    "Materi sosialisasi administrasi kependudukan.",
  ],

  jabatanPenandatangan: "Penanggung Jawab Kegiatan",

  pejabat: "Drs. Yohanis Kocu, M.Si",

  nip: "19870909 202001 1 001",
};

export const laporanPdfSections = [
  "Cover dan identitas laporan",
  "A. Pendahuluan",
  "B. Pelaksanaan Kegiatan",
  "C. Hasil Pelaksanaan",
  "D. Peserta dan Dokumentasi",
  "E. Realisasi Biaya",
  "F. Penutup dan tanda tangan",
];
