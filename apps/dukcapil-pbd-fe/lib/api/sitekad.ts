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
      body: buildSitekadCapaianKendalaBody(payload),
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
      body: buildSitekadCapaianKendalaBody(payload),
    },
  );
}

export function deleteSitekadCapaianKendala(id: number) {
  return apiRequest<null>(apiEndpoints.sitekadCapaianKendalaDetail(id), {
    method: "DELETE",
  });
}

function buildSitekadCapaianKendalaBody(
  payload: SitekadCapaianKendalaPayload,
) {
  const photos = payload.documentationPhotos ?? [];
  if (photos.length === 0) {
    return JSON.stringify({
      kelompokId: payload.kelompokId,
      namaCapaian: payload.namaCapaian,
      tahunBinaan: payload.tahunBinaan,
      deskripsiCapaian: payload.deskripsiCapaian,
      kendalaHambatan: payload.kendalaHambatan,
      dokumentasiUrls: payload.dokumentasiUrls,
    });
  }

  const formData = new FormData();
  formData.append("kelompokId", String(payload.kelompokId));
  formData.append("namaCapaian", payload.namaCapaian.trim());
  formData.append("tahunBinaan", payload.tahunBinaan.trim());
  formData.append("deskripsiCapaian", payload.deskripsiCapaian.trim());
  formData.append("kendalaHambatan", payload.kendalaHambatan.trim());
  for (const value of payload.dokumentasiUrls) {
    formData.append("dokumentasiUrls", value.trim());
  }
  for (const photo of photos) {
    formData.append("documentationPhotos", photo);
  }

  return formData;
}
