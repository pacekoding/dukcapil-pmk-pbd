export const roleOptions = [
  "superadmin",
  "admin_dukcapil",
  "admin_pmk",
  "admin_sekretariat",
] as const;

export type AdminRole = (typeof roleOptions)[number];

const roleLabels: Record<AdminRole, string> = {
  superadmin: "Superadmin",
  admin_pmk: "Admin PMK",
  admin_dukcapil: "Admin Dukcapil",
  admin_sekretariat: "Admin Sekretariat",
};

export function formatAdminRole(role: string) {
  return roleLabels[role as AdminRole] ?? role;
}

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

export type UpdateAdminUserPayload = Omit<CreateAdminUserPayload, "password">;
