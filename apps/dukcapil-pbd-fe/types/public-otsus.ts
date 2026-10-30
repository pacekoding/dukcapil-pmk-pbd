import type { OtsusFundingSource, OtsusStatus } from "@/types/otsus";

export type PublicOtsusFunding = { sumberDana: OtsusFundingSource; jumlah: number; pagu: number; realisasi: number };
export type PublicOtsusSummary = { total: number; selesai: number; berjalan: number; belumMulai: number; pagu: number; realisasi: number; foto: number; dokumen: number; funding: PublicOtsusFunding[]; updatedAt: string };
export type PublicOtsusItem = {
  id: number; tahunAnggaran: string; kodeSubkegiatan: string; namaSubkegiatan: string;
  program: string; kegiatan: string; bidang: string; kabupatenKota: string;
  sumberDana: OtsusFundingSource; pagu: number; realisasi: number; status: OtsusStatus;
  jumlahFoto: number; jumlahDokumen: number; thumbnailUrl?: string; updatedAt: string;
};
export type PublicOtsusListResponse = { year: string; years: string[]; summary: PublicOtsusSummary; items: PublicOtsusItem[]; kabupaten: string[]; page: number; pageSize: number; total: number; totalPages: number };
export type PublicOtsusFile = { id: number; title: string; type: "PHOTO" | "DPA" | "LPJ"; version?: number; mimeType: string; fileSize: number; previewUrl: string; downloadUrl: string; caption?: string; createdAt?: string };
export type PublicOtsusDetail = { item: PublicOtsusItem; keterangan: string; photos: PublicOtsusFile[]; documents: PublicOtsusFile[] };
