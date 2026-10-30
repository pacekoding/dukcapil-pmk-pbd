import type { Subkegiatan } from "@/types/subkegiatan";

export type OtsusStatus = "BELUM_MULAI" | "BERJALAN" | "SELESAI";
export type OtsusFundingSource = "SG_1_25" | "BG_1";
export type DpaType = "AWAL" | "PERGESERAN" | "PERUBAHAN";
export type OtsusFile = { id: number; originalFilename: string; mimeType: string; fileSize: number; previewUrl: string; downloadUrl: string; createdAt: string };
export type OtsusLabel = {
  id: number; tahunAnggaran: string; subkegiatanId: number; pagu: number; realisasi: number; sumberDana: OtsusFundingSource;
  status: OtsusStatus; keterangan: string; kabupatenKota: string; isPublic: boolean; bidang: string; program: string; kegiatan: string;
  subkegiatan: string; subkegiatanKode: string; subkegiatanNama: string;
  documentationCount: number; dpaCount: number; hasLpj: boolean;
  createdAt: string; updatedAt: string;
};
export type OtsusDocumentation = { id: number; otsusLabelId: number; fileId: number; caption: string; isPublic: boolean; createdAt: string; file: OtsusFile };
export type OtsusLpj = { id: number; isPublic: boolean; file: OtsusFile; createdAt: string; updatedAt: string };
export type OtsusDpa = { id: number; jenis: DpaType; versi: number; catatan: string; isPublic: boolean; uploadedAt: string; file: OtsusFile };
export type OtsusDetail = { label: OtsusLabel; documentations: OtsusDocumentation[]; lpj: OtsusLpj | null; dpaVersions: OtsusDpa[] };
export type OtsusPayload = { subkegiatanId: number; pagu: number; realisasi: number; sumberDana: OtsusFundingSource; status: OtsusStatus; keterangan: string; kabupatenKota: string };
export type OtsusOptions = Subkegiatan[];
