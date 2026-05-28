export type PortalStatisticIcon = "users" | "fileText" | "building" | "landmark";

export type PortalStatisticCard = {
  id: number;
  title: string;
  value: string;
  icon: PortalStatisticIcon;
};

export type PortalMenu = {
  id: number;
  title: string;
  description: string;
  href: string;
};

export type OapStatistic = {
  id: number;
  wilayah: string;
  oap: string;
  nonOap: string;
  total: string;
};

export type PortalFeature = {
  title: string;
  description: string;
};

export const portalStatisticCards: PortalStatisticCard[] = [
  {
    id: 1,
    title: "Total Penduduk",
    value: "1.245.000",
    icon: "users",
  },
  {
    id: 2,
    title: "Total OAP",
    value: "326.000",
    icon: "users",
  },
  {
    id: 3,
    title: "Total Non-OAP",
    value: "919.000",
    icon: "users",
  },
  {
    id: 4,
    title: "KTP-el",
    value: "850.000",
    icon: "fileText",
  },
  {
    id: 5,
    title: "Akta Kelahiran",
    value: "610.000",
    icon: "building",
  },
  {
    id: 6,
    title: "Jumlah Kampung",
    value: "1.245",
    icon: "landmark",
  },
];

export const portalMenus: PortalMenu[] = [
  {
    id: 1,
    title: "Statistik Dukcapil",
    description:
      "Data kependudukan, KTP-el, KK, Akta Kelahiran, IKD, dan statistik OAP.",
    href: "/dukcapil",
  },
  {
    id: 2,
    title: "Statistik PMK",
    description:
      "Data kampung, BUM Kampung, kelompok masyarakat, dan program PMK.",
    href: "/pmk",
  },
  {
    id: 3,
    title: "Berita & Kegiatan",
    description:
      "Informasi kegiatan pelayanan Dukcapil dan PMK Papua Barat Daya.",
    href: "/berita",
  },
  {
    id: 4,
    title: "Profil Instansi",
    description: "Profil Dinas Dukcapil dan PMK Provinsi Papua Barat Daya.",
    href: "/profil",
  },
];

export const wilayahPapuaBaratDaya = [
  "Kota Sorong",
  "Kabupaten Sorong",
  "Kabupaten Sorong Selatan",
  "Kabupaten Maybrat",
  "Kabupaten Tambrauw",
  "Kabupaten Raja Ampat",
];

export const oapStatisticData: OapStatistic[] = [
  {
    id: 1,
    wilayah: "Kota Sorong",
    oap: "78.000",
    nonOap: "216.000",
    total: "294.000",
  },
  {
    id: 2,
    wilayah: "Kabupaten Sorong",
    oap: "92.000",
    nonOap: "153.000",
    total: "245.000",
  },
  {
    id: 3,
    wilayah: "Kabupaten Sorong Selatan",
    oap: "51.000",
    nonOap: "61.000",
    total: "112.000",
  },
  {
    id: 4,
    wilayah: "Kabupaten Maybrat",
    oap: "45.000",
    nonOap: "41.000",
    total: "86.000",
  },
  {
    id: 5,
    wilayah: "Kabupaten Tambrauw",
    oap: "29.000",
    nonOap: "29.000",
    total: "58.000",
  },
  {
    id: 6,
    wilayah: "Kabupaten Raja Ampat",
    oap: "31.000",
    nonOap: "50.000",
    total: "81.000",
  },
];

export const portalFeatureCards: PortalFeature[] = [
  {
    title: "Statistik Kependudukan",
    description:
      "Penyajian data KTP-el, KK, Akta Kelahiran, IKD, dan statistik OAP.",
  },
  {
    title: "Statistik PMK",
    description: "Data kampung, pemberdayaan masyarakat, dan BUM Kampung.",
  },
  {
    title: "Informasi Kegiatan",
    description:
      "Publikasi kegiatan pelayanan Dukcapil dan PMK Papua Barat Daya.",
  },
];
