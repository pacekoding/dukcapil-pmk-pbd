import type { RegionData } from "@/types/data-wilayah";

export type RegionTab = "registration" | "civil" | "oap" | "idm" | "bumdes";

export const defaultRegionData: RegionData[] = [
  {
    id: "kabupaten-sorong",
    name: "Kabupaten Sorong",
    shortName: "Sorong",
    type: "Kabupaten",
    mapLabel: "Kab. Sorong",
    idm: { sangatTertinggal: 60, tertinggal: 80, berkembang: 66, maju: 3, mandiri: 0 },
    bumdes: { jumlah: 0, aktif: 0, tidakAktif: 0, bersama: 0 },
    registration: { penerbitanKk: 4311, perubahanKk: 8945, kia: 3861, nikWni: 2756, perekamanKtpEl: 2511, pencetakanKtpEl: 21637 },
    oap: { luasWilayah: 6544.23, jumlahOap: 54379, jumlahNonOap: 76322, jumlahJiwa: 130701 },
    civil: { aktaKelahiran: 4213, aktaKematian: 947, aktaPerkawinan: 390, aktaPerceraian: 21 },
  },
  {
    id: "kota-sorong",
    name: "Kota Sorong",
    shortName: "Kota Sorong",
    type: "Kota",
    mapLabel: "Kota Sorong",
    idm: { sangatTertinggal: 0, tertinggal: 0, berkembang: 0, maju: 0, mandiri: 0 },
    bumdes: { jumlah: 0, aktif: 0, tidakAktif: 0, bersama: 0 },
    registration: { penerbitanKk: 9376, perubahanKk: 14612, kia: 1490, nikWni: 4627, perekamanKtpEl: 4418, pencetakanKtpEl: 27136 },
    oap: { luasWilayah: 656.64, jumlahOap: 77487, jumlahNonOap: 209765, jumlahJiwa: 287252 },
    civil: { aktaKelahiran: 7208, aktaKematian: 1941, aktaPerkawinan: 1118, aktaPerceraian: 47 },
  },
  {
    id: "raja-ampat",
    name: "Kabupaten Raja Ampat",
    shortName: "Raja Ampat",
    type: "Kabupaten",
    mapLabel: "Raja Ampat",
    idm: { sangatTertinggal: 16, tertinggal: 33, berkembang: 75, maju: 6, mandiri: 0 },
    bumdes: { jumlah: 0, aktif: 0, tidakAktif: 0, bersama: 0 },
    registration: { penerbitanKk: 2688, perubahanKk: 4543, kia: 1997, nikWni: 1713, perekamanKtpEl: 1466, pencetakanKtpEl: 10624 },
    oap: { luasWilayah: 8034.44, jumlahOap: 53035, jumlahNonOap: 20713, jumlahJiwa: 73748 },
    civil: { aktaKelahiran: 3998, aktaKematian: 545, aktaPerkawinan: 741, aktaPerceraian: 2 },
  },
  {
    id: "sorong-selatan",
    name: "Kabupaten Sorong Selatan",
    shortName: "Sorong Selatan",
    type: "Kabupaten",
    mapLabel: "Sorong Selatan",
    idm: { sangatTertinggal: 28, tertinggal: 40, berkembang: 73, maju: 4, mandiri: 0 },
    bumdes: { jumlah: 0, aktif: 0, tidakAktif: 0, bersama: 0 },
    registration: { penerbitanKk: 1342, perubahanKk: 2568, kia: 680, nikWni: 1570, perekamanKtpEl: 880, pencetakanKtpEl: 6031 },
    oap: { luasWilayah: 6594.31, jumlahOap: 46829, jumlahNonOap: 10684, jumlahJiwa: 57513 },
    civil: { aktaKelahiran: 2571, aktaKematian: 323, aktaPerkawinan: 359, aktaPerceraian: 5 },
  },
  {
    id: "maybrat",
    name: "Kabupaten Maybrat",
    shortName: "Maybrat",
    type: "Kabupaten",
    mapLabel: "Maybrat",
    idm: { sangatTertinggal: 107, tertinggal: 128, berkembang: 59, maju: 1, mandiri: 0 },
    bumdes: { jumlah: 0, aktif: 0, tidakAktif: 0, bersama: 0 },
    registration: { penerbitanKk: 1230, perubahanKk: 3222, kia: 190, nikWni: 696, perekamanKtpEl: 505, pencetakanKtpEl: 5220 },
    oap: { luasWilayah: 5461.69, jumlahOap: 43178, jumlahNonOap: 3626, jumlahJiwa: 46804 },
    civil: { aktaKelahiran: 1775, aktaKematian: 300, aktaPerkawinan: 203, aktaPerceraian: 4 },
  },
  {
    id: "tambrauw",
    name: "Kabupaten Tambrauw",
    shortName: "Tambrauw",
    type: "Kabupaten",
    mapLabel: "Tambrauw",
    idm: { sangatTertinggal: 202, tertinggal: 64, berkembang: 19, maju: 0, mandiri: 0 },
    bumdes: { jumlah: 0, aktif: 0, tidakAktif: 0, bersama: 0 },
    registration: { penerbitanKk: 631, perubahanKk: 1253, kia: 1025, nikWni: 596, perekamanKtpEl: 330, pencetakanKtpEl: 2861 },
    oap: { luasWilayah: 11529.18, jumlahOap: 21302, jumlahNonOap: 10086, jumlahJiwa: 31388 },
    civil: { aktaKelahiran: 830, aktaKematian: 120, aktaPerkawinan: 101, aktaPerceraian: 1 },
  },
];

export const tabLabels: Record<RegionTab, string> = {
  registration: "Pendaftaran Penduduk",
  civil: "Pencatatan Sipil",
  oap: "Data OAP",
  idm: "IDM Desa",
  bumdes: "Data BUMDes",
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

export const formatArea = (value: number) =>
  `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)} km²`;

export const getTotalIdmVillages = (idm: RegionData["idm"]) =>
  idm.sangatTertinggal + idm.tertinggal + idm.berkembang + idm.maju + idm.mandiri;

export const getTotalBumdes = (bumdes: RegionData["bumdes"]) =>
  bumdes.jumlah;

export const getDominantIdmStatus = (idm: RegionData["idm"]) => {
  const entries: Array<[string, number]> = [
    ["Sangat Tertinggal", idm.sangatTertinggal],
    ["Tertinggal", idm.tertinggal],
    ["Berkembang", idm.berkembang],
    ["Maju", idm.maju],
    ["Mandiri", idm.mandiri],
  ];
  const [status, total] = entries.reduce((highest, current) =>
    current[1] > highest[1] ? current : highest,
  );
  return total > 0 ? status : "Tidak tersedia";
};

export const getProvinceTotals = (regions: RegionData[]) => ({
  totalJiwa: regions.reduce((total, region) => total + region.oap.jumlahJiwa, 0),
  totalOap: regions.reduce((total, region) => total + region.oap.jumlahOap, 0),
  totalNonOap: regions.reduce((total, region) => total + region.oap.jumlahNonOap, 0),
  totalKtpEl: regions.reduce((total, region) => total + region.registration.pencetakanKtpEl, 0),
  totalDesaIdm: regions.reduce((total, region) => total + getTotalIdmVillages(region.idm), 0),
  totalBumdes: regions.reduce((total, region) => total + getTotalBumdes(region.bumdes), 0),
});
