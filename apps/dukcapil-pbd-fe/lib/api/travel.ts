import { apiRequest, API_PREFIX } from "@/lib/api/http";
import type {
  TravelAssignment,
  TravelAssignmentPayload,
  TravelDocument,
  TravelFilters,
  TravelKind,
  TravelOptions,
  TravelOrder,
  TravelOrderPayload,
} from "@/types/travel";
const url = (kind: TravelKind, id?: number) =>
  `${API_PREFIX}/travel/${kind}${id ? `/${id}` : ""}`;
export function getTravelOptions() {
  return apiRequest<TravelOptions>(`${API_PREFIX}/travel/options`);
}
export function getTravelDocuments(
  kind: TravelKind,
  filters: Partial<TravelFilters> = {},
) {
  const query = new URLSearchParams();
  if (filters.activityId)
    query.set("activity_execution_id", String(filters.activityId));
  if (filters.year) query.set("year", filters.year);
  if (filters.status) query.set("status", filters.status);
  if (filters.search) query.set("search", filters.search);
  if (filters.employeeId) query.set("employee_id", String(filters.employeeId));
  if (filters.destination) query.set("destination", filters.destination);
  return apiRequest<TravelDocument[]>(`${url(kind)}?${query}`);
}
export function getTravelDocument(kind: TravelKind, id: number) {
  return apiRequest<TravelDocument>(url(kind, id));
}
export function saveTravelAssignment(
  id: number | null,
  payload: TravelAssignmentPayload,
) {
  return apiRequest<TravelAssignment>(
    url("assignment-letters", id ?? undefined),
    { method: id ? "PUT" : "POST", body: JSON.stringify(payload) },
  );
}
export function saveTravelOrder(
  id: number | null,
  payload: TravelOrderPayload,
) {
  return apiRequest<TravelOrder>(url("spd", id ?? undefined), {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}
export function travelAction(
  kind: TravelKind,
  id: number,
  action: "finalize" | "cancel" | "duplicate",
  reason = "",
) {
  return apiRequest<TravelDocument>(`${url(kind, id)}/${action}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
export function deleteTravelDocument(kind: TravelKind, id: number) {
  return apiRequest<void>(url(kind, id), { method: "DELETE" });
}
