import { API_PREFIX } from "@/lib/api/http";

export const apiEndpoints = {
  dashboard: `${API_PREFIX}/dashboard`,
  dataWilayah: `${API_PREFIX}/data-wilayah`,
  dataWilayahDetail: (id: string) => `${API_PREFIX}/data-wilayah/${id}`,
  dataWilayahSettings: `${API_PREFIX}/data-wilayah/settings`,
  ssd: `${API_PREFIX}/ssd`,
  ssdImport: `${API_PREFIX}/ssd/import`,
  ssdDetail: (id: number) => `${API_PREFIX}/ssd/${id}`,
  ssdStatus: (id: number) => `${API_PREFIX}/ssd/${id}/status`,
  subkegiatan: `${API_PREFIX}/subkegiatan`,
  subkegiatanImport: `${API_PREFIX}/subkegiatan/import`,
  subkegiatanDetail: (id: number) => `${API_PREFIX}/subkegiatan/${id}`,
  realisasiSubkegiatan: `${API_PREFIX}/realisasi-subkegiatan`,
  realisasiSubkegiatanDetail: (id: number) =>
    `${API_PREFIX}/realisasi-subkegiatan/${id}`,
  realisasiSubkegiatanFoto: (id: number) =>
    `${API_PREFIX}/realisasi-subkegiatan/${id}/foto`,
  realisasiSubkegiatanDokumen: (id: number) =>
    `${API_PREFIX}/realisasi-subkegiatan/${id}/dokumen`,
  users: `${API_PREFIX}/users`,
  userDetail: (id: number) => `${API_PREFIX}/users/${id}`,
  userResetPassword: (id: number) => `${API_PREFIX}/users/${id}/reset-password`,
  accountChangePassword: `${API_PREFIX}/account/change-password`,
  websiteHome: `${API_PREFIX}/website/home`,
  websiteDataWilayah: `${API_PREFIX}/website/data-wilayah`,
  websiteDataWilayahSettings: `${API_PREFIX}/website/data-wilayah/settings`,
  websiteProfile: `${API_PREFIX}/website/profile`,
};
