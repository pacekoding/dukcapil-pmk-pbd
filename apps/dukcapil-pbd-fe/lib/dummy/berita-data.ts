export type BeritaCategory = "Dukcapil" | "PMK";

export type BeritaItem = {
  id: number;
  title: string;
  category: BeritaCategory;
  date: string;
  location: string;
  image: string;
  description: string;
};

export const beritaYears = [2025, 2026];

export const beritaData: BeritaItem[] = [
  {
    id: 1,
    title: "Pelayanan Perekaman KTP-el di Kabupaten Sorong Selatan",
    category: "Dukcapil",
    date: "12 Januari 2025",
    location: "Kabupaten Sorong Selatan",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
    description:
      "Pelaksanaan pelayanan perekaman KTP-el bagi masyarakat dalam rangka peningkatan kepemilikan dokumen kependudukan.",
  },
  {
    id: 2,
    title: "Sosialisasi Identitas Kependudukan Digital (IKD)",
    category: "Dukcapil",
    date: "20 Februari 2025",
    location: "Kota Sorong",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    description:
      "Kegiatan sosialisasi dan aktivasi IKD untuk mendukung transformasi digital pelayanan administrasi kependudukan.",
  },
  {
    id: 3,
    title: "Pelatihan Pengelolaan BUM Kampung Papua Barat Daya",
    category: "PMK",
    date: "03 Maret 2025",
    location: "Kabupaten Raja Ampat",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    description:
      "Pelatihan peningkatan kapasitas pengurus BUM Kampung untuk mendukung pemberdayaan ekonomi masyarakat.",
  },
  {
    id: 4,
    title: "Musrenbang Kampung Tahun 2025",
    category: "PMK",
    date: "18 April 2025",
    location: "Kabupaten Maybrat",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
    description:
      "Pelaksanaan musrenbang kampung untuk meningkatkan partisipasi masyarakat dalam pembangunan daerah.",
  },
  {
    id: 5,
    title: "Pelayanan Akta Kelahiran Terpadu",
    category: "Dukcapil",
    date: "10 Mei 2025",
    location: "Kabupaten Tambrauw",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
    description:
      "Pelayanan administrasi kependudukan terpadu dalam rangka percepatan kepemilikan akta kelahiran.",
  },
  {
    id: 6,
    title: "Pembinaan Kelompok Masyarakat Kampung",
    category: "PMK",
    date: "28 Juni 2025",
    location: "Kabupaten Sorong",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
    description:
      "Pembinaan kelompok masyarakat aktif untuk mendukung pemberdayaan dan pembangunan kampung.",
  },
];
