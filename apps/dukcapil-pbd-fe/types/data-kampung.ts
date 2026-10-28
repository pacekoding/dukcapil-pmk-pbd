export const dataKampungStatusIdmOptions = [
  "Mandiri",
  "Maju",
  "Berkembang",
  "Tertinggal",
  "Sangat Tertinggal",
] as const;

export type DataKampungStatusIDM = (typeof dataKampungStatusIdmOptions)[number];

export type DataKampungData = {
  id: number;
  tahunAnggaran: string;
  kodeDesa: string;
  desa: string;
  distrik: string;
  kabupaten: string;
  iks: number;
  ike: number;
  ikl: number;
  nilaiIdm: number;
  statusIdm: DataKampungStatusIDM;
  createdAt: string;
  updatedAt: string;
};

export type DataKampungPayload = {
  kodeDesa: string;
  desa: string;
  distrik: string;
  kabupaten: string;
  iks: number;
  ike: number;
  ikl: number;
  nilaiIdm: number;
  statusIdm: DataKampungStatusIDM;
};

export type DataKampungListResponse = {
  tahunAnggaran: string;
  items: DataKampungData[];
  page: number;
  pageSize: number;
  total: number;
};
