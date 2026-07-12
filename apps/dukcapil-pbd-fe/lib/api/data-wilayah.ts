import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  DataWilayahAdminSettings,
  DataWilayahResponse,
  DataWilayahSettingsPayload,
  DataWilayahWebsiteSettings,
} from "@/types/data-wilayah";

export function getWebsiteDataWilayah() {
  return apiRequest<DataWilayahResponse>(apiEndpoints.websiteDataWilayah);
}

export function getWebsiteDataWilayahSettings() {
  return apiRequest<DataWilayahWebsiteSettings>(apiEndpoints.websiteDataWilayahSettings);
}

export function getAdminDataWilayahSettings() {
  return apiRequest<DataWilayahAdminSettings>(apiEndpoints.dataWilayahSettings);
}

export function updateAdminDataWilayahSettings(payload: DataWilayahSettingsPayload) {
  return apiRequest<DataWilayahAdminSettings>(apiEndpoints.dataWilayahSettings, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getWebsiteDataWilayahByYear(tahunAnggaran: string) {
  const params = new URLSearchParams({ tahunAnggaran });
  return apiRequest<DataWilayahResponse>(
    `${apiEndpoints.websiteDataWilayah}?${params.toString()}`,
  );
}
