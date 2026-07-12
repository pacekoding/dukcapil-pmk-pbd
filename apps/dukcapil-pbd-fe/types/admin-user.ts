export const roleOptions = [
  "superadmin",
  "admin_dukcapil",
  "admin_pmk",
  "admin_sekretariat",
] as const;

export const systemAccessOptions = [
  {
    value: "sibum",
    label: "SIBUM Kampung",
  },
  {
    value: "sikampung",
    label: "SIKAMPUNG",
  },
  {
    value: "sitekad",
    label: "SiTEKAD",
  },
  {
    value: "aspirasiku",
    label: "ASPIRASIKU",
  },
  {
    value: "sidoka",
    label: "SIDOKA",
  },
  {
    value: "sidak",
    label: "SIDAK",
  },
  {
    value: "arsip_pegawai",
    label: "ARSIPKU",
  },
] as const;

export type AdminRole = (typeof roleOptions)[number];

export type SystemAccess = (typeof systemAccessOptions)[number]["value"];

export type AdminUser = {
  id: number;
  username: string;
  name: string;
  role: AdminRole;
  systemAccess: SystemAccess[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserPayload = {
  username: string;
  name: string;
  role: AdminRole;
  systemAccess: SystemAccess[];
  password: string;
  isActive: boolean;
};

export type UpdateAdminUserPayload = Omit<CreateAdminUserPayload, "password">;
