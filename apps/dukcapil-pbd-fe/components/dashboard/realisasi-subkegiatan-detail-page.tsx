"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  FileUp,
  ImageUp,
  X,
} from "lucide-react";

import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { ErrorState, SuccessState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getRealisasiSubkegiatanDetail,
  uploadRealisasiDokumen,
  uploadRealisasiFoto,
} from "@/lib/api/realisasi-subkegiatan";
import type {
  RealisasiFile,
  RealisasiSubkegiatan,
} from "@/types/realisasi-subkegiatan";
import {
  assetUrl,
  formatCapaian,
  formatDate,
  formatFileSize,
  formatOutputWithUnit,
  getStatusCapaianBadgeClass,
} from "@/components/dashboard/realisasi-subkegiatan-utils";

type UploadMode = "foto" | "dokumen" | null;

export function RealisasiSubkegiatanDetailPage({
  realisasiId,
}: {
  realisasiId: number;
}) {
  const [item, setItem] = useState<RealisasiSubkegiatan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    const detail = await getRealisasiSubkegiatanDetail(realisasiId);
    setItem(detail);
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const detail = await getRealisasiSubkegiatanDetail(realisasiId);
        if (mounted) {
          setItem(detail);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Detail realisasi gagal dimuat.");
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
  }, [realisasiId]);

  const closeUploadDialog = () => {
    if (saving) {
      return;
    }
    setUploadMode(null);
    setPhotoFiles(null);
    setDocumentFiles(null);
    setError(null);
  };

  const handleUploadFoto = async () => {
    if (!photoFiles?.length) {
      setError("Pilih minimal satu foto dokumentasi.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await uploadRealisasiFoto(realisasiId, photoFiles);
      await loadDetail();
      setMessage("Foto dokumentasi berhasil ditambahkan.");
      closeUploadDialog();
    } catch (uploadError) {
      console.error(uploadError);
      setError("Foto dokumentasi gagal diupload.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDokumen = async () => {
    if (!documentFiles?.length) {
      setError("Pilih minimal satu dokumen PDF.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await uploadRealisasiDokumen(realisasiId, documentFiles);
      await loadDetail();
      setMessage("Dokumen berhasil ditambahkan.");
      closeUploadDialog();
    } catch (uploadError) {
      console.error(uploadError);
      setError("Dokumen gagal diupload. Pastikan file berbentuk PDF.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardBreadcrumb
        items={[
          {
            label: "Realisasi Subkegiatan",
            href: "/dashboard/realisasi-subkegiatan",
          },
          { label: item?.nama ?? "Detail Realisasi" },
        ]}
      />

      <PageHero
        icon={CalendarDays}
        eyebrow="Realisasi Subkegiatan"
        title={item?.nama ?? "Detail Realisasi"}
        description={
          item
            ? `${formatDate(item.tanggal)} - ${item.lokasi || "Lokasi belum diisi"}`
            : "Memuat detail realisasi subkegiatan."
        }
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {item?.tahunAnggaran ?? "-"}
          </p>
        }
        aside={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-12 rounded-xl">
              <Link href="/dashboard/realisasi-subkegiatan">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
            {item ? (
              <Button
                asChild
                className="h-12 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <Link href={`/dashboard/realisasi-subkegiatan/${item.id}/ubah`}>
                  <Edit3 className="h-4 w-4" />
                  Ubah
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error && !uploadMode ? <ErrorState message={error} /> : null}

      {loading ? (
        <SectionCard>
          <div className="py-10 text-center text-sm text-slate-500">
            Memuat detail realisasi...
          </div>
        </SectionCard>
      ) : item ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <DetailBlock label="Subkegiatan">
              <div className="font-semibold text-pbd-navy">
                {item.subkegiatan?.kode ?? "-"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {item.subkegiatan?.nama ?? "-"}
              </div>
            </DetailBlock>

            <DetailBlock label="Data Realisasi">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailValue label="Lokasi" value={item.lokasi} />
                <DetailValue label="Tanggal" value={formatDate(item.tanggal)} />
                <DetailValue
                  label="Nama kegiatan"
                  value={item.nama}
                  className="sm:col-span-2"
                />
                <DetailValue label="Fasilitator" value={item.fasilitator} />
                <DetailValue
                  label="Jumlah tamu/peserta"
                  value={`${item.jumlahTamu ?? 0}`}
                />
                <DetailValue label="Narasumber" value={item.narasumber} />
                <DetailValue
                  label="Jabatan narasumber"
                  value={item.jabatanNarasumber}
                />
                <DetailValue
                  label="Tujuan kegiatan"
                  value={item.tujuanKegiatan}
                  className="sm:col-span-2"
                  multiline
                />
                <DetailValue
                  label="Poin penting"
                  value={item.poinPenting}
                  className="sm:col-span-2"
                  multiline
                />
                <DetailValue
                  label="Hasil kegiatan"
                  value={item.hasilKegiatan}
                  className="sm:col-span-2"
                  multiline
                />
              </div>
            </DetailBlock>

            <DetailBlock label="Evaluasi Ringan">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailValue
                  label="Target output"
                  value={formatOutputWithUnit(item.targetOutput, item.satuanOutput)}
                />
                <DetailValue
                  label="Realisasi output"
                  value={formatOutputWithUnit(
                    item.realisasiOutput,
                    item.satuanOutput,
                  )}
                />
                <DetailValue
                  label="Persentase capaian"
                  value={formatCapaian(item.persentaseCapaian)}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Status capaian
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${getStatusCapaianBadgeClass(
                      item.statusCapaian,
                    )}`}
                  >
                    {item.statusCapaian}
                  </Badge>
                </div>
                <DetailValue
                  label="Kendala"
                  value={item.kendala}
                  className="sm:col-span-2"
                  multiline
                />
                <DetailValue
                  label="Tindak lanjut"
                  value={item.tindakLanjut}
                  className="sm:col-span-2"
                  multiline
                />
                <DetailValue
                  label="Catatan evaluasi"
                  value={item.catatanEvaluasi}
                  className="sm:col-span-2"
                  multiline
                />
              </div>
            </DetailBlock>

            <DetailBlock label="Data SSD">
              {item.subkegiatan?.ssdItems?.length ? (
                <div className="space-y-3">
                  {(item.subkegiatan?.ssdItems ?? []).map((ssd) => {
                    const value = item.ssdValues?.find(
                      (entry) => entry.ssdId === ssd.id,
                    )?.nilai;

                    return (
                      <div
                        key={ssd.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700"
                          >
                            {ssd.kode}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              value?.trim()
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {value?.trim() ? "Terisi" : "Belum terisi"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-pbd-navy">
                          {ssd.uraian}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {value?.trim() || "-"} {ssd.satuan}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Subkegiatan ini belum memiliki SSD terkait.
                </p>
              )}
            </DetailBlock>
          </div>

          <div className="space-y-5">
            <DetailBlock label="Foto Dokumentasi">
              <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg"
                  onClick={() => setUploadMode("foto")}
                >
                  <ImageUp className="h-4 w-4" />
                  Tambah Foto
                </Button>
              </div>
              <PhotoGrid files={item.fotoDokumentasi ?? []} />
            </DetailBlock>

            <DetailBlock label="Dokumen">
              <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg"
                  onClick={() => setUploadMode("dokumen")}
                >
                  <FileUp className="h-4 w-4" />
                  Tambah Dokumen
                </Button>
              </div>
              <FileList files={item.dokumen ?? []} />
            </DetailBlock>
          </div>
        </div>
      ) : null}

      <Dialog open={uploadMode !== null} onOpenChange={(open) => !open && closeUploadDialog()}>
        {uploadMode === "foto" ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Foto Dokumentasi</DialogTitle>
              <DialogDescription>{item?.nama}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="foto">Foto realisasi</Label>
              <Input
                id="foto"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setPhotoFiles(event.target.files)}
                className="h-11 rounded-lg"
              />
            </div>
            {error ? <DialogError message={error} /> : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleUploadFoto}
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <ImageUp className="h-4 w-4" />
                {saving ? "Mengunggah..." : "Unggah Foto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}

        {uploadMode === "dokumen" ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Dokumen</DialogTitle>
              <DialogDescription>
                Upload TOR, laporan, dan dokumen pendukung lain dalam bentuk PDF.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="dokumen">Dokumen PDF</Label>
              <Input
                id="dokumen"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={(event) => setDocumentFiles(event.target.files)}
                className="h-11 rounded-lg"
              />
            </div>
            {error ? <DialogError message={error} /> : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleUploadDokumen}
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <FileUp className="h-4 w-4" />
                {saving ? "Mengunggah..." : "Unggah Dokumen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function DialogError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
      {message}
    </div>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailValue({
  label,
  value,
  className = "",
  multiline = false,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
  multiline?: boolean;
}) {
  const displayValue =
    typeof value === "string" ? value.trim() || "-" : value ?? "-";

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p
        className={
          multiline
            ? "mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700"
            : "mt-1 text-sm font-semibold text-pbd-navy"
        }
      >
        {displayValue}
      </p>
    </div>
  );
}

function PhotoGrid({ files }: { files: RealisasiFile[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-slate-500">Foto belum tersedia.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {files.map((file) => (
        <a
          key={file.id}
          href={assetUrl(file.url)}
          target="_blank"
          rel="noreferrer"
          className="group overflow-hidden rounded-lg border border-slate-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(file.url)}
            alt={file.originalName}
            className="h-40 w-full object-cover transition group-hover:scale-105"
          />
          <div className="truncate px-3 py-2 text-xs font-medium text-slate-600">
            {file.originalName}
          </div>
        </a>
      ))}
    </div>
  );
}

function FileList({ files }: { files: RealisasiFile[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-slate-500">Dokumen belum tersedia.</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={assetUrl(file.url)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
        >
          <span className="truncate font-medium text-pbd-navy">
            {file.originalName}
          </span>
          <span className="shrink-0 text-xs text-slate-500">
            {formatFileSize(file.size)}
          </span>
        </a>
      ))}
    </div>
  );
}
