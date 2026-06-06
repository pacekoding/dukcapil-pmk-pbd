"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getSSDDetail, updateSSD } from "@/lib/api/ssd";
import { cn } from "@/lib/utils";
import type {
  SSDDetail,
  SSDIndicatorPayload,
  SSDPayload,
  SSDVariablePayload,
} from "@/types/ssd";

const indicatorMeasureOptions = [
  "Jumlah",
  "Rata-rata",
  "Persentase",
  "Indeks",
  "Rasio",
];

const createEmptyVariable = (): SSDVariablePayload => ({
  namaVariabel: "",
  konsepDasar: "",
  definisiVariabel: "",
  referensiWaktu: "",
  kalimatPertanyaan: "",
});

const createEmptyIndicator = (): SSDIndicatorPayload => ({
  namaIndikator: "",
  konsepIndikator: "",
  levelEstimasiHasil: "",
  ukuranIndikator: "Jumlah",
  satuanIndikator: "",
  klasifikasiPenyajian: "",
  definisiIndikator: "",
  metodeRumus: "",
  interpretasiHasil: "",
  variableIds: [],
});

const createEmptyPayload = (): SSDPayload => ({
  kode: "",
  uraian: "",
  satuan: "",
  definisiOperasional: "",
  variables: [createEmptyVariable(), createEmptyVariable()],
  indicators: [createEmptyIndicator()],
});

