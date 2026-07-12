import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  PortalAppStatusItem,
  PortalAppStatusPayload,
} from "@/types/portal-app";

export function getWebsitePortalAppStatuses() {
  return apiRequest<PortalAppStatusItem[]>(apiEndpoints.websitePortalApps);
}

export function getAdminPortalAppStatuses() {
  return apiRequest<PortalAppStatusItem[]>(apiEndpoints.portalApps);
}

export function updateAdminPortalAppStatuses(payload: PortalAppStatusPayload) {
  return apiRequest<PortalAppStatusItem[]>(apiEndpoints.portalApps, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
