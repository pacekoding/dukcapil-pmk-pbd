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
  | "settings";

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
    title: "Pelaksanaan Kegiatan",
    href: "/internal/pelaksanaan-kegiatan",
    icon: "fileText",
    children: [
      {
        title: "Surat Tugas",
        href: "/internal/pelaksanaan-kegiatan/surat-tugas",
        icon: "fileText",
      },
      {
        title: "Surat Perjalanan Dinas",
        href: "/internal/pelaksanaan-kegiatan/spd",
        icon: "fileText",
      },
      {
        title: "Surat Undangan",
        href: "/internal/pelaksanaan-kegiatan/surat-undangan",
        icon: "fileText",
      },
      {
        title: "Daftar Hadir",
        href: "/internal/pelaksanaan-kegiatan/daftar-hadir",
        icon: "users",
      },
      {
        title: "Notula",
        href: "/internal/pelaksanaan-kegiatan/notula",
        icon: "fileText",
      },
      {
        title: "Berita Acara",
        href: "/internal/pelaksanaan-kegiatan/berita-acara",
        icon: "fileText",
      },
      {
        title: "Laporan Kegiatan",
        href: "/internal/pelaksanaan-kegiatan/laporan",
        icon: "fileText",
      },
      {
        title: "Dokumentasi",
        href: "/internal/pelaksanaan-kegiatan/dokumentasi",
        icon: "folderArchive",
      },
    ],
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
