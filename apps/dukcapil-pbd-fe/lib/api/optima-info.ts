import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  OptimaInfoAdminListResponse,
  OptimaInfoDetail,
  OptimaInfoFilters,
  OptimaInfoPublicFilters,
  OptimaInfoPublicListResponse,
  SaveOptimaInfoPayload,
} from "@/types/optima-info";
import type { StoredFileMetadata } from "@/types/stored-file";

export function getOptimaInfoArticles(filters: OptimaInfoFilters = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      params.set(key, `${value}`.trim());
    }
  }

  const query = params.toString();
  return apiRequest<OptimaInfoAdminListResponse>(
    query ? `${apiEndpoints.optimaInfo}?${query}` : apiEndpoints.optimaInfo,
  );
}

export function getOptimaInfoDetail(id: number) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.optimaInfoDetail(id));
}

export function getOptimaInfoPreview(id: number) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.optimaInfoPreview(id));
}

export function createOptimaInfoArticle(payload: SaveOptimaInfoPayload) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.optimaInfo, {
    method: "POST",
    body: buildOptimaInfoFormData(payload),
  });
}

export function updateOptimaInfoArticle(id: number, payload: SaveOptimaInfoPayload) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.optimaInfoDetail(id), {
    method: "PUT",
    body: buildOptimaInfoFormData(payload),
  });
}

export function deleteOptimaInfoArticle(id: number) {
  return apiRequest<void>(apiEndpoints.optimaInfoDetail(id), {
    method: "DELETE",
  });
}

export function publishOptimaInfoArticle(id: number) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.optimaInfoPublish(id), {
    method: "POST",
  });
}

export function unpublishOptimaInfoArticle(id: number) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.optimaInfoUnpublish(id), {
    method: "POST",
  });
}

export function archiveOptimaInfoArticle(id: number) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.optimaInfoArchive(id), {
    method: "POST",
  });
}

export function uploadOptimaInfoContentImage(id: number, file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<StoredFileMetadata>(apiEndpoints.optimaInfoImages(id), {
    method: "POST",
    body,
  });
}

export function deleteOptimaInfoContentImage(id: number, fileId: number) {
  return apiRequest<void>(apiEndpoints.optimaInfoImageDetail(id, fileId), {
    method: "DELETE",
  });
}

export function getWebsiteInformasi(filters: OptimaInfoPublicFilters = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      params.set(key, `${value}`.trim());
    }
  }

  const query = params.toString();
  return apiRequest<OptimaInfoPublicListResponse>(
    query
      ? `${apiEndpoints.websiteInformasi}?${query}`
      : apiEndpoints.websiteInformasi,
  );
}

export function getWebsiteInformasiDetail(slug: string) {
  return apiRequest<OptimaInfoDetail>(apiEndpoints.websiteInformasiDetail(slug));
}

function buildOptimaInfoFormData(payload: SaveOptimaInfoPayload) {
  const formData = new FormData();
  formData.append("title", payload.title.trim());
  formData.append("slug", payload.slug.trim());
  formData.append("category", payload.category.trim());
  formData.append("summary", payload.summary.trim());
  formData.append("content", payload.content);
  formData.append("externalUrl", payload.externalUrl.trim());
  formData.append("displayOrder", `${payload.displayOrder}`);
  formData.append("isFeatured", payload.isFeatured ? "true" : "false");
  formData.append("startDate", payload.startDate.trim());
  formData.append("endDate", payload.endDate.trim());
  formData.append("removeThumbnail", payload.removeThumbnail ? "true" : "false");
  formData.append("removeAttachment", payload.removeAttachment ? "true" : "false");
  formData.append("intent", payload.intent ?? "save");

  if (payload.thumbnail) {
    formData.append("thumbnail", payload.thumbnail);
  }
  if (payload.attachment) {
    formData.append("attachment", payload.attachment);
  }

  return formData;
}
