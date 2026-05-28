"use client";

import Link from "next/link";

import {
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Handshake,
  Megaphone,
  SearchCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  kegiatanFormConfigs,
  type KegiatanSlug,
} from "@/lib/kegiatan/kegiatan-form-config";

const iconMap: Record<KegiatanSlug, LucideIcon> = {
  sosialisasi: Megaphone,
  bimtek: GraduationCap,
  pendampingan: Handshake,
  monev: SearchCheck,
  rapat: UsersRound,
};

const colorMap: Record<KegiatanSlug, string> = {
  sosialisasi: "bg-violet-50 text-violet-700",
  bimtek: "bg-blue-50 text-blue-700",
  pendampingan: "bg-emerald-50 text-emerald-700",
  monev: "bg-orange-50 text-orange-700",
  rapat: "bg-amber-50 text-amber-700",
};

export default function CreateKegiatanPage() {
  return (
    <main className="space-y-6">
      <section>
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-2 text-sm"
        >
          <Link
            href="/dashboard/kegiatan"
            className="font-medium text-slate-500 transition hover:text-pbd-blue"
          >
            Kegiatan
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <Link
            href="/dashboard/kegiatan/create"
            className="font-medium text-slate-500 transition hover:text-pbd-blue"
          >
            Buat Kegiatan
          </Link>
        </nav>

        <Badge className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
          Buat Kegiatan
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Pilih Jenis Kegiatan
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Setiap jenis kegiatan memiliki kebutuhan data yang berbeda. Pilih
          jenis kegiatan untuk membuka form input yang sesuai.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {kegiatanFormConfigs.map((item) => {
          const Icon = iconMap[item.slug] ?? ClipboardList;

          return (
            <Link
              key={item.slug}
              href={`/dashboard/kegiatan/create/${item.slug}`}
              className="group"
            >
              <Card className="h-full rounded-lg border border-slate-200 shadow-sm transition hover:border-pbd-blue hover:bg-blue-50/30">
                <CardContent className="flex h-full flex-col p-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorMap[item.slug]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <Badge className="mt-6 w-fit rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-600">
                    {item.badge}
                  </Badge>

                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                    {item.jenis}
                  </h2>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-6 text-sm font-semibold text-pbd-blue">
                    Buka form
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
