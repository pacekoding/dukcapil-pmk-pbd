import type {
  JenisSurat,
  KlasifikasiSurat,
  PdfPreviewSettings,
  RadiogramSurat,
  StatusSurat,
  SuratKeluar,
} from "@/types/surat";

export const jenisSuratLabels: Record<JenisSurat, string> = {
  radiogram: "Radiogram",
  undangan: "Undangan",
  nota_dinas: "Nota Dinas",
  surat_tugas: "Surat Tugas",
  surat_biasa: "Surat Biasa",
  berita_acara: "Berita Acara",
};

export const statusSuratLabels: Record<StatusSurat, string> = {
  draft: "Draft",
  siap_cetak: "Siap Cetak",
  sudah_dicetak: "Sudah Dicetak",
  terkirim: "Terkirim",
  dibatalkan: "Dibatalkan",
};

export const klasifikasiSuratLabels: Record<KlasifikasiSurat, string> = {
  biasa: "Biasa",
  penting: "Penting",
  segera: "Segera",
  sangat_segera: "Sangat Segera",
};

export const defaultPdfPreviewSettings: PdfPreviewSettings = {
  paperSize: "A4",
  orientation: "portrait",
  fontFamily: "Arial",
  bodyFontSize: 11,
  headerFontSize: 14,
  margin: "normal",
  lineSpacing: 1.15,
  showLogo: true,
  showHeaderLine: true,
  showQrCode: true,
  showTteNote: true,
  showTrafficSection: true,
};

export const mockRadiogramSorong: RadiogramSurat = {
  id: "rad-001",
  nomorSurat: "RADIOGRAM/OAP/2026",
  nomorRadiogram: "",
  registerNo: "REG-001/DUKCAPIL/2026",
  jenisSurat: "radiogram",
  tanggalPembuatan: "2026-07-15",
  tujuan: "BUPATI / WALIKOTA SE-PAPUA BARAT DAYA",
  perihal: "Launching Data Orang Asli Papua",
  klasifikasi: "segera",
  status: "siap_cetak",
  createdAt: "2026-07-15T08:00:00.000Z",
  updatedAt: "2026-07-15T08:00:00.000Z",
  panggilan: "PBD",
  jenis: "RG",
  nomor: "",
  derajat: "kilat",
  tahunAnggaran: "2026",
  dari: "GUBERNUR PROVINSI PAPUA BARAT DAYA",
  untuk:
    "1. BUPATI / WALIKOTA SE-PAPUA BARAT DAYA\n2. KETUA DPRD PROVINSI PAPUA BARAT DAYA\n3. KETUA DPRD KAB / KOTA SE-PAPUA BARAT DAYA\n4. KETUA MRP PROVINSI PAPUA BARAT DAYA",
  tembusan: ["PJ SEKRETARIS DAERAH PROVINSI PAPUA BARAT DAYA"],
  amanat:
    "AMANAT UNDANG UNDANG NOMER 2 TAHUN 2021 TENTANG OTONOMI KHUSUS PAPUA SEBAGAI DASAR PEMBAGIAN DAN PENERIMAAN KHUSUS DALAM RANGKA PELAKSAAN OTSUS ANTAR PROVINSI DAN KABUPATEN GARING KOTA DI WILAYAH PAPUA MEMPERHATIKAN JUMLAH ORANG ASLI PAPUA SERTA PERATURAN MENTERI KEUANGAN NO.33 TAHUN 2024 TENTANG PENGELOLAAN TRANSFER KE DAERAH DALAM RANGKA OTONOMI KHUSUS UNTUK MENGISYARATKAN SISTEM INFORMASI KHUSUS YANG TERINTEGRITAS MENDUKUNG KEBUTUHAN PENYEDIAN DATA DAN INFORMASI DALAM RUMUSAN KEBIJAKAN PENGELOLAAN APBN DAN TRANSFER KE DAERAH TKD UTK PENERIMAAN DALAM RANGKA OTSUS KMA DISAMPAIKAN HAL SBB :",
  isiBerita: [
    {
      id: "blk-aaa",
      kode: "AAA",
      isi: "PELAKSAAN LAUNCING DATA ORANG ASLI PAPUA TINGKAT PROVINSI PAPUA BARAT DAYA HARI/TANGGAL : SELASA, 13 JANUARI 2026 WAKTU : 09.00 WIT SAMPAI SELESAI TEMPAT : RHYLICH PANORAMA HOTEL KAMPUNG BARU KOTA SORONG",
    },
    {
      id: "blk-bbb",
      kode: "BBB",
      isi: "MENGINGAT PENTINGNYA ACARA TSB DIHARAPKAN KPD KEPALA DINAS DUKCAPIL KABUPATEN KOTA UTK MENGIKUTI KEGIATAN LAUNCING DI MSD KOMA MENGINGAT DIHADIRI LANGSUNG OLEH DIRJEN KEPENDUDUKAN KEMENTERIAN DALAM NEGERI",
    },
    {
      id: "blk-ccc",
      kode: "CCC",
      isi: "BIAYA PERJALANAN DINAS KAB GARING KOTA KE KOTA SORONG DITANGGUNG APBD MASINGS KAB GARING KOTA",
    },
    {
      id: "blk-ddd",
      kode: "DDD",
      isi: "DUM KMA GUB PAPUA BARAT DAYA KRM TTK HBS",
    },
  ],
  pengirimAtasNama: "An. GUBERNUR PAPUA BARAT DAYA",
  jabatanPengirim: "PJ. SEKRETARIS DAERAH",
  namaPenandatangan: "Drs. YAKOB KARET, M.Si",
  nipPenandatangan: "196708041988101001",
  catatanTte:
    "Sesuai dengan ketentuan peraturan perundang-undangan yang berlaku, dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik.",
  qrCodeLabel: "QR TTE",
};

