import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type { DashboardOverview } from "@/types/dashboard";

export function getDashboardOverview() {
  return apiRequest<DashboardOverview>(apiEndpoints.dashboard);
}
