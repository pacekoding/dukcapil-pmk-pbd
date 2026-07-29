export const sikampungStatusIdmOptions = [
  "Mandiri",
  "Maju",
  "Berkembang",
  "Tertinggal",
  "Sangat Tertinggal",
] as const;

export type SikampungStatusIDM = (typeof sikampungStatusIdmOptions)[number];

export type SikampungData = {
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
  statusIdm: SikampungStatusIDM;
  createdAt: string;
  updatedAt: string;
};

export type SikampungPayload = {
  kodeDesa: string;
  desa: string;
  distrik: string;
  kabupaten: string;
  iks: number;
  ike: number;
  ikl: number;
  nilaiIdm: number;
  statusIdm: SikampungStatusIDM;
};

export type SikampungListResponse = {
  tahunAnggaran: string;
  items: SikampungData[];
};
