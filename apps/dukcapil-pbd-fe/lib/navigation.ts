export type PublicMenuItem = {
  label: string;
  href: string;
};

export type DashboardMenuIcon =
  | "home"
  | "database"
  | "map"
  | "idCard"
  | "building2"
  | "fileText"
  | "folderArchive"
  | "listChecks"
  | "messageSquare"
  | "calendarClock"
  | "toggle"
  | "users"
  | "keyRound"
  | "settings";

export type DashboardMenuLink = {
  title: string;
  href: string;
  icon: DashboardMenuIcon;
  roles?: string[];
};

export type DashboardMenuGroup = {
  title: string;
  icon: DashboardMenuIcon;
  roles?: string[];
  children: DashboardMenuLink[];
};

export type DashboardMenuItem = DashboardMenuLink | DashboardMenuGroup;

export const publicMenus: PublicMenuItem[] = [
  {
    label: "Beranda",
    href: "/",
  },
  {
    label: "Profil",
    href: "/profil",
  },
  {
    label: "Data Wilayah",
    href: "/data-wilayah",
  },
  {
    label: "Layanan",
    href: "/#layanan",
  },
  {
    label: "Kontak",
    href: "/#kontak",
  },
];

export const dashboardMenus: DashboardMenuItem[] = [
  {
    title: "Portal Aplikasi",
    href: "/portal",
    icon: "home",
  },
  {
    title: "SIBUM Kampung",
    href: "/sibum/dashboard",
    icon: "building2",
  },
  {
    title: "SIKAMPUNG",
    href: "/sikampung/dashboard",
    icon: "map",
  },
  {
    title: "SiTEKAD",
    href: "/sitekad/dashboard",
    icon: "listChecks",
  },
  {
    title: "ASPIRASIKU",
    href: "/aspirasiku/dashboard",
    icon: "messageSquare",
  },
  {
    title: "SIDOKA",
    href: "/sidoka/dashboard",
    icon: "folderArchive",
  },
  {
    title: "SIDAK",
    href: "/sidak/dashboard",
    icon: "fileText",
  },
  {
    title: "ARSIPKU",
    href: "/arsip-pegawai",
    icon: "idCard",
  },
];

export const sibumMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/sibum/dashboard",
    icon: "home",
  },
  {
    title: "Data BUMKam",
    href: "/sibum/data",
    icon: "database",
  },
];

export const sikampungMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/sikampung/dashboard",
    icon: "home",
  },
  {
    title: "Data",
    href: "/sikampung/data",
    icon: "database",
  },
];

export const sitekadMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/sitekad/dashboard",
    icon: "home",
  },
  {
    title: "Data Potensi Kampung",
    href: "/sitekad/data",
    icon: "database",
  },
];

export const aspirasikuMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/aspirasiku/dashboard",
    icon: "home",
  },
  {
    title: "Data Aspirasi",
    href: "/aspirasiku/data",
    icon: "messageSquare",
  },
];

export const sidokaMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/sidoka/dashboard",
    icon: "home",
  },
  {
    title: "Data Pelaksanaan",
    href: "/sidoka/data",
    icon: "fileText",
  },
];

export const sidakMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/sidak/dashboard",
    icon: "home",
  },
  {
    title: "Data Pelaksanaan",
    href: "/sidak/data",
    icon: "fileText",
  },
];

export const arsipPegawaiMenus: DashboardMenuItem[] = [
  {
    title: "Data Pegawai",
    href: "/arsip-pegawai",
    icon: "users",
  },
];

export const settingsMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "home",
  },
  {
    title: "Pengguna Portal",
    href: "/dashboard/users",
    icon: "users",
  },
  {
    title: "Status Portal",
    href: "/dashboard/portal-apps",
    icon: "toggle",
  },
  {
    title: "Data Kab/Kota",
    href: "/dashboard/kab-kota",
    icon: "map",
  },
  {
    title: "Release Data Wilayah",
    href: "/dashboard/data-wilayah-release",
    icon: "calendarClock",
  },
  {
    title: "Data SSD",
    href: "/dashboard/SDD",
    icon: "database",
  },
  {
    title: "Subkegiatan",
    href: "/dashboard/Subkegiatan",
    icon: "listChecks",
  },
];
