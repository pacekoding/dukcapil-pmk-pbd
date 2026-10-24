import type {
  TravelAssignment,
  TravelAssignmentPayload,
  TravelDocument,
  TravelOrderPayload,
} from "../types/travel";
export const travelToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jayapura",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const isTravelAssignment = (
  doc: TravelDocument,
): doc is TravelAssignment => "employeeIds" in doc;
export function travelDuration(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
}
export function createAssignmentForm(): TravelAssignmentPayload {
  return {
    activityExecutionId: null,
    number: "",
    documentDate: travelToday(),
    issuePlace: "",
    bases: [""],
    instructions: [""],
    employeeIds: [],
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    tripType: "Dalam Daerah",
    transport: "",
    signerId: 0,
  };
}
export function createOrderForm(agency: string): TravelOrderPayload {
  return {
    activityExecutionId: null,
    assignmentLetterId: 0,
    employeeId: 0,
    number: "",
    sheetNumber: "1",
    code: "",
    documentDate: travelToday(),
    issuePlace: "",
    signerId: 0,
    signerRole: "Pejabat Pembuat Komitmen",
    expenseLevel: "",
    followers: [],
    approvals: [],
    skpd: agency,
    subkegiatanId: null,
    accountCode: "",
    fundingSource: "",
    fiscalYear: Number(travelToday().slice(0, 4)),
    notes: "",
    returnedPlace: "",
    returnedDate: "",
    returnOfficerName: "",
    returnOfficerNip: "",
    returnOfficerPosition: "",
  };
}
export function assignmentFormPayload(
  a: TravelAssignment,
): TravelAssignmentPayload {
  const p = createAssignmentForm();
  for (const key of Object.keys(p) as (keyof TravelAssignmentPayload)[])
    Object.assign(p, { [key]: a[key] });
  return p;
}
