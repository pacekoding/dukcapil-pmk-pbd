import type { SSD } from "@/types/ssd";

export type SubkegiatanBidang = "dukcapil" | "pmk" | "umum";

export type Subkegiatan = {
  id: number;
  tahunAnggaran: string;
  kode: string;
  nama: string;
  bidang: SubkegiatanBidang;
  ssdItems: SSD[];
};

export type SubkegiatanPayload = {
  kode: string;
  nama: string;
  bidang: SubkegiatanBidang;
  ssdIds: number[];
};

export type SubkegiatanListResponse = {
  tahunAnggaran: string;
  items: Subkegiatan[];
};

export type SubkegiatanImportResult = {
  tahunAnggaran: string;
  total: number;
  created: number;
  updated: number;
};
