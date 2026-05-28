// types/tor.ts

export type TorRundownItem = {
  waktu: string;

  kegiatan: string;

  keterangan: string;
};

export type TorBiayaItem = {
  no: number;

  uraian: string;

  volume: string;

  harga: string;

  jumlah: string;
};

export type TorDocument = {
  tahun: number;

  kementerian: string;

  dinas: string;

  unitKerja: string;

  judul: string;

  jenisKegiatan?: string;

  bidang?: string;

  status?: string;

  tanggalDokumen?: string;

  dibuatOleh?: string;

  detailKegiatan?: string[];

  iku: string;

  targetIku: string;

  ikk: string;

  targetIkk: string;

  latarBelakang: string;

  lokasi: string;

  tanggal: string;

  waktu: string;

  peserta: number;

  penanggungJawab: string;

  pejabat: string;

  nip: string;

  tujuan: string[];

  sasaran: string[];

  outputs: string[];

  rundown: TorRundownItem[];

  biaya: TorBiayaItem[];

  totalBiaya: string;
};
