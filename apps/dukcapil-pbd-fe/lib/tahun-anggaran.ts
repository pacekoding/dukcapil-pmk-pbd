export const getCurrentTahunAnggaran = () => String(new Date().getFullYear());

export const getTahunAnggaranOptions = () => {
  const currentYear = new Date().getFullYear();
  const earliestSupportedYear = 2025;

  return Array.from(
    { length: Math.max(currentYear - earliestSupportedYear + 1, 1) },
    (_, index) => String(currentYear - index),
  );
};
