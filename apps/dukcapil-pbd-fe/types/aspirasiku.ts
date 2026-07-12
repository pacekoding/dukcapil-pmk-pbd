export type AspirasiJenis =
  | "Saran"
  | "Masukan"
  | "Keluhan"
  | "Pendapat"
  | "Lainnya";

export type AspirasiStatus = "Baru" | "Dibaca" | "Selesai";

export const aspirasiJenisOptions: AspirasiJenis[] = [
  "Saran",
  "Masukan",
  "Keluhan",
  "Pendapat",
  "Lainnya",
];

export const aspirasiStatusOptions: AspirasiStatus[] = [
  "Baru",
  "Dibaca",
  "Selesai",
];

export type Aspirasi = {
  id: number;
  jenis: AspirasiJenis;
  judul: string;
  isi: string;
  status: AspirasiStatus;
  createdAt: string;
  updatedAt: string;
};

export type AspirasiPayload = {
  jenis: AspirasiJenis;
  judul: string;
  isi: string;
};

export type AspirasiListResponse = {
  items: Aspirasi[];
};
