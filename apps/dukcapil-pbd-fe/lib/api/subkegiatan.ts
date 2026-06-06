import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  Subkegiatan,
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
