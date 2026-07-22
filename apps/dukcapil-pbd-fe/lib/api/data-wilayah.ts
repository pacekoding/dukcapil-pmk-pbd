import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  DataWilayahAdminSettings,
  DataWilayahResponse,
  DataWilayahSettingsPayload,
  DataWilayahWebsiteSettings,
  RegionData,
  SiberDataWilayahPayload,
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

export function getSiberDataWilayah() {
  return apiRequest<DataWilayahResponse>(apiEndpoints.siberDataWilayah);
}

export function getSiberDataWilayahSettings() {
  return apiRequest<DataWilayahAdminSettings>(
    apiEndpoints.siberDataWilayahSettings,
  );
}

export function updateSiberDataWilayah(
  id: string,
  payload: SiberDataWilayahPayload,
) {
  return apiRequest<RegionData>(
    apiEndpoints.siberDataWilayahDetail(id),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
