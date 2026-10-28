export function otsusBudget(pagu: number, realisasi: number) {
  return {
    sisa: pagu - realisasi,
    persentase: pagu === 0 ? 0 : (realisasi / pagu) * 100,
  };
}
