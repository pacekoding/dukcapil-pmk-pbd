export type KategoriUsaha =
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

export const kelompokBinaanKategoriUsahaOptions: KategoriUsaha[] = [
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

export type KelompokBinaan = {
  id: number;
  kode: string;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  namaKelompok: string;
  kategoriUsaha: KategoriUsaha;
  jenisUsaha: string;
  komoditas: string;
  jumlahAnggota: number;
  danaAlokasi: number;
  createdAt: string;
  updatedAt: string;
};

export type KelompokBinaanPayload = {
  kode: string;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  namaKelompok: string;
  kategoriUsaha: KategoriUsaha;
  jenisUsaha: string;
  komoditas: string;
  jumlahAnggota: number;
  danaAlokasi: number;
};

export type KelompokBinaanListResponse = {
  items: KelompokBinaan[];
};

export type KampungOption = {
  kabupatenKota: string;
  distrik: string;
  kampung: string;
};

export type KelompokBinaanOptionsResponse = {
  kabupatenKota: string[];
  kampung: KampungOption[];
};

export type CapaianKendala = {
  id: number;
  kelompokId: number;
  kelompok: KelompokBinaan;
  namaCapaian: string;
  tahunBinaan: string;
  deskripsiCapaian: string;
  kendalaHambatan: string;
  dokumentasiUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type CapaianKendalaPayload = {
  kelompokId: number;
  namaCapaian: string;
  tahunBinaan: string;
  deskripsiCapaian: string;
  kendalaHambatan: string;
  dokumentasiUrls: string[];
  documentationPhotos?: File[];
};

export type CapaianKendalaListResponse = {
  items: CapaianKendala[];
};
