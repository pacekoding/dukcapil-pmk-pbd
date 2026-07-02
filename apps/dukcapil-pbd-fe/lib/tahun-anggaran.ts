export const getCurrentTahunAnggaran = () => String(new Date().getFullYear());

export const getTahunAnggaranOptions = () => {
  const currentYear = new Date().getFullYear();

  return Array.from(
    new Set([
      String(currentYear),
      String(currentYear - 1),
    ]),
  );
};
