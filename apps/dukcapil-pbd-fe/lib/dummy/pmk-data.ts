import type {
  PMKIndicator,
  PMKProgram,
  PMKStatistic,
} from "@/types/pmk";

export const pmkStatistics: PMKStatistic[] = [
  {
    id: 1,
    title: "Kampung Tertib Administrasi",
    value: "79%",
  },
  {
    id: 2,
    title: "BUM Kampung Aktif",
    value: "45",
  },
  {
    id: 3,
    title: "Partisipasi Musrenbang",
    value: "82%",
  },
  {
    id: 4,
    title: "Program Pemberdayaan",
    value: "76%",
  },
];

export const pmkIndicators: PMKIndicator[] = [
  {
    id: 1,
    title: "Meningkatnya Kapasitas Pemerintahan Kampung",
    items: [
      "Persentase kampung dengan RPJM Kampung",
      "Persentase kampung tertib administrasi",
    ],
  },
  {
    id: 2,
    title: "Meningkatnya Kemandirian Masyarakat Kampung",
    items: [
      "Indeks Desa/Kampung Membangun (IDM)",
      "Jumlah BUM Kampung aktif",
      "Persentase peningkatan ekonomi masyarakat kampung",
    ],
  },
];

export const pmkPrograms: PMKProgram[] = [
  {
    id: 1,
    title: "Penguatan Pemerintahan Kampung",
    description:
      "Peningkatan kapasitas tata kelola dan administrasi pemerintahan kampung.",
  },
  {
    id: 2,
    title: "Pengembangan BUM Kampung",
    description:
      "Mendorong pertumbuhan ekonomi kampung berbasis potensi lokal.",
  },
  {
    id: 3,
    title: "Pemberdayaan Kelompok Masyarakat",
    description:
      "Peningkatan partisipasi dan kapasitas masyarakat kampung.",
  },
];
