import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  BumKampung,
  BumKampungListResponse,
  BumKampungPayload,
} from "@/types/bum-kampung";

export function getBumKampung() {
  return apiRequest<BumKampungListResponse>(apiEndpoints.bumKampung);
}

export function createBumKampung(payload: BumKampungPayload) {
  return apiRequest<BumKampung>(apiEndpoints.bumKampung, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBumKampung(id: number, payload: BumKampungPayload) {
  return apiRequest<BumKampung>(apiEndpoints.bumKampungDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBumKampung(id: number) {
  return apiRequest<null>(apiEndpoints.bumKampungDetail(id), {
    method: "DELETE",
  });
}
