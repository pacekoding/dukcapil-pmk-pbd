export const bumKampungKategoriOptions = ["BUMKam", "BUMKam bersama"] as const;

export const bumKampungStatusOptions = [
  "Dokumen Badan Hukum Terverifikasi",
  "Nama Terverifikasi",
  "Perbaikan Dokumen Badan Hukum",
  "Perbaikan Nama",
] as const;

export type BumKampungKategori = (typeof bumKampungKategoriOptions)[number];

export type BumKampungStatus = (typeof bumKampungStatusOptions)[number];

export type BumKampung = {
  id: number;
  tahunAnggaran: string;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  namaBumKampung: string;
  kategori: BumKampungKategori;
  status: BumKampungStatus;
};

export type BumKampungPayload = {
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  namaBumKampung: string;
  kategori: BumKampungKategori;
  status: BumKampungStatus;
};

export type BumKampungListResponse = {
  tahunAnggaran: string;
  items: BumKampung[];
};
