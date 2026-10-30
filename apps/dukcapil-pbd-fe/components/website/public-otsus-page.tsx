"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Camera,
  CheckCircle2,
  CircleDashed,
  FileText,
  ListChecks,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContentContainer } from "@/components/website/content-container";
import { Pagination } from "@/components/website/pagination";
import { getPublicOtsus } from "@/lib/api/public-otsus";
import type { PublicOtsusItem, PublicOtsusListResponse } from "@/types/public-otsus";
import type { OtsusStatus } from "@/types/otsus";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("id-ID");
const statusLabels: Record<OtsusStatus, string> = { BELUM_MULAI: "Belum Berjalan", BERJALAN: "Sedang Berjalan", SELESAI: "Selesai" };
const fundingLabels = { SG_1_25: "SG 1,25%", BG_1: "BG 1%" } as const;

function percentage(value: number, total: number) { return total > 0 ? Math.min((value / total) * 100, 100) : 0; }
function localDate(value: string) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jayapura" }).format(new Date(value)) : ""; }
function statusStyle(status: OtsusStatus) { return status === "SELESAI" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status === "BERJALAN" ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-700 ring-slate-200"; }

export function PublicOtsusPage({ initialData = null, initialError = false }: { initialData?: PublicOtsusListResponse | null; initialError?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const [data, setData] = useState<PublicOtsusListResponse | null>(initialData);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [error, setError] = useState(initialError);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updateQuery = useCallback((changes: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key); else params.set(key, String(value));
    });
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const timer = window.setTimeout(() => updateQuery({ search, page: null }), 350);
    return () => window.clearTimeout(timer);
  }, [search, searchParams, updateQuery]);

  useEffect(() => {
    let active = true;
    getPublicOtsus({
      tahun: searchParams.get("tahun") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      kabupaten: searchParams.get("kabupaten") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      sumberDana: searchParams.get("sumberDana") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      page: Number(searchParams.get("page") || 1),
      pageSize: 12,
    }).then((response) => {
      if (!active) return;
      setData(response); setError(false);
      if (!searchParams.get("tahun") && response.year) updateQuery({ tahun: response.year });
    }).catch(() => active && setError(true)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [queryKey, reload, searchParams, updateQuery]);

  const retry = () => { setLoading(true); setError(false); setReload((value) => value + 1); };
  const reset = () => { setSearch(""); updateQuery({ search: null, kabupaten: null, status: null, sumberDana: null, sort: null, page: null }); };
  const hasFilters = ["search", "kabupaten", "status", "sumberDana"].some((key) => searchParams.has(key));
  const summary = data?.summary;
  const realization = percentage(summary?.realisasi ?? 0, summary?.pagu ?? 0);

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <section className="border-b border-slate-200 bg-white">
      <ContentContainer className="py-10 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-pbd-blue">Portal transparansi publik</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-pbd-navy sm:text-4xl">Data Labelisasi Otsus</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">Informasi pelaksanaan program dan kegiatan yang didanai melalui Dana Otonomi Khusus Provinsi Papua Barat Daya.</p>
          {summary && summary.total > 0 ? <p className="mt-3 text-sm text-slate-500">Data terakhir diperbarui {localDate(summary.updatedAt)}.</p> : null}
        </div>
        <label className="relative mt-7 block max-w-2xl">
          <span className="sr-only">Cari kegiatan, subkegiatan, atau lokasi</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 rounded-xl pl-12 text-base" placeholder="Cari kegiatan, subkegiatan, atau lokasi…" />
        </label>
      </ContentContainer>
    </section>

    <ContentContainer className="space-y-8 py-8 sm:py-10">
      {error ? <ErrorPanel onRetry={retry} /> : <>
        {loading && !data ? <SummarySkeleton /> : <section aria-label="Ringkasan data" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={ListChecks} label="Total Subkegiatan" value={integer.format(summary?.total ?? 0)} note={`Tahun anggaran ${data?.year || "-"}`} tone="blue" />
          <SummaryCard icon={CheckCircle2} label="Selesai" value={integer.format(summary?.selesai ?? 0)} note={`${percentage(summary?.selesai ?? 0, summary?.total ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari total`} tone="green" />
          <SummaryCard icon={CircleDashed} label="Sedang Berjalan" value={integer.format(summary?.berjalan ?? 0)} note={`${integer.format(summary?.belumMulai ?? 0)} belum berjalan`} tone="indigo" />
          <SummaryCard icon={Banknote} label="Realisasi Anggaran" value={`${realization.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`} note={`${currency.format(summary?.realisasi ?? 0)} dari ${currency.format(summary?.pagu ?? 0)}`} tone="amber" />
        </section>}

        <section aria-label="Filter data" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3 lg:hidden"><p className="font-semibold text-pbd-navy">Filter data</p><Button type="button" variant="outline" size="sm" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal className="h-4 w-4" />{filtersOpen ? "Tutup" : "Filter"}</Button></div>
          <div className={`${filtersOpen ? "grid" : "hidden"} mt-4 gap-3 sm:grid-cols-2 lg:mt-0 lg:grid lg:grid-cols-5`}>
            <FilterSelect label="Tahun anggaran" value={data?.year ?? searchParams.get("tahun") ?? ""} onChange={(value) => updateQuery({ tahun: value, page: null })} options={Array.from(new Set([...(data?.year ? [data.year] : []), ...(data?.years ?? [])])).map((year) => ({ value: year, label: year }))} />
            <FilterSelect label="Kabupaten/Kota" placeholder="Semua lokasi" value={searchParams.get("kabupaten") ?? ""} onChange={(value) => updateQuery({ kabupaten: value, page: null })} options={(data?.kabupaten ?? []).map((value) => ({ value, label: value }))} />
            <FilterSelect label="Status" placeholder="Semua status" value={searchParams.get("status") ?? ""} onChange={(value) => updateQuery({ status: value, page: null })} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
            <FilterSelect label="Sumber dana" placeholder="Semua sumber dana" value={searchParams.get("sumberDana") ?? ""} onChange={(value) => updateQuery({ sumberDana: value, page: null })} options={Object.entries(fundingLabels).map(([value, label]) => ({ value, label }))} />
            <FilterSelect label="Urutkan" value={searchParams.get("sort") ?? "latest"} onChange={(value) => updateQuery({ sort: value, page: null })} options={[{ value: "latest", label: "Terbaru" }, { value: "name", label: "Nama A–Z" }, { value: "budget", label: "Anggaran terbesar" }, { value: "realization", label: "Realisasi tertinggi" }]} />
          </div>
          {hasFilters ? <div className="mt-4 flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={reset}>Reset filter</Button></div> : null}
        </section>

        <section aria-labelledby="activity-title">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="activity-title" className="text-xl font-bold text-pbd-navy">Daftar Kegiatan</h2><p className="mt-1 text-sm text-slate-500">{loading ? "Memuat data…" : `${integer.format(data?.total ?? 0)} kegiatan ditemukan`}</p></div><p className="text-sm font-medium text-slate-500">12 item per halaman</p></div>
          {loading ? <CardSkeleton /> : data?.items.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.items.map((item) => <ActivityCard key={item.id} item={item} year={data.year} />)}</div> : <EmptyPanel filtered={hasFilters} year={data?.year} onReset={reset} />}
          {data && data.total > 0 ? <div className="mt-7 rounded-xl border border-slate-200 bg-white p-4"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={(page) => updateQuery({ page: page === 1 ? null : page })} /></div> : null}
        </section>
      </>}
    </ContentContainer>
  </div>;
}

function SummaryCard({ icon: Icon, label, value, note, tone }: { icon: typeof ListChecks; label: string; value: string; note: string; tone: "blue" | "green" | "indigo" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", indigo: "bg-indigo-50 text-indigo-700", amber: "bg-amber-50 text-amber-700" };
  return <article className="min-h-40 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-3 text-2xl font-extrabold tabular-nums text-pbd-navy">{value}</p></div><span className={`rounded-xl p-3 ${colors[tone]}`} aria-hidden="true"><Icon className="h-5 w-5" /></span></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{note}</p></article>;
}

function ActivityCard({ item, year }: { item: PublicOtsusItem; year: string }) {
  const realized = percentage(item.realisasi, item.pagu);
  return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    {item.thumbnailUrl ? <div className="relative aspect-[16/8] bg-slate-100"><Image unoptimized fill sizes="(max-width: 768px) 100vw, 420px" src={item.thumbnailUrl} alt={`Dokumentasi ${item.namaSubkegiatan}`} className="object-cover" /></div> : null}
    <div className="flex flex-1 flex-col p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge status={item.status} /><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{fundingLabels[item.sumberDana]}</span></div>
      <p className="mt-4 font-mono text-xs font-semibold text-pbd-blue">{item.kodeSubkegiatan || "Kode belum tersedia"}</p>
      <h3 className="mt-1 line-clamp-3 text-lg font-bold leading-7 text-pbd-navy">{item.namaSubkegiatan}</h3>
      <p className="mt-3 flex items-start gap-2 text-sm text-slate-500"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{item.kabupatenKota || "Lokasi belum tersedia"}</p>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4"><DataPoint label="Pagu" value={currency.format(item.pagu)} /><DataPoint label="Realisasi" value={currency.format(item.realisasi)} /></div>
      <div className="mt-4"><div className="flex justify-between text-xs font-semibold text-slate-600"><span>Progres anggaran</span><span>{realized.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-pbd-blue" style={{ width: `${realized}%` }} /></div></div>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><Camera className="h-4 w-4" aria-hidden="true" />{item.jumlahFoto} foto</span><span className="flex items-center gap-1.5"><FileText className="h-4 w-4" aria-hidden="true" />{item.jumlahDokumen} dokumen</span></div>
      <Button asChild variant="outline" className="mt-5 w-full"><Link href={`/labelisasi-otsus/${item.id}?tahun=${encodeURIComponent(year)}`}>Lihat Detail<ArrowRight className="h-4 w-4" /></Link></Button>
    </div>
  </article>;
}

function StatusBadge({ status }: { status: OtsusStatus }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyle(status)}`}>{statusLabels[status]}</span>; }
function DataPoint({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-bold tabular-nums text-slate-800">{value}</p></div>; }
function FilterSelect({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string }) { return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-pbd-blue focus:ring-2 focus:ring-blue-100">{placeholder ? <option value="">{placeholder}</option> : null}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function ErrorPanel({ onRetry }: { onRetry: () => void }) { return <div className="rounded-2xl border border-red-200 bg-white p-10 text-center"><p className="font-bold text-slate-800">Data belum dapat dimuat</p><p className="mt-2 text-sm text-slate-500">Silakan coba kembali.</p><Button type="button" variant="outline" className="mt-5" onClick={onRetry}><RefreshCw className="h-4 w-4" />Coba Lagi</Button></div>; }
function EmptyPanel({ filtered, year, onReset }: { filtered: boolean; year?: string; onReset: () => void }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 font-bold text-pbd-navy">{filtered ? "Tidak ada kegiatan yang sesuai dengan filter." : `Belum ada data labelisasi untuk tahun ${year || "terpilih"}.`}</p><p className="mt-2 text-sm text-slate-500">{filtered ? "Coba ubah kata pencarian atau filter yang digunakan." : "Data akan tampil setelah ditetapkan untuk publik oleh pengelola."}</p>{filtered ? <Button type="button" variant="outline" className="mt-5" onClick={onReset}>Reset Filter</Button> : null}</div>; }
function SummarySkeleton() { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"><div className="h-4 w-28 rounded bg-slate-100" /><div className="mt-5 h-8 w-20 rounded bg-slate-100" /><div className="mt-4 h-4 w-3/4 rounded bg-slate-100" /></div>)}</div>; }
function CardSkeleton() { return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"><div className="h-5 w-28 rounded bg-slate-100" /><div className="mt-6 h-6 w-4/5 rounded bg-slate-100" /><div className="mt-3 h-6 w-3/5 rounded bg-slate-100" /><div className="mt-8 h-24 rounded bg-slate-100" /></div>)}</div>; }
