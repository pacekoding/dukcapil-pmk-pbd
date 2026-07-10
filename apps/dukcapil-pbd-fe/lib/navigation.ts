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
    label: "Peta GIS",
    href: "/peta-geojson",
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
    title: "SIDOKA",
    href: "/sidoka/data",
    icon: "folderArchive",
  },
  {
    title: "Arsipku",
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

export const sidokaMenus: DashboardMenuItem[] = [
  {
    title: "Data Pelaksanaan",
    href: "/sidoka/data",
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
    title: "Data Kab/Kota",
    href: "/dashboard/kab-kota",
    icon: "map",
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
