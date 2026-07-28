import type { RadiogramSectionAAA } from "@/types/surat";

const punctuationMap: Array<[RegExp, string]> = [
  [/\//g, " GARING "],
  [/,/g, " KMA "],
  [/\./g, " TTK "],
  [/;/g, " TTK KMA "],
  [/:/g, " : "],
];

const phraseMap: Array<[RegExp, string]> = [
  [/\bkabupaten\s*\/\s*kota\b/gi, "KABUPATEN GARING KOTA"],
  [/\bkab\s*\/\s*kota\b/gi, "KAB GARING KOTA"],
  [/\bkepada\b/gi, "KPD"],
  [/\buntuk\b/gi, "UTK"],
  [/\bdimaksud\b/gi, "DIMAKSUD"],
  [/\btersebut\b/gi, "TERSEBUT"],
  [/\bsebagai berikut\b/gi, "SBB"],
  [/\bselesai atau akhir berita\b/gi, "HBS"],
  [/\bselesai\b/gi, "SELESAI"],
  [/\bdan\b/gi, "DAN"],
];

export function normalizeRadiogramText(value: string) {
  let normalized = value;

  for (const [pattern, replacement] of phraseMap) {
    normalized = normalized.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of punctuationMap) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s+:/g, " :")
    .trim();
}

export function ensureRadiogramClosing(value: string) {
  const normalized = normalizeRadiogramText(value);
  return /\b(TTK|HBS)$/.test(normalized) ? normalized : `${normalized} TTK`;
}

export function formatRadiogramAAA(section: RadiogramSectionAAA) {
  const agenda = normalizeRadiogramText(section.agenda);
  const hari = normalizeRadiogramText(section.hari);
  const tanggal = normalizeRadiogramText(section.tanggal);
  const waktuMulai = normalizeRadiogramText(section.waktuMulai);
  const waktuSelesai = normalizeRadiogramText(section.waktuSelesai);
  const tempat = normalizeRadiogramText(section.tempat);

  return [
    `AAA TTK ${agenda}`,
    `HARI/TANGGAL : ${hari}, ${tanggal}`,
    `WAKTU : ${waktuMulai} SAMPAI ${waktuSelesai}`,
    `TEMPAT : ${tempat}`,
  ].join("\n");
}

export function formatRadiogramBlock(kode: string, value: string) {
  const normalized = ensureRadiogramClosing(value);
  return `${kode} TTK\n${normalized}`;
}

export function sanitizeRadiogramFilename(nomorSurat: string, tanggal: string) {
  const safeNumber =
    nomorSurat.trim().replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+/g, "-") ||
    "tanpa-nomor";
  const safeDate = tanggal.trim() || new Date().toISOString().slice(0, 10);

  return `radiogram-${safeNumber}-${safeDate}.pdf`;
}
