export type PelaksanaanDocumentFileType =
  | "pdf"
  | "word"
  | "excel"
  | "image"
  | "unknown";

export type PelaksanaanDocument = {
  id: number;
  nama: string;
  subkegiatanId: number | null;
  subkegiatanCode: string | null;
  subkegiatanName: string | null;
  storedFileName: string;
  fileType: PelaksanaanDocumentFileType;
  mimeType: string;
  fileSize: number;
  downloadUrl: string;
  previewUrl?: string;
  isDokumenDssd: boolean;
  tanggalUpload: string;
};

export type PelaksanaanDocumentMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PelaksanaanDocumentListResponse = {
  data: PelaksanaanDocument[];
  meta: PelaksanaanDocumentMeta;
};

export type PelaksanaanDocumentListParams = {
  search?: string;
  subkegiatanPrefix?: string;
  page?: number;
  limit?: number;
};

export type UploadPelaksanaanDocumentPayload = {
  file: File;
  nama?: string;
  subkegiatanId?: string | number | null;
  isDokumenDssd: boolean;
};

export type UpdatePelaksanaanDocumentPayload = {
  nama: string;
  subkegiatanId?: string | number | null;
  isDokumenDssd: boolean;
};
