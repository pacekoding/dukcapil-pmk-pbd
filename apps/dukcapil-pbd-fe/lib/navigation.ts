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
  | "globe"
  | "listChecks"
  | "users"
  | "settings"
  | "tags";

export type DashboardMenuLink = {
  title: string;
  href: string;
  icon: DashboardMenuIcon;
  roles?: string[];
};

export type DashboardMenuGroup = {
  href?: string;
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
    label: "Data Labelisasi Otsus",
    href: "/labelisasi-otsus",
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
    title: "UMUM",
    icon: "users",
    roles: ["superadmin", "admin_sekretariat"],
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
    roles: ["superadmin", "admin_dukcapil"],
    children: [
      {
        title: "Pendaftaran Penduduk",
        href: "/internal/dukcapil/pendaftaran-penduduk",
        icon: "database",
      },
      {
        title: "Pencatatan Sipil",
        href: "/internal/dukcapil/pencatatan-sipil",
        icon: "fileText",
      },
    ],
  },
  {
    title: "PMK",
    icon: "building2",
    roles: ["superadmin", "admin_pmk"],
    children: [
      {
        title: "BUM Kampung",
        href: "/internal/pmk/bum-kampung",
        icon: "building2",
      },
      {
        title: "Potensi Kampung",
        href: "/internal/pmk/kelompok-binaan",
        icon: "listChecks",
      },
      {
        title: "Data Kampung",
        href: "/internal/pmk/data-kampung",
        icon: "map",
      },
    ],
  },
  {
    title: "Labelisasi Otsus",
    href: "/internal/otsus",
    icon: "tags",
  },
  {
    title: "Pengaturan",
    icon: "settings",
    roles: ["superadmin"],
    children: [
      {
        title: "Struktur Organisasi",
        href: "/internal/pengaturan/struktur-organisasi",
        icon: "building2",
      },
      {
        title: "Subkegiatan",
        href: "/internal/pengaturan/subkegiatan",
        icon: "listChecks",
      },
      {
        title: "Pengguna",
        href: "/internal/pengaturan/pengguna",
        icon: "users",
      },
      {
        title: "Kab/Kota",
        href: "/internal/pengaturan/kab-kota",
        icon: "map",
      },
      {
        title: "Publikasi Website",
        href: "/internal/pengaturan/data-wilayah-release",
        icon: "globe",
      },
    ],
  },
];
