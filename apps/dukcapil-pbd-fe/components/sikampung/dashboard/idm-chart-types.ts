import type { SikampungStatusIDM } from "@/types/sikampung";

export const IDM_YEARS = [2025, 2026] as const;

export type IdmYear = (typeof IDM_YEARS)[number];

export type IDMStatusKey =
  | "sangat_tertinggal"
  | "tertinggal"
  | "berkembang"
  | "maju"
  | "mandiri";

export type IDMStatusDatum = {
  key: IDMStatusKey;
  name: SikampungStatusIDM;
  value: number;
};

export type IDMComponentDatum = {
  code: "IKS" | "IKE" | "IKL";
  label: string;
  value: number;
};

export type IDMTrendDatum = {
  year: IdmYear;
  value: number | null;
};
