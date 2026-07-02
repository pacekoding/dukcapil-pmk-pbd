import type { Subkegiatan } from "@/types/subkegiatan";
import type { SSD } from "@/types/ssd";

export type RealisasiFile = {
  id: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

export type RealisasiSSDValue = {
  ssdId: number;
  ssd?: SSD;
  nilai: string;
};

export type StatusCapaian =
  | "Target Belum Diisi"
  | "Belum Ada Realisasi"
  | "Belum Tercapai"
  | "Tercapai"
  | "Melebihi Target";

export type RealisasiSubkegiatan = {
  id: number;
  tahunAnggaran: string;
  subkegiatanId: number;
  subkegiatan?: Subkegiatan;
  tanggal: string;
  nama: string;
  lokasi: string;
  fasilitator: string;
  narasumber: string;
  jabatanNarasumber: string;
  jumlahTamu: number;
  tujuanKegiatan: string;
  poinPenting: string;
  hasilKegiatan: string;
  keterangan: string;
  targetOutput: number | null;
  realisasiOutput: number | null;
  satuanOutput: string;
  persentaseCapaian: number | null;
  statusCapaian: StatusCapaian;
  kendala: string;
  tindakLanjut: string;
  catatanEvaluasi: string;
  jumlahFoto: number;
  jumlahDokumen: number;
  jumlahSsd: number;
  jumlahSsdData: number;
  ssdValues?: RealisasiSSDValue[];
  fotoDokumentasi?: RealisasiFile[];
  dokumen?: RealisasiFile[];
};

export type RealisasiSubkegiatanPayload = {
  subkegiatanId: number;
  tanggal: string;
  nama: string;
  lokasi: string;
  fasilitator: string;
  narasumber: string;
  jabatanNarasumber: string;
  jumlahTamu: number;
  tujuanKegiatan: string;
  poinPenting: string;
  hasilKegiatan: string;
  keterangan: string;
  targetOutput: number | null;
  realisasiOutput: number | null;
  satuanOutput: string;
  kendala: string;
  tindakLanjut: string;
  catatanEvaluasi: string;
  ssdValues: Array<{
    ssdId: number;
    nilai: string;
  }>;
};

export type RealisasiSubkegiatanListResponse = {
  tahunAnggaran: string;
  items: RealisasiSubkegiatan[];
};
