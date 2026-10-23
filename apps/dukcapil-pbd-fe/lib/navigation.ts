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
    label: "Layanan",
    href: "/#layanan",
  },
  {
    label: "Kontak",
    href: "/#kontak",
  },
];

export const internalMenus: DashboardMenuItem[] = [
  {
    title: "Dashboard",
    href: "/internal/dashboard",
    icon: "home",
  },
  {
    title: "Umum",
    icon: "users",
    children: [
      {
        title: "Pegawai",
        href: "/internal/pegawai",
        icon: "idCard",
      },
      {
        title: "Arsip",
        href: "/internal/arsip",
        icon: "folderArchive",
      },
    ],
  },
  {
    title: "Dukcapil",
    icon: "database",
    children: [
      {
        title: "Data Kependudukan",
        href: "/internal/dukcapil/kependudukan",
        icon: "database",
      },
      {
        title: "Data Pencatatan Sipil",
        href: "/internal/dukcapil/pencatatan-sipil",
        icon: "fileText",
      },
    ],
  },
  {
    title: "Pemberdayaan",
    icon: "building2",
    children: [
      {
        title: "BUM Kampung",
        href: "/internal/sibumkam/data",
        icon: "building2",
      },
      {
        title: "Potensi Kampung",
        href: "/internal/sitekad/data",
        icon: "listChecks",
      },
      {
        title: "Data Kampung",
        href: "/internal/sikampung/data",
        icon: "map",
      },
    ],
  },
];
