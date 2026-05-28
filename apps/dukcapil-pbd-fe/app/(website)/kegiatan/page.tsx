"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  FileText,
  Images,
  MapPin,
  Search,
  Users,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWebsiteKegiatan } from "@/lib/api/website";
import type { KegiatanJenis } from "@/types/kegiatan";
import type {
  PublicKegiatanItem,
  WebsiteKegiatanResponse,
} from "@/types/website";

type JenisFilter = KegiatanJenis | "all";

export default function WebsiteKegiatanPage() {
  const [data, setData] = useState<WebsiteKegiatanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [jenis, setJenis] = useState<JenisFilter>("all");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const result = await getWebsiteKegiatan();

        if (mounted) {
          setData(result);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Data kegiatan gagal dimuat.");
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

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          item.nama,
          item.jenis,
          item.bidang,
          item.status,
          item.lokasi,
          item.penanggungJawab,
          item.ringkasan,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesJenis = jenis === "all" || item.jenis === jenis;

      return matchesSearch && matchesJenis;
    });
  }, [data?.items, jenis, search]);

  return (
    <main className="min-h-screen bg-pbd-bg">
      <section className="bg-pbd-navy">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <span className="rounded-full bg-pbd-gold/20 px-4 py-2 text-sm font-medium text-pbd-gold">
            Kegiatan
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Dokumentasi Kegiatan Selesai
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80">
            Arsip kegiatan lintas bidang yang telah selesai dilaksanakan,
            lengkap dengan foto dokumentasi, lokasi, peserta, dan dokumen
            pendukung.
          </p>
        </div>
      </section>

      <section className="relative -mt-10 z-10">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.stats ?? []).map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <h2 className="mt-2 text-3xl font-extrabold text-pbd-navy">
                {item.value}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kegiatan, lokasi, bidang..."
                className="h-11 rounded-2xl border-slate-200 pl-10"
              />
            </div>

            <Select value={jenis} onValueChange={(value) => setJenis(value as JenisFilter)}>
              <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {(data?.jenisOptions ?? []).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-3xl bg-white"
                />
              ))
            : filteredItems.map((item) => (
                <KegiatanCard key={item.id} item={item} />
              ))}
        </div>

        {!loading && filteredItems.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-pbd-navy">
              Kegiatan tidak ditemukan
            </h2>
            <p className="mt-2 text-gray-500">
              Coba gunakan kata kunci atau filter jenis kegiatan lain.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function KegiatanCard({ item }: { item: PublicKegiatanItem }) {
  const primaryPhoto = item.dokumentasi?.[0];

  return (
    <Link href={`/kegiatan/${item.id}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-pbd-blue/30 hover:shadow-xl">
        <div className="relative aspect-[16/10] bg-slate-100">
          <Image
            src={primaryPhoto?.url ?? "/hero-pbd.png"}
            alt={primaryPhoto?.caption ?? item.nama}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pbd-navy/65 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pbd-blue shadow-sm">
              {item.jenis}
            </span>
            <span className="rounded-full bg-pbd-gold px-3 py-1 text-xs font-semibold text-pbd-navy shadow-sm">
              {item.status}
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {item.bidang}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold leading-tight text-pbd-navy transition group-hover:text-pbd-blue">
            {item.nama}
          </h2>

          <p className="mt-3 line-clamp-3 leading-relaxed text-gray-600">
            {item.ringkasan}
          </p>

          <div className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
            <InfoItem icon={CalendarDays} value={item.tanggal} />
            <InfoItem icon={MapPin} value={item.lokasi} />
            <InfoItem icon={Users} value={`${item.peserta} peserta`} />
            <InfoItem
              icon={Images}
              value={`${item.dokumentasi?.length ?? 0} foto dokumentasi`}
            />
            <InfoItem
              icon={FileText}
              value={`${item.dokumen.tor} TOR, ${item.dokumen.laporan} laporan`}
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-5 text-sm text-gray-500">
            <p className="min-w-0">
              Penanggung jawab:{" "}
              <span className="font-semibold text-pbd-navy">
                {item.penanggungJawab}
              </span>
            </p>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pbd-blue/10 text-pbd-blue transition group-hover:bg-pbd-blue group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function InfoItem({
  icon: Icon,
  value,
}: {
  icon: typeof CalendarDays;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-pbd-blue" />
      <span className="line-clamp-2">{value}</span>
    </div>
  );
}
