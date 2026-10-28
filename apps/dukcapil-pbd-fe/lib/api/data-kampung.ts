import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  DataKampungData,
  DataKampungListResponse,
  DataKampungPayload,
} from "@/types/data-kampung";

type DataKampungListParams = {
  tahunAnggaran?: string;
  page?: number;
  pageSize?: number;
  search?: string;
};

export function getDataKampungData(params: DataKampungListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.tahunAnggaran) {
    searchParams.set("tahunAnggaran", params.tahunAnggaran);
  }
  if (params.page) {
    searchParams.set("page", String(params.page));
  }
  if (params.pageSize) {
    searchParams.set("pageSize", String(params.pageSize));
  }
  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  const query = searchParams.toString();
  return apiRequest<DataKampungListResponse>(
    query ? `${apiEndpoints.dataKampung}?${query}` : apiEndpoints.dataKampung,
  );
}

export function createDataKampungData(payload: DataKampungPayload) {
  return apiRequest<DataKampungData>(apiEndpoints.dataKampung, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDataKampungDataDetail(id: number) {
  return apiRequest<DataKampungData>(apiEndpoints.dataKampungDetail(id));
}

export function updateDataKampungData(id: number, payload: DataKampungPayload) {
  return apiRequest<DataKampungData>(apiEndpoints.dataKampungDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDataKampungData(id: number) {
  return apiRequest<null>(apiEndpoints.dataKampungDetail(id), {
    method: "DELETE",
  });
}
