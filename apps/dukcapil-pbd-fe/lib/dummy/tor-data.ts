// lib/dummy/tor-data.ts

import { TorDocument } from "@/types/tor";

export const torData: TorDocument =
  {
    tahun: 2026,

    kementerian:
      "Pemerintah Provinsi Papua Barat Daya",

    dinas:
      "Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung",

    unitKerja:
      "Bidang Pelayanan Pendaftaran Penduduk",

    judul:
      "Sosialisasi Administrasi Kependudukan dan Pelayanan Dokumen Kependudukan",

    iku:
      "Meningkatnya cakupan kepemilikan dokumen kependudukan masyarakat",

    targetIku:
      "95% Kepemilikan Dokumen Kependudukan",

    ikk:
      "Meningkatnya kualitas pelayanan administrasi kependudukan",

    targetIkk:
      "50 Kampung mendapatkan sosialisasi dan pendampingan",

    latarBelakang:
      "Dalam rangka meningkatkan kualitas pelayanan administrasi kependudukan dan penguatan kapasitas aparatur kampung, diperlukan kegiatan sosialisasi dan pendampingan teknis kepada masyarakat dan operator distrik.",

    lokasi:
      "Aula Dinas Dukcapil & PMK Papua Barat Daya",

    tanggal:
      "Senin, 22 Mei 2026",

    waktu:
      "09.00 WIT - Selesai",

    peserta: 50,

    penanggungJawab:
      "Kepala Dinas Dukcapil & PMK Papua Barat Daya",

    pejabat:
      "Drs. Yohanis Kocu, M.Si",

    nip:
      "19870909 202001 1 001",

    tujuan: [
      "Meningkatkan pemahaman masyarakat terkait administrasi kependudukan.",

      "Meningkatkan kualitas pelayanan dokumen kependudukan.",

      "Meningkatkan kapasitas operator kampung dan distrik.",

      "Mendukung tertib administrasi kependudukan di Papua Barat Daya.",
    ],

    sasaran: [
      "Aparatur distrik dan kampung",

      "Operator SIAK",

      "Tokoh masyarakat dan tokoh adat",

      "Masyarakat umum",
    ],

    outputs: [
      "Pelaksanaan kegiatan sosialisasi administrasi kependudukan",

      "Peningkatan pemahaman peserta",

      "Laporan pelaksanaan kegiatan",

      "Pendataan masyarakat terkait dokumen kependudukan",
    ],

    rundown: [
      {
        waktu:
          "08.30 - 09.00",

        kegiatan:
          "Registrasi Peserta",

        keterangan:
          "Panitia",
      },

      {
        waktu:
          "09.00 - 09.30",

        kegiatan:
          "Pembukaan dan Sambutan",

        keterangan:
          "Kepala Dinas",
      },
    ],

    biaya: [
      {
        no: 1,

        uraian:
          "Konsumsi Peserta",

        volume:
          "50 Orang",

        harga:
          "Rp150.000",

        jumlah:
          "Rp7.500.000",
      },
    ],

    totalBiaya:
      "Rp17.000.000",
  };

export const torPdfSections = [
  "Cover dan informasi kegiatan",
  "A. Latar Belakang",
  "B. Tujuan Kegiatan",
  "C. Sasaran Kegiatan",
  "D. Output Kegiatan",
  "E. Waktu dan Tempat",
  "F. Rundown Kegiatan",
  "G. Rincian Biaya",
  "H. Penutup dan tanda tangan",
];
