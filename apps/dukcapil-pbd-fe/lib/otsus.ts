import type { OtsusLabel } from "@/types/otsus";

export function otsusBudget(pagu: number, realisasi: number) {
  return {
    sisa: pagu - realisasi,
    persentase: pagu === 0 ? 0 : (realisasi / pagu) * 100,
  };
}

export function normalizeOtsusLabels(
  labels: OtsusLabel[] | null,
): OtsusLabel[] {
  return labels ?? [];
}
