import type {
  BumKampungKategori,
  BumKampungStatus,
} from "@/types/bum-kampung";

export type BumStatusDatum = {
  key: BumKampungStatus;
  name: BumKampungStatus;
  value: number;
};

export type BumKategoriDatum = {
  key: BumKampungKategori;
  name: BumKampungKategori;
  value: number;
};

export type BumKabupatenDatum = {
  name: string;
  value: number;
};
