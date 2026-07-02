import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  Subkegiatan,
  SubkegiatanImportResult,
  SubkegiatanListResponse,
  SubkegiatanPayload,
} from "@/types/subkegiatan";

export function getSubkegiatan() {
  return apiRequest<SubkegiatanListResponse>(apiEndpoints.subkegiatan);
}

export function createSubkegiatan(payload: SubkegiatanPayload) {
  return apiRequest<Subkegiatan>(apiEndpoints.subkegiatan, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importSubkegiatan(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<SubkegiatanImportResult>(apiEndpoints.subkegiatanImport, {
    method: "POST",
    body: formData,
  });
}

export function updateSubkegiatan(id: number, payload: SubkegiatanPayload) {
  return apiRequest<Subkegiatan>(apiEndpoints.subkegiatanDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSubkegiatan(id: number) {
  return apiRequest<void>(apiEndpoints.subkegiatanDetail(id), {
    method: "DELETE",
  });
}
