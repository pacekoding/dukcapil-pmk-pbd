"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Save, X } from "lucide-react";

import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { ErrorState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createRealisasiSubkegiatan,
  getRealisasiSubkegiatanDetail,
  updateRealisasiSubkegiatan,
} from "@/lib/api/realisasi-subkegiatan";
import { getSubkegiatan } from "@/lib/api/subkegiatan";
import type {
  RealisasiSubkegiatan,
  RealisasiSubkegiatanPayload,
} from "@/types/realisasi-subkegiatan";
import type { Subkegiatan } from "@/types/subkegiatan";
import {
  calculateCapaian,
  formatCapaian,
  getStatusCapaian,
  getStatusCapaianBadgeClass,
  parseOptionalNumber,
  today,
} from "@/components/dashboard/realisasi-subkegiatan-utils";

type RealisasiFormMode = "create" | "edit";

const emptyForm = (): RealisasiSubkegiatanPayload => ({
  subkegiatanId: 0,
  tanggal: today(),
  nama: "",
  lokasi: "",
  fasilitator: "",
  narasumber: "",
  jabatanNarasumber: "",
  jumlahTamu: 0,
  tujuanKegiatan: "",
  poinPenting: "",
  hasilKegiatan: "",
  keterangan: "",
  targetOutput: null,
  realisasiOutput: null,
  satuanOutput: "",
  kendala: "",
  tindakLanjut: "",
  catatanEvaluasi: "",
  ssdValues: [],
});

const buildRealisasiSSDValues = (
  subkegiatanId: number,
  source: Subkegiatan[],
  currentValues: RealisasiSubkegiatanPayload["ssdValues"] = [],
) => {
  const selected = source.find((entry) => entry.id === subkegiatanId);
  const currentMap = new Map(
    currentValues.map((value) => [value.ssdId, value.nilai]),
  );

  return (
    selected?.ssdItems?.map((ssd) => ({
      ssdId: ssd.id,
      nilai: currentMap.get(ssd.id) ?? "",
    })) ?? []
  );
};

