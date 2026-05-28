import { API_PREFIX } from "@/lib/api/http";

export const apiEndpoints = {
  dashboard: `${API_PREFIX}/dashboard`,
  kegiatan: `${API_PREFIX}/kegiatan`,
  kegiatanDetail: (id: number) => `${API_PREFIX}/kegiatan/${id}`,
  kegiatanDokumentasi: (id: number) => `${API_PREFIX}/kegiatan/${id}/dokumentasi`,
  kegiatanDokumentasiDetail: (id: number, documentationId: number) =>
    `${API_PREFIX}/kegiatan/${id}/dokumentasi/${documentationId}`,
  dokumen: `${API_PREFIX}/dokumen`,
  dokumenDetail: (id: number) => `${API_PREFIX}/dokumen/${id}`,
  dokumenFormMeta: `${API_PREFIX}/dokumen/form-meta`,
  dokumenPreview: (id: number) => `${API_PREFIX}/dokumen/${id}/preview`,
  users: `${API_PREFIX}/users`,
  userDetail: (id: number) => `${API_PREFIX}/users/${id}`,
  userResetPassword: (id: number) => `${API_PREFIX}/users/${id}/reset-password`,
  accountChangePassword: `${API_PREFIX}/account/change-password`,
  websiteHome: `${API_PREFIX}/website/home`,
  websiteKegiatan: `${API_PREFIX}/website/kegiatan`,
  websiteKegiatanDetail: (id: number) => `${API_PREFIX}/website/kegiatan/${id}`,
  websiteProfile: `${API_PREFIX}/website/profile`,
};
