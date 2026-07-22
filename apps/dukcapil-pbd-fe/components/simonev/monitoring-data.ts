"use client";

export type ChecklistStatus = "Ya" | "Tidak" | "";
export type FollowUpStatus = "Selesai" | "Dalam Proses" | "Belum Dilaksanakan";

export type ChecklistItem = {
  id: string;
  indikator: string;
  status: ChecklistStatus;
  keterangan: string;
};

export type FollowUpItem = {
  id: string;
  permasalahan: string;
  rekomendasi: string;
  penanggungJawab: string;
  targetWaktu: string;
  status: FollowUpStatus;
};

export type MonitoringRecord = {
  id: string;
  subkegiatan: string;
  lokus: string;
  waktu: string;
  namaMonev: string;
  checklist: ChecklistItem[];
  tindakLanjut: FollowUpItem[];
};

export type MonitoringFormState = Omit<MonitoringRecord, "id">;

export const monitoringStorageKey = "simonev:monitoring-records";

export const defaultChecklistIndicators = [
  "Data pelayanan akta kelahiran tersedia",
  "Data pelayanan akta kematian tersedia",
  "Data akta perkawinan tersedia",
  "Data akta perceraian tersedia",
  "Data pengakuan anak tersedia",
  "Data perubahan status WNI tersedia",
  "Data perubahan nama tersedia",
  "Pelayanan KTP-el berjalan",
  "Pelayanan KK berjalan",
  "Pelayanan KIA berjalan",
  "Pelayanan pindah datang berjalan",
  "Pelayanan pindah keluar berjalan",
  "Pendataan penduduk orang asli papua (OAP)",
];

export const followUpStatusOptions: FollowUpStatus[] = [
  "Selesai",
  "Dalam Proses",
  "Belum Dilaksanakan",
];

export const minimumPreviewRows = 5;

export const initialMonitoringData: MonitoringRecord[] = [
  {
    id: "monev-1",
    subkegiatan: "Penyelenggaraan pencatatan sipil kabupaten/kota",
    lokus: "Kota Sorong",
    waktu: "2026-07-21",
    namaMonev: "Monev Pelayanan Capil Kota Sorong",
    checklist: defaultChecklistIndicators.map((indikator, index) => ({
      id: `check-1-${index}`,
      indikator,
      status: index < 9 ? "Ya" : index < 11 ? "Tidak" : "",
      keterangan:
        index === 9
          ? "Ketersediaan blanko perlu dikonfirmasi ulang."
          : index === 10
            ? "Masih menunggu rekapitulasi lokus."
            : "",
    })),
    tindakLanjut: [
      {
        id: "follow-1",
        permasalahan: "Rekap data pelayanan pindah datang belum lengkap.",
        rekomendasi: "Kabupaten/kota melengkapi rekap dan bukti dukung.",
        penanggungJawab: "Bidang PIAK dan pemanfaatan data",
        targetWaktu: "2026-08-05",
        status: "Dalam Proses",
      },
    ],
  },
];

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyFollowUp(): FollowUpItem {
  return {
    id: createId(),
    permasalahan: "",
    rekomendasi: "",
    penanggungJawab: "",
    targetWaktu: "",
    status: "Belum Dilaksanakan",
  };
}

export function createEmptyChecklistItem(): ChecklistItem {
  return {
    id: createId(),
    indikator: "",
    status: "",
    keterangan: "",
  };
}

export function createEmptyFormState(): MonitoringFormState {
  return {
    subkegiatan: "",
    lokus: "",
    waktu: "",
    namaMonev: "",
    checklist: Array.from({ length: minimumPreviewRows }, createEmptyChecklistItem),
    tindakLanjut: Array.from({ length: minimumPreviewRows }, createEmptyFollowUp),
  };
}

export function recordToFormState(record: MonitoringRecord): MonitoringFormState {
  return {
    subkegiatan: record.subkegiatan,
    lokus: record.lokus,
    waktu: record.waktu,
    namaMonev: record.namaMonev,
    checklist: padChecklistForForm(record.checklist.map((item) => ({ ...item }))),
    tindakLanjut: padFollowUpsForForm(
      record.tindakLanjut.map((item) => ({ ...item })),
    ),
  };
}

function padChecklistForForm(items: ChecklistItem[]) {
  const rows = [...items];

  while (rows.length < minimumPreviewRows) {
    rows.push(createEmptyChecklistItem());
  }

  return rows;
}

function padFollowUpsForForm(items: FollowUpItem[]) {
  const rows = [...items];

  while (rows.length < minimumPreviewRows) {
    rows.push(createEmptyFollowUp());
  }

  return rows;
}

export function normalizeFollowUps(items: FollowUpItem[]) {
  return items.filter((item) =>
    [
      item.permasalahan,
      item.rekomendasi,
      item.penanggungJawab,
      item.targetWaktu,
    ].some((value) => value.trim()),
  );
}

export function readMonitoringRecords() {
  if (typeof window === "undefined") {
    return initialMonitoringData;
  }

  try {
    const raw = window.localStorage.getItem(monitoringStorageKey);
    if (!raw) {
      return initialMonitoringData;
    }

    const parsed = JSON.parse(raw) as MonitoringRecord[];
    return Array.isArray(parsed) && parsed.length ? parsed : initialMonitoringData;
  } catch (error) {
    console.error(error);
    return initialMonitoringData;
  }
}

export function writeMonitoringRecords(records: MonitoringRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(monitoringStorageKey, JSON.stringify(records));
}

export function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "format-monitoring"
  );
}
