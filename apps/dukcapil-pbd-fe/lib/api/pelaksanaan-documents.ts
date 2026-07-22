import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  PelaksanaanDocument,
  PelaksanaanDocumentListParams,
  PelaksanaanDocumentListResponse,
  UpdatePelaksanaanDocumentPayload,
  UploadPelaksanaanDocumentPayload,
} from "@/types/pelaksanaan-documents";

export function getPelaksanaanDocuments(
  params: PelaksanaanDocumentListParams = {},
) {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.sumberAplikasi?.trim()) {
    searchParams.set("sumber_aplikasi", params.sumberAplikasi.trim());
  }
  if (params.bidang?.trim()) {
    searchParams.set("bidang", params.bidang.trim());
  }
  if (params.subkegiatanPrefix?.trim()) {
    searchParams.set("subkegiatan_prefix", params.subkegiatanPrefix.trim());
  }
  if (params.page) {
    searchParams.set("page", String(params.page));
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  const url = query
    ? `${apiEndpoints.pelaksanaanDocuments}?${query}`
    : apiEndpoints.pelaksanaanDocuments;

  return apiRequest<PelaksanaanDocumentListResponse>(url);
}

export function uploadDokumenPelaksanaan(
  payload: UploadPelaksanaanDocumentPayload,
) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("sumber_aplikasi", payload.sumberAplikasi);
  formData.append("bidang", payload.bidang);
  formData.append("is_dokumen_dssd", String(payload.isDokumenDssd));

  if (payload.subkegiatanId) {
    formData.append("subkegiatan_id", String(payload.subkegiatanId));
  }
  if (payload.nama?.trim()) {
    formData.append("nama", payload.nama.trim());
  }

  return apiRequest<PelaksanaanDocument>(apiEndpoints.pelaksanaanDocuments, {
    method: "POST",
    body: formData,
  });
}

export function updatePelaksanaanDocument(
  id: number,
  payload: UpdatePelaksanaanDocumentPayload,
) {
  return apiRequest<PelaksanaanDocument>(
    apiEndpoints.pelaksanaanDocumentDetail(id),
    {
      method: "PUT",
      body: JSON.stringify({
        nama: payload.nama.trim(),
        subkegiatan_id: payload.subkegiatanId
          ? Number(payload.subkegiatanId)
          : null,
        is_dokumen_dssd: payload.isDokumenDssd,
      }),
    },
  );
}

export function deletePelaksanaanDocument(id: number) {
  return apiRequest<void>(apiEndpoints.pelaksanaanDocumentDetail(id), {
    method: "DELETE",
  });
}
