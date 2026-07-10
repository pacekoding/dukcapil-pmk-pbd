export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const formatFileSize = (size: number) => {
  if (size <= 0) {
    return "0 KB";
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatOutputValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
};
