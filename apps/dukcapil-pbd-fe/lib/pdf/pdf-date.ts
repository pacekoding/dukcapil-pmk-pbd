// lib/pdf/pdf-date.ts

export function formatPdfDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",

      month: "long",

      year: "numeric",
    },
  ).format(date);
}