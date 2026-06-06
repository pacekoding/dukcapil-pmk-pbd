import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  RealisasiSubkegiatan,
  RealisasiSubkegiatanListResponse,
  RealisasiSubkegiatanPayload,
} from "@/types/realisasi-subkegiatan";

export function getRealisasiSubkegiatan() {
  return apiRequest<RealisasiSubkegiatanListResponse>(
    apiEndpoints.realisasiSubkegiatan,
  );
}

export function getRealisasiSubkegiatanDetail(id: number) {
  return apiRequest<RealisasiSubkegiatan>(
    apiEndpoints.realisasiSubkegiatanDetail(id),
  );
}

export function createRealisasiSubkegiatan(
  payload: RealisasiSubkegiatanPayload,
) {
  return apiRequest<RealisasiSubkegiatan>(apiEndpoints.realisasiSubkegiatan, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRealisasiSubkegiatan(
  id: number,
  payload: RealisasiSubkegiatanPayload,
) {
  return apiRequest<RealisasiSubkegiatan>(
    apiEndpoints.realisasiSubkegiatanDetail(id),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteRealisasiSubkegiatan(id: number) {
  return apiRequest<void>(apiEndpoints.realisasiSubkegiatanDetail(id), {
    method: "DELETE",
  });
}

export function uploadRealisasiFoto(id: number, files: FileList | File[]) {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  return apiRequest<RealisasiSubkegiatan>(
    apiEndpoints.realisasiSubkegiatanFoto(id),
    {
      method: "POST",
      body: formData,
    },
  );
}

export function uploadRealisasiDokumen(id: number, files: FileList | File[]) {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  return apiRequest<RealisasiSubkegiatan>(
    apiEndpoints.realisasiSubkegiatanDokumen(id),
    {
      method: "POST",
      body: formData,
    },
  );
}
