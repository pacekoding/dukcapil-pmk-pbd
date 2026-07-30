import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  PegawaiArchive,
  PegawaiArchivePayload,
  PegawaiDocument,
  UploadPegawaiDocumentPayload,
} from "@/types/arsip-pegawai";

export function getArsipPegawai(search?: string) {
  const searchParams = new URLSearchParams();
  if (search?.trim()) {
    searchParams.set("search", search.trim());
  }

  const query = searchParams.toString();
  const url = query
    ? `${apiEndpoints.arsipPegawai}?${query}`
    : apiEndpoints.arsipPegawai;

  return apiRequest<PegawaiArchive[]>(url);
}

export function getArsipPegawaiDetail(id: number) {
  return apiRequest<PegawaiArchive>(apiEndpoints.arsipPegawaiDetail(id));
}

export function createArsipPegawai(payload: PegawaiArchivePayload) {
  return apiRequest<PegawaiArchive>(apiEndpoints.arsipPegawai, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateArsipPegawai(id: number, payload: PegawaiArchivePayload) {
  return apiRequest<PegawaiArchive>(apiEndpoints.arsipPegawaiDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteArsipPegawai(id: number) {
  return apiRequest<void>(apiEndpoints.arsipPegawaiDetail(id), {
    method: "DELETE",
  });
}

export function uploadArsipPegawaiPhoto(id: number, photo: File) {
  const formData = new FormData();
  formData.append("photo", photo);

  return apiRequest<PegawaiArchive>(apiEndpoints.arsipPegawaiPhoto(id), {
    method: "POST",
    body: formData,
  });
}

export function uploadPegawaiDocument(
  pegawaiId: number,
  payload: UploadPegawaiDocumentPayload,
) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("bidang", payload.bidang);
  formData.append("title", payload.title.trim());
  formData.append("category", payload.category);
  formData.append("number", payload.number.trim());
  formData.append("year", payload.year.trim());
  formData.append("status", payload.status);

  return apiRequest<PegawaiDocument>(
    apiEndpoints.arsipPegawaiDocumentList(pegawaiId),
    {
      method: "POST",
      body: formData,
    },
  );
}

export function deletePegawaiDocument(pegawaiId: number, documentId: number) {
  return apiRequest<void>(
    apiEndpoints.arsipPegawaiDocumentDetail(pegawaiId, documentId),
    { method: "DELETE" },
  );
}
