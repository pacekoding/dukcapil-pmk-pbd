import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  Aspirasi,
  AspirasiListResponse,
  AspirasiPayload,
  AspirasiStatus,
} from "@/types/aspirasiku";

export function submitWebsiteAspirasi(payload: AspirasiPayload) {
  return apiRequest<Aspirasi>(apiEndpoints.websiteAspirasiku, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAspirasiMessages() {
  return apiRequest<AspirasiListResponse>(apiEndpoints.aspirasiku);
}

export function updateAspirasiStatus(id: number, status: AspirasiStatus) {
  return apiRequest<Aspirasi>(apiEndpoints.aspirasikuStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteAspirasi(id: number) {
  return apiRequest<null>(apiEndpoints.aspirasikuDetail(id), {
    method: "DELETE",
  });
}
