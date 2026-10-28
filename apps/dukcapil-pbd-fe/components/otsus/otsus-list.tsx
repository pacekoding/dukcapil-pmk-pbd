"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Search, Tags } from "lucide-react";
import { CrudPage } from "@/components/dashboard/crud-page";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/dashboard/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteOtsus, getOtsus } from "@/lib/api/otsus";
import type { OtsusLabel } from "@/types/otsus";
import { OtsusStatusBadge, rupiah } from "./otsus-utils";

export function OtsusList() {
  const [rows, setRows] = useState<OtsusLabel[]>([]), [search, setSearch] = useState(""), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState(""), [target, setTarget] = useState<OtsusLabel | null>(null), [deleting, setDeleting] = useState(false), [reload, setReload] = useState(0);
  useEffect(() => { let active = true; const timer = setTimeout(() => { setLoading(true); setError(""); getOtsus(search).then((items) => active && setRows(items)).catch((cause) => active && setError(cause instanceof Error ? cause.message : "Data gagal dimuat.")).finally(() => active && setLoading(false)); }, 250); return () => { active = false; clearTimeout(timer); }; }, [search, reload]);
  return <CrudPage width="max-w-none" title="Labelisasi Otsus" description="Kelola data subkegiatan yang menggunakan Dana Otonomi Khusus." breadcrumbs={[{ label: "Internal", href: "/internal/dashboard" }, { label: "Labelisasi Otsus" }]} actions={<Button asChild><Link href="/internal/otsus/add"><Plus className="h-4 w-4" />Tambah</Link></Button>}>
    {error ? <ErrorState message={error} /> : null}{notice ? <SuccessState message={notice} /> : null}
    <Card><CardContent className="space-y-4"><div className="relative max-w-xl"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode/ID atau nama subkegiatan..." aria-label="Cari Labelisasi Otsus" /></div>
      {loading ? <LoadingState rows={5} message="Memuat Labelisasi Otsus..." /> : rows.length === 0 ? <EmptyState icon={Tags} title="Belum ada Labelisasi Otsus" description={search ? "Tidak ada subkegiatan yang cocok dengan pencarian." : "Tambahkan subkegiatan yang menggunakan Dana Otsus."} /> : <Table><TableHeader><TableRow>{["Subkegiatan", "Bidang", "Pagu Otsus", "Realisasi", "Persentase", "Status Pelaksanaan", "Dokumentasi", "LPJ", "DPA", "Aksi"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row) => { const percent = row.pagu === 0 ? 0 : row.realisasi / row.pagu * 100; return <TableRow key={row.id}><TableCell className="min-w-64 whitespace-normal"><p className="text-xs text-slate-500">ID Subkegiatan: {row.subkegiatanId}</p><p className="font-semibold text-pbd-navy">{row.subkegiatan}</p></TableCell><TableCell className="max-w-48 whitespace-normal">{row.bidang}</TableCell><TableCell>{rupiah(row.pagu)}</TableCell><TableCell>{rupiah(row.realisasi)}</TableCell><TableCell>{percent.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%</TableCell><TableCell><OtsusStatusBadge status={row.status} /></TableCell><TableCell>{row.documentationCount} Foto</TableCell><TableCell>{row.hasLpj ? "Tersedia" : "Belum Ada"}</TableCell><TableCell>{row.dpaCount ? `${row.dpaCount} Versi` : "Belum Ada"}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Aksi"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/internal/otsus/${row.id}`}>Detail</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href={`/internal/otsus/${row.id}/edit`}>Edit</Link></DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => setTarget(row)}>Hapus</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>; })}</TableBody></Table>}
    </CardContent></Card>
    <ConfirmDeleteDialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)} loading={deleting} title="Hapus Labelisasi Otsus?" description={`Data ${target?.subkegiatan ?? "ini"} beserta foto dan LPJ akan dihapus. Riwayat DPA juga tidak lagi tersedia.`} onConfirm={async () => { if (!target) return; setDeleting(true); setError(""); try { await deleteOtsus(target.id); setTarget(null); setNotice("Labelisasi Otsus berhasil dihapus."); setReload((value) => value + 1); } catch (cause) { setError(cause instanceof Error ? cause.message : "Data gagal dihapus."); } finally { setDeleting(false); } }} />
  </CrudPage>;
}
