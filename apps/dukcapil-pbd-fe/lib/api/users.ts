import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  AdminUser,
  CreateAdminUserPayload,
  ResetPasswordPayload,
  UpdateAdminUserPayload,
} from "@/types/user";

export function getAdminUsers() {
  return apiRequest<AdminUser[]>(apiEndpoints.users);
}

export function createAdminUser(payload: CreateAdminUserPayload) {
  return apiRequest<AdminUser>(apiEndpoints.users, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id: number, payload: UpdateAdminUserPayload) {
  return apiRequest<AdminUser>(apiEndpoints.userDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(id: number) {
  return apiRequest<AdminUser>(apiEndpoints.userDetail(id), {
    method: "DELETE",
  });
}

export function resetAdminUserPassword(
  id: number,
  payload: ResetPasswordPayload,
) {
  return apiRequest<AdminUser>(apiEndpoints.userResetPassword(id), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
