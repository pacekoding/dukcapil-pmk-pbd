import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type { PublicOtsusDetail, PublicOtsusListResponse } from "@/types/public-otsus";

export type PublicOtsusQuery = { tahun?: string; search?: string; kabupaten?: string; status?: string; sumberDana?: string; sort?: string; page?: number; pageSize?: number };

export function getPublicOtsus(query: PublicOtsusQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return apiRequest<PublicOtsusListResponse>(`${apiEndpoints.publicOtsus}?${params}`);
}

export function getPublicOtsusDetail(id: number, year?: string) {
  const params = new URLSearchParams();
  if (year) params.set("tahun", year);
  return apiRequest<PublicOtsusDetail>(`${apiEndpoints.publicOtsus}/${id}${params.size ? `?${params}` : ""}`);
}
