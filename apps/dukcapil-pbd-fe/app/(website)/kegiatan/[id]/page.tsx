"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  ChevronRight,
  FileText,
  Images,
  MapPin,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { getWebsiteKegiatanDetail } from "@/lib/api/website";
import type { PublicKegiatanItem } from "@/types/website";

function parseDetailRows(description: string) {
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))
    .filter(Boolean);
}

export default function WebsiteKegiatanDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<PublicKegiatanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const id = Number(params.id);

    const loadData = async () => {
      if (Number.isNaN(id)) {
        setError("Kegiatan tidak ditemukan.");
        setLoading(false);
        return;
      }

      try {
        const result = await getWebsiteKegiatanDetail(id);

        if (mounted) {
          setItem(result);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Kegiatan tidak ditemukan atau belum selesai.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [params.id]);

  const detailRows = useMemo(
    () => parseDetailRows(item?.deskripsi ?? ""),
    [item?.deskripsi],
  );

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-pbd-bg">
        <section className="mx-auto max-w-7xl px-6 py-20">
          <Breadcrumb current="Kegiatan tidak ditemukan" />
          <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <h1 className="text-2xl font-bold text-pbd-navy">
              Kegiatan tidak ditemukan
            </h1>
            <p className="mt-3 text-gray-500">
              {error || "Data kegiatan tidak tersedia."}
            </p>
            <Link
              href="/kegiatan"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-pbd-navy px-6 font-semibold text-white"
            >
              Lihat Kegiatan
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const dokumentasi = item.dokumentasi ?? [];
  const primaryPhoto = dokumentasi[0];

  return (
    <main className="min-h-screen bg-pbd-bg">
      <section className="bg-pbd-navy">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Breadcrumb current={item.nama} inverted />

          <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-pbd-gold px-3 py-1 text-xs font-semibold text-pbd-navy">
                  {item.status}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {item.jenis}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {item.bidang}
                </span>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
                {item.nama}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80">
                {item.ringkasan}
              </p>
            </div>

            <div className="relative aspect-[16/11] overflow-hidden rounded-3xl bg-white/10 shadow-2xl">
              <Image
                src={primaryPhoto?.url ?? "/hero-pbd.png"}
                alt={primaryPhoto?.caption ?? item.nama}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-10 z-10">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            icon={CalendarDays}
            label="Tanggal"
            value={item.tanggal}
          />
          <InfoCard icon={MapPin} label="Lokasi" value={item.lokasi} />
          <InfoCard
            icon={Users}
            label="Peserta"
            value={`${item.peserta} peserta`}
          />
          <InfoCard
            icon={UserRound}
            label="Penanggung Jawab"
            value={item.penanggungJawab}
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <SectionTitle title="Ringkasan Kegiatan" />
            <p className="mt-5 leading-8 text-gray-600">{item.ringkasan}</p>

            {detailRows.length > 0 ? (
              <div className="mt-6 grid gap-3">
                {detailRows.map((detail) => (
                  <div
                    key={detail}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                  >
                    {detail}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <SectionTitle title="Foto Dokumentasi" />

            {dokumentasi.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {dokumentasi.map((photo) => (
                  <figure
                    key={photo.id}
                    className="overflow-hidden rounded-3xl border border-gray-100 bg-white"
                  >
                    <div className="relative aspect-[16/11] bg-slate-100">
                      <Image
                        src={photo.url}
                        alt={photo.caption}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="p-4 text-sm leading-6 text-gray-600">
                      {photo.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-slate-50 p-8 text-center text-gray-500">
                Foto dokumentasi belum tersedia.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionTitle title="Dokumen" />
            <div className="mt-5 grid gap-3">
              <DocumentRow label="TOR" value={item.dokumen.tor} />
              <DocumentRow label="Laporan" value={item.dokumen.laporan} />
              <DocumentRow label="Total Dokumen" value={item.dokumen.total} />
            </div>
          </div>

          <div className="rounded-3xl bg-pbd-navy p-6 text-white shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-pbd-gold">
              <Images className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Arsip Kegiatan Selesai</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Detail ini hanya menampilkan kegiatan yang telah selesai dan
              memiliki arsip pelaksanaan pada sistem.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Breadcrumb({
  current,
  inverted = false,
}: {
  current: string;
  inverted?: boolean;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-2 text-sm ${
        inverted ? "text-white/65" : "text-slate-500"
      }`}
    >
      <Link
        href="/"
        className={`font-medium transition ${
          inverted ? "hover:text-white" : "hover:text-pbd-blue"
        }`}
      >
        Beranda
      </Link>
      <ChevronRight className="h-4 w-4 opacity-60" />
      <Link
        href="/kegiatan"
        className={`font-medium transition ${
          inverted ? "hover:text-white" : "hover:text-pbd-blue"
        }`}
      >
        Kegiatan
      </Link>
      <ChevronRight className="h-4 w-4 opacity-60" />
      <span
        className={`line-clamp-1 font-semibold ${
          inverted ? "text-pbd-gold" : "text-pbd-navy"
        }`}
      >
        {current}
      </span>
    </nav>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pbd-blue/10 text-pbd-blue">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold leading-7 text-pbd-navy">{value}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-2.5 w-2.5 rounded-full bg-pbd-gold" />
      <h2 className="text-2xl font-bold text-pbd-navy">{title}</h2>
    </div>
  );
}

function DocumentRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <FileText className="h-4 w-4 text-pbd-blue" />
        {label}
      </div>
      <span className="text-sm font-bold text-pbd-navy">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-pbd-bg">
      <section className="bg-pbd-navy">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="h-80 animate-pulse rounded-3xl bg-white/10" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      </section>
    </main>
  );
}
