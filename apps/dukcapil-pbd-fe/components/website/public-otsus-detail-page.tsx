"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, MapPin, RefreshCw, Share2 } from "lucide-react";

import { Breadcrumb } from "@/components/website/breadcrumb";
import { ContentContainer } from "@/components/website/content-container";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getPublicOtsusDetail } from "@/lib/api/public-otsus";
import type { PublicOtsusDetail, PublicOtsusFile } from "@/types/public-otsus";
import type { OtsusStatus } from "@/types/otsus";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const statusLabels: Record<OtsusStatus, string> = { BELUM_MULAI: "Belum Berjalan", BERJALAN: "Sedang Berjalan", SELESAI: "Selesai" };
const fundingLabels = { SG_1_25: "SG 1,25%", BG_1: "BG 1%" } as const;
function percentage(value: number, total: number) { return total > 0 ? Math.min((value / total) * 100, 100) : 0; }
function statusStyle(status: OtsusStatus) { return status === "SELESAI" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status === "BERJALAN" ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-700 ring-slate-200"; }
function fileSize(value: number) { return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(value / 1024)).toLocaleString("id-ID")} KB`; }

export function PublicOtsusDetailPage({ id, year, initialDetail }: { id: number; year?: string; initialDetail?: PublicOtsusDetail | null }) {
  const [detail, setDetail] = useState<PublicOtsusDetail | null>(initialDetail ?? null);
  const [loading, setLoading] = useState(!initialDetail);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicOtsusDetail(id, year).then((response) => { if (active) { setDetail(response); setError(false); } }).catch(() => active && setError(true)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, year, reload]);

  const retry = () => { setLoading(true); setError(false); setReload((value) => value + 1); };
  const share = async () => {
    const payload = { title: detail?.item.namaSubkegiatan ?? "Data Labelisasi Otsus", text: "Lihat informasi publik kegiatan Otsus ini.", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(payload); else { await navigator.clipboard.writeText(window.location.href); setShared(true); window.setTimeout(() => setShared(false), 2000); }
    } catch { /* pembatalan share tidak perlu ditampilkan sebagai error */ }
  };

  const title = detail?.item.namaSubkegiatan ?? "Detail Labelisasi Otsus";
  return <div className="min-h-screen bg-slate-50">
    <Breadcrumb items={[{ label: "Data Labelisasi Otsus", href: `/labelisasi-otsus${year ? `?tahun=${encodeURIComponent(year)}` : ""}` }, { label: title }]} />
    {error ? <ContentContainer className="py-16"><ErrorPanel onRetry={retry} /></ContentContainer> : loading ? <DetailSkeleton /> : detail ? <DetailContent detail={detail} onShare={share} shared={shared} onPhoto={setLightbox} /> : null}
    <Lightbox photos={detail?.photos ?? []} index={lightbox} onChange={setLightbox} />
  </div>;
}

function DetailContent({ detail, onShare, shared, onPhoto }: { detail: PublicOtsusDetail; onShare: () => void; shared: boolean; onPhoto: (index: number) => void }) {
  const item = detail.item;
  const realized = percentage(item.realisasi, item.pagu);
  return <>
    <section className="border-b border-slate-200 bg-white"><ContentContainer className="py-8 sm:py-10"><div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-4xl"><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyle(item.status)}`}>{statusLabels[item.status]}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{fundingLabels[item.sumberDana]}</span></div><p className="mt-5 font-mono text-xs font-semibold text-pbd-blue">{item.kodeSubkegiatan || "Kode belum tersedia"}</p><h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-pbd-navy sm:text-4xl">{item.namaSubkegiatan}</h1><p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.kabupatenKota || "Lokasi belum tersedia"}</span><span>Tahun Anggaran {item.tahunAnggaran}</span></p></div><Button type="button" variant="outline" onClick={onShare}><Share2 className="h-4 w-4" />{shared ? "Tautan Disalin" : "Bagikan"}</Button></div></ContentContainer></section>
    <ContentContainer className="space-y-8 py-8 sm:py-10">
      <section aria-labelledby="budget-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 id="budget-title" className="text-xl font-bold text-pbd-navy">Ringkasan Anggaran</h2><div className="mt-6 grid gap-5 sm:grid-cols-3"><Metric label="Pagu" value={currency.format(item.pagu)} /><Metric label="Realisasi" value={currency.format(item.realisasi)} /><Metric label="Persentase" value={`${realized.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`} /></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`Realisasi anggaran ${realized.toLocaleString("id-ID", { maximumFractionDigits: 1 })} persen`}><div className="h-full rounded-full bg-pbd-blue" style={{ width: `${realized}%` }} /></div></section>
      <section aria-labelledby="info-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 id="info-title" className="text-xl font-bold text-pbd-navy">Informasi Kegiatan</h2><dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2"><Info label="Program" value={item.program} /><Info label="Kegiatan" value={item.kegiatan} /><Info label="Subkegiatan" value={item.namaSubkegiatan} /><Info label="Bidang" value={item.bidang} /><Info label="Lokasi" value={item.kabupatenKota || "Informasi lokasi belum tersedia"} /><Info label="Sumber Dana" value={fundingLabels[item.sumberDana]} /><Info label="Tahun Anggaran" value={item.tahunAnggaran} /><Info label="Status" value={statusLabels[item.status]} /></dl></section>
      <section aria-labelledby="about-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 id="about-title" className="text-xl font-bold text-pbd-navy">Tentang dan Output Kegiatan</h2><p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">{detail.keterangan || "Deskripsi atau output kegiatan belum tersedia."}</p></section>
      <PhotoGallery photos={detail.photos} onOpen={onPhoto} />
      <DocumentList documents={detail.documents} />
      <Button asChild variant="outline"><Link href={`/labelisasi-otsus?tahun=${encodeURIComponent(item.tahunAnggaran)}`}><ArrowLeft className="h-4 w-4" />Kembali ke daftar</Link></Button>
    </ContentContainer>
  </>;
}

