export type JenisSurat =
  | "radiogram"
  | "undangan"
  | "nota_dinas"
  | "surat_tugas"
  | "surat_biasa"
  | "berita_acara";

export type StatusSurat =
  | "draft"
  | "siap_cetak"
  | "sudah_dicetak"
  | "terkirim"
  | "dibatalkan";

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
  tujuan: string;
  perihal: string;
  klasifikasi: KlasifikasiSurat;
  status: StatusSurat;
  createdAt: string;
  updatedAt: string;
}

export interface RadiogramBlock {
  id: string;
  kode: "AAA" | "BBB" | "CCC" | "DDD" | "EEE" | string;
  isi: string;
}

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
  isiBerita: RadiogramBlock[];
  amanat?: string;
  pengirimAtasNama?: string;
  jabatanPengirim?: string;
  namaPenandatangan?: string;
  nipPenandatangan?: string;
  catatanTte?: string;
  qrCodeLabel?: string;
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
