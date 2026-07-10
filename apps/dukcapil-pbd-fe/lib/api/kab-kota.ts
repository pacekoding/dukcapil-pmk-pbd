import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type { KabKota, KabKotaPayload } from "@/types/kab-kota";

export function getKabKota() {
  return apiRequest<KabKota[]>(apiEndpoints.kabKota);
}

export function createKabKota(payload: KabKotaPayload) {
  return apiRequest<KabKota>(apiEndpoints.kabKota, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateKabKota(id: number, payload: KabKotaPayload) {
  return apiRequest<KabKota>(apiEndpoints.kabKotaDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteKabKota(id: number) {
  return apiRequest<null>(apiEndpoints.kabKotaDetail(id), {
    method: "DELETE",
  });
}
