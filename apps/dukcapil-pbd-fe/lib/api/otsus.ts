import { apiRequest } from "@/lib/api/http";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { DpaType, OtsusDetail, OtsusDocumentation, OtsusDpa, OtsusLabel, OtsusLpj, OtsusOptions, OtsusPayload } from "@/types/otsus";

export const getOtsus = (search = "") => apiRequest<OtsusLabel[]>(`${apiEndpoints.otsus}?search=${encodeURIComponent(search)}`);
export const getOtsusDetail = (id: number) => apiRequest<OtsusDetail>(`${apiEndpoints.otsus}/${id}`);
export const getOtsusOptions = () => apiRequest<OtsusOptions>(`${apiEndpoints.otsus}/options`);
export const saveOtsus = (id: number | null, payload: OtsusPayload) => apiRequest<OtsusDetail>(id ? `${apiEndpoints.otsus}/${id}` : apiEndpoints.otsus, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
export const deleteOtsus = (id: number) => apiRequest<void>(`${apiEndpoints.otsus}/${id}`, { method: "DELETE" });
function upload<T>(path: string, file: File, values: Record<string, string> = {}) { const body = new FormData(); body.set("file", file); Object.entries(values).forEach(([key, value]) => body.set(key, value)); return apiRequest<T>(path, { method: "POST", body }); }
export const uploadOtsusPhoto = (id: number, file: File, caption: string) => upload<OtsusDocumentation>(`${apiEndpoints.otsus}/${id}/documentations`, file, { caption });
export const deleteOtsusPhoto = (id: number, documentId: number) => apiRequest<void>(`${apiEndpoints.otsus}/${id}/documentations/${documentId}`, { method: "DELETE" });
export const uploadOtsusLpj = (id: number, file: File) => upload<OtsusLpj>(`${apiEndpoints.otsus}/${id}/lpj`, file);
export const deleteOtsusLpj = (id: number) => apiRequest<void>(`${apiEndpoints.otsus}/${id}/lpj`, { method: "DELETE" });
export const uploadOtsusDpa = (id: number, file: File, jenis: DpaType, catatan: string) => upload<OtsusDpa>(`${apiEndpoints.otsus}/${id}/dpa`, file, { jenis, catatan });
