export type AdminRole =
  | "superadmin"
  | "admin_dukcapil"
  | "admin_pmk"
  | "admin_sekretariat";

export type AdminUser = {
  id: number;
  username: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserPayload = {
  username: string;
  name: string;
  role: AdminRole;
  password: string;
  isActive: boolean;
};

export type UpdateAdminUserPayload = {
  username: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
};

export type ResetPasswordPayload = {
  newPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
