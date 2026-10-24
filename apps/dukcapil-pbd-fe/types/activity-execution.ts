import type {
  TravelAudit,
  TravelPerson,
  TravelOffice,
  TravelAssignment,
  TravelOrder,
} from "./travel";
export type ActivityDocumentKind =
  | "invitations"
  | "attendance"
  | "minutes"
  | "records"
  | "reports"
  | "receipts";
export type ActivityPayload = {
  subkegiatanId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  fiscalYear: number;
  fundingSource: string;
  pptkEmployeeId: number;
  responsibleEmployeeId: number;
  activityType: string;
  kabKotaId: number | null;
  status: string;
  recommendedDocuments: string[];
};
export type ActivityChecklist = {
  kind: string;
  finalCount: number;
  draftCount: number;
  recommended: boolean;
};
export type ActivityExecution = ActivityPayload & {
  id: number;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  program: string;
  kegiatan: string;
  subkegiatan: string;
  kabKotaName: string;
  pptk: TravelPerson;
  responsible: TravelPerson;
  office: TravelOffice;
  checklist: ActivityChecklist[];
};
export type ActivityParty = {
  employeeId: number | null;
  name: string;
  nip: string;
  rank: string;
  position: string;
  institution: string;
  address: string;
  role: string;
};
export type ActivityParticipant = {
  rank?: string;
  id?: number;
  documentId?: number;
  employeeId: number | null;
  name: string;
  identification: string;
  position: string;
  institution: string;
  phone: string;
  address: string;
  village: string;
  kabKota: string;
  assistanceType: string;
  quantity: number;
  unit: string;
  attendanceStatus: string;
  signatureFileId: number | null;
  notes: string;
  sortOrder?: number;
};
export type ActivitySection = { key: string; title: string; body: string };
export type ActivityContent = {
  nature: string;
  attachmentNotice: string;
  subject: string;
  preamble: string;
  closing: string;
  eventDate: string;
  time: string;
  location: string;
  agenda: string;
  invitationReference: string;
  chairEmployeeId: number | null;
  notetakerEmployeeId: number | null;
  recordType: string;
  recipients: ActivityParty[];
  signers: ActivityParty[];
  copies: string[];
  bases: string[];
  sections: ActivitySection[];
  followUps: {
    description: string;
    responsible: ActivityParty;
    dueDate: string;
    status: string;
  }[];
  goods: { name: string; quantity: number; unit: string; condition: string }[];
};
export type ActivityFile = {
  id: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  previewUrl: string;
  downloadUrl: string;
};
export type ActivityAttachment = {
  id: number;
  activityExecutionId: number;
  fileId: number;
  kind: "photo" | "support";
  category: string;
  caption: string;
  takenAt: string;
  locationDescription: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  file: ActivityFile;
};
export type ActivityDocumentLink = {
  id: number;
  kind: string;
  number: string;
  status: string;
};
export type ActivitySnapshot = {
  execution: ActivityExecution;
  office: TravelOffice;
  content: ActivityContent;
  participants: ActivityParticipant[];
  chair: TravelPerson | null;
  notetaker: TravelPerson | null;
  relatedDocuments: ActivityDocumentLink[];
  photos: ActivityAttachment[];
};
export type ActivityDocumentPayload = {
  activityExecutionId: number;
  kind: ActivityDocumentKind;
  documentNumber: string;
  documentDate: string;
  content: ActivityContent;
  participants: ActivityParticipant[];
};
export type ActivityDocument = ActivityDocumentPayload &
  TravelAudit & {
    id: number;
    snapshot: ActivitySnapshot | null;
    details: ActivitySnapshot;
  };
export type ActivityDetail = {
  execution: ActivityExecution;
  documents: ActivityDocument[];
  assignments: TravelAssignment[];
  orders: TravelOrder[];
  attachments: ActivityAttachment[];
};
