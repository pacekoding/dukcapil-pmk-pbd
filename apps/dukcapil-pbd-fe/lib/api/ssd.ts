import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  SSDDetail,
  SSD,
  SSDImportResult,
  SSDListResponse,
  SSDPayload,
} from "@/types/ssd";

export function getSSD() {
  return apiRequest<SSDListResponse>(apiEndpoints.ssd);
}

export function importSSD(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<SSDImportResult>(apiEndpoints.ssdImport, {
    method: "POST",
    body: formData,
  });
}

export function createSSD(payload: SSDPayload) {
  return apiRequest<SSDDetail>(apiEndpoints.ssd, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSSDDetail(id: number) {
  return apiRequest<SSDDetail>(apiEndpoints.ssdDetail(id));
}

export function updateSSD(id: number, payload: SSDPayload) {
  return apiRequest<SSDDetail>(apiEndpoints.ssdDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function setSSDStatus(id: number, isActive: boolean) {
  return apiRequest<SSD>(apiEndpoints.ssdStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}
