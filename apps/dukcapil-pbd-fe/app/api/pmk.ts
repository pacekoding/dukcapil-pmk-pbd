import {
  pmkIndicators,
  pmkPrograms,
  pmkStatistics,
} from "@/lib/dummy/pmk-data";

export async function getPMKStatistics() {
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  return pmkStatistics;
}

export async function getPMKIndicators() {
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  return pmkIndicators;
}

export async function getPMKPrograms() {
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  return pmkPrograms;
}
