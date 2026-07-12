export type PortalAppStatus = "Aktif" | "Pemeliharaan" | "Nonaktif";

export type PortalAppStatusItem = {
  accessKey: string;
  status: PortalAppStatus;
  updatedAt: string;
};

export type PortalAppStatusPayload = {
  apps: Array<{
    accessKey: string;
    status: PortalAppStatus;
  }>;
};
