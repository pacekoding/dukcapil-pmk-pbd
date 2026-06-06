export type PublicMenuItem = {
  label: string;
  href: string;
};

export type DashboardMenuIcon =
  | "home"
  | "map"
  | "fileText"
  | "listChecks"
  | "clipboardList"
  | "users"
  | "keyRound";

export type DashboardMenuItem = {
  title: string;
  href: string;
  icon: DashboardMenuIcon;
  roles?: string[];
};

export const publicMenus: PublicMenuItem[] = [
  {
    label: "Beranda",
    href: "/",
  },
  {
    label: "Data Wilayah",
    href: "/data-wilayah",
  },
  {
    label: "Profil",
    href: "/profil",
  },
];

export const dashboardMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "home",
  },
  {
    title: "Data Wilayah",
    href: "/dashboard/data-wilayah",
    icon: "map",
  },
  {
    title: "Data SSD",
    href: "/dashboard/ssd",
    icon: "fileText",
  },
  {
    title: "Subkegiatan",
    href: "/dashboard/subkegiatan",
    icon: "listChecks",
  },
  {
    title: "Realisasi Subkegiatan",
    href: "/dashboard/realisasi-subkegiatan",
    icon: "clipboardList",
  },
  {
    title: "User Admin",
    href: "/dashboard/users",
    icon: "users",
    roles: ["superadmin"],
  },
];
