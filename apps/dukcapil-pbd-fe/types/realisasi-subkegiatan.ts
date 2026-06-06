import type { Subkegiatan } from "@/types/subkegiatan";

export type RealisasiFile = {
  id: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

export type RealisasiSubkegiatan = {
  id: number;
  tahunAnggaran: string;
  subkegiatanId: number;
  subkegiatan?: Subkegiatan;
  tanggal: string;
  nama: string;
  lokasi: string;
  keterangan: string;
  jumlahFoto: number;
  jumlahDokumen: number;
  fotoDokumentasi?: RealisasiFile[];
  dokumen?: RealisasiFile[];
};

export type RealisasiSubkegiatanPayload = {
  subkegiatanId: number;
  tanggal: string;
  nama: string;
  lokasi: string;
  keterangan: string;
};

export type RealisasiSubkegiatanListResponse = {
  tahunAnggaran: string;
  items: RealisasiSubkegiatan[];
};
