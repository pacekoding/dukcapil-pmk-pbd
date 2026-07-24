import { API_PREFIX } from "@/lib/api/http";

export const apiEndpoints = {
  ssd: `${API_PREFIX}/ssd`,
  ssdImport: `${API_PREFIX}/ssd/import`,
  ssdDetail: (id: number) => `${API_PREFIX}/ssd/${id}`,
  ssdStatus: (id: number) => `${API_PREFIX}/ssd/${id}/status`,
  subkegiatan: `${API_PREFIX}/subkegiatan`,
  subkegiatanImport: `${API_PREFIX}/subkegiatan/import`,
  subkegiatanDetail: (id: number) => `${API_PREFIX}/subkegiatan/${id}`,
  bumKampung: `${API_PREFIX}/bum-kampung`,
  bumKampungDetail: (id: number) => `${API_PREFIX}/bum-kampung/${id}`,
  macekuPkk: `${API_PREFIX}/maceku-pkk`,
  macekuPkkOptions: `${API_PREFIX}/maceku-pkk/options`,
  macekuPkkDetail: (id: number) => `${API_PREFIX}/maceku-pkk/${id}`,
  macekuPkkLogo: (id: number) => `${API_PREFIX}/maceku-pkk/${id}/logo`,
  macekuPkkArchiveList: (id: number) => `${API_PREFIX}/maceku-pkk/${id}/archives`,
  macekuPkkArchiveDetail: (id: number, archiveId: number) =>
    `${API_PREFIX}/maceku-pkk/${id}/archives/${archiveId}`,
  macekuPkkArchiveDownload: (id: number, archiveId: number) =>
    `${API_PREFIX}/maceku-pkk/${id}/archives/${archiveId}/download`,
  macekuPkkArchivePreview: (id: number, archiveId: number) =>
    `${API_PREFIX}/maceku-pkk/${id}/archives/${archiveId}/preview`,
  sitekad: `${API_PREFIX}/sitekad`,
  sitekadOptions: `${API_PREFIX}/sitekad/options`,
  sitekadDetail: (id: number) => `${API_PREFIX}/sitekad/${id}`,
  aspirasiku: `${API_PREFIX}/aspirasiku`,
  aspirasikuDetail: (id: number) => `${API_PREFIX}/aspirasiku/${id}`,
  aspirasikuStatus: (id: number) => `${API_PREFIX}/aspirasiku/${id}/status`,
  users: `${API_PREFIX}/users`,
  userDetail: (id: number) => `${API_PREFIX}/users/${id}`,
  userResetPassword: (id: number) => `${API_PREFIX}/users/${id}/reset-password`,
  portalApps: `${API_PREFIX}/portal-apps`,
  kabKota: `${API_PREFIX}/kab-kota`,
  kabKotaDetail: (id: number) => `${API_PREFIX}/kab-kota/${id}`,
  dataWilayahSettings: `${API_PREFIX}/data-wilayah/settings`,
  siberDataWilayah: `${API_PREFIX}/siber/data-wilayah`,
  siberDataWilayahSettings: `${API_PREFIX}/siber/data-wilayah/settings`,
  siberDataWilayahDetail: (id: string) =>
    `${API_PREFIX}/siber/data-wilayah/${encodeURIComponent(id)}`,
  pelaksanaanDocuments: `${API_PREFIX}/pelaksanaan-documents`,
  pelaksanaanDocumentDetail: (id: number) =>
    `${API_PREFIX}/pelaksanaan-documents/${id}`,
  pelaksanaanDocumentPreview: (id: number) =>
    `${API_PREFIX}/pelaksanaan-documents/${id}/preview`,
  pelaksanaanDocumentDownload: (id: number) =>
    `${API_PREFIX}/pelaksanaan-documents/${id}/download`,
  optimaInfo: `${API_PREFIX}/optima-info`,
  optimaInfoDetail: (id: number) => `${API_PREFIX}/optima-info/${id}`,
  optimaInfoPreview: (id: number) => `${API_PREFIX}/optima-info/${id}/preview`,
  optimaInfoPublish: (id: number) => `${API_PREFIX}/optima-info/${id}/publish`,
  optimaInfoUnpublish: (id: number) => `${API_PREFIX}/optima-info/${id}/unpublish`,
  optimaInfoArchive: (id: number) => `${API_PREFIX}/optima-info/${id}/archive`,
  optimaInfoImages: (id: number) => `${API_PREFIX}/optima-info/${id}/images`,
  optimaInfoImageDetail: (id: number, fileId: number) =>
    `${API_PREFIX}/optima-info/${id}/images/${fileId}`,
  arsipPegawai: `${API_PREFIX}/arsip-pegawai`,
  arsipPegawaiDetail: (id: number) => `${API_PREFIX}/arsip-pegawai/${id}`,
  arsipPegawaiDocumentList: (pegawaiId: number) =>
    `${API_PREFIX}/arsip-pegawai/${pegawaiId}/documents`,
  arsipPegawaiDocumentDetail: (pegawaiId: number, documentId: number) =>
    `${API_PREFIX}/arsip-pegawai/${pegawaiId}/documents/${documentId}`,
  arsipPegawaiDocumentDownload: (pegawaiId: number, documentId: number) =>
    `${API_PREFIX}/arsip-pegawai/${pegawaiId}/documents/${documentId}/download`,
  websiteHome: `${API_PREFIX}/website/home`,
  websitePortalApps: `${API_PREFIX}/website/portal-apps`,
  websiteAspirasiku: `${API_PREFIX}/website/aspirasiku`,
  websiteInformasi: `${API_PREFIX}/website/informasi`,
  websiteInformasiDetail: (slug: string) =>
    `${API_PREFIX}/website/informasi/${encodeURIComponent(slug)}`,
  websiteDataWilayah: `${API_PREFIX}/website/data-wilayah`,
  websiteDataWilayahSettings: `${API_PREFIX}/website/data-wilayah/settings`,
  websiteProfile: `${API_PREFIX}/website/profile`,
};
