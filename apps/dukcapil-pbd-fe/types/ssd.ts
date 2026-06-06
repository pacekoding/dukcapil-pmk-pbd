export type SSD = {
  id: number;
  tahunAnggaran: string;
  kode: string;
  uraian: string;
  satuan: string;
  definisiOperasional: string;
  isActive: boolean;
  jumlahVariabel: number;
  jumlahIndikator: number;
  variables: SSDVariable[];
};

export type SSDIndicator = {
  id: number;
  ssdId: number;
  tahunAnggaran: string;
  sortOrder: number;
  namaIndikator: string;
  konsepIndikator: string;
  levelEstimasiHasil: string;
  ukuranIndikator: string;
  satuanIndikator: string;
  klasifikasiPenyajian: string;
  definisiIndikator: string;
  metodeRumus: string;
  interpretasiHasil: string;
  variableIds: number[];
};

export type SSDIndicatorPayload = {
  namaIndikator: string;
  konsepIndikator: string;
  levelEstimasiHasil: string;
  ukuranIndikator: string;
  satuanIndikator: string;
  klasifikasiPenyajian: string;
  definisiIndikator: string;
  metodeRumus: string;
  interpretasiHasil: string;
  variableIds: number[];
};

export type SSDVariable = {
  id: number;
  ssdId: number;
  tahunAnggaran: string;
  sortOrder: number;
  namaVariabel: string;
  konsepDasar: string;
  definisiVariabel: string;
  referensiWaktu: string;
  kalimatPertanyaan: string;
};

export type SSDVariablePayload = {
  namaVariabel: string;
  konsepDasar: string;
  definisiVariabel: string;
  referensiWaktu: string;
  kalimatPertanyaan: string;
};

export type SSDPayload = {
  kode: string;
  uraian: string;
  satuan: string;
  definisiOperasional: string;
  variables: SSDVariablePayload[];
  indicators: SSDIndicatorPayload[];
};

export type SSDDetail = SSD & {
  variables: SSDVariable[];
  indicators: SSDIndicator[];
};

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
