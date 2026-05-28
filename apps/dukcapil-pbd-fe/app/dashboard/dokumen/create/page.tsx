"use client";

import Link from "next/link";

import { ArrowLeft, ClipboardList, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const documentOptions = [
  {
    title: "Dokumen TOR",
    description:
      "Buat dokumen perencanaan kegiatan dengan rundown, rincian biaya, dan tanda tangan.",
    href: "/dashboard/dokumen/create/tor",
    badge: "Format Perencanaan",
    icon: ClipboardList,
    iconClassName: "bg-blue-50 text-blue-600",
    hoverClassName: "hover:border-pbd-blue hover:bg-blue-50/40",
  },
  {
    title: "Dokumen Laporan",
    description:
      "Buat laporan pelaksanaan dengan hasil kegiatan, dokumentasi, realisasi biaya, dan penutup.",
    href: "/dashboard/dokumen/create/laporan",
    badge: "Format Pelaksanaan",
    icon: FileText,
    iconClassName: "bg-emerald-50 text-emerald-600",
    hoverClassName: "hover:border-emerald-500 hover:bg-emerald-50/40",
  },
];

export default function CreateDokumenPage() {
  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-3 h-9 rounded-lg px-0">
            <Link href="/dashboard/dokumen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>

          <Badge className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
            Buat Dokumen
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Pilih Format Dokumen
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Pilih format dokumen sesuai kebutuhan. Setiap pilihan akan membuka
            form input yang mengikuti struktur PDF masing-masing.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {documentOptions.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="group">
              <Card
                className={`h-full rounded-3xl border border-slate-200 shadow-sm transition ${item.hoverClassName}`}
              >
                <CardContent className="flex h-full flex-col p-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconClassName}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <Badge className="mt-6 w-fit rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-600">
                    {item.badge}
                  </Badge>

                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                    {item.title}
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
