import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicOtsusDetailPage } from "@/components/website/public-otsus-detail-page";
import type { PublicOtsusDetail } from "@/types/public-otsus";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tahun?: string }> };

async function publicDetail(id: number, year?: string): Promise<PublicOtsusDetail | null> {
  const base = process.env.SERVER_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";
  const prefix = process.env.SERVER_API_PREFIX ?? "/api/v1";
  const query = year ? `?tahun=${encodeURIComponent(year)}` : "";
  try {
    const response = await fetch(`${base}${prefix}/public/labelisasi/${id}${query}`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as { data?: PublicOtsusDetail };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ id: rawID }, query] = await Promise.all([params, searchParams]);
  const id = Number(rawID);
  const detail = Number.isInteger(id) && id > 0 ? await publicDetail(id, query.tahun) : null;
  const name = detail?.item.namaSubkegiatan ?? "Detail Labelisasi Otsus";
  return {
    title: `${name} | Data Labelisasi Otsus`,
    description: `Informasi publik pelaksanaan, anggaran, dokumentasi, dan dokumen kegiatan ${name}.`,
    alternates: { canonical: `/labelisasi-otsus/${rawID}` },
  };
}

export default async function LabelisasiOtsusDetailRoute({ params, searchParams }: Props) {
  const [{ id: rawID }, query] = await Promise.all([params, searchParams]);
  const id = Number(rawID);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const detail = await publicDetail(id, query.tahun);
  if (!detail) notFound();
  return <PublicOtsusDetailPage id={id} year={query.tahun} initialDetail={detail} />;
}
