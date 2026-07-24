export type MacekuPKKLevel =
  | "PKK Kabupaten/Kota"
  | "PKK Kecamatan/Distrik"
  | "PKK Desa/Kampung";

export type MacekuPKKArchiveCategory =
  | "Program Kerja"
  | "LKPJ"
  | "Laporan Kegiatan"
  | "Surat Keputusan"
  | "Data Kepengurusan"
  | "Administrasi"
  | "Dokumentasi"
  | "Lainnya";

export type MacekuPKKProfileSummary = {
  id: number;
  name: string;
  level: MacekuPKKLevel;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  chairperson: string;
  managementPeriod: string;
  documentCount: number;
  isActive: boolean;
  updatedAt: string;
};

export type MacekuPKKArchive = {
  id: number;
  profileId: number;
  title: string;
  category: MacekuPKKArchiveCategory;
  documentYear: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileId?: number;
  checksumSha256?: string;
  originalName: string;
  uploadedByName: string;
  downloadUrl: string;
  previewUrl: string;
  uploadedAt: string;
  updatedAt: string;
};

export type MacekuPKKProfileDetail = {
  id: number;
  name: string;
  level: MacekuPKKLevel;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  secretariatAddress: string;
  chairperson: string;
  secretary: string;
  phone: string;
  email: string;
  managementPeriod: string;
  description: string;
  logoOriginalName: string;
  logoMimeType: string;
  logoSize: number;
  logoFileId?: number;
  logoChecksumSha256?: string;
  logoPreviewUrl: string;
  documentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  archives: MacekuPKKArchive[];
};

export type MacekuPKKListResponse = {
  items: MacekuPKKProfileSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type MacekuPKKProfilePayload = {
  name: string;
  kabupatenKota: string;
  distrik: string;
  kampung: string;
  secretariatAddress: string;
  chairperson: string;
  secretary: string;
  phone: string;
  email: string;
  managementPeriod: string;
  description: string;
  isActive: boolean;
};

export type SaveMacekuPKKProfilePayload = MacekuPKKProfilePayload & {
  logo?: File | null;
};

export type MacekuPKKListFilters = {
  search?: string;
  level?: string;
  kabupatenKota?: string;
  distrik?: string;
  kampung?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type MacekuPKKDistrikOption = {
  kabupatenKota: string;
  distrik: string;
};

export type MacekuPKKKampungOption = {
  kabupatenKota: string;
  distrik: string;
  kampung: string;
};

export type MacekuPKKOptionsResponse = {
  kabupatenKota: string[];
  distrik: MacekuPKKDistrikOption[];
  kampung: MacekuPKKKampungOption[];
};

export type UploadMacekuArchivePayload = {
  file: File;
  title: string;
  category: MacekuPKKArchiveCategory;
  documentYear: string;
  documentNumber: string;
  documentDate: string;
  description: string;
};

export type UpdateMacekuArchivePayload = Omit<UploadMacekuArchivePayload, "file">;

export const macekuArchiveCategories: MacekuPKKArchiveCategory[] = [
  "Program Kerja",
  "LKPJ",
  "Laporan Kegiatan",
  "Surat Keputusan",
  "Data Kepengurusan",
  "Administrasi",
  "Dokumentasi",
  "Lainnya",
];
