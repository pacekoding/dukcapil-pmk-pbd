export type JenisSurat =
  | "radiogram"
  | "undangan"
  | "nota_dinas"
  | "surat_tugas"
  | "surat_biasa"
  | "berita_acara";

export type StatusSurat =
  | "draft"
  | "selesai";

export type KlasifikasiSurat =
  | "biasa"
  | "penting"
  | "segera"
  | "sangat_segera";

export type DerajatSurat = "biasa" | "kilat" | "kilat_khusus";

export interface SuratKeluar {
  id: string;
  nomorSurat: string;
  jenisSurat: JenisSurat;
  tanggalPembuatan: string;
  tanggalSurat?: string;
  tujuan: string;
  perihal: string;
  klasifikasi: KlasifikasiSurat;
  status: StatusSurat;
  dibuatOleh?: string;
  diubahOleh?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RadiogramBlock {
  id: string;
  kode: "AAA" | "BBB" | "CCC" | "DDD" | "EEE" | string;
  isi: string;
}

export interface RadiogramSectionAAA {
  agenda: string;
  hari: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  tempat: string;
}

export type RadiogramTextMode = "normal" | "radiogram";

export interface RadiogramSurat extends SuratKeluar {
  registerNo?: string;
  panggilan?: string;
  jenis?: string;
  nomor?: string;
  nomorRadiogram?: string;
  derajat?: DerajatSurat;
  tahunAnggaran?: string;
  dari: string;
  untuk: string;
  tembusan: string[];
  alamatTujuan?: string;
  isiBerita: RadiogramBlock[];
  amanat?: string;
  textMode?: RadiogramTextMode;
  sectionAAA?: RadiogramSectionAAA;
  sectionBBB?: string;
  sectionCCC?: string;
  sectionDDD?: string;
  pengirimAtasNama?: string;
  jabatanPengirim?: string;
  pangkatPenandatangan?: string;
  namaPenandatangan?: string;
  nipPenandatangan?: string;
  kodeJabatan?: string;
  catatanTte?: string;
  qrCodeLabel?: string;
  footer?: string;
}

export interface PdfPreviewSettings {
  paperSize: "A4" | "F4" | "Legal" | "Letter";
  orientation: "portrait" | "landscape";
  fontFamily: "Arial" | "Times New Roman" | "Calibri" | "Inter" | "Roboto Mono";
  bodyFontSize: number;
  headerFontSize: number;
  margin: "normal" | "sempit" | "lebar" | "custom";
  lineSpacing: number;
  showLogo: boolean;
  showHeaderLine: boolean;
  showQrCode: boolean;
  showTteNote: boolean;
  showTrafficSection: boolean;
}