function PhotoGallery({ photos, onOpen }: { photos: PublicOtsusFile[]; onOpen: (index: number) => void }) {
  return <section aria-labelledby="photos-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-2"><Camera className="h-5 w-5 text-pbd-blue" /><h2 id="photos-title" className="text-xl font-bold text-pbd-navy">Dokumentasi Kegiatan</h2></div>{photos.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{photos.map((photo, index) => <button key={photo.id} type="button" onClick={() => onOpen(index)} className="group text-left outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue focus-visible:ring-offset-2"><span className="relative block aspect-square overflow-hidden rounded-xl bg-slate-100"><Image unoptimized fill loading="lazy" sizes="(max-width: 640px) 50vw, 280px" src={photo.previewUrl} alt={photo.caption || `Dokumentasi kegiatan ${index + 1}`} className="object-cover transition duration-300 group-hover:scale-105" /></span><span className="mt-2 line-clamp-2 block text-sm text-slate-600">{photo.caption || `Dokumentasi ${index + 1}`}</span></button>)}</div> : <EmptyAsset icon={Camera} title="Dokumentasi belum tersedia." />}</section>;
}

function DocumentList({ documents }: { documents: PublicOtsusFile[] }) {
  return <section aria-labelledby="docs-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-pbd-blue" /><h2 id="docs-title" className="text-xl font-bold text-pbd-navy">Dokumen Publik</h2></div>{documents.length ? <div className="mt-6 space-y-3">{documents.map((document) => { const pdf = document.mimeType === "application/pdf"; return <article key={document.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-pbd-blue">{pdf ? "PDF" : "DOC"}</span><div className="min-w-0 flex-1"><h3 className="font-bold text-pbd-navy">{document.version ? `Versi ${document.version} — ` : ""}{document.title}</h3><p className="mt-1 text-sm text-slate-500">{fileSize(document.fileSize)}</p></div><div className="flex flex-wrap gap-2">{pdf ? <Button asChild size="sm" variant="outline"><a href={document.previewUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Lihat Dokumen</a></Button> : null}<Button asChild size="sm"><a href={document.downloadUrl}><Download className="h-4 w-4" />Unduh</a></Button></div></article>; })}</div> : <EmptyAsset icon={FileText} title="Dokumen publik belum tersedia." />}</section>;
}

function Lightbox({ photos, index, onChange }: { photos: PublicOtsusFile[]; index: number | null; onChange: (index: number | null) => void }) {
  const photo = index === null ? null : photos[index];
  return <Dialog open={index !== null} onOpenChange={(open) => !open && onChange(null)}><DialogContent className="max-w-6xl border-0 bg-slate-950 p-2 text-white">{photo ? <><div className="relative h-[72vh] min-h-80"><Image unoptimized fill sizes="100vw" src={photo.previewUrl} alt={photo.caption || `Dokumentasi kegiatan ${(index ?? 0) + 1}`} className="object-contain" /></div><div className="flex items-center justify-between gap-3 p-2"><Button type="button" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" disabled={index === 0} onClick={() => onChange(Math.max((index ?? 0) - 1, 0))}><ChevronLeft className="h-4 w-4" />Sebelumnya</Button><p className="line-clamp-2 text-center text-sm text-white/80">{photo.caption || `Dokumentasi ${(index ?? 0) + 1}`}</p><Button type="button" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" disabled={index === photos.length - 1} onClick={() => onChange(Math.min((index ?? 0) + 1, photos.length - 1))}>Berikutnya<ChevronRight className="h-4 w-4" /></Button></div></> : null}</DialogContent></Dialog>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 break-words text-2xl font-extrabold tabular-nums text-pbd-navy">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-sm font-medium text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-line leading-7 text-slate-800">{value || "-"}</dd></div>; }
function EmptyAsset({ icon: Icon, title }: { icon: typeof Camera; title: string }) { return <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Icon className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">{title}</p></div>; }
function ErrorPanel({ onRetry }: { onRetry: () => void }) { return <div className="rounded-2xl border border-red-200 bg-white p-10 text-center"><p className="font-bold text-slate-800">Detail kegiatan belum dapat dimuat</p><p className="mt-2 text-sm text-slate-500">Silakan coba kembali atau kembali ke daftar kegiatan.</p><div className="mt-5 flex justify-center gap-2"><Button asChild variant="outline"><Link href="/labelisasi-otsus"><ArrowLeft className="h-4 w-4" />Kembali</Link></Button><Button type="button" onClick={onRetry}><RefreshCw className="h-4 w-4" />Coba Lagi</Button></div></div>; }
function DetailSkeleton() { return <ContentContainer className="space-y-6 py-10"><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /><div className="h-52 animate-pulse rounded-2xl bg-slate-100" /><div className="h-72 animate-pulse rounded-2xl bg-slate-100" /></ContentContainer>; }
