import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";

export type OutgoingLetterPayload = {
  letterType: "radiogram";
  classification: "biasa" | "penting" | "segera" | "sangat_segera";
  letterNumber: string;
  letterDate: string;
  recipient: string;
  subject: string;
  openingText: string;
  sectionAAA: {
    agenda: string;
    day: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  sectionBBB: string;
  sectionCCC: string;
  sectionDDD: string;
  senderAgency: string;
  fromText: string;
  toText: string;
  copyTo: string[];
  signatoryName: string;
  signatoryPosition: string;
  signatoryRank: string;
  signatoryNip: string;
  status: "draft" | "selesai";
};

export type OutgoingLetter = OutgoingLetterPayload & {
  id: number;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
};

export type OutgoingLetterListResponse = {
  items: OutgoingLetter[];
  total: number;
  page: number;
  limit: number;
};

export type OutgoingLetterQuery = {
  q?: string;
  status?: "draft" | "selesai";
  letterType?: "radiogram";
  year?: string;
  page?: number;
  limit?: number;
};

export function getOutgoingLetters(query: OutgoingLetterQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const suffix = params.size ? `?${params.toString()}` : "";
  return apiRequest<OutgoingLetterListResponse>(
    `${apiEndpoints.outgoingLetters}${suffix}`,
  );
}

export function getOutgoingLetter(id: number) {
  return apiRequest<OutgoingLetter>(apiEndpoints.outgoingLetterDetail(id));
}

export function createOutgoingLetter(payload: OutgoingLetterPayload) {
  return apiRequest<OutgoingLetter>(apiEndpoints.outgoingLetters, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOutgoingLetter(id: number, payload: OutgoingLetterPayload) {
  return apiRequest<OutgoingLetter>(apiEndpoints.outgoingLetterDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteOutgoingLetter(id: number) {
  return apiRequest<null>(apiEndpoints.outgoingLetterDetail(id), {
    method: "DELETE",
  });
}

export function outgoingLetterPdfUrl(id: number) {
  return apiEndpoints.outgoingLetterPdf(id);
}
