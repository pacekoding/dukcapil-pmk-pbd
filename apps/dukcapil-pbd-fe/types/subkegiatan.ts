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