export default function DashboardSSDDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ssdID = Number(params.id);
  const isValidSSDID = Number.isFinite(ssdID) && ssdID > 0;

  const [detail, setDetail] = useState<SSDDetail | null>(null);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [form, setForm] = useState<SSDPayload>(createEmptyPayload);
  const [loading, setLoading] = useState(isValidSSDID);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDetail = async () => {
      try {
        const item = await getSSDDetail(ssdID);
        if (!mounted) {
          return;
        }

        setDetail(item);
        setTahunAnggaran(item.tahunAnggaran);
        setForm({
          kode: item.kode,
          uraian: item.uraian,
          satuan: item.satuan,
          definisiOperasional: item.definisiOperasional,
          variables:
            item.variables.length > 0
              ? item.variables.map((variable) => ({
                  namaVariabel: variable.namaVariabel,
                  konsepDasar: variable.konsepDasar,
                  definisiVariabel: variable.definisiVariabel,
                  referensiWaktu: variable.referensiWaktu,
                  kalimatPertanyaan: variable.kalimatPertanyaan,
                }))
              : [createEmptyVariable(), createEmptyVariable()],
          indicators:
            item.indicators.length > 0
              ? item.indicators.map((indicator) => ({
                  namaIndikator: indicator.namaIndikator,
                  konsepIndikator: indicator.konsepIndikator,
                  levelEstimasiHasil: indicator.levelEstimasiHasil,
                  ukuranIndikator: indicator.ukuranIndikator || "Jumlah",
                  satuanIndikator: indicator.satuanIndikator,
                  klasifikasiPenyajian: indicator.klasifikasiPenyajian,
                  definisiIndikator: indicator.definisiIndikator,
                  metodeRumus: indicator.metodeRumus,
                  interpretasiHasil: indicator.interpretasiHasil,
                  variableIds: indicator.variableIds,
                }))
              : [createEmptyIndicator()],
        });
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Detail SSD gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (isValidSSDID) {
      void loadDetail();
    }

    return () => {
      mounted = false;
    };
  }, [isValidSSDID, ssdID]);

  const variableCount = form.variables.length;
  const indicatorCount = form.indicators.length;

  const handleSave = async () => {
    if (!form.kode.trim() || !form.uraian.trim()) {
      setError("Kode dan uraian SSD wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: SSDPayload = {
        kode: form.kode.trim(),
        uraian: form.uraian.trim(),
        satuan: form.satuan.trim(),
        definisiOperasional: form.definisiOperasional.trim(),
        variables: form.variables.map((variable) => ({
          namaVariabel: variable.namaVariabel.trim(),
          konsepDasar: variable.konsepDasar.trim(),
          definisiVariabel: variable.definisiVariabel.trim(),
          referensiWaktu: variable.referensiWaktu.trim(),
          kalimatPertanyaan: variable.kalimatPertanyaan.trim(),
        })),
        indicators: form.indicators.map((indicator) => ({
          namaIndikator: indicator.namaIndikator.trim(),
          konsepIndikator: indicator.konsepIndikator.trim(),
          levelEstimasiHasil: indicator.levelEstimasiHasil.trim(),
          ukuranIndikator: indicator.ukuranIndikator.trim(),
          satuanIndikator: indicator.satuanIndikator.trim(),
          klasifikasiPenyajian: indicator.klasifikasiPenyajian.trim(),
          definisiIndikator: indicator.definisiIndikator.trim(),
          metodeRumus: indicator.metodeRumus.trim(),
          interpretasiHasil: indicator.interpretasiHasil.trim(),
          variableIds: indicator.variableIds,
        })),
      };

      const saved = await updateSSD(ssdID, payload);
      setDetail(saved);
      setForm(payload);
      setMessage("Metadata SSD berhasil disimpan.");
    } catch (saveError) {
      console.error(saveError);
      setError("Metadata SSD gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const variableLabels = useMemo(
    () =>
      form.variables.map((variable, index) => ({
        id: index + 1,
        label: variable.namaVariabel.trim() || `Variabel ${index + 1}`,
      })),
    [form.variables],
  );

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="h-40 animate-pulse rounded-lg bg-white" />
      </main>
    );
  }

  if (!isValidSSDID) {
    return (
      <main className="space-y-6">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
          ID SSD tidak valid.
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <PageHero
        icon={FileSpreadsheet}
        eyebrow="Metadata Data"
        title={`Kelola Variabel dan Indikator ${detail?.kode ?? "SSD"}`}
        description="Setiap SSD memiliki banyak variabel dan banyak indikator. Setiap indikator disusun dari variabel SSD yang tersedia."
        meta={
          <div className="flex flex-wrap gap-2">
            <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
              Tahun Anggaran {tahunAnggaran}
            </p>
            {detail?.isActive === false ? (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                SSD Nonaktif
              </Badge>
            ) : null}
          </div>
        }
        aside={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-12 rounded-xl">
              <Link href="/dashboard/ssd">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-slate-200 bg-white px-5 text-pbd-navy shadow-sm"
            >
              <Link href="https://romantik.web.bps.go.id/" target="_blank">
                <ArrowUpRight className="h-4 w-4" />
                Lihat Panduan
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      {message ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {message}
        </section>
      ) : null}
      {error ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
          {error}
        </section>
      ) : null}
      {detail && detail.jumlahVariabel === 0 && detail.jumlahIndikator === 0 ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-700">
          SSD ini belum memiliki metadata variabel dan indikator. Form kosong adalah kondisi awal, dan data dapat langsung ditambahkan lalu disimpan.
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,35,80,0.08)]">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryStat label="Kode SSD" value={form.kode || "-"} />
          <SummaryStat label="Variabel" value={String(variableCount)} />
          <SummaryStat label="Indikator" value={String(indicatorCount)} />
          <SummaryStat label="Satuan" value={form.satuan || "-"} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,35,80,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-pbd-navy">Identitas SSD</h2>
            <p className="mt-1 text-sm text-slate-500">
              Informasi dasar SSD sebagai induk metadata variabel dan indikator.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/ssd")}
              className="h-11 rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Metadata"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField label="Kode SSD *">
            <Input
              value={form.kode}
              onChange={(event) =>
                setForm((current) => ({ ...current, kode: event.target.value }))
              }
              className="h-11 rounded-lg"
            />
          </FormField>
          <FormField label="Satuan SSD">
            <Input
              value={form.satuan}
              onChange={(event) =>
                setForm((current) => ({ ...current, satuan: event.target.value }))
              }
              className="h-11 rounded-lg"
            />
          </FormField>
          <FormField label="Uraian SSD *" className="md:col-span-2">
            <Textarea
              value={form.uraian}
              onChange={(event) =>
                setForm((current) => ({ ...current, uraian: event.target.value }))
              }
              className="min-h-24 rounded-lg"
            />
          </FormField>
          <FormField label="Definisi Operasional SSD" className="md:col-span-2">
            <Textarea
              value={form.definisiOperasional}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  definisiOperasional: event.target.value,
                }))
              }
              className="min-h-24 rounded-lg"
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,35,80,0.08)]">
        <Tabs defaultValue="variabel" className="gap-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-pbd-blue">
                Metadata Data
              </p>
              <h3 className="text-2xl font-extrabold tracking-tight text-pbd-navy">
                Kelola Metadata SSD
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Atur metadata variabel dan indikator dalam tab terpisah agar lebih fokus saat mengelola SSD.
              </p>
            </div>
            <TabsList variant="line" className="h-auto gap-2 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="variabel"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm data-active:border-pbd-blue data-active:bg-blue-50 data-active:text-pbd-blue"
              >
                Metadata Variabel
              </TabsTrigger>
              <TabsTrigger
                value="indikator"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm data-active:border-pbd-blue data-active:bg-blue-50 data-active:text-pbd-blue"
              >
                Metadata Indikator
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="variabel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-xl font-bold text-pbd-navy">Metadata Variabel</h4>
                <p className="mt-1 text-sm text-slate-500">
                  SSD dapat memiliki lebih dari satu variabel.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    variables: [...current.variables, createEmptyVariable()],
                  }))
                }
                className="h-11 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Tambah Variabel
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              {form.variables.map((variable, variableIndex) => (
                <div
                  key={`variable-${variableIndex}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h5 className="text-lg font-bold text-pbd-navy">
                        Variabel {variableIndex + 1}
                      </h5>
                      <p className="mt-1 text-sm text-slate-500">
                        Metadata variabel untuk SSD ini.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          variables: current.variables.filter(
                            (_, index) => index !== variableIndex,
                          ),
                        }))
                      }
                      disabled={form.variables.length <= 1}
                      className="h-10 rounded-xl bg-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Variabel
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Nama *"
                      className="md:col-span-2"
                      hint='Sesuai Juknis BPS: nama variabel tidak boleh disingkat, serta tidak mengandung satuan, cakupan wilayah, maupun klasifikasi.'
                    >
                      <Input
                        value={variable.namaVariabel}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variables: current.variables.map((item, index) =>
                              index === variableIndex
                                ? { ...item, namaVariabel: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField label="Konsep Dasar">
                      <Input
                        value={variable.konsepDasar}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variables: current.variables.map((item, index) =>
                              index === variableIndex
                                ? { ...item, konsepDasar: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField label="Definisi" className="md:col-span-2">
                      <Textarea
                        value={variable.definisiVariabel}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variables: current.variables.map((item, index) =>
                              index === variableIndex
                                ? { ...item, definisiVariabel: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="min-h-24 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField label="Referensi Waktu">
                      <Input
                        value={variable.referensiWaktu}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variables: current.variables.map((item, index) =>
                              index === variableIndex
                                ? { ...item, referensiWaktu: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField
                      label="Kalimat Pertanyaan dalam Kuesioner"
                      className="md:col-span-2"
                    >
                      <Input
                        value={variable.kalimatPertanyaan}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variables: current.variables.map((item, index) =>
                              index === variableIndex
                                ? { ...item, kalimatPertanyaan: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="indikator">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-xl font-bold text-pbd-navy">Metadata Indikator</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Setiap indikator dapat tersusun dari satu atau lebih variabel SSD.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    indicators: [...current.indicators, createEmptyIndicator()],
                  }))
                }
                className="h-11 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Tambah Indikator
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              {form.indicators.map((indicator, indicatorIndex) => (
                <div
                  key={`indicator-${indicatorIndex}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h5 className="text-lg font-bold text-pbd-navy">
                        Indikator {indicatorIndex + 1}
                      </h5>
                      <p className="mt-1 text-sm text-slate-500">
                        Pilih variabel yang menyusun indikator ini.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          indicators: current.indicators.filter(
                            (_, index) => index !== indicatorIndex,
                          ),
                        }))
                      }
                      disabled={form.indicators.length <= 1}
                      className="h-10 rounded-xl bg-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Indikator
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Nama Indikator *"
                      className="md:col-span-2"
                      hint="Sesuai Juknis BPS: nama indikator bisa berupa jumlah, rata-rata, persentase, indeks, atau rasio."
                    >
                      <Input
                        value={indicator.namaIndikator}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? { ...item, namaIndikator: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField label="Konsep Indikator">
                      <Input
                        value={indicator.konsepIndikator}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? { ...item, konsepIndikator: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField label="Level Estimasi Hasil">
                      <Input
                        value={indicator.levelEstimasiHasil}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? { ...item, levelEstimasiHasil: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField label="Ukuran Indikator">
                      <Select
                        value={indicator.ukuranIndikator}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? { ...item, ukuranIndikator: value }
                                : item,
                            ),
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-lg bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {indicatorMeasureOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Satuan Indikator">
                      <Input
                        value={indicator.satuanIndikator}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? { ...item, satuanIndikator: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField
                      label="Variabel Penyusun"
                      className="md:col-span-2"
                      hint="Pilih satu atau lebih variabel SSD yang menyusun indikator ini."
                    >
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="space-y-2">
                          {variableLabels.map((variable) => {
                            const checked = indicator.variableIds.includes(variable.id);
                            return (
                              <label
                                key={variable.id}
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition",
                                  checked
                                    ? "border-pbd-blue bg-blue-50/70"
                                    : "border-slate-200 hover:border-slate-300",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      indicators: current.indicators.map((item, index) =>
                                        index === indicatorIndex
                                          ? {
                                              ...item,
                                              variableIds: event.target.checked
                                                ? [...item.variableIds, variable.id]
                                                : item.variableIds.filter(
                                                    (id) => id !== variable.id,
                                                  ),
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-pbd-blue"
                                />
                                <div>
                                  <p className="font-semibold text-pbd-navy">
                                    {variable.label}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    Variabel #{variable.id}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </FormField>
                    <FormField label="Klasifikasi Penyajian" className="md:col-span-2">
                      <Input
                        value={indicator.klasifikasiPenyajian}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? {
                                    ...item,
                                    klasifikasiPenyajian: event.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        className="h-11 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField label="Definisi Indikator" className="md:col-span-2">
                      <Textarea
                        value={indicator.definisiIndikator}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? { ...item, definisiIndikator: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="min-h-24 rounded-lg bg-white"
                      />
                    </FormField>
                    <FormField
                      label="Metode / Rumus Penghitungan Matematika"
                      className="md:col-span-2"
                    >
                      <Textarea
                        value={indicator.metodeRumus}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? { ...item, metodeRumus: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="min-h-24 rounded-lg bg-white font-mono text-[#7a22ff]"
                      />
                    </FormField>
                    <FormField
                      label="Interpretasi Hasil Indikator"
                      className="md:col-span-2"
                    >
                      <Textarea
                        value={indicator.interpretasiHasil}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            indicators: current.indicators.map((item, index) =>
                              index === indicatorIndex
                                ? {
                                    ...item,
                                    interpretasiHasil: event.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        className="min-h-24 rounded-lg bg-white"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function FormField({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-bold uppercase tracking-wide text-slate-700">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-pbd-navy">{value}</p>
    </div>
  );
}
