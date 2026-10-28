import { API_PREFIX } from "@/lib/api/http";

export const apiEndpoints = {
  otsus: `${API_PREFIX}/otsus`,
  bumKampung: `${API_PREFIX}/bum-kampung`,
  bumKampungDetail: (id: number) => `${API_PREFIX}/bum-kampung/${id}`,
  dataKampung: `${API_PREFIX}/data-kampung`,
  dataKampungDetail: (id: number) => `${API_PREFIX}/data-kampung/${id}`,
  kelompokBinaan: `${API_PREFIX}/kelompok-binaan`,
  kelompokBinaanOptions: `${API_PREFIX}/kelompok-binaan/options`,
  kelompokBinaanDetail: (id: number) => `${API_PREFIX}/kelompok-binaan/${id}`,
  kelompokBinaanCapaianKendala: `${API_PREFIX}/kelompok-binaan/capaian-kendala`,
  kelompokBinaanCapaianKendalaDetail: (id: number) =>
    `${API_PREFIX}/kelompok-binaan/capaian-kendala/${id}`,
  users: `${API_PREFIX}/users`,
  userDetail: (id: number) => `${API_PREFIX}/users/${id}`,
  userResetPassword: (id: number) => `${API_PREFIX}/users/${id}/reset-password`,
  kabKota: `${API_PREFIX}/kab-kota`,
  kabKotaDetail: (id: number) => `${API_PREFIX}/kab-kota/${id}`,
  organization: (kind: "fields" | "sections" | "positions") =>
    `${API_PREFIX}/organization/${kind}`,
  subkegiatan: `${API_PREFIX}/subkegiatan`,
  dataWilayahSettings: `${API_PREFIX}/data-wilayah/settings`,
  dashboardDataWilayah: `${API_PREFIX}/dashboard/data-wilayah`,
  dukcapilDataWilayah: `${API_PREFIX}/dukcapil/data-wilayah`,
  dukcapilDataWilayahDetail: (id: string) =>
    `${API_PREFIX}/dukcapil/data-wilayah/${encodeURIComponent(id)}`,
  populationRegistration: `${API_PREFIX}/dukcapil/pendaftaran-penduduk`,
  populationRegistrationDetail: (id: string) =>
    `${API_PREFIX}/dukcapil/pendaftaran-penduduk/${encodeURIComponent(id)}`,
  civilRegistration: `${API_PREFIX}/dukcapil/pencatatan-sipil`,
  civilRegistrationDetail: (id: string) =>
    `${API_PREFIX}/dukcapil/pencatatan-sipil/${encodeURIComponent(id)}`,
  arsipPegawai: `${API_PREFIX}/pegawai`,
  arsipPegawaiDetail: (id: number) => `${API_PREFIX}/pegawai/${id}`,
  arsipPegawaiPhoto: (id: number) => `${API_PREFIX}/pegawai/${id}/photo`,
  arsipPegawaiDocumentList: (pegawaiId: number) =>
    `${API_PREFIX}/pegawai/${pegawaiId}/documents`,
  arsipPegawaiDocumentDetail: (pegawaiId: number, documentId: number) =>
    `${API_PREFIX}/pegawai/${pegawaiId}/documents/${documentId}`,
  arsipPegawaiDocumentDownload: (pegawaiId: number, documentId: number) =>
    `${API_PREFIX}/pegawai/${pegawaiId}/documents/${documentId}/download`,
  websiteHome: `${API_PREFIX}/website/home`,
  websiteDataWilayah: `${API_PREFIX}/website/data-wilayah`,
  websiteDataWilayahSettings: `${API_PREFIX}/website/data-wilayah/settings`,
  websiteProfile: `${API_PREFIX}/website/profile`,
};
