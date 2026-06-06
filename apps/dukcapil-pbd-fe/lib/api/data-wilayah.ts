import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type { DataWilayahResponse, RegionData } from "@/types/data-wilayah";

export function getDataWilayah() {
  return apiRequest<DataWilayahResponse>(apiEndpoints.dataWilayah);
}

export function getWebsiteDataWilayah() {
  return apiRequest<DataWilayahResponse>(apiEndpoints.websiteDataWilayah);
}

export function updateDataWilayahRegion(id: string, payload: RegionData) {
  return apiRequest<RegionData>(apiEndpoints.dataWilayahDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
