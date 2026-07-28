"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  Database,
  FileText,
  FolderCheck,
  IdCard,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPinned,
  MessageSquareText,
  MonitorPlay,
  ShieldCheck,
  UsersRound,
  Wrench,
  type LucideProps,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getWebsitePortalAppStatuses } from "@/lib/api/portal-apps";
import { cn } from "@/lib/utils";
import type { PortalAppStatus } from "@/types/portal-app";

type SessionUser = {
  name: string;
  role: string;
  systemAccess: string[];
};

type AppMenu = {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  accessKey: string;
  status: PortalAppStatus;
  icon: ComponentType<LucideProps>;
  tone: {
    icon: string;
    subtitle: string;
    button: string;
    hover: string;
  };
};

const appMenus: AppMenu[] = [
  {
    title: "MACEKU PKK",
    subtitle: "Manajemen Cakupan Keluarga PKK",
    description:
      "Kelola profil organisasi PKK dari tingkat kabupaten/kota sampai desa/kampung beserta arsip dokumennya.",
    href: "/maceku-pkk/dashboard",
    accessKey: "maceku_pkk",
    icon: UsersRound,
    tone: {
      icon: "bg-teal-50 text-teal-700 ring-teal-100",
      subtitle: "text-teal-700",
      button:
        "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-400",
      hover:
        "group-hover:bg-teal-50/70 group-hover:border-teal-200",
    },
    status: "Aktif",
  },
  {
    title: "SIBUM Kampung",
    subtitle: "Sistem Informasi BUM Kampung",
    description:
      "Sistem informasi untuk pendataan, monitoring, dan pengelolaan BUM Kampung.",
    href: "/sibum/dashboard",
    accessKey: "sibum",
    icon: Building2,
    tone: {
      icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      subtitle: "text-emerald-700",
      button: "border-emerald-600 text-emerald-700",
      hover: "group-hover:bg-emerald-50 group-hover:border-emerald-300",
    },
    status: "Aktif",
  },
  {
    title: "SIKAMPUNG",
    subtitle: "Sistem Informasi Kampung/Desa",
    description:
      "Sistem informasi untuk pendataan dan pengelolaan data kampung/desa.",
    href: "/sikampung/dashboard",
    accessKey: "sikampung",
    icon: MapPinned,
    tone: {
      icon: "bg-cyan-50 text-cyan-700 ring-cyan-100",
      subtitle: "text-cyan-700",
      button: "border-cyan-600 text-cyan-700",
      hover: "group-hover:bg-cyan-50 group-hover:border-cyan-300",
    },
    status: "Pemeliharaan",
  },
  {
    title: "SiTEKAD",
    subtitle: "Sistem Informasi Tekad",
    description:
      "Sistem informasi untuk input dan pengelolaan data potensi kampung.",
    href: "/sitekad/dashboard",
    accessKey: "sitekad",
    icon: ClipboardList,
    tone: {
      icon: "bg-teal-50 text-teal-700 ring-teal-100",
      subtitle: "text-teal-700",
      button: "border-teal-600 text-teal-700",
      hover: "group-hover:bg-teal-50 group-hover:border-teal-300",
    },
    status: "Aktif",
  },
  {
    title: "ASPIRASIKU",
    subtitle: "Sistem Aspirasi Anonim",
    description:
      "Sistem untuk menampung dan mengelola pesan aspirasi anonim dari website.",
    href: "/aspirasiku/dashboard",
    accessKey: "aspirasiku",
    icon: MessageSquareText,
    tone: {
      icon: "bg-violet-50 text-violet-700 ring-violet-100",
      subtitle: "text-violet-700",
      button: "border-violet-600 text-violet-700",
      hover: "group-hover:bg-violet-50 group-hover:border-violet-300",
    },
    status: "Aktif",
  },
  {
    title: "SIDOKA",
    subtitle: "Sistem Informasi Dokumen Kegiatan",
    description:
      "Sistem informasi untuk upload, arsip, dan monitoring dokumen kegiatan PMK.",
    href: "/sidoka/dashboard",
    accessKey: "sidoka",
    icon: FolderCheck,
    tone: {
      icon: "bg-indigo-50 text-indigo-700 ring-indigo-100",
      subtitle: "text-indigo-700",
      button: "border-indigo-600 text-indigo-700",
      hover: "group-hover:bg-indigo-50 group-hover:border-indigo-300",
    },
    status: "Pemeliharaan",
  },
  {
    title: "SIDAK",
    subtitle: "Sistem Informasi Data Kegiatan Dukcapil",
    description:
      "Sistem informasi untuk upload, arsip, dan monitoring dokumen kegiatan Dukcapil.",
    href: "/sidak/dashboard",
    accessKey: "sidak",
    icon: ClipboardList,
    tone: {
      icon: "bg-blue-50 text-blue-700 ring-blue-100",
      subtitle: "text-blue-700",
      button: "border-blue-600 text-blue-700",
      hover: "group-hover:bg-blue-50 group-hover:border-blue-300",
    },
    status: "Pemeliharaan",
  },
  {
    title: "SIBER",
    subtitle: "Dashboard Data Dukcapil",
    description:
      "Kelola data kependudukan, pencatatan sipil, dan OAP yang ditampilkan pada halaman Data Wilayah.",
    href: "/siber/dashboard",
    accessKey: "siber",
    icon: Database,
    tone: {
      icon: "bg-blue-50 text-blue-700 ring-blue-100",
      subtitle: "text-blue-700",
      button: "border-blue-600 text-blue-700",
      hover: "group-hover:bg-blue-50 group-hover:border-blue-300",
    },
    status: "Aktif",
  },
  {
    title: "SISURAT DUKCAPIL",
    subtitle: "Surat Keluar Bidang Dukcapil",
    description:
      "Sistem informasi untuk membuat, mengelola, dan mencetak surat keluar Radiogram.",
    href: "/sisurat/dashboard",
    accessKey: "sisurat",
    icon: FileText,
    tone: {
      icon: "bg-sky-50 text-sky-700 ring-sky-100",
      subtitle: "text-sky-700",
      button: "border-sky-600 text-sky-700",
      hover: "group-hover:bg-sky-50 group-hover:border-sky-300",
    },
    status: "Aktif",
  },
  {
    title: "SIMONEV DUKCAPIL",
    subtitle: "Monitoring Evaluasi SSD",
    description:
      "Sistem informasi untuk membuat, meninjau, dan mencetak formulir monitoring evaluasi data SSD Dukcapil dan PMK.",
    href: "/simonev/dashboard",
    accessKey: "simonev",
    icon: ClipboardList,
    tone: {
      icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      subtitle: "text-emerald-700",
      button: "border-emerald-600 text-emerald-700",
      hover: "group-hover:bg-emerald-50 group-hover:border-emerald-300",
    },
    status: "Aktif",
  },
  {
    title: "OPTIMA-INFO",
    subtitle: "Dashboard Informasi Website",
    description:
      "Kelola satu informasi aktif per periode untuk halaman informasi publik tanpa menu.",
    href: "/optima-info/dashboard",
    accessKey: "optima_info",
    icon: MonitorPlay,
    tone: {
      icon: "bg-teal-50 text-teal-700 ring-teal-100",
      subtitle: "text-teal-700",
      button: "border-teal-600 text-teal-700",
      hover: "group-hover:bg-teal-50 group-hover:border-teal-300",
    },
    status: "Aktif",
  },
  {
    title: "ARSIPKU",
    subtitle: "Sistem ARSIPKU",
    description:
      "Kelola biodata pegawai dan file ijazah, SK, SPMT, sertifikat, dan dokumen lainnya.",
    href: "/arsip-pegawai",
    accessKey: "arsip_pegawai",
    icon: IdCard,
    tone: {
      icon: "bg-amber-50 text-amber-800 ring-amber-100",
      subtitle: "text-amber-800",
      button: "border-amber-700 text-amber-800",
      hover: "group-hover:bg-amber-50 group-hover:border-amber-300",
    },
    status: "Pemeliharaan",
  },
];

