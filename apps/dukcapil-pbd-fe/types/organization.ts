export type OrganizationKind = "fields" | "sections" | "positions";

export type OrganizationItem = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  bidangId: number | null;
  seksiId: number | null;
  bidangName: string;
  seksiName: string;
  sectionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationField = OrganizationItem;
export type OrganizationSection = OrganizationItem & { bidangId: number };
export type OrganizationPosition = OrganizationItem & { bidangId: number };

export type OrganizationPayload = Pick<
  OrganizationItem,
  "name" | "code" | "isActive" | "bidangId" | "seksiId"
>;
export type OrganizationData = Record<OrganizationKind, OrganizationItem[]>;
export type OrganizationSelection = {
  bidangId: number | null;
  seksiId: number | null;
  jabatanId: number | null;
};
