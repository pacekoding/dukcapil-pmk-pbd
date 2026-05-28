import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  dashboardActivities,
  dashboardStats,
} from "@/lib/dummy/dashboard-data";
import type { DashboardOverview } from "@/types/dashboard";

const dashboardStatsByYear: Record<
  string,
  Array<{
    value: string;
    trend: string;
  }>
> = {
  "2026": [
    { value: "128", trend: "+12%" },
    { value: "48", trend: "+12%" },
    { value: "72", trend: "+12%" },
    { value: "68", trend: "+12%" },
  ],
  "2025": [
    { value: "112", trend: "+8%" },
    { value: "0", trend: "Tutup TA" },
    { value: "104", trend: "+9%" },
    { value: "76", trend: "+11%" },
  ],
  "2024": [
    { value: "94", trend: "+6%" },
    { value: "0", trend: "Tutup TA" },
    { value: "88", trend: "+7%" },
    { value: "61", trend: "+8%" },
  ],
};

function getDashboardStatsByYear(tahunAnggaran: string) {
  const yearValues =
    dashboardStatsByYear[tahunAnggaran] ?? dashboardStatsByYear["2026"];

  return dashboardStats.map((item, index) => ({
    ...item,
    value: yearValues[index]?.value ?? item.value,
    trend: yearValues[index]?.trend ?? item.trend,
  }));
}

function getDashboardActivitiesByYear(tahunAnggaran: string) {
  return dashboardActivities.map((item) => ({
    ...item,
    time:
      tahunAnggaran === "2026"
        ? item.time
        : `TA ${tahunAnggaran}`,
  }));
}

export async function GET() {
  const cookieStore = await cookies();
  const tahunAnggaran = cookieStore.get("tahun_anggaran")?.value ?? "2026";

  const data: DashboardOverview = {
    tahunAnggaran,
    stats: getDashboardStatsByYear(tahunAnggaran),
    activities: getDashboardActivitiesByYear(tahunAnggaran),
  };

  return NextResponse.json({
    data,
  });
}
