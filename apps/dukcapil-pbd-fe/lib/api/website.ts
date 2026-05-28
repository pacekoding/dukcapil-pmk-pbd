import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  WebsiteHomeResponse,
  WebsiteKegiatanDetailResponse,
  WebsiteKegiatanResponse,
  WebsiteProfileResponse,
} from "@/types/website";

export function getWebsiteHome() {
  return apiRequest<WebsiteHomeResponse>(apiEndpoints.websiteHome);
}

export function getWebsiteKegiatan() {
  return apiRequest<WebsiteKegiatanResponse>(apiEndpoints.websiteKegiatan);
}

export function getWebsiteKegiatanDetail(id: number) {
  return apiRequest<WebsiteKegiatanDetailResponse>(
    apiEndpoints.websiteKegiatanDetail(id),
  );
}

export function getWebsiteProfile() {
  return apiRequest<WebsiteProfileResponse>(apiEndpoints.websiteProfile);
}
