import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  OrganizationData,
  OrganizationItem,
  OrganizationKind,
  OrganizationPayload,
} from "@/types/organization";

export function getOrganization(
  kind: OrganizationKind,
  filters: {
    bidangId?: number;
    seksiId?: number;
    active?: boolean;
    search?: string;
  } = {},
) {
  const params = new URLSearchParams();
  if (filters.bidangId !== undefined)
    params.set("bidang_id", String(filters.bidangId));
  if (filters.seksiId !== undefined)
    params.set("seksi_id", String(filters.seksiId));
  if (filters.active !== undefined)
    params.set("active", String(filters.active));
  if (filters.search) params.set("search", filters.search);
  return apiRequest<OrganizationItem[]>(
    `${apiEndpoints.organization(kind)}?${params}`,
  );
}

// Load all options before hydrating dependent employee selections.
export async function getOrganizationData(): Promise<OrganizationData> {
  const [fields, sections, positions] = await Promise.all([
    getOrganization("fields"),
    getOrganization("sections"),
    getOrganization("positions"),
  ]);
  return { fields, sections, positions };
}

export function saveOrganization(
  kind: OrganizationKind,
  id: number | null,
  payload: OrganizationPayload,
) {
  return apiRequest<OrganizationItem>(
    `${apiEndpoints.organization(kind)}${id ? `/${id}` : ""}`,
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteOrganization(kind: OrganizationKind, id: number) {
  return apiRequest<void>(`${apiEndpoints.organization(kind)}/${id}`, {
    method: "DELETE",
  });
}
