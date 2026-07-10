import Link from "next/link";
import {
  ArrowRight,
  Database,
  ListChecks,
  MapPinned,
  Settings,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SettingsMenu = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: string;
};

const settingsMenus: SettingsMenu[] = [
  {
    title: "Pengguna Portal",
    description:
      "Kelola akun, reset password, role, dan akses sistem untuk pengguna internal.",
    href: "/dashboard/users",
    icon: UserCog,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  {
    title: "Data Kab/Kota",
    description:
      "Kelola master kabupaten/kota yang digunakan pada formulir dan dashboard.",
    href: "/dashboard/kab-kota",
    icon: MapPinned,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  },
  {
    title: "Data SSD",
    description:
      "Kelola master SSD, import XLSX, dan pemutakhiran data pendukung SIDOKA.",
    href: "/dashboard/SDD",
    icon: Database,
    tone: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  },
  {
    title: "Subkegiatan",
    description:
      "Kelola master subkegiatan berdasarkan tahun anggaran dan relasi SSD.",
    href: "/dashboard/Subkegiatan",
    icon: ListChecks,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
];

export default function SettingsDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHero
        icon={Settings}
        eyebrow="Super Admin"
        title="Dashboard"
        description="Pusat pengaturan portal, pengguna, master wilayah, SSD, dan subkegiatan."
        aside={
          <Button asChild variant="outline">
            <Link href="/portal">Kembali ke Portal</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        {settingsMenus.map((menu) => (
          <SettingsMenuItem key={menu.href} menu={menu} />
        ))}
      </section>

      <section className="app-surface flex flex-col gap-3 rounded-lg p-5 text-sm text-slate-600 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-pbd-navy ring-1 ring-slate-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="leading-6">
          Menu ini khusus super admin. Pastikan perubahan akses pengguna dan
          master data sudah sesuai kebutuhan operasional.
        </p>
      </section>
    </div>
  );
}

function SettingsMenuItem({ menu }: { menu: SettingsMenu }) {
  const Icon = menu.icon;

  return (
    <Link
      href={menu.href}
      className="group flex min-h-[168px] rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pbd-blue/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/25"
    >
      <div className="flex w-full gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ring-1",
            menu.tone,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-lg font-bold text-pbd-navy">{menu.title}</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            {menu.description}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-pbd-blue">
            Buka menu
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
