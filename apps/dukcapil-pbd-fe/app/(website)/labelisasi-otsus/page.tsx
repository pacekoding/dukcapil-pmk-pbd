import type { Metadata } from "next";
import { Suspense } from "react";

import { PublicOtsusPage } from "@/components/website/public-otsus-page";
import type { PublicOtsusListResponse } from "@/types/public-otsus";

export const metadata: Metadata = {
  title: "Data Labelisasi Otsus | Dukcapil & PMK Papua Barat Daya",
  description:
    "Informasi publik pelaksanaan kegiatan dan realisasi anggaran Dana Otonomi Khusus pada Dinas Dukcapil dan PMK Provinsi Papua Barat Daya.",
  alternates: { canonical: "/labelisasi-otsus" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function initialPublicData(query: Record<string, string | string[] | undefined>) {
  const base = process.env.SERVER_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";
  const prefix = process.env.SERVER_API_PREFIX ?? "/api/v1";
  const params = new URLSearchParams();
  for (const key of ["tahun", "search", "kabupaten", "status", "sumberDana", "sort", "page"]) {
    const value = query[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  params.set("pageSize", "12");
  try {
    const response = await fetch(`${base}${prefix}/public/labelisasi?${params}`, { cache: "no-store" });
    if (!response.ok) return { data: null, error: true };
    const payload = await response.json() as { data?: PublicOtsusListResponse };
    return { data: payload.data ?? null, error: !payload.data };
  } catch {
    return { data: null, error: true };
  }
}

export default async function LabelisasiOtsusPage({ searchParams }: Props) {
  const initial = await initialPublicData(await searchParams);
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-slate-50" />}>
      <PublicOtsusPage initialData={initial.data} initialError={initial.error} />
    </Suspense>
  );
}
