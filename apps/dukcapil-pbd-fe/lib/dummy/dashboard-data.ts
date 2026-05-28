import type { DashboardActivity, DashboardStat } from "@/types/dashboard";

export type {
  DashboardActivity,
  DashboardActivityStatus,
  DashboardIcon,
  DashboardOverview,
  DashboardStat,
} from "@/types/dashboard";

export const dashboardStats: DashboardStat[] = [
  {
    title: "Total Kegiatan",
    value: "128",
    icon: "calendar",
    color: "bg-blue-50 text-blue-600",
    trend: "+12%",
  },
  {
    title: "Kegiatan Berjalan",
    value: "48",
    icon: "play",
    color: "bg-emerald-50 text-emerald-600",
    trend: "+12%",
  },
  {
    title: "Kegiatan Selesai",
    value: "72",
    icon: "checkCircle",
    color: "bg-amber-50 text-amber-600",
    trend: "+12%",
  },
  {
    title: "Laporan Dibuat",
    value: "68",
    icon: "fileText",
    color: "bg-violet-50 text-violet-600",
    trend: "+12%",
  },
];

export const dashboardActivities: DashboardActivity[] = [
  {
    title: "Sosialisasi Administrasi Kependudukan",
    location: "Kota Sorong",
    status: "Berjalan",
    time: "2 jam lalu",
    icon: "calendar",
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Bimtek Operator SIAK",
    location: "Kabupaten Sorong",
    status: "Berjalan",
    time: "5 jam lalu",
    icon: "play",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Pendampingan Pengelolaan Kampung",
    location: "Raja Ampat",
    status: "Selesai",
    time: "1 hari lalu",
    icon: "checkCircle",
    color: "bg-amber-50 text-amber-600",
  },
];
