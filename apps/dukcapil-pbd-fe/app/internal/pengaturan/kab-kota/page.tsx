"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, MapPinned, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteKabKota, getKabKota } from "@/lib/api/kab-kota";
import type { KabKota } from "@/types/kab-kota";

const base = "/internal/pengaturan/kab-kota";
export default function InternalKabKotaPage() {
  const [items,setItems]=useState<KabKota[]>([]), [target,setTarget]=useState<KabKota|null>(null);
  const [query,setQuery]=useState(""), [loading,setLoading]=useState(true), [deleting,setDeleting]=useState(false), [error,setError]=useState<string|null>(null);
  useEffect(()=>{ getKabKota().then(setItems).catch(()=>setError("Data kabupaten/kota gagal dimuat.")).finally(()=>setLoading(false)); },[]);
  const shown=useMemo(()=>items.filter((item)=>`${item.kodeWilayah} ${item.nama} ${item.provinsi}`.toLowerCase().includes(query.toLowerCase())),[items,query]);
  async function remove(){ if(!target)return; setDeleting(true); try{await deleteKabKota(target.id);setItems(v=>v.filter(i=>i.id!==target.id));setTarget(null);}catch(cause){setError(cause instanceof Error?cause.message:"Data gagal dihapus.");}finally{setDeleting(false);} }
  return <main className="space-y-6"><PageHero icon={MapPinned} eyebrow="Pengaturan" title="Data Kab/Kota" description="Kelola master kabupaten/kota yang digunakan sistem." />
    <SectionCard title="Daftar Kab/Kota" description={`${items.length} data tersimpan.`} action={<div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input className="pl-9" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari kab/kota..."/></div><Button asChild><Link href={`${base}/add`}><Plus className="h-4 w-4"/>Tambah</Link></Button></div>} contentClassName="p-0">
      {error?<p className="border-b bg-red-50 p-4 text-sm text-red-700">{error}</p>:null}<Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead>Provinsi</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{loading?<TableRow><TableCell colSpan={4} className="py-10 text-center">Memuat...</TableCell></TableRow>:shown.map(item=><TableRow key={item.id}><TableCell>{item.kodeWilayah}</TableCell><TableCell className="font-semibold">{item.nama}</TableCell><TableCell>{item.provinsi}</TableCell><TableCell><div className="flex justify-end gap-1"><Button asChild size="icon-sm" variant="ghost" aria-label={`Lihat ${item.nama}`}><Link href={`${base}/${item.id}/preview`}><Eye className="h-4 w-4"/></Link></Button><Button asChild size="icon-sm" variant="ghost" aria-label={`Edit ${item.nama}`}><Link href={`${base}/${item.id}/edit`}><Pencil className="h-4 w-4"/></Link></Button><Button size="icon-sm" variant="ghost" aria-label={`Hapus ${item.nama}`} onClick={()=>setTarget(item)}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>)}</TableBody></Table>
    </SectionCard><ConfirmDeleteDialog open={!!target} title="Hapus Data Kab/Kota?" description={`Data ${target?.nama??""} akan dihapus.`} loading={deleting} onOpenChange={open=>!open&&setTarget(null)} onConfirm={remove}/></main>;
}