const defaultPortalStatuses = appMenus.reduce<Record<string, PortalAppStatus>>(
  (result, menu) => ({
    ...result,
    [menu.accessKey]: menu.status,
  }),
  {},
);

export default function InternalAppsPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser>({
    name: "Admin",
    role: "Karyawan",
    systemAccess: [],
  });
  const [portalStatuses, setPortalStatuses] = useState<
    Record<string, PortalAppStatus>
  >(defaultPortalStatuses);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const result = await response.json();

        if (mounted && result.user) {
          setUser({
            name: result.user.name,
            role: result.user.role || "Karyawan",
            systemAccess: result.user.systemAccess ?? [],
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPortalStatuses = async () => {
      try {
        const statuses = await getWebsitePortalAppStatuses();
        if (!mounted) {
          return;
        }

        setPortalStatuses(
          statuses.reduce<Record<string, PortalAppStatus>>(
            (result, item) => ({
              ...result,
              [item.accessKey]: item.status,
            }),
            { ...defaultPortalStatuses },
          ),
        );
      } catch (error) {
        console.error(error);
      }
    };

    void loadPortalStatuses();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoggingOut(false);
    }
  };

  const visibleAppMenus = appMenus.filter(
    (menu) =>
      isSuperAdminRole(user.role) || user.systemAccess.includes(menu.accessKey),
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] text-pbd-navy">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-[520px] w-[520px] rotate-45 bg-blue-100/35" />
        <div className="absolute -right-28 bottom-10 h-[420px] w-[420px] rotate-45 bg-blue-100/35" />
        <div className="absolute right-10 bottom-28 h-44 w-44 bg-[radial-gradient(circle,_rgba(37,99,235,0.16)_1px,_transparent_1px)] [background-size:16px_16px]" />
      </div>

      <PortalHeader
        user={user}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />

      <section className="relative mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-7xl flex-col items-center px-5 pb-9 pt-12 sm:px-8 lg:pt-14">
        <div className="text-center">
          <p className="text-base font-bold text-pbd-blue">Selamat Datang,</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-pbd-navy sm:text-5xl">
            {user.name}
          </h1>
          <div className="mx-auto mt-7 h-0.5 w-12 rounded-full bg-pbd-blue" />

          <div className="mt-7">
            <p className="text-base font-semibold text-slate-500">
              Portal Aplikasi Internal
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-pbd-navy sm:text-3xl">
              Dinas Dukcapil dan PMK
            </h2>
            <p className="mt-2 text-lg font-semibold text-slate-600">
              Provinsi Papua Barat Daya
            </p>
          </div>

          <p className="mt-9 text-lg font-semibold text-slate-600">
            Pilih sistem yang ingin digunakan
          </p>
        </div>

        <div className="mt-7 grid w-full max-w-6xl gap-7 md:grid-cols-2 xl:grid-cols-4">
          {visibleAppMenus.map((menu) => (
            <AppCard
              key={menu.href}
              menu={{
                ...menu,
                status: portalStatuses[menu.accessKey] ?? menu.status,
              }}
            />
          ))}
          {visibleAppMenus.length === 0 ? (
            <div className="col-span-full rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500">
              Belum ada sistem yang dapat diakses. Hubungi super admin.
            </div>
          ) : null}
        </div>

        <PortalFooter />
      </section>
    </main>
  );
}

