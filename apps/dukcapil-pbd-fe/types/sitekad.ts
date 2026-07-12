export type SitekadKategoriUsaha =
  | "Pertanian"
  | "Perikanan"
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
  kampung: string;
  kategoriUsaha: SitekadKategoriUsaha;
  danaAlokasi: number;
  capaianUtama: string;
  kendalaLapangan: string;
  createdAt: string;
  updatedAt: string;
};

export type SitekadPotensiKampungPayload = {
  kode: string;
  kabupatenKota: string;
  kampung: string;
  kategoriUsaha: SitekadKategoriUsaha;
  danaAlokasi: number;
  capaianUtama: string;
  kendalaLapangan: string;
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
