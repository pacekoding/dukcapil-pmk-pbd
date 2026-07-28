import type { RadiogramSurat } from "@/types/surat";

const now = new Date().toISOString();

export const defaultRadiogramTemplate: RadiogramSurat = {
  id: "rad-template-oap-2026",
  nomorSurat: "",
  nomorRadiogram: "",
  registerNo: "",
  jenisSurat: "radiogram",
  tanggalPembuatan: "2026-01-13",
  tanggalSurat: "2026-01-13",
  tujuan: "BUPATI / WALIKOTA SE-PAPUA BARAT DAYA",
  perihal: "Launching Data Orang Asli Papua",
  klasifikasi: "segera",
  status: "draft",
  dibuatOleh: "Operator SISURAT",
  diubahOleh: "Operator SISURAT",
  createdAt: now,
  updatedAt: now,
  panggilan: "PBD",
  jenis: "RG",
  nomor: "",
  derajat: "kilat",
  tahunAnggaran: "2026",
  dari: "GUBERNUR PROVINSI PAPUA BARAT DAYA",
  untuk:
    "1. BUPATI / WALIKOTA SE-PAPUA BARAT DAYA\n2. KETUA DPRD PROVINSI PAPUA BARAT DAYA\n3. KETUA DPRD KAB / KOTA SE-PAPUA BARAT DAYA\n4. KETUA MRP PROVINSI PAPUA BARAT DAYA",
  alamatTujuan: "SE-PAPUA BARAT DAYA",
  tembusan: ["PJ SEKRETARIS DAERAH PROVINSI PAPUA BARAT DAYA"],
  amanat:
    "AMANAT UNDANG UNDANG NOMOR 2 TAHUN 2021 TENTANG OTONOMI KHUSUS PAPUA SEBAGAI DASAR PEMBAGIAN DAN PENERIMAAN KHUSUS DALAM RANGKA PELAKSANAAN OTSUS ANTAR PROVINSI DAN KABUPATEN/KOTA DI WILAYAH PAPUA MEMPERHATIKAN JUMLAH ORANG ASLI PAPUA SERTA PERATURAN MENTERI KEUANGAN NOMOR 33 TAHUN 2024 TENTANG PENGELOLAAN TRANSFER KE DAERAH DALAM RANGKA OTONOMI KHUSUS UNTUK MENGISYARATKAN SISTEM INFORMASI KHUSUS YANG TERINTEGRASI MENDUKUNG KEBUTUHAN PENYEDIAAN DATA DAN INFORMASI DALAM PERUMUSAN KEBIJAKAN PENGELOLAAN APBN DAN TRANSFER KE DAERAH DALAM RANGKA OTONOMI KHUSUS, DISAMPAIKAN HAL-HAL SEBAGAI BERIKUT:",
  textMode: "normal",
  sectionAAA: {
    agenda:
      "PELAKSANAAN LAUNCHING DATA ORANG ASLI PAPUA TINGKAT PROVINSI PAPUA BARAT DAYA",
    hari: "SELASA",
    tanggal: "13 JANUARI 2026",
    waktuMulai: "09.00 WIT",
    waktuSelesai: "SELESAI",
    tempat: "RHYLICH PANORAMA HOTEL, KAMPUNG BARU, KOTA SORONG",
  },
  sectionBBB:
    "MENGINGAT PENTINGNYA ACARA TERSEBUT, DIHARAPKAN KEPADA KEPALA DINAS DUKCAPIL KABUPATEN/KOTA UNTUK MENGIKUTI KEGIATAN LAUNCHING DIMAKSUD, MENGINGAT KEGIATAN DIHADIRI LANGSUNG OLEH DIREKTUR JENDERAL KEPENDUDUKAN DAN PENCATATAN SIPIL KEMENTERIAN DALAM NEGERI.",
  sectionCCC:
    "BIAYA PERJALANAN DINAS KABUPATEN/KOTA KE KOTA SORONG DITANGGUNG APBD MASING-MASING KABUPATEN/KOTA.",
  sectionDDD: "DUM KMA GUB PAPUA BARAT DAYA KRM TTK HBS",
  isiBerita: [],
  pengirimAtasNama: "An. GUBERNUR PAPUA BARAT DAYA",
  jabatanPengirim: "PJ. SEKRETARIS DAERAH",
  pangkatPenandatangan: "",
  namaPenandatangan: "Drs. YAKOB KARET, M.Si",
  nipPenandatangan: "196708041988101001",
  kodeJabatan: "",
  catatanTte: "",
  qrCodeLabel: "",
  footer: "Dokumen ini dicetak dari SISURAT DUKCAPIL Papua Barat Daya.",
};

export function createRadiogramDraft(base?: Partial<RadiogramSurat>) {
  const timestamp = new Date().toISOString();

  return {
    ...defaultRadiogramTemplate,
    id: `rad-${Date.now()}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...base,
  };
}
