import type {
  ActivityDocumentKind,
  ActivityParty,
  ActivityParticipant,
} from "../types/activity-execution";
export const activityRoot = "/internal/pelaksanaan-kegiatan";
export const activityDocumentLabels: Record<string, string> = {
  "assignment-letters": "Surat Tugas",
  spd: "Surat Perjalanan Dinas",
  invitations: "Surat Undangan",
  attendance: "Daftar Hadir",
  minutes: "Notula",
  records: "Berita Acara",
  reports: "Laporan Kegiatan",
  photo: "Dokumentasi",
  support: "Dokumen Pendukung",
  receipts: "Tanda Terima / Daftar Penerima",
};
export const activityDocumentRoutes: Record<string, string> = {
  "assignment-letters": "surat-tugas",
  spd: "spd",
  invitations: "surat-undangan",
  attendance: "daftar-hadir",
  minutes: "notula",
  records: "berita-acara",
  reports: "laporan",
  photo: "dokumentasi",
  receipts: "daftar-penerima",
};
export const activityTypes = [
  "Rapat / Rakor",
  "Sosialisasi",
  "Pelatihan",
  "Monitoring dan Evaluasi",
  "Perjalanan Dinas",
  "Penyerahan Bantuan",
  "Distribusi Barang",
  "Kegiatan Lapangan",
  "Lainnya",
];
export const documentKinds: ActivityDocumentKind[] = [
  "invitations",
  "attendance",
  "minutes",
  "records",
  "reports",
];
export function activityRecommendations(type: string): string[] {
  switch (type) {
    case "Rapat / Rakor":
      return ["invitations", "attendance", "minutes", "reports", "photo"];
    case "Sosialisasi":
    case "Pelatihan":
      return ["invitations", "attendance", "reports", "photo"];
    case "Monitoring dan Evaluasi":
    case "Perjalanan Dinas":
      return ["assignment-letters", "spd", "records", "reports", "photo"];
    case "Penyerahan Bantuan":
    case "Distribusi Barang":
      return ["assignment-letters", "receipts", "records", "reports", "photo"];
    case "Kegiatan Lapangan":
      return ["assignment-letters", "reports", "photo"];
    default:
      return [];
  }
}
export const blankParty = (): ActivityParty => ({
  employeeId: null,
  name: "",
  nip: "",
  rank: "",
  position: "",
  institution: "",
  address: "",
  role: "",
});
export const blankParticipant = (): ActivityParticipant => ({
  employeeId: null,
  name: "",
  identification: "",
  position: "",
  institution: "",
  phone: "",
  address: "",
  village: "",
  kabKota: "",
  assistanceType: "",
  quantity: 0,
  unit: "",
  attendanceStatus: "Hadir",
  signatureFileId: null,
  notes: "",
});
export const activityDocumentHref = (kind: string, id: number) =>
  `${activityRoot}/${activityDocumentRoutes[kind] ?? ""}?activityId=${id}`;
export function activityProgress(
  items: { recommended: boolean; finalCount: number }[],
) {
  const recommended = items.filter((x) => x.recommended);
  return {
    complete: recommended.filter((x) => x.finalCount > 0).length,
    total: recommended.length,
  };
}
