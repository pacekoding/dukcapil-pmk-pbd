export type TravelKind = "assignment-letters" | "spd";
export type TravelStatus = "Draft" | "Final" | "Dibatalkan";
export type TravelPerson = {
  id: number;
  name: string;
  nip: string;
  rank: string;
  position: string;
  bidang: string;
  unit: string;
  status: string;
};
export type TravelOffice = {
  governmentName: string;
  provinceName: string;
  agencyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
};
export type TravelAudit = {
  status: TravelStatus;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  finalizedBy: number | null;
  cancelledAt: string | null;
  cancelledBy: number | null;
  cancellationReason: string;
};
export type TravelAssignmentPayload = {
  activityExecutionId: number | null;
  number: string;
  documentDate: string;
  issuePlace: string;
  bases: string[];
  instructions: string[];
  employeeIds: number[];
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: string;
  transport: string;
  signerId: number;
};
export type TravelAssignmentSnapshot = {
  activity: import("./activity-execution").ActivityExecution | null;
  office: TravelOffice;
  employees: TravelPerson[];
  signer: TravelPerson;
};
export type TravelAssignment = TravelAssignmentPayload &
  TravelAudit & {
    id: number;
    snapshot: TravelAssignmentSnapshot | null;
    activity: import("./activity-execution").ActivityExecution | null;
    employees: TravelPerson[];
    signer: TravelPerson;
    office: TravelOffice;
    durationDays: number;
  };
export type TravelFollower = {
  name: string;
  birthDate: string;
  description: string;
};
export type TravelApproval = {
  arrivalPlace: string;
  arrivalDate: string;
  departurePlace: string;
  destination: string;
  departureDate: string;
  arrivalOfficerName: string;
  arrivalOfficerNip: string;
  arrivalOfficerPosition: string;
  departureOfficerName: string;
  departureOfficerNip: string;
  departureOfficerPosition: string;
};
export type TravelOrderPayload = {
  activityExecutionId: number | null;
  assignmentLetterId: number;
  employeeId: number;
  number: string;
  sheetNumber: string;
  code: string;
  documentDate: string;
  issuePlace: string;
  signerId: number;
  signerRole: string;
  expenseLevel: string;
  followers: TravelFollower[];
  approvals: TravelApproval[];
  skpd: string;
  subkegiatanId: number | null;
  accountCode: string;
  fundingSource: string;
  fiscalYear: number;
  notes: string;
  returnedPlace: string;
  returnedDate: string;
  returnOfficerName: string;
  returnOfficerNip: string;
  returnOfficerPosition: string;
};
export type TravelOrderSnapshot = {
  activity: import("./activity-execution").ActivityExecution | null;
  office: TravelOffice;
  employee: TravelPerson;
  signer: TravelPerson;
  assignmentNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  transport: string;
  tripType: string;
  purpose: string;
  program: string;
  kegiatan: string;
  subkegiatan: string;
};
export type TravelOrder = TravelOrderPayload &
  TravelAudit & {
    id: number;
    snapshot: TravelOrderSnapshot | null;
    details: TravelOrderSnapshot;
    durationDays: number;
  };
export type TravelDocument = TravelAssignment | TravelOrder;
export type TravelOptions = {
  employees: TravelPerson[];
  subkegiatan: import("./subkegiatan").Subkegiatan[];
  office: TravelOffice;
};
export type TravelFilters = {
  activityId?: number | null;
  year: string;
  status: string;
  search: string;
  employeeId: number | null;
  destination: string;
};
