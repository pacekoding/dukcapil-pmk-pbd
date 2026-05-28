"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ArrowRight, CalendarDays, FileText, Users } from "lucide-react";

import { getWebsiteHome } from "@/lib/api/website";
import type { PublicKegiatanItem, WebsiteHomeResponse } from "@/types/website";

export default function HomePage() {
  const [data, setData] = useState<WebsiteHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const result = await getWebsiteHome();

        if (mounted) {
          setData(result);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Data beranda gagal dimuat.");
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
  }, []);

  if (loading || !data) {
    return <HomeSkeleton error={error} />;
  }

  return (
    <main className="min-h-screen bg-pbd-bg">
      <section className="relative overflow-hidden bg-pbd-navy">
        <div className="absolute inset-0">
          <Image
            src="/hero-pbd.png"
            alt="Papua Barat Daya"
            fill
            priority
            className="object-cover opacity-25"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full bg-pbd-gold/20 px-4 py-2 text-sm font-medium text-pbd-gold">
              {data.hero.eyebrow}
            </span>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-6xl">
              {data.hero.title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80">
              {data.hero.description}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/kegiatan"
                className="rounded-lg bg-pbd-gold px-6 py-4 font-semibold text-pbd-navy transition hover:opacity-90"
              >
                Lihat Kegiatan
              </Link>

              <Link
                href="/profil"
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Profil Dinas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-10 z-10">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.stats.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              description={item.description}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>Kegiatan Terkini</SectionLabel>
            <h2 className="mt-3 text-3xl font-bold text-pbd-navy">
              Agenda dan Dokumentasi Kegiatan
            </h2>
          </div>

          <Link
            href="/kegiatan"
            className="inline-flex items-center gap-2 font-semibold text-pbd-blue"
          >
            Semua kegiatan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {data.latestKegiatan.map((item) => (
            <KegiatanCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionLabel>Fokus Layanan</SectionLabel>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {data.highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-gray-100 bg-pbd-bg p-8"
              >
                <h3 className="text-2xl font-bold text-pbd-navy">
                  {item.title}
                </h3>
                <p className="mt-4 leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="grid gap-10 rounded-lg bg-pbd-navy p-8 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
          <div>
            <SectionLabel className="text-pbd-gold">Profil</SectionLabel>
            <h2 className="mt-3 text-3xl font-bold">
              {data.profileSummary.title}
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
              {data.profileSummary.description}
            </p>
          </div>

          <Link
            href="/profil"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-pbd-gold px-6 font-semibold text-pbd-navy"
          >
            Baca Profil
          </Link>
        </div>
      </section>
    </main>
  );
}

function HomeSkeleton({ error }: { error: string }) {
  return (
    <main className="min-h-screen bg-pbd-bg">
      <section className="bg-pbd-navy">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
          <div className="h-56 animate-pulse rounded-lg bg-white/10" />
          {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}

function SectionLabel({
  children,
  className = "text-pbd-blue",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-sm font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-pbd-blue/10 text-pbd-blue">
        <Users className="h-5 w-5" />
      </div>
      <p className="mt-5 text-sm text-gray-500">{label}</p>
      <h3 className="mt-2 text-3xl font-extrabold text-pbd-navy">{value}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function KegiatanCard({ item }: { item: PublicKegiatanItem }) {
  return (
    <article className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-pbd-blue/10 px-3 py-1 text-xs font-semibold text-pbd-blue">
          {item.jenis}
        </span>
        <span className="rounded-full bg-pbd-gold/20 px-3 py-1 text-xs font-semibold text-pbd-navy">
          {item.status}
        </span>
      </div>

      <h3 className="mt-5 text-2xl font-bold leading-tight text-pbd-navy">
        {item.nama}
      </h3>

      <p className="mt-3 line-clamp-3 leading-relaxed text-gray-600">
        {item.ringkasan}
      </p>

      <div className="mt-6 grid gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-pbd-blue" />
          {item.tanggal}
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-pbd-blue" />
          {item.dokumen.total} dokumen tersedia
        </div>
      </div>
    </article>
  );
}
