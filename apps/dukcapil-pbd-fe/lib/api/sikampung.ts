import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  SikampungData,
  SikampungListResponse,
  SikampungPayload,
} from "@/types/sikampung";

export function getSikampungData() {
  return apiRequest<SikampungListResponse>(apiEndpoints.sikampung);
}

export function createSikampungData(payload: SikampungPayload) {
  return apiRequest<SikampungData>(apiEndpoints.sikampung, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSikampungData(id: number, payload: SikampungPayload) {
  return apiRequest<SikampungData>(apiEndpoints.sikampungDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSikampungData(id: number) {
  return apiRequest<null>(apiEndpoints.sikampungDetail(id), {
    method: "DELETE",
  });
}
