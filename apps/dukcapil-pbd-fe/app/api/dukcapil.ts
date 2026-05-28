import {
  indicatorData,
  kpiStatistics,
  statistikTable,
} from "@/lib/dummy/dukcapil-data";

export async function getKpiStatistics() {
  // simulasi API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  return kpiStatistics;
}

export async function getIndicators() {
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  return indicatorData;
}

export async function getStatistikTable() {
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  return statistikTable;
}
