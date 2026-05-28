export type KegiatanStatus = "Berjalan" | "Selesai" | "Draft";

export type KegiatanBidang = "Dukcapil" | "PMK" | "Sekretariat";

export type KegiatanJenis =
  | "Sosialisasi"
  | "Bimtek"
  | "Pendampingan"
  | "Monev"
  | "Rapat";

export type KegiatanDokumentasiItem = {
  id: number;
  url: string;
  caption: string;
  uploadedAt: string;
  fileName?: string;
};

export type KegiatanDokumentasiPayload = {
  url: string;
  caption: string;
  fileName?: string;
};

export type Kegiatan = {
  id: number;
  nama: string;
  jenis: KegiatanJenis;
  tanggal: string;
  lokasi: string;
  status: KegiatanStatus;
  bidang: KegiatanBidang;
  penanggungJawab: string;
  peserta: number;
  progres: number;
  deskripsi: string;
  dokumentasi?: KegiatanDokumentasiItem[];
};

export type KegiatanPayload = Omit<Kegiatan, "id">;

export type KegiatanStatusFilterOption = {
  value: KegiatanStatus | "all";
  label: string;
};

export type KegiatanSelectOption<Value extends string> = {
  value: Value;
  label: string;
};
