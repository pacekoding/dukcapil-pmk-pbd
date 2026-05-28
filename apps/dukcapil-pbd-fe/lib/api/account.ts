import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type { ChangePasswordPayload } from "@/types/user";

export function changePassword(payload: ChangePasswordPayload) {
  return apiRequest<{ success: boolean }>(apiEndpoints.accountChangePassword, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