function PortalHeader({
  user,
  loggingOut,
  onLogout,
}: {
  user: SessionUser;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  const superAdmin = isSuperAdminRole(user.role);

  return (
    <header className="relative z-10 border-b border-slate-200/80 bg-white/95 px-5 py-4 shadow-[0_8px_24px_rgba(15,35,80,0.06)] backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-14 w-14 shrink-0">
            <Image
              src="/logo-pbd.png"
              alt="Logo Papua Barat Daya"
              fill
              priority
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-pbd-navy sm:text-xl">
              Dinas Dukcapil & PMK
            </p>
            <p className="truncate text-sm font-semibold text-slate-500 sm:text-base">
              Provinsi Papua Barat Daya
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden rounded-full text-pbd-navy hover:bg-blue-50 sm:inline-flex"
            aria-label="Notifikasi"
            title="Notifikasi"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <UserMenu
            user={user}
            superAdmin={superAdmin}
            loggingOut={loggingOut}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}

function UserMenu({
  user,
  superAdmin,
  loggingOut,
  onLogout,
}: {
  user: SessionUser;
  superAdmin: boolean;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-full px-1.5 py-1 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/25"
        >
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-50 text-lg font-bold text-pbd-blue">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left md:block">
            <p className="max-w-[220px] truncate text-sm font-bold text-pbd-navy">
              {user.name}
            </p>
            <p className="text-sm font-medium text-slate-500">
              {formatRole(user.role)}
            </p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-pbd-navy md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate">{user.name}</span>
          <span className="mt-1 block text-xs font-medium text-slate-500">
            {formatRole(user.role)}
          </span>
        </DropdownMenuLabel>
        {superAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <LayoutDashboard className="h-4 w-4 text-pbd-blue" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          disabled={loggingOut}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Keluar..." : "Keluar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppCard({ menu }: { menu: AppMenu }) {
  const Icon = menu.icon;
  const active = menu.status === "Aktif";
  const CardContent = (
    <>
      <div
        className={cn(
          "flex h-22 w-22 items-center justify-center rounded-full ring-1",
          active
            ? menu.tone.icon
            : "bg-slate-100 text-slate-500 ring-slate-200",
        )}
      >
        <Icon className="h-12 w-12" />
      </div>

      <StatusBadge status={menu.status} />

      <h3 className="mt-5 text-xl font-extrabold tracking-tight text-pbd-navy lg:text-2xl">
        {menu.title}
      </h3>
      <p
        className={cn(
          "mt-3 text-base font-bold",
          active ? menu.tone.subtitle : "text-slate-500",
        )}
      >
        {menu.subtitle}
      </p>

      <div className="my-5 h-px w-full bg-slate-200" />

      <p className="max-w-sm flex-1 text-sm leading-6 text-slate-600">
        {menu.description}
      </p>

      <div
        className={cn(
          "mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-lg border bg-white px-5 text-base font-bold transition",
          active
            ? cn(menu.tone.button, menu.tone.hover)
            : "border-slate-200 text-slate-500",
        )}
      >
        {active ? (
          <>
            Buka {menu.title}
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </>
        ) : menu.status === "Pemeliharaan" ? (
          <>
            <Wrench className="h-5 w-5" />
            Pemeliharaan
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            Nonaktif
          </>
        )}
      </div>
    </>
  );

  const className = cn(
    "group flex min-h-[340px] flex-col items-center rounded-lg border border-slate-200 bg-white/90 p-6 text-center shadow-[0_16px_42px_rgba(15,35,80,0.10)] backdrop-blur transition lg:p-7",
    active
      ? "hover:-translate-y-0.5 hover:border-pbd-blue/35 hover:shadow-[0_22px_52px_rgba(15,35,80,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/30"
      : "cursor-not-allowed opacity-80",
  );

  if (!active) {
    return <article className={className}>{CardContent}</article>;
  }

  return (
    <Link href={menu.href} className={className}>
      {CardContent}
    </Link>
  );
}

function StatusBadge({ status }: { status: PortalAppStatus }) {
  const className =
    status === "Aktif"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Pemeliharaan"
        ? "border-yellow-200 bg-yellow-50 text-yellow-700"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <Badge
      variant="outline"
      className={cn("mt-6 rounded-full px-3 py-1 text-sm font-bold", className)}
    >
      <span
        className={cn(
          "mr-1.5 h-2.5 w-2.5 rounded-full",
          status === "Aktif"
            ? "bg-emerald-600"
            : status === "Pemeliharaan"
              ? "bg-yellow-500"
              : "bg-slate-400",
        )}
      />
      {status}
    </Badge>
  );
}

function PortalFooter() {
  return (
    <footer className="mt-9 flex items-center justify-center gap-3 text-center text-sm font-medium leading-6 text-slate-600">
      <ShieldCheck className="h-6 w-6 shrink-0 text-pbd-navy" />
      <p>
        Sistem ini bersifat internal dan rahasia.
        <br className="hidden sm:block" />
        Penggunaan harus sesuai ketentuan yang berlaku.
      </p>
    </footer>
  );
}

function formatRole(role: string) {
  if (!role) {
    return "Karyawan";
  }

  return role
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function isSuperAdminRole(role: string) {
  return role.toLowerCase().replace(/[^a-z0-9]/g, "") === "superadmin";
}
