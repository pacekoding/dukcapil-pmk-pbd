"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, CircleDollarSign, FileCheck2, FileText, ListChecks, MoreHorizontal, PlayCircle, Plus, Search, Tags } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { CrudPage } from "@/components/dashboard/crud-page";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/dashboard/state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteOtsus, getOtsus } from "@/lib/api/otsus";
import type { OtsusLabel } from "@/types/otsus";
import { OtsusStatusBadge, persen, rupiah } from "./otsus-utils";

export function OtsusList() {
  const [rows, setRows] = useState<OtsusLabel[]>([]);
  const [summaryRows, setSummaryRows] = useState<OtsusLabel[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<OtsusLabel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getOtsus(search).then(items => { if (!active) return; setRows(items); if (!search.trim()) setSummaryRows(items); }).catch(cause => active && setError(cause instanceof Error ? cause.message : "Data gagal dimuat.")).finally(() => active && setLoading(false));
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, reload]);

  const summary = useMemo(() => {
    const pagu = summaryRows.reduce((total, row) => total + row.pagu, 0);
    const realisasi = summaryRows.reduce((total, row) => total + row.realisasi, 0);
    const funding = (source: OtsusLabel["sumberDana"]) => {
      const items = summaryRows.filter(row => row.sumberDana === source);
      return {
        pagu: items.reduce((total, row) => total + row.pagu, 0),
        realisasi: items.reduce((total, row) => total + row.realisasi, 0),
      };
    };
    return {
      total: summaryRows.length,
      selesai: summaryRows.filter(row => row.status === "SELESAI").length,
      berjalan: summaryRows.filter(row => row.status === "BERJALAN").length,
      realisasi,
      pagu,
      persentase: pagu > 0 ? realisasi / pagu * 100 : 0,
      sg: funding("SG_1_25"),
      bg: funding("BG_1"),
    };
  }, [summaryRows]);

  return <CrudPage width="max-w-none" title="Labelisasi Otsus" description="Kelola data subkegiatan yang menggunakan Dana Otonomi Khusus." breadcrumbs={[{ label: "Internal", href: "/internal/dashboard" }, { label: "Labelisasi Otsus" }]} actions={<Button asChild><Link href="/internal/otsus/add"><Plus className="h-4 w-4" />Tambah Labelisasi</Link></Button>}>
    {error ? <ErrorState message={error} /> : null}
    {notice ? <SuccessState message={notice} /> : null}
    <section aria-label="Ringkasan Labelisasi Otsus" className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Subkegiatan" value={String(summary.total)} description="Subkegiatan yang dilabelisasi Otsus" icon={ListChecks} tone="blue" loading={loading && summaryRows.length === 0} />
      <StatCard label="Status Selesai" value={String(summary.selesai)} description={`${persen(summary.total ? summary.selesai / summary.total * 100 : 0)} dari total subkegiatan`} icon={CheckCircle2} tone="emerald" loading={loading && summaryRows.length === 0} />
      <StatCard label="Sedang Berjalan" value={String(summary.berjalan)} description={`${persen(summary.total ? summary.berjalan / summary.total * 100 : 0)} dari total subkegiatan`} icon={PlayCircle} tone="indigo" loading={loading && summaryRows.length === 0} />
      <BudgetSummary summary={summary} loading={loading && summaryRows.length === 0} />
    </section>
    <Card className="overflow-hidden"><CardContent className="p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold text-slate-800">Daftar Labelisasi</p><p className="mt-0.5 text-sm text-slate-500">{loading ? "Memuat data..." : `${rows.length} subkegiatan ditemukan`}</p></div>
        <div className="relative w-full sm:w-96"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari kode atau nama subkegiatan..." aria-label="Cari Labelisasi Otsus" /></div>
      </div>
      {loading ? <LoadingState className="p-5" rows={5} message="Memuat Labelisasi Otsus..." /> : rows.length === 0 ? <EmptyState className="m-5" icon={Tags} title="Belum ada Labelisasi Otsus" description={search ? "Tidak ada kode atau nama subkegiatan yang cocok." : "Tambahkan subkegiatan yang menggunakan Dana Otsus."} /> :
        <Table containerClassName="max-h-[68vh]" className="min-w-[1180px] table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgb(226_232_240)]"><TableRow>
            <TableHead className="w-[360px]">Subkegiatan</TableHead><TableHead className="w-[190px] text-right">Anggaran</TableHead><TableHead className="w-[180px]">Progres Realisasi</TableHead><TableHead className="w-[150px]">Status</TableHead><TableHead className="w-[220px]">Kelengkapan Dokumen</TableHead><TableHead className="sticky right-0 w-[80px] bg-slate-50 text-right">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>{rows.map(row => { const percent = row.pagu === 0 ? 0 : Math.min(100, row.realisasi / row.pagu * 100); return <TableRow key={row.id} className="group even:bg-slate-50/35">
            <TableCell className="whitespace-normal align-top py-4"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-blue-200 bg-blue-50 font-mono text-blue-700">{row.subkegiatanKode || `ID ${row.subkegiatanId}`}</Badge><span className="text-xs text-slate-500">Tahun {row.tahunAnggaran}</span></div><Link href={`/internal/otsus/${row.id}`} className="font-semibold leading-5 text-pbd-navy hover:underline">{row.subkegiatanNama || row.subkegiatan}</Link><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{row.bidang} · {row.program}</p></TableCell>
            <TableCell className="whitespace-normal text-right align-top py-4"><p className="font-semibold text-slate-800">{rupiah(row.pagu)}</p><p className="mt-1 text-xs text-slate-500">Realisasi {rupiah(row.realisasi)}</p></TableCell>
            <TableCell className="align-top py-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{persen(percent)}</span><span className="text-slate-400">terserap</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${percent >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${percent}%` }} /></div></TableCell>
            <TableCell className="align-top py-4"><OtsusStatusBadge status={row.status} /></TableCell>
            <TableCell className="whitespace-normal align-top py-4"><div className="flex flex-wrap gap-1.5"><DocumentBadge icon={Camera} label={`${row.documentationCount} Foto`} ready={row.documentationCount > 0} /><DocumentBadge icon={FileText} label="LPJ" ready={row.hasLpj} /><DocumentBadge icon={FileCheck2} label={row.dpaCount ? `DPA ${row.dpaCount} versi` : "DPA"} ready={row.dpaCount > 0} /></div></TableCell>
            <TableCell className="sticky right-0 bg-white text-right align-top py-3 shadow-[-1px_0_0_0_rgb(241_245_249)] group-even:bg-slate-50 group-hover:bg-slate-50"><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Aksi untuk ${row.subkegiatan}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/internal/otsus/${row.id}`}>Lihat detail</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href={`/internal/otsus/${row.id}/edit`}>Edit labelisasi</Link></DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => setTarget(row)}>Hapus</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
          </TableRow>; })}</TableBody>
        </Table>}
    </CardContent></Card>
    <ConfirmDeleteDialog open={Boolean(target)} onOpenChange={open => !open && setTarget(null)} loading={deleting} title="Hapus Labelisasi Otsus?" description={`Data ${target?.subkegiatan ?? "ini"} beserta foto, LPJ, dan riwayat DPA akan dihapus.`} onConfirm={async () => { if (!target) return; setDeleting(true); setError(""); try { await deleteOtsus(target.id); setSummaryRows(items => items.filter(item => item.id !== target.id)); setTarget(null); setNotice("Labelisasi Otsus berhasil dihapus."); setReload(value => value + 1); } catch (cause) { setError(cause instanceof Error ? cause.message : "Data gagal dihapus."); } finally { setDeleting(false); } }} />
  </CrudPage>;
}

function DocumentBadge({ icon: Icon, label, ready }: { icon: typeof CheckCircle2; label: string; ready: boolean }) {
  return <Badge variant="outline" className={ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}><Icon className="h-3 w-3" />{label}</Badge>;
}

type BudgetValues = { pagu: number; realisasi: number };
type BudgetSummaryData = { pagu: number; realisasi: number; persentase: number; sg: BudgetValues; bg: BudgetValues };

function BudgetSummary({ summary, loading }: { summary: BudgetSummaryData; loading: boolean }) {
  return <div className="app-surface self-start rounded-lg p-5 sm:col-span-1 xl:col-span-2"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-semibold text-slate-500">Realisasi Anggaran</p>{loading ? <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-slate-200"/> : <p className="mt-3 text-3xl font-bold leading-none tracking-tight tabular-nums text-pbd-navy">{persen(summary.persentase)}</p>}</div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-700/10"><CircleDollarSign className="h-5 w-5"/></div></div>
    <p className="mt-3 text-sm font-semibold tabular-nums text-slate-700">{rupiah(summary.realisasi)}</p><p className="mt-0.5 text-sm text-slate-500">dari {rupiah(summary.pagu)}</p><BudgetProgress value={summary.persentase}/>
    <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Sumber Dana</p><div className="grid gap-3 sm:grid-cols-2"><BudgetSource label="SG 1,25%" values={summary.sg}/><BudgetSource label="BG 1%" values={summary.bg}/></div></div></div>;
}

function BudgetSource({ label, values }: { label: string; values: BudgetValues }) {
  const percentage = values.pagu > 0 ? values.realisasi / values.pagu * 100 : 0;
  return <div className="rounded-md bg-slate-50/80 px-3 py-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-600">{label}</span><span className="text-xs font-bold tabular-nums text-slate-700">{persen(percentage)}</span></div><p className="mt-2 break-words text-sm font-semibold tabular-nums text-slate-800">{rupiah(values.realisasi)}</p><p className="mt-0.5 break-words text-xs leading-5 tabular-nums text-slate-500">dari {rupiah(values.pagu)}</p><BudgetProgress value={percentage} compact/></div>;
}

function BudgetProgress({ value, compact = false }: { value: number; compact?: boolean }) {
  const visualWidth = value > 0 ? Math.max(Math.min(value, 100), 2) : 0;
  return <div className={`${compact ? "mt-2 h-1" : "mt-3 h-1.5"} overflow-hidden rounded-full bg-slate-100`} role="progressbar" aria-label="Persentase realisasi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(value, 100)}><div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${visualWidth}%` }}/></div>;
}
