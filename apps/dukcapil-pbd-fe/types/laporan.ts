export type LaporanPesertaItem = {
  no: number;
  nama: string;
  unsur: string;
  jumlah: number;
};

export type LaporanBiayaItem = {
  no: number;
  uraian: string;
  volume: string;
  satuan: string;
  biaya: string;
  jumlah: string;
};

export type LaporanDokumentasiItem = {
  no: number;
  kegiatan: string;
  keterangan: string;
};

export type LaporanPelaksanaanDocument = {
  tahun: number;
  kementerian: string;
  dinas: string;
  unitKerja: string;
  nomorDokumen: string;
  namaKegiatan: string;
  jenisKegiatan?: string;
  bidang?: string;
  status?: string;
  dibuatOleh?: string;
  detailKegiatan?: string[];
  tanggalLaporan: string;
  latarBelakang: string;
  dasarPelaksanaan: string[];
  maksudTujuan: string[];
  tanggal: string;
  waktu: string;
  lokasi: string;
  peserta: number;
  pelaksana: string;
  narasumber: string[];
  metode: string;
  uraianPelaksanaan: string[];
  hasilPelaksanaan: string[];
  capaianOutput: string[];
  kendala: string[];
  tindakLanjut: string[];
  pesertaDetail: LaporanPesertaItem[];
  dokumentasi: LaporanDokumentasiItem[];
  realisasiBiaya: LaporanBiayaItem[];
  totalRealisasi: string;
  lampiran: string[];
  jabatanPenandatangan: string;
  pejabat: string;
  nip: string;
};
