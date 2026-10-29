import { apiEndpoints } from "@/lib/api/endpoints";
import { API_BASE_URL, apiRequest } from "@/lib/api/http";
import type { Subkegiatan, SubkegiatanImportPreview, SubkegiatanImportResult, SubkegiatanListResponse, SubkegiatanPayload } from "@/types/subkegiatan";

export function getSubkegiatan() {
  return apiRequest<Subkegiatan[]>(apiEndpoints.subkegiatan);
}

export function getSubkegiatanPage(params: { page: number; pageSize: number; search?: string }) {
  const searchParams = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  return apiRequest<SubkegiatanListResponse>(`${apiEndpoints.subkegiatan}?${searchParams}`);
}

export function createSubkegiatan(payload: SubkegiatanPayload) {
  return apiRequest<Subkegiatan>(apiEndpoints.subkegiatan, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSubkegiatan(id: number, payload: SubkegiatanPayload) {
  return apiRequest<Subkegiatan>(`${apiEndpoints.subkegiatan}/${id}`, {
    method: "PUT", body: JSON.stringify(payload),
  });
}

export function deleteSubkegiatan(id: number) {
  return apiRequest<void>(`${apiEndpoints.subkegiatan}/${id}`, { method: "DELETE" });
}

function uploadExcel<T>(path: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<T>(path, { method: "POST", body });
}

export function previewSubkegiatanImport(file: File) {
  return uploadExcel<SubkegiatanImportPreview>(`${apiEndpoints.subkegiatan}/import/preview`, file);
}

export function importSubkegiatan(file: File) {
  return uploadExcel<SubkegiatanImportResult>(`${apiEndpoints.subkegiatan}/import`, file);
}

export async function downloadSubkegiatanExcel(kind: "data" | "template") {
  const path = kind === "data" ? `${apiEndpoints.subkegiatan}/export` : `${apiEndpoints.subkegiatan}/import-template`;
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", credentials: "include" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? "File Excel gagal didownload.");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? (kind === "data" ? "subkegiatan.xlsx" : "template_import_subkegiatan.xlsx");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
