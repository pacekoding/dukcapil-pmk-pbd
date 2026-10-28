import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  CapaianKendala,
  CapaianKendalaListResponse,
  CapaianKendalaPayload,
  KelompokBinaanListResponse,
  KelompokBinaanOptionsResponse,
  KelompokBinaan,
  KelompokBinaanPayload,
} from "@/types/kelompok-binaan";

export function getKelompokBinaan() {
  return apiRequest<KelompokBinaanListResponse>(apiEndpoints.kelompokBinaan);
}

export function getKelompokBinaanOptions() {
  return apiRequest<KelompokBinaanOptionsResponse>(apiEndpoints.kelompokBinaanOptions);
}

export function createKelompokBinaan(
  payload: KelompokBinaanPayload,
) {
  return apiRequest<KelompokBinaan>(apiEndpoints.kelompokBinaan, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateKelompokBinaan(
  id: number,
  payload: KelompokBinaanPayload,
) {
  return apiRequest<KelompokBinaan>(apiEndpoints.kelompokBinaanDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteKelompokBinaan(id: number) {
  return apiRequest<null>(apiEndpoints.kelompokBinaanDetail(id), {
    method: "DELETE",
  });
}

export function getCapaianKendala() {
  return apiRequest<CapaianKendalaListResponse>(
    apiEndpoints.kelompokBinaanCapaianKendala,
  );
}

export function createCapaianKendala(
  payload: CapaianKendalaPayload,
) {
  return apiRequest<CapaianKendala>(
    apiEndpoints.kelompokBinaanCapaianKendala,
    {
      method: "POST",
      body: buildCapaianKendalaBody(payload),
    },
  );
}

export function updateCapaianKendala(
  id: number,
  payload: CapaianKendalaPayload,
) {
  return apiRequest<CapaianKendala>(
    apiEndpoints.kelompokBinaanCapaianKendalaDetail(id),
    {
      method: "PUT",
      body: buildCapaianKendalaBody(payload),
    },
  );
}

export function deleteCapaianKendala(id: number) {
  return apiRequest<null>(apiEndpoints.kelompokBinaanCapaianKendalaDetail(id), {
    method: "DELETE",
  });
}

function buildCapaianKendalaBody(
  payload: CapaianKendalaPayload,
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
