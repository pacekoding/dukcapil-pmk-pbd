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
  | "clipboardCheck"
  | "messageSquare"
  | "calendarClock"
  | "monitorPlay"
  | "toggle"
  | "trophy"
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
    label: "Informasi",
    href: "/informasi",
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
    title: "MACEKU PKK",
    href: "/maceku-pkk/dashboard",
    icon: "users",
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
    title: "SITeKAD",
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
    title: "SIRBE",
    href: "/siber/dashboard",
    icon: "database",
  },
  {
    title: "SISURAT DUKCAPIL",
    href: "/sisurat/dashboard",
    icon: "fileText",
  },
  {
    title: "SIMONEV DUKCAPIL",
    href: "/simonev/dashboard",
    icon: "clipboardCheck",
  },
  {
    title: "OPTIMA-INFO",
    href: "/optima-info/dashboard",
    icon: "monitorPlay",
  },
  {
    title: "ARSIPKU",
    href: "/arsipku/dashboard",
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

export const macekuPkkMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/maceku-pkk/dashboard",
    icon: "home",
  },
  {
    title: "Profil PKK",
    href: "/maceku-pkk/data",
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
    title: "Data Kelompok Binaan",
    href: "/sitekad/data",
    icon: "database",
  },
  {
    title: "Capaian & Kendala",
    href: "/sitekad/capaian-kendala",
    icon: "trophy",
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

export const siberMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/siber/dashboard",
    icon: "home",
  },
  {
    title: "Data Dukcapil",
    href: "/siber/data",
    icon: "database",
  },
];

export const sisuratMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/sisurat/dashboard",
    icon: "home",
  },
  {
    title: "Daftar Surat Keluar",
    href: "/sisurat/surat-keluar",
    icon: "database",
  },
];

export const simonevMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/simonev/dashboard",
    icon: "home",
  },
  {
    title: "Data Form Monev",
    href: "/simonev/data",
    icon: "clipboardCheck",
  },
];

export const optimaInfoMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/optima-info/dashboard",
    icon: "home",
  },
  {
    title: "Tambah Informasi",
    href: "/optima-info/create",
    icon: "fileText",
  },
];

export const arsipPegawaiMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/arsipku/dashboard",
    icon: "home",
  },
  {
    title: "Data Pegawai",
    href: "/arsipku/data-pegawai",
    icon: "users",
  },
  {
    title: "Data Arsip",
    href: "/arsipku/data-arsip",
    icon: "folderArchive",
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
    roles: ["superadmin"],
  },
  {
    title: "Status Portal",
    href: "/dashboard/portal-apps",
    icon: "toggle",
    roles: ["superadmin"],
  },
  {
    title: "Data Kab/Kota",
    href: "/dashboard/kab-kota",
    icon: "map",
    roles: ["superadmin"],
  },
  {
    title: "Release Data Wilayah",
    href: "/dashboard/data-wilayah-release",
    icon: "calendarClock",
    roles: ["superadmin"],
  },
  {
    title: "Data SSD",
    href: "/dashboard/SDD",
    icon: "database",
    roles: ["superadmin"],
  },
  {
    title: "Subkegiatan",
    href: "/dashboard/subkegiatan",
    icon: "listChecks",
    roles: ["superadmin"],
  },
];
