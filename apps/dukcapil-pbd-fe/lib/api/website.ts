import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  WebsiteHomeResponse,
  WebsiteProfileResponse,
} from "@/types/website";

export function getWebsiteHome() {
  return apiRequest<WebsiteHomeResponse>(apiEndpoints.websiteHome);
}

export function getWebsiteProfile() {
  return apiRequest<WebsiteProfileResponse>(apiEndpoints.websiteProfile);
}
