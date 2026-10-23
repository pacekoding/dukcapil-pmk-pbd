import { API_PREFIX } from "@/lib/api/http";

export const apiEndpoints = {
  bumKampung: `${API_PREFIX}/bum-kampung`,
  bumKampungDetail: (id: number) => `${API_PREFIX}/bum-kampung/${id}`,
  sikampung: `${API_PREFIX}/sikampung`,
  sikampungDetail: (id: number) => `${API_PREFIX}/sikampung/${id}`,
  sitekad: `${API_PREFIX}/sitekad`,
  sitekadOptions: `${API_PREFIX}/sitekad/options`,
  sitekadDetail: (id: number) => `${API_PREFIX}/sitekad/${id}`,
  sitekadCapaianKendala: `${API_PREFIX}/sitekad/capaian-kendala`,
  sitekadCapaianKendalaDetail: (id: number) =>
    `${API_PREFIX}/sitekad/capaian-kendala/${id}`,
  users: `${API_PREFIX}/users`,
  userDetail: (id: number) => `${API_PREFIX}/users/${id}`,
  userResetPassword: (id: number) => `${API_PREFIX}/users/${id}/reset-password`,
  portalApps: `${API_PREFIX}/portal-apps`,
  kabKota: `${API_PREFIX}/kab-kota`,
  kabKotaDetail: (id: number) => `${API_PREFIX}/kab-kota/${id}`,
  dataWilayahSettings: `${API_PREFIX}/data-wilayah/settings`,
  dashboardDataWilayah: `${API_PREFIX}/dashboard/data-wilayah`,
  siberDataWilayah: `${API_PREFIX}/siber/data-wilayah`,
  siberDataWilayahSettings: `${API_PREFIX}/siber/data-wilayah/settings`,
  siberDataWilayahDetail: (id: string) =>
    `${API_PREFIX}/siber/data-wilayah/${encodeURIComponent(id)}`,
  arsipPegawai: `${API_PREFIX}/arsipku`,
  arsipPegawaiDetail: (id: number) => `${API_PREFIX}/arsipku/${id}`,
  arsipPegawaiPhoto: (id: number) =>
    `${API_PREFIX}/arsipku/${id}/photo`,
  arsipPegawaiDocumentList: (pegawaiId: number) =>
    `${API_PREFIX}/arsipku/${pegawaiId}/documents`,
  arsipPegawaiDocumentDetail: (pegawaiId: number, documentId: number) =>
    `${API_PREFIX}/arsipku/${pegawaiId}/documents/${documentId}`,
  arsipPegawaiDocumentDownload: (pegawaiId: number, documentId: number) =>
    `${API_PREFIX}/arsipku/${pegawaiId}/documents/${documentId}/download`,
  websiteHome: `${API_PREFIX}/website/home`,
  websitePortalApps: `${API_PREFIX}/website/portal-apps`,
  websiteDataWilayah: `${API_PREFIX}/website/data-wilayah`,
  websiteDataWilayahSettings: `${API_PREFIX}/website/data-wilayah/settings`,
  websiteProfile: `${API_PREFIX}/website/profile`,
};
