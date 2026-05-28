export type DashboardIcon = "calendar" | "play" | "checkCircle" | "fileText";

export type DashboardActivityStatus = "Berjalan" | "Selesai" | "Draft";

export type DashboardStat = {
  title: string;
  value: string;
  icon: DashboardIcon;
  color: string;
  trend: string;
};

export type DashboardActivity = {
  title: string;
  location: string;
  status: DashboardActivityStatus;
  time: string;
  icon: DashboardIcon;
  color: string;
};

export type DashboardOverview = {
  tahunAnggaran: string;
  stats: DashboardStat[];
  activities: DashboardActivity[];
};
