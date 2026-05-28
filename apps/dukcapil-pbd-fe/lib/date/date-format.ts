const monthNameToNumber: Record<string, string> = {
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12",
};

const monthNumberToName: Record<string, string> = {
  "01": "Januari",
  "02": "Februari",
  "03": "Maret",
  "04": "April",
  "05": "Mei",
  "06": "Juni",
  "07": "Juli",
  "08": "Agustus",
  "09": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Desember",
};

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

export function toDateInputValue(value: string) {
  const trimmedValue = value.trim();

  if (dateInputPattern.test(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedValue = trimmedValue.replace(",", "");
  const parts = normalizedValue.split(/\s+/);
  const dateParts = parts.length === 4 ? parts.slice(1) : parts;

  if (dateParts.length !== 3) {
    return "";
  }

  const [day, monthName, year] = dateParts;
  const month = monthNameToNumber[monthName.toLowerCase()];

  if (!month || !/^\d{4}$/.test(year)) {
    return "";
  }

  return `${year}-${month}-${day.padStart(2, "0")}`;
}

export function formatDateForDisplay(value: string) {
  const inputValue = toDateInputValue(value);

  if (!inputValue) {
    return value;
  }

  const [year, month, day] = inputValue.split("-");
  const monthName = monthNumberToName[month];

  if (!monthName) {
    return value;
  }

  return `${Number(day)} ${monthName} ${year}`;
}
