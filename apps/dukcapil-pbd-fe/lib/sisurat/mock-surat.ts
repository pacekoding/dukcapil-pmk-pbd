import type {
  JenisSurat,
  KlasifikasiSurat,
  PdfPreviewSettings,
  RadiogramSurat,
  StatusSurat,
  SuratKeluar,
} from "@/types/surat";

import { createRadiogramDraft } from "./radiogram-template";

export const jenisSuratLabels: Record<JenisSurat, string> = {
  radiogram: "Radiogram",
  undangan: "Undangan",
  nota_dinas: "Nota Dinas",
  surat_tugas: "Surat Tugas",
  surat_biasa: "Surat Biasa",
  berita_acara: "Berita Acara",
};

export const mvpJenisSurat: JenisSurat[] = ["radiogram"];

export const statusSuratLabels: Record<StatusSurat, string> = {
  draft: "Draft",
  selesai: "Selesai",
};

export const klasifikasiSuratLabels: Record<KlasifikasiSurat, string> = {
  biasa: "Biasa",
  penting: "Penting",
  segera: "Segera",
  sangat_segera: "Sangat Segera",
};

export const defaultPdfPreviewSettings: PdfPreviewSettings = {
  paperSize: "A4",
  orientation: "portrait",
  fontFamily: "Arial",
  bodyFontSize: 11,
  headerFontSize: 14,
  margin: "normal",
  lineSpacing: 1.15,
  showLogo: false,
  showHeaderLine: true,
  showQrCode: false,
  showTteNote: false,
  showTrafficSection: true,
};

export const mockRadiogramSorong: RadiogramSurat = createRadiogramDraft({
  id: "rad-001",
  nomorSurat: "470/001/DUKCAPIL-PMK/I/2026",
  registerNo: "REG-001/DUKCAPIL/2026",
  status: "selesai",
  dibuatOleh: "Admin Dukcapil",
  diubahOleh: "Admin Dukcapil",
  createdAt: "2026-01-10T02:00:00.000Z",
  updatedAt: "2026-01-10T02:00:00.000Z",
});

export const mockRadiogramDraft: RadiogramSurat = createRadiogramDraft({
  id: "rad-002",
  nomorSurat: "",
  registerNo: "REG-002/DUKCAPIL/2026",
  status: "draft",
  dibuatOleh: "Operator SISURAT",
  diubahOleh: "Operator SISURAT",
  createdAt: "2026-01-12T04:30:00.000Z",
  updatedAt: "2026-01-12T04:30:00.000Z",
});

export const mockSuratKeluar: SuratKeluar[] = [
  mockRadiogramSorong,
  mockRadiogramDraft,
];

export const mockRadiogramById = new Map(
  [mockRadiogramSorong, mockRadiogramDraft].map((item) => [item.id, item]),
);

export function findSuratKeluar(id: string) {
  return mockSuratKeluar.find((item) => item.id === id);
}

export function findRadiogram(id: string) {
  return mockRadiogramById.get(id);
}
