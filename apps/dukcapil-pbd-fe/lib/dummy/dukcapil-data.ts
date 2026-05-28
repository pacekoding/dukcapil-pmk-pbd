import type {
  Indicator,
  KpiStatistic,
  StatistikRecord,
} from "@/types/dukcapil";

export const kpiStatistics: KpiStatistic[] = [
  {
    id: 1,
    title: "Kepemilikan KTP-el",
    value: "98.2%",
  },
  {
    id: 2,
    title: "Kepemilikan KK",
    value: "97.5%",
  },
  {
    id: 3,
    title: "Akta Kelahiran",
    value: "91.4%",
  },
  {
    id: 4,
    title: "Pelayanan Digital",
    value: "72%",
  },
];

export const indicatorData: Indicator[] = [
  {
    id: 1,
    title: "Meningkatnya Kepemilikan Dokumen Kependudukan",
    indicators: [
      "Persentase penduduk memiliki KTP-el",
      "Persentase kepemilikan Kartu Keluarga",
      "Persentase kepemilikan Akta Kelahiran",
    ],
  },
  {
    id: 2,
    title: "Meningkatnya Kualitas Pelayanan Adminduk",
    indicators: [
      "Indeks kepuasan masyarakat",
      "Pelayanan selesai tepat waktu",
      "Pelayanan berbasis digital",
    ],
  },
  {
    id: 3,
    title: "Meningkatnya Pemanfaatan Data Kependudukan",
    indicators: [
      "Kerja sama pemanfaatan data",
      "Integrasi data layanan publik",
    ],
  },
];

export const statistikTable: StatistikRecord[] = [
  {
    id: 1,
    indikator: "Persentase kepemilikan KTP-el",
    target: "98%",
    capaian: "98.2%",
    status: "Tercapai",
  },
  {
    id: 2,
    indikator: "Persentase kepemilikan KK",
    target: "97%",
    capaian: "97.5%",
    status: "Tercapai",
  },
  {
    id: 3,
    indikator: "Pelayanan digital",
    target: "70%",
    capaian: "72%",
    status: "Tercapai",
  },
  {
    id: 4,
    indikator: "Pelayanan tepat waktu",
    target: "95%",
    capaian: "94%",
    status: "Proses",
  },
];
