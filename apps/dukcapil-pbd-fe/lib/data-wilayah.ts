import type { RegionData } from "@/types/data-wilayah";

export type RegionTab = "registration" | "civil" | "oap" | "idm" | "bumdes";

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

export const getProvinceTotals = (regions: RegionData[]) => ({
  totalJiwa: regions.reduce((total, region) => total + region.oap.jumlahJiwa, 0),
  totalOap: regions.reduce((total, region) => total + region.oap.jumlahOap, 0),
  totalNonOap: regions.reduce((total, region) => total + region.oap.jumlahNonOap, 0),
  totalKtpEl: regions.reduce((total, region) => total + region.registration.pencetakanKtpEl, 0),
  totalDesaIdm: regions.reduce((total, region) => total + getTotalIdmVillages(region.idm), 0),
  totalBumdes: regions.reduce((total, region) => total + getTotalBumdes(region.bumdes), 0),
});
