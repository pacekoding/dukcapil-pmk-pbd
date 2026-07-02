export type SSD = {
  id: number;
  tahunAnggaran: string;
  kode: string;
  uraian: string;
  satuan: string;
  definisiOperasional: string;
  isActive: boolean;
};

export type SSDPayload = {
  kode: string;
  uraian: string;
  satuan: string;
  definisiOperasional: string;
};

export type SSDDetail = SSD;

export type SSDListResponse = {
  tahunAnggaran: string;
  items: SSD[];
};

export type SSDImportResult = {
  tahunAnggaran: string;
  total: number;
  created: number;
  updated: number;
};
