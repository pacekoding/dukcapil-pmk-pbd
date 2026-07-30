export type ArsipBidang = "sekretariat" | "dukcapil" | "pmk";

export type PegawaiDocumentCategory =
  | "Ijazah"
  | "SK"
  | "SPMT"
  | "Sertifikat"
  | "Lainnya";

export type PegawaiDocument = {
  id: number;
  pegawaiId: number;
  bidang: ArsipBidang;
  title: string;
  category: PegawaiDocumentCategory;
  number: string;
  year: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileId?: number;
  checksumSha256?: string;
  status: "Lengkap" | "Perlu Verifikasi";
  storedFileName: string;
  downloadUrl: string;
  previewUrl?: string;
  uploadedAt: string;
};

export type PegawaiArchive = {
  id: number;
  nip: string;
  nik: string;
  name: string;
  position: string;
  unit: string;
  rank: string;
  email: string;
  phone: string;
  bankAccount: string;
  address: string;
  status: "Aktif" | "Cuti" | "Mutasi";
  photoColor: string;
  photoFileId?: number;
  photoOriginalName: string;
  photoPreviewUrl: string;
  documents: PegawaiDocument[];
};

export type PegawaiArchivePayload = {
  nip: string;
  nik: string;
  name: string;
  position: string;
  unit: string;
  rank: string;
  email: string;
  phone: string;
  bankAccount: string;
  address: string;
  status: PegawaiArchive["status"];
  photoColor?: string;
};

export type UploadPegawaiDocumentPayload = {
  file: File;
  bidang: ArsipBidang;
  title: string;
  category: PegawaiDocumentCategory;
  number: string;
  year: string;
  status: PegawaiDocument["status"];
};
