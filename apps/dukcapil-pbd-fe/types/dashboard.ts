export type DashboardIcon =
  | "users"
  | "userRound"
  | "idCard"
  | "building2"
  | "listChecks"
  | "clipboardList"
  | "image"
  | "fileText";

export type DashboardStat = {
  title: string;
  value: string;
  icon: DashboardIcon;
  color: string;
  trend: string;
  description: string;
};

export type DashboardActivity = {
  title: string;
  location: string;
  status: string;
  time: string;
  icon: DashboardIcon;
  color: string;
  description: string;
};

export type DashboardOverview = {
  tahunAnggaran: string;
  stats: DashboardStat[];
  activities: DashboardActivity[];
};