export const mockRadiogramData: RadiogramSurat = {
  ...mockRadiogramSorong,
  id: "rad-002",
  nomorSurat: "470/126/DUKCAPIL-PMK/2026",
  registerNo: "REG-002/DUKCAPIL/2026",
  tanggalPembuatan: "2026-07-12",
  tujuan: "YTH. KEPALA DINAS DUKCAPIL KABUPATEN/KOTA SE-PAPUA BARAT DAYA",
  untuk: "YTH. KEPALA DINAS DUKCAPIL KABUPATEN/KOTA SE-PAPUA BARAT DAYA",
  perihal: "Koordinasi data kependudukan",
  klasifikasi: "penting",
  status: "draft",
  isiBerita: [
    {
      id: "blk-aaa-data",
      kode: "AAA",
      isi: "DALAM RANGKA VALIDASI DATA KEPENDUDUKAN SEMESTER BERJALAN DIMINTA KEPADA DINAS DUKCAPIL KABUPATEN KOTA UNTUK MELAKUKAN PEMUTAKHIRAN DATA",
    },
    {
      id: "blk-bbb-data",
      kode: "BBB",
      isi: "HASIL PEMUTAKHIRAN DATA AGAR DISAMPAIKAN MELALUI KANAL RESMI BIDANG DUKCAPIL PALING LAMBAT AKHIR BULAN BERJALAN",
    },
    {
      id: "blk-ccc-data",
      kode: "CCC",
      isi: "KOORDINASI TEKNIS DAPAT DILAKUKAN MELALUI TIM DATA KEPENDUDUKAN PROVINSI PAPUA BARAT DAYA",
    },
    {
      id: "blk-eee-data",
      kode: "EEE",
      isi: "DUM TTK HBS",
    },
  ],
};

export const mockSuratKeluar: SuratKeluar[] = [
  mockRadiogramSorong,
  mockRadiogramData,
  {
    id: "und-001",
    nomorSurat: "005/210/DUKCAPIL-PMK/2026",
    jenisSurat: "undangan",
    tanggalPembuatan: "2026-07-10",
    tujuan: "Sekretariat Dinas Dukcapil dan PMK",
    perihal: "Rapat internal evaluasi triwulan",
    klasifikasi: "biasa",
    status: "terkirim",
    createdAt: "2026-07-10T03:15:00.000Z",
    updatedAt: "2026-07-10T03:15:00.000Z",
  },
  {
    id: "st-001",
    nomorSurat: "800/044/DUKCAPIL-PMK/2026",
    jenisSurat: "surat_tugas",
    tanggalPembuatan: "2026-07-08",
    tujuan: "Tim Monitoring Bidang Dukcapil",
    perihal: "Surat tugas monitoring pelayanan administrasi kependudukan",
    klasifikasi: "penting",
    status: "sudah_dicetak",
    createdAt: "2026-07-08T06:30:00.000Z",
    updatedAt: "2026-07-08T06:30:00.000Z",
  },
  {
    id: "nd-001",
    nomorSurat: "470/098/DUKCAPIL-PMK/2026",
    jenisSurat: "nota_dinas",
    tanggalPembuatan: "2026-07-05",
    tujuan: "Kepala Bidang Dukcapil",
    perihal: "Permintaan data capaian pelayanan",
    klasifikasi: "segera",
    status: "siap_cetak",
    createdAt: "2026-07-05T02:45:00.000Z",
    updatedAt: "2026-07-05T02:45:00.000Z",
  },
];

export const mockRadiogramById = new Map(
  [mockRadiogramSorong, mockRadiogramData].map((item) => [item.id, item]),
);

export function findSuratKeluar(id: string) {
  return mockSuratKeluar.find((item) => item.id === id);
}

export function findRadiogram(id: string) {
  return mockRadiogramById.get(id);
}
