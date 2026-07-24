import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  MacekuPKKArchive,
  MacekuPKKListFilters,
  MacekuPKKListResponse,
  MacekuPKKOptionsResponse,
  MacekuPKKProfileDetail,
  SaveMacekuPKKProfilePayload,
  UpdateMacekuArchivePayload,
  UploadMacekuArchivePayload,
} from "@/types/maceku-pkk";

export function getMacekuPKKProfiles(filters: MacekuPKKListFilters = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      params.set(key, `${value}`.trim());
    }
  }

  const query = params.toString();
  return apiRequest<MacekuPKKListResponse>(
    query ? `${apiEndpoints.macekuPkk}?${query}` : apiEndpoints.macekuPkk,
  );
}

export function getMacekuPKKOptions() {
  return apiRequest<MacekuPKKOptionsResponse>(apiEndpoints.macekuPkkOptions);
}

export function getMacekuPKKDetail(id: number) {
  return apiRequest<MacekuPKKProfileDetail>(apiEndpoints.macekuPkkDetail(id));
}

export function createMacekuPKKProfile(payload: SaveMacekuPKKProfilePayload) {
  const formData = buildProfileFormData(payload);
  return apiRequest<MacekuPKKProfileDetail>(apiEndpoints.macekuPkk, {
    method: "POST",
    body: formData,
  });
}

export function updateMacekuPKKProfile(
  id: number,
  payload: SaveMacekuPKKProfilePayload,
) {
  const formData = buildProfileFormData(payload);
  return apiRequest<MacekuPKKProfileDetail>(apiEndpoints.macekuPkkDetail(id), {
    method: "PUT",
    body: formData,
  });
}

export function deleteMacekuPKKProfile(id: number) {
  return apiRequest<void>(apiEndpoints.macekuPkkDetail(id), {
    method: "DELETE",
  });
}

export function uploadMacekuArchive(
  profileId: number,
  payload: UploadMacekuArchivePayload,
) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("title", payload.title.trim());
  formData.append("category", payload.category);
  formData.append("documentYear", payload.documentYear.trim());
  formData.append("documentNumber", payload.documentNumber.trim());
  formData.append("documentDate", payload.documentDate.trim());
  formData.append("description", payload.description.trim());

  return apiRequest<MacekuPKKArchive>(apiEndpoints.macekuPkkArchiveList(profileId), {
    method: "POST",
    body: formData,
  });
}

export function updateMacekuArchive(
  profileId: number,
  archiveId: number,
  payload: UpdateMacekuArchivePayload,
) {
  return apiRequest<MacekuPKKArchive>(
    apiEndpoints.macekuPkkArchiveDetail(profileId, archiveId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteMacekuArchive(profileId: number, archiveId: number) {
  return apiRequest<void>(apiEndpoints.macekuPkkArchiveDetail(profileId, archiveId), {
    method: "DELETE",
  });
}

function buildProfileFormData(payload: SaveMacekuPKKProfilePayload) {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("kabupatenKota", payload.kabupatenKota.trim());
  formData.append("distrik", payload.distrik.trim());
  formData.append("kampung", payload.kampung.trim());
  formData.append("secretariatAddress", payload.secretariatAddress.trim());
  formData.append("chairperson", payload.chairperson.trim());
  formData.append("secretary", payload.secretary.trim());
  formData.append("phone", payload.phone.trim());
  formData.append("email", payload.email.trim());
  formData.append("managementPeriod", payload.managementPeriod.trim());
  formData.append("description", payload.description.trim());
  formData.append("isActive", payload.isActive ? "true" : "false");

  if (payload.logo) {
    formData.append("logo", payload.logo);
  }

  return formData;
}
