import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  Dokumen,
  DokumenFormMeta,
  DokumenListResponse,
  DokumenPayload,
  DokumenPreviewData,
} from "@/types/dokumen";

export function getDokumenList() {
  return apiRequest<DokumenListResponse>(apiEndpoints.dokumen);
}

export function getDokumenById(id: number) {
  return apiRequest<Dokumen>(apiEndpoints.dokumenDetail(id));
}

export function createDokumen(payload: DokumenPayload) {
  return apiRequest<Dokumen>(apiEndpoints.dokumen, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDokumen(id: number, payload: DokumenPayload) {
  return apiRequest<Dokumen>(apiEndpoints.dokumenDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDokumen(id: number) {
  return apiRequest<Dokumen>(apiEndpoints.dokumenDetail(id), {
    method: "DELETE",
  });
}

export function getDokumenFormMeta() {
  return apiRequest<DokumenFormMeta>(apiEndpoints.dokumenFormMeta);
}

export function getDokumenPreviewData(id: number) {
  return apiRequest<DokumenPreviewData>(apiEndpoints.dokumenPreview(id));
}