export function RealisasiSubkegiatanFormPage({
  mode,
  realisasiId,
}: {
  mode: RealisasiFormMode;
  realisasiId?: number;
}) {
  const router = useRouter();
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [subkegiatan, setSubkegiatan] = useState<Subkegiatan[]>([]);
  const [item, setItem] = useState<RealisasiSubkegiatan | null>(null);
  const [form, setForm] = useState<RealisasiSubkegiatanPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "edit";
  const selectedSubkegiatan = useMemo(
    () => subkegiatan.find((entry) => entry.id === form.subkegiatanId) ?? null,
    [form.subkegiatanId, subkegiatan],
  );
  const formPersentaseCapaian = useMemo(
    () => calculateCapaian(form.targetOutput, form.realisasiOutput),
    [form.targetOutput, form.realisasiOutput],
  );
  const formStatusCapaian = useMemo(
    () => getStatusCapaian(form.targetOutput, form.realisasiOutput),
    [form.targetOutput, form.realisasiOutput],
  );

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const subkegiatanData = await getSubkegiatan();
        let detail: RealisasiSubkegiatan | null = null;

        if (isEdit && realisasiId) {
          detail = await getRealisasiSubkegiatanDetail(realisasiId);
        }

        if (!mounted) {
          return;
        }

        setTahunAnggaran(
          detail?.tahunAnggaran ?? subkegiatanData.tahunAnggaran,
        );
        setSubkegiatan(subkegiatanData.items);
        setItem(detail);
        setForm(
          detail
            ? {
                subkegiatanId: detail.subkegiatanId,
                tanggal: detail.tanggal,
                nama: detail.nama,
                lokasi: detail.lokasi,
                fasilitator: detail.fasilitator ?? "",
                narasumber: detail.narasumber ?? "",
                jabatanNarasumber: detail.jabatanNarasumber ?? "",
                jumlahTamu: detail.jumlahTamu ?? 0,
                tujuanKegiatan: detail.tujuanKegiatan ?? "",
                poinPenting: detail.poinPenting ?? "",
                hasilKegiatan: detail.hasilKegiatan ?? "",
                keterangan: detail.keterangan ?? "",
                targetOutput: detail.targetOutput ?? null,
                realisasiOutput: detail.realisasiOutput ?? null,
                satuanOutput: detail.satuanOutput ?? "",
                kendala: detail.kendala ?? "",
                tindakLanjut: detail.tindakLanjut ?? "",
                catatanEvaluasi: detail.catatanEvaluasi ?? "",
                ssdValues: buildRealisasiSSDValues(
                  detail.subkegiatanId,
                  subkegiatanData.items,
                  detail.ssdValues?.map((value) => ({
                    ssdId: value.ssdId,
                    nilai: value.nilai,
                  })) ?? [],
                ),
              }
            : {
                ...emptyForm(),
                subkegiatanId: subkegiatanData.items[0]?.id ?? 0,
                ssdValues: buildRealisasiSSDValues(
                  subkegiatanData.items[0]?.id ?? 0,
                  subkegiatanData.items,
                  [],
                ),
              },
        );
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data form realisasi gagal dimuat.");
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
  }, [isEdit, realisasiId]);

  const handleSubmit = async () => {
    const payload: RealisasiSubkegiatanPayload = {
      subkegiatanId: form.subkegiatanId,
      tanggal: form.tanggal,
      nama: form.nama.trim(),
      lokasi: form.lokasi.trim(),
      fasilitator: form.fasilitator.trim(),
      narasumber: form.narasumber.trim(),
      jabatanNarasumber: form.jabatanNarasumber.trim(),
      jumlahTamu: Math.max(0, Number(form.jumlahTamu) || 0),
      tujuanKegiatan: form.tujuanKegiatan.trim(),
      poinPenting: form.poinPenting.trim(),
      hasilKegiatan: form.hasilKegiatan.trim(),
      keterangan: form.keterangan.trim(),
      targetOutput: form.targetOutput,
      realisasiOutput: form.realisasiOutput,
      satuanOutput: form.satuanOutput.trim(),
      kendala: form.kendala.trim(),
      tindakLanjut: form.tindakLanjut.trim(),
      catatanEvaluasi: form.catatanEvaluasi.trim(),
      ssdValues: form.ssdValues.map((value) => ({
        ssdId: value.ssdId,
        nilai: value.nilai.trim(),
      })),
    };

    if (!payload.subkegiatanId || !payload.tanggal || !payload.nama) {
      setError("Subkegiatan, tanggal, dan nama kegiatan wajib diisi.");
      return;
    }
    if (payload.targetOutput !== null && payload.targetOutput < 0) {
      setError("Target output tidak boleh negatif.");
      return;
    }
    if (payload.realisasiOutput !== null && payload.realisasiOutput < 0) {
      setError("Realisasi output tidak boleh negatif.");
      return;
    }
    if (
      ((payload.targetOutput ?? 0) > 0 || (payload.realisasiOutput ?? 0) > 0) &&
      !payload.satuanOutput
    ) {
      setError("Satuan output wajib diisi jika target atau realisasi diisi.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = item
        ? await updateRealisasiSubkegiatan(item.id, payload)
        : await createRealisasiSubkegiatan(payload);
      router.push(`/dashboard/realisasi-subkegiatan/${saved.id}`);
    } catch (saveError) {
      console.error(saveError);
      setError("Realisasi subkegiatan gagal disimpan.");
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
          { label: isEdit ? "Ubah Realisasi" : "Tambah Realisasi" },
        ]}
      />

      <PageHero
        icon={CalendarDays}
        eyebrow="Realisasi Subkegiatan"
        title={isEdit ? "Ubah Realisasi" : "Tambah Realisasi"}
        description="Isi data realisasi, evaluasi ringan, dan nilai SSD yang terkait dengan subkegiatan."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {tahunAnggaran}
          </p>
        }
        aside={
          <Button asChild variant="outline" className="h-12 rounded-xl">
            <Link href={item ? `/dashboard/realisasi-subkegiatan/${item.id}` : "/dashboard/realisasi-subkegiatan"}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <SectionCard>
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Memuat form realisasi...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Subkegiatan</Label>
              <Select
                value={form.subkegiatanId ? String(form.subkegiatanId) : undefined}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    subkegiatanId: Number(value),
                    ssdValues: buildRealisasiSSDValues(
                      Number(value),
                      subkegiatan,
                      current.ssdValues,
                    ),
                  }))
                }
              >
                <SelectTrigger className="h-11 w-full rounded-lg">
                  <SelectValue placeholder="Pilih subkegiatan" />
                </SelectTrigger>
                <SelectContent>
                  {subkegiatan.map((entry) => (
                    <SelectItem key={entry.id} value={String(entry.id)}>
                      {entry.kode} - {entry.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormSection title="Data Realisasi">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  id="lokasi"
                  label="Lokasi"
                  value={form.lokasi}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, lokasi: value }))
                  }
                />
                <TextInput
                  id="tanggal"
                  label="Tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, tanggal: value }))
                  }
                />
                <TextInput
                  id="nama"
                  label="Nama Kegiatan"
                  value={form.nama}
                  className="md:col-span-2"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, nama: value }))
                  }
                />
                <TextInput
                  id="fasilitator"
                  label="Fasilitator"
                  value={form.fasilitator}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, fasilitator: value }))
                  }
                />
                <TextInput
                  id="jumlah-tamu"
                  label="Jumlah Tamu/Peserta"
                  type="number"
                  min={0}
                  value={form.jumlahTamu}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      jumlahTamu: Math.max(0, Number(value) || 0),
                    }))
                  }
                />
                <TextInput
                  id="narasumber"
                  label="Narasumber"
                  value={form.narasumber}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, narasumber: value }))
                  }
                />
                <TextInput
                  id="jabatan-narasumber"
                  label="Jabatan Narasumber"
                  value={form.jabatanNarasumber}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      jabatanNarasumber: value,
                    }))
                  }
                />
                <TextareaInput
                  id="tujuan-kegiatan"
                  label="Tujuan Kegiatan"
                  value={form.tujuanKegiatan}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, tujuanKegiatan: value }))
                  }
                />
                <TextareaInput
                  id="poin-penting"
                  label="Poin Penting"
                  value={form.poinPenting}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, poinPenting: value }))
                  }
                />
                <TextareaInput
                  id="hasil-kegiatan"
                  label="Hasil Kegiatan"
                  value={form.hasilKegiatan}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, hasilKegiatan: value }))
                  }
                />
              </div>
            </FormSection>

            <FormSection
              title="Evaluasi Ringan"
              aside={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-600"
                  >
                    Capaian: {formatCapaian(formPersentaseCapaian)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getStatusCapaianBadgeClass(formStatusCapaian)}
                  >
                    {formStatusCapaian}
                  </Badge>
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-3">
                <TextInput
                  id="target-output"
                  label="Target Output"
                  type="number"
                  min={0}
                  step="any"
                  value={form.targetOutput ?? ""}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      targetOutput: parseOptionalNumber(value),
                    }))
                  }
                />
                <TextInput
                  id="realisasi-output"
                  label="Realisasi Output"
                  type="number"
                  min={0}
                  step="any"
                  value={form.realisasiOutput ?? ""}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      realisasiOutput: parseOptionalNumber(value),
                    }))
                  }
                />
                <TextInput
                  id="satuan-output"
                  label="Satuan Output"
                  value={form.satuanOutput}
                  placeholder="Contoh: Laporan"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, satuanOutput: value }))
                  }
                />
                <TextareaInput
                  id="kendala"
                  label="Kendala"
                  value={form.kendala}
                  className="md:col-span-3"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, kendala: value }))
                  }
                />
                <TextareaInput
                  id="tindak-lanjut"
                  label="Tindak Lanjut"
                  value={form.tindakLanjut}
                  className="md:col-span-3"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, tindakLanjut: value }))
                  }
                />
                <TextareaInput
                  id="catatan-evaluasi"
                  label="Catatan Evaluasi"
                  value={form.catatanEvaluasi}
                  className="md:col-span-3"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      catatanEvaluasi: value,
                    }))
                  }
                />
              </div>
            </FormSection>

            <FormSection
              title="Data SSD"
              aside={
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 text-slate-600"
                >
                  {selectedSubkegiatan?.ssdItems?.length ?? 0} SSD
                </Badge>
              }
            >
              {selectedSubkegiatan &&
              (selectedSubkegiatan.ssdItems?.length ?? 0) > 0 ? (
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {selectedSubkegiatan.ssdItems.map((ssd) => {
                    const value =
                      form.ssdValues.find((entry) => entry.ssdId === ssd.id)
                        ?.nilai ?? "";

                    return (
                      <div
                        key={ssd.id}
                        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_240px]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              {ssd.kode}
                            </Badge>
                            {ssd.satuan ? (
                              <Badge
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-slate-600"
                              >
                                {ssd.satuan}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-5 text-pbd-navy">
                            {ssd.uraian}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`ssd-value-${ssd.id}`}
                            className="text-xs text-slate-500"
                          >
                            Nilai {ssd.satuan || "data"}
                          </Label>
                          <Input
                            id={`ssd-value-${ssd.id}`}
                            value={value}
                            placeholder={`Isi nilai ${ssd.satuan || "data"}`}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                ssdValues: current.ssdValues.map((entry) =>
                                  entry.ssdId === ssd.id
                                    ? { ...entry, nilai: event.target.value }
                                    : entry,
                                ),
                              }))
                            }
                            className="h-10 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Subkegiatan ini belum memiliki SSD terkait.
                </div>
              )}
            </FormSection>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end md:col-span-2">
              <Button asChild type="button" variant="outline" disabled={saving}>
                <Link href={item ? `/dashboard/realisasi-subkegiatan/${item.id}` : "/dashboard/realisasi-subkegiatan"}>
                  <X className="h-4 w-4" />
                  Batal
                </Link>
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan Realisasi"}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function FormSection({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 md:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-pbd-navy">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
  className = "",
  type = "text",
  min,
  step,
  placeholder,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  min?: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg"
      />
    </div>
  );
}

function TextareaInput({
  id,
  label,
  value,
  onChange,
  className = "md:col-span-2",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 rounded-lg"
      />
    </div>
  );
}
