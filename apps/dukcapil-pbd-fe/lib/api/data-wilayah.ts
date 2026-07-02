import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  DataWilayahResponse,
  DataWilayahWebsiteSettings,
  DataWilayahWebsiteSettingsResponse,
  RegionData,
} from "@/types/data-wilayah";

export function getDataWilayah() {
  return apiRequest<DataWilayahResponse>(apiEndpoints.dataWilayah);
}

export function getDataWilayahSettings() {
  return apiRequest<DataWilayahWebsiteSettingsResponse>(apiEndpoints.dataWilayahSettings);
}

export function getWebsiteDataWilayah() {
  return apiRequest<DataWilayahResponse>(apiEndpoints.websiteDataWilayah);
}

export function getWebsiteDataWilayahSettings() {
  return apiRequest<DataWilayahWebsiteSettings>(apiEndpoints.websiteDataWilayahSettings);
}

export function getWebsiteDataWilayahByYear(tahunAnggaran: string) {
  const params = new URLSearchParams({ tahunAnggaran });
  return apiRequest<DataWilayahResponse>(
    `${apiEndpoints.websiteDataWilayah}?${params.toString()}`,
  );
}

export function updateDataWilayahRegion(id: string, payload: RegionData) {
  return apiRequest<RegionData>(apiEndpoints.dataWilayahDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateDataWilayahSettings(payload: DataWilayahWebsiteSettings) {
  return apiRequest<DataWilayahWebsiteSettingsResponse>(apiEndpoints.dataWilayahSettings, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
