import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  SitekadCapaianKendala,
  SitekadCapaianKendalaListResponse,
  SitekadCapaianKendalaPayload,
  SitekadListResponse,
  SitekadOptionsResponse,
  SitekadPotensiKampung,
  SitekadPotensiKampungPayload,
} from "@/types/sitekad";

export function getSitekadPotensiKampung() {
  return apiRequest<SitekadListResponse>(apiEndpoints.sitekad);
}

export function getSitekadOptions() {
  return apiRequest<SitekadOptionsResponse>(apiEndpoints.sitekadOptions);
}

export function createSitekadPotensiKampung(
  payload: SitekadPotensiKampungPayload,
) {
  return apiRequest<SitekadPotensiKampung>(apiEndpoints.sitekad, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSitekadPotensiKampung(
  id: number,
  payload: SitekadPotensiKampungPayload,
) {
  return apiRequest<SitekadPotensiKampung>(apiEndpoints.sitekadDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSitekadPotensiKampung(id: number) {
  return apiRequest<null>(apiEndpoints.sitekadDetail(id), {
    method: "DELETE",
  });
}

export function getSitekadCapaianKendala() {
  return apiRequest<SitekadCapaianKendalaListResponse>(
    apiEndpoints.sitekadCapaianKendala,
  );
}

export function createSitekadCapaianKendala(
  payload: SitekadCapaianKendalaPayload,
) {
  return apiRequest<SitekadCapaianKendala>(
    apiEndpoints.sitekadCapaianKendala,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateSitekadCapaianKendala(
  id: number,
  payload: SitekadCapaianKendalaPayload,
) {
  return apiRequest<SitekadCapaianKendala>(
    apiEndpoints.sitekadCapaianKendalaDetail(id),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteSitekadCapaianKendala(id: number) {
  return apiRequest<null>(apiEndpoints.sitekadCapaianKendalaDetail(id), {
    method: "DELETE",
  });
}
