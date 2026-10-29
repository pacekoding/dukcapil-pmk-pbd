export type Subkegiatan = {
  id: number;
  bidang: string;
  program: string;
  kegiatan: string;
  subkegiatan: string;
  kinerja: string;
  indikator: string;
  satuan: string;
  definisiOperasional: string;
};

export type SubkegiatanPayload = Omit<Subkegiatan, "id">;

export type SubkegiatanListResponse = {
  items: Subkegiatan[];
  page: number;
  pageSize: number;
  total: number;
};

export type SubkegiatanImportStatus = "valid" | "existing" | "error";

export type SubkegiatanImportRow = SubkegiatanPayload & {
  row: number;
  status: SubkegiatanImportStatus;
  message?: string;
};

export type SubkegiatanImportPreview = {
  totalRows: number;
  validRows: number;
  existingRows: number;
  errorRows: number;
  rows: SubkegiatanImportRow[];
};

export type SubkegiatanImportResult = {
  importedRows: number;
  skippedRows: number;
};
