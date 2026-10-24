import { API_PREFIX, apiRequest } from "@/lib/api/http";
import type {
  ActivityExecution,
  ActivityPayload,
  ActivityDetail,
  ActivityDocument,
  ActivityDocumentKind,
  ActivityDocumentPayload,
  ActivityAttachment,
} from "@/types/activity-execution";
export const getActivities = (
  filters: Record<string, string> = { year: "all" },
) =>
  apiRequest<ActivityExecution[]>(
    `${API_PREFIX}/activity-executions?${new URLSearchParams(filters)}`,
  );
export const getActivity = (id: number) =>
  apiRequest<ActivityDetail>(`${API_PREFIX}/activity-executions/${id}`);
export const saveActivity = (id: number | null, p: ActivityPayload) =>
  apiRequest<ActivityExecution>(
    `${API_PREFIX}/activity-executions${id ? `/${id}` : ""}`,
    { method: id ? "PUT" : "POST", body: JSON.stringify(p) },
  );
export const deleteActivity = (id: number) =>
  apiRequest<void>(`${API_PREFIX}/activity-executions/${id}`, {
    method: "DELETE",
  });
export const getActivityDocuments = (filters: Record<string, string>) =>
  apiRequest<ActivityDocument[]>(
    `${API_PREFIX}/activity-documents?${new URLSearchParams(filters)}`,
  );
export const getActivityDocument = (id: number) =>
  apiRequest<ActivityDocument>(`${API_PREFIX}/activity-documents/${id}`);
export const getActivityTemplate = (id: number, kind: ActivityDocumentKind) =>
  apiRequest<ActivityDocumentPayload>(
    `${API_PREFIX}/activity-executions/${id}/templates/${kind}`,
  );
export const saveActivityDocument = (
  id: number | null,
  p: ActivityDocumentPayload,
) =>
  apiRequest<ActivityDocument>(
    `${API_PREFIX}/activity-documents${id ? `/${id}` : ""}`,
    { method: id ? "PUT" : "POST", body: JSON.stringify(p) },
  );
export const deleteActivityDocument = (id: number) =>
  apiRequest<void>(`${API_PREFIX}/activity-documents/${id}`, {
    method: "DELETE",
  });
export const activityDocumentAction = (
  id: number,
  action: "finalize" | "cancel",
  reason = "",
) =>
  apiRequest<ActivityDocument>(
    `${API_PREFIX}/activity-documents/${id}/${action}`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
export const getActivityAttachments = (id?: number, kind?: string) => {
  const p = new URLSearchParams({ year: "all" });
  if (id) p.set("activity_execution_id", String(id));
  if (kind) p.set("kind", kind);
  return apiRequest<ActivityAttachment[]>(
    `${API_PREFIX}/activity-attachments?${p}`,
  );
};
export const uploadActivityAttachment = (id: number, data: FormData) =>
  apiRequest<ActivityAttachment>(
    `${API_PREFIX}/activity-executions/${id}/attachments`,
    { method: "POST", body: data },
  );
export const updateActivityAttachment = (
  id: number,
  p: Pick<
    ActivityAttachment,
    "kind" | "category" | "caption" | "takenAt" | "locationDescription"
  >,
) =>
  apiRequest<ActivityAttachment>(`${API_PREFIX}/activity-attachments/${id}`, {
    method: "PUT",
    body: JSON.stringify(p),
  });
export const deleteActivityAttachment = (id: number) =>
  apiRequest<void>(`${API_PREFIX}/activity-attachments/${id}`, {
    method: "DELETE",
  });
export const linkTravelActivity = (id: number, activityExecutionId: number) =>
  apiRequest(`${API_PREFIX}/travel/assignment-letters/${id}/link-activity`, {
    method: "POST",
    body: JSON.stringify({ activityExecutionId }),
  });
