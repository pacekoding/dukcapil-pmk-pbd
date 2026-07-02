import type {
  RealisasiSubkegiatan,
  StatusCapaian,
} from "@/types/realisasi-subkegiatan";

export const today = () => new Date().toISOString().slice(0, 10);

const backendAssetOrigin =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080";

export const assetUrl = (url: string) =>
  url.startsWith("http") ? url : `${backendAssetOrigin}${url}`;

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const statusCapaianOptions: Array<StatusCapaian | "semua"> = [
  "semua",
  "Target Belum Diisi",
  "Belum Ada Realisasi",
  "Belum Tercapai",
  "Tercapai",
  "Melebihi Target",
];

export const formatOutputValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatOutputWithUnit = (
  value: number | null | undefined,
  unit: string | null | undefined,
) => {
  const formattedValue = formatOutputValue(value);
  if (formattedValue === "-") {
    return "-";
  }
  const normalizedUnit = unit?.trim();
  return normalizedUnit ? `${formattedValue} ${normalizedUnit}` : formattedValue;
};

export const formatCapaian = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "Target belum diisi";
  }
  return `${formatOutputValue(value)}%`;
};

export const calculateCapaian = (
  target: number | null | undefined,
  realisasi: number | null | undefined,
) => {
  if (!target || target <= 0) {
    return null;
  }
  return Math.round(((realisasi ?? 0) / target) * 100 * 100) / 100;
};

export const getStatusCapaian = (
  target: number | null | undefined,
  realisasi: number | null | undefined,
): StatusCapaian => {
  if (!target || target <= 0) {
    return "Target Belum Diisi";
  }
  if (!realisasi || realisasi <= 0) {
    return "Belum Ada Realisasi";
  }
  if (realisasi < target) {
    return "Belum Tercapai";
  }
  if (realisasi === target) {
    return "Tercapai";
  }
  return "Melebihi Target";
};

export const parseOptionalNumber = (value: string) => {
  if (value.trim() === "") {
    return null;
  }
  return Math.max(0, Number(value) || 0);
};

export const getStatusCapaianBadgeClass = (status?: string) => {
  switch (status) {
    case "Tercapai":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Melebihi Target":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Belum Tercapai":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Belum Ada Realisasi":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

export const getSSDValueStatus = (item: RealisasiSubkegiatan) => {
  const total = item.jumlahSsd || item.subkegiatan?.ssdItems?.length || 0;
  const filled = item.jumlahSsdData || 0;

  if (total === 0) {
    return {
      className: "border-slate-200 bg-slate-50 text-slate-600",
      label: "Tanpa SSD",
      tone: "empty" as const,
    };
  }

  if (filled >= total) {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: `${filled}/${total} terisi`,
      tone: "complete" as const,
    };
  }

  return {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    label: `${filled}/${total} terisi`,
    tone: "partial" as const,
  };
};
