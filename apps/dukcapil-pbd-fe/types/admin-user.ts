export const roleOptions = [
  "superadmin",
  "admin_dukcapil",
  "admin_pmk",
  "admin_sekretariat",
] as const;

export const systemAccessOptions = [
  {
    value: "maceku_pkk",
    label: "MACEKU PKK",
  },
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
    label: "SITeKAD",
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
    value: "siber",
    label: "SIRBE",
  },
  {
    value: "sisurat",
    label: "SISURAT DUKCAPIL",
  },
  {
    value: "simonev",
    label: "SIMONEV DUKCAPIL",
  },
  {
    value: "optima_info",
    label: "OPTIMA-INFO",
  },
  {
    value: "arsip_pegawai",
    label: "ARSIPKU",
  },
] as const;

export type AdminRole = (typeof roleOptions)[number];

export type SystemAccess = (typeof systemAccessOptions)[number]["value"];

export type UserRegionScope = {
  kabupatenKota: string;
  distrik: string;
  kampung: string;
};

export type AdminUser = {
  id: number;
  username: string;
  name: string;
  role: AdminRole;
  systemAccess: SystemAccess[];
  regionScope: UserRegionScope;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserPayload = {
  username: string;
  name: string;
  role: AdminRole;
  systemAccess: SystemAccess[];
  regionScope: UserRegionScope;
  password: string;
  isActive: boolean;
};

export type UpdateAdminUserPayload = Omit<CreateAdminUserPayload, "password">;
