import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { TorDocument } from "@/types/tor";

export type DokumenJenisKegiatan =
  | "Sosialisasi"
  | "Bimtek"
  | "Pendampingan"
  | "Monev"
  | "Rapat";

export type DokumenJenisDokumen = "TOR" | "Laporan";

export type Dokumen = {
  id: number;
  namaKegiatan: string;
  jenisKegiatan: DokumenJenisKegiatan;
  jenisDokumen: DokumenJenisDokumen;
  tanggal: string;
  dibuatOleh: string;
};

export type DokumenPayload = Omit<Dokumen, "id">;

export type DokumenTypeOption = {
  value: string;
  label: string;
};

export type DokumenListResponse = {
  documents: Dokumen[];
  jenisKegiatanOptions: DokumenJenisKegiatan[];
  jenisDokumenOptions: DokumenJenisDokumen[];
};

export type DokumenFormMeta = {
  dokumenTypeOptions: DokumenTypeOption[];
  kegiatanOptions: Array<{
    id: number;
    nama: string;
  }>;
  torData: TorDocument;
  torPdfSections: string[];
  laporanPelaksanaanData: LaporanPelaksanaanDocument;
  laporanPdfSections: string[];
};

export type DokumenPreviewData = {
  document: Dokumen;
  torData: TorDocument;
  laporanPelaksanaanData: LaporanPelaksanaanDocument;
};
