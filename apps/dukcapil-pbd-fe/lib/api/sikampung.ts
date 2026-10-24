import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  SikampungData,
  SikampungListResponse,
  SikampungPayload,
} from "@/types/sikampung";

type SikampungListParams = {
  tahunAnggaran?: string;
  page?: number;
  pageSize?: number;
  search?: string;
};

export function getSikampungData(params: SikampungListParams = {}) {
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
  return apiRequest<SikampungListResponse>(
    query ? `${apiEndpoints.sikampung}?${query}` : apiEndpoints.sikampung,
  );
}

export function createSikampungData(payload: SikampungPayload) {
  return apiRequest<SikampungData>(apiEndpoints.sikampung, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSikampungDataDetail(id: number) {
  return apiRequest<SikampungData>(apiEndpoints.sikampungDetail(id));
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
