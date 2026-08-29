export type SitekadKategoriUsaha =
  | "Pertanian"
  | "Perikanan"
  | "Perikanan Darat"
  | "Perikanan Laut"
  | "Peternakan"
  | "Perkebunan"
  | "Pariwisata"
  | "Perdagangan"
  | "Kerajinan"
  | "Jasa"
  | "Lainnya";

export const sitekadKategoriUsahaOptions: SitekadKategoriUsaha[] = [
  "Pertanian",
  "Perikanan",
  "Perikanan Darat",
  "Perikanan Laut",
  "Peternakan",
  "Perkebunan",
  "Pariwisata",
  "Perdagangan",
  "Kerajinan",
  "Jasa",
  "Lainnya",
];

export type SitekadPotensiKampung = {
  id: number;
  kode: string;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  namaKelompok: string;
  kategoriUsaha: SitekadKategoriUsaha;
  jenisUsaha: string;
  komoditas: string;
  jumlahAnggota: number;
  danaAlokasi: number;
  createdAt: string;
  updatedAt: string;
};

export type SitekadPotensiKampungPayload = {
  kode: string;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  namaKelompok: string;
  kategoriUsaha: SitekadKategoriUsaha;
  jenisUsaha: string;
  komoditas: string;
  jumlahAnggota: number;
  danaAlokasi: number;
};

export type SitekadListResponse = {
  items: SitekadPotensiKampung[];
};

export type SitekadKampungOption = {
  kabupatenKota: string;
  distrik: string;
  kampung: string;
};

export type SitekadOptionsResponse = {
  kabupatenKota: string[];
  kampung: SitekadKampungOption[];
};

export type SitekadCapaianKendala = {
  id: number;
  kelompokId: number;
  kelompok: SitekadPotensiKampung;
  namaCapaian: string;
  tahunBinaan: string;
  deskripsiCapaian: string;
  kendalaHambatan: string;
  dokumentasiUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type SitekadCapaianKendalaPayload = {
  kelompokId: number;
  namaCapaian: string;
  tahunBinaan: string;
  deskripsiCapaian: string;
  kendalaHambatan: string;
  dokumentasiUrls: string[];
  documentationPhotos?: File[];
};

export type SitekadCapaianKendalaListResponse = {
  items: SitekadCapaianKendala[];
};
