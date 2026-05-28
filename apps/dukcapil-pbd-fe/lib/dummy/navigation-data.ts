export type PublicMenuItem = {
  label: string;
  href: string;
};

export type DashboardMenuIcon = "home" | "calendar" | "fileText";

export type DashboardMenuItem = {
  title: string;
  href: string;
  icon: DashboardMenuIcon;
};

export const publicMenus: PublicMenuItem[] = [
  {
    label: "Beranda",
    href: "/",
  },
  {
    label: "Kegiatan",
    href: "/kegiatan",
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
    title: "Kegiatan",
    href: "/dashboard/kegiatan",
    icon: "calendar",
  },
  {
    title: "Dokumen",
    href: "/dashboard/dokumen",
    icon: "fileText",
  },
];
