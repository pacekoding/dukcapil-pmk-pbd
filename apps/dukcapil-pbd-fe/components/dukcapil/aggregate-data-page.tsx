"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Database,
  Edit3,
  FileText,
  MapPin,
  RefreshCw,
  Save,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { CrudPage, DetailGrid } from "@/components/dashboard/crud-page";
import { ErrorState, LoadingState, SuccessState } from "@/components/dashboard/state";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { confirmDiscard, useUnsavedChanges } from "@/lib/use-unsaved-changes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCivilRegistration,
  getPopulationRegistration,
  updateCivilRegistration,
  updatePopulationRegistration,
} from "@/lib/api/dukcapil-aggregate";
import { formatNumber } from "@/lib/data-wilayah";
import type {
  CivilRegistrationAggregate,
  DukcapilAggregateRegion,
  DukcapilAggregateResponse,
  PopulationRegistrationAggregate,
} from "@/types/dukcapil-aggregate";

type NumericData<Data extends object> = {
  [Key in keyof Data]: number;
};
const legacyInlineCrudEnabled: boolean = false;

type FieldDefinition<Key extends string> = {
  key: Key;
  label: string;
  description: string;
};

type TableColumn<Data> = {
  label: string;
  value: (data: Data) => number;
};

type PageConfig<Data extends NumericData<Data>> = {
  routeBase: string;
  icon: LucideIcon;
  title: string;
  description: string;
  formTitle: string;
  formDescription: string;
  tableDescription: string;
  emptyMessage: (year: string) => string;
  loadErrorMessage: string;
  saveErrorMessage: string;
  fields: readonly FieldDefinition<Extract<keyof Data, string>>[];
  columns: readonly TableColumn<Data>[];
  load: () => Promise<DukcapilAggregateResponse<Data>>;
  update: (
    id: string,
    payload: Data,
  ) => Promise<DukcapilAggregateRegion<Data>>;
};

const populationFields = [
  { key: "penerbitanKk", label: "Penerbitan KK", description: "Jumlah Kartu Keluarga yang diterbitkan." },
  { key: "perubahanKk", label: "Perubahan KK", description: "Jumlah perubahan data Kartu Keluarga." },
  { key: "kia", label: "Kartu Identitas Anak", description: "Jumlah dokumen KIA yang diterbitkan." },
  { key: "nikWni", label: "Penerbitan NIK WNI", description: "Jumlah NIK WNI yang diterbitkan." },
  { key: "perekamanKtpEl", label: "Perekaman KTP-el", description: "Jumlah perekaman KTP elektronik." },
  { key: "pencetakanKtpEl", label: "Pencetakan KTP-el", description: "Jumlah KTP elektronik yang dicetak." },
  { key: "pindahDatang", label: "Pindah Datang", description: "Jumlah penduduk yang tercatat pindah datang." },
  { key: "pindahKeluar", label: "Pindah Keluar", description: "Jumlah penduduk yang tercatat pindah keluar." },
] as const satisfies readonly FieldDefinition<keyof PopulationRegistrationAggregate>[];

const civilFields = [
  { key: "aktaKelahiran", label: "Akta Kelahiran", description: "Jumlah akta kelahiran yang tercatat." },
  { key: "aktaKematian", label: "Akta Kematian", description: "Jumlah akta kematian yang tercatat." },
  { key: "aktaPerkawinan", label: "Akta Perkawinan", description: "Jumlah akta perkawinan yang tercatat." },
  { key: "aktaPerceraian", label: "Akta Perceraian", description: "Jumlah akta perceraian yang tercatat." },
  { key: "lahirMati", label: "Lahir Mati", description: "Jumlah peristiwa lahir mati yang tercatat." },
  { key: "pengangkatanAnak", label: "Pengangkatan Anak", description: "Jumlah pengangkatan anak yang tercatat." },
  { key: "pengakuanAnak", label: "Pengakuan Anak", description: "Jumlah pengakuan anak yang tercatat." },
  { key: "pengesahanAnak", label: "Pengesahan Anak", description: "Jumlah pengesahan anak yang tercatat." },
  { key: "perubahanNama", label: "Perubahan Nama", description: "Jumlah perubahan nama yang tercatat." },
  { key: "pembatalanPerkawinan", label: "Pembatalan Perkawinan", description: "Jumlah pembatalan perkawinan yang tercatat." },
  { key: "pembatalanPerceraian", label: "Pembatalan Perceraian", description: "Jumlah pembatalan perceraian yang tercatat." },
  { key: "perubahanStatusKewarganegaraan", label: "Perubahan Status Kewarganegaraan", description: "Jumlah perubahan status kewarganegaraan yang tercatat." },
  { key: "pembetulanAkta", label: "Pembetulan Akta", description: "Jumlah pembetulan akta pencatatan sipil." },
  { key: "pembatalanAkta", label: "Pembatalan Akta", description: "Jumlah pembatalan akta pencatatan sipil." },
  { key: "peristiwaPentingLainnya", label: "Peristiwa Penting Lainnya", description: "Jumlah peristiwa penting lainnya yang tercatat." },
] as const satisfies readonly FieldDefinition<keyof CivilRegistrationAggregate>[];

const otherCivilTotal = (data: CivilRegistrationAggregate) =>
  data.pembatalanPerkawinan +
  data.pembatalanPerceraian +
  data.perubahanStatusKewarganegaraan +
  data.pembetulanAkta +
  data.pembatalanAkta +
  data.peristiwaPentingLainnya;

const populationConfig: PageConfig<PopulationRegistrationAggregate> = {
  routeBase: "/internal/dukcapil/pendaftaran-penduduk",
  icon: Database,
  title: "Pendaftaran Penduduk",
  description: "Kelola data agregat layanan pendaftaran penduduk per kabupaten/kota di Provinsi Papua Barat Daya.",
  formTitle: "Pendaftaran Penduduk",
  formDescription: "Isi seluruh capaian layanan administrasi kependudukan.",
  tableDescription: "Pilih Edit untuk memperbarui data pendaftaran penduduk pada satu wilayah.",
  emptyMessage: (year) => `Belum ada data pendaftaran penduduk untuk tahun ${year}.`,
  loadErrorMessage: "Data pendaftaran penduduk gagal dimuat.",
  saveErrorMessage: "Data pendaftaran penduduk gagal disimpan.",
  fields: populationFields,
  columns: [
    { label: "Terbit KK", value: (data) => data.penerbitanKk },
    { label: "Perubahan KK", value: (data) => data.perubahanKk },
    { label: "KIA", value: (data) => data.kia },
    { label: "NIK WNI", value: (data) => data.nikWni },
    { label: "Rekam KTP-el", value: (data) => data.perekamanKtpEl },
    { label: "Cetak KTP-el", value: (data) => data.pencetakanKtpEl },
    { label: "Pindah Datang", value: (data) => data.pindahDatang },
    { label: "Pindah Keluar", value: (data) => data.pindahKeluar },
  ],
  load: getPopulationRegistration,
  update: updatePopulationRegistration,
};

const civilConfig: PageConfig<CivilRegistrationAggregate> = {
  routeBase: "/internal/dukcapil/pencatatan-sipil",
  icon: FileText,
  title: "Pencatatan Sipil",
  description: "Kelola data agregat pencatatan sipil per kabupaten/kota di Provinsi Papua Barat Daya.",
  formTitle: "Pencatatan Sipil",
  formDescription: "Isi jumlah dokumen/peristiwa penting yang tercatat.",
  tableDescription: "Pilih Edit untuk memperbarui data pencatatan sipil pada satu wilayah.",
  emptyMessage: (year) => `Belum ada data pencatatan sipil untuk tahun ${year}.`,
  loadErrorMessage: "Data pencatatan sipil gagal dimuat.",
  saveErrorMessage: "Data pencatatan sipil gagal disimpan.",
  fields: civilFields,
  columns: [
    { label: "Kelahiran", value: (data) => data.aktaKelahiran },
    { label: "Kematian", value: (data) => data.aktaKematian },
    { label: "Perkawinan", value: (data) => data.aktaPerkawinan },
    { label: "Perceraian", value: (data) => data.aktaPerceraian },
    { label: "Lahir Mati", value: (data) => data.lahirMati },
    { label: "Pengangkatan Anak", value: (data) => data.pengangkatanAnak },
    { label: "Pengakuan Anak", value: (data) => data.pengakuanAnak },
    { label: "Pengesahan Anak", value: (data) => data.pengesahanAnak },
    { label: "Perubahan Nama", value: (data) => data.perubahanNama },
    { label: "Lainnya", value: otherCivilTotal },
  ],
  load: getCivilRegistration,
  update: updateCivilRegistration,
};

export function PopulationRegistrationPage() {
  return <AggregateDataPage config={populationConfig} />;
}

export function CivilRegistrationPage() {
  return <AggregateDataPage config={civilConfig} />;
}

export function PopulationRegistrationRecordPage({ mode, id }: { mode: "edit" | "preview"; id: string }) {
  return <AggregateRecordPage config={populationConfig} mode={mode} id={id} />;
}

export function CivilRegistrationRecordPage({ mode, id }: { mode: "edit" | "preview"; id: string }) {
  return <AggregateRecordPage config={civilConfig} mode={mode} id={id} />;
}

function AggregateRecordPage<Data extends NumericData<Data>>({ config, mode, id }: { config: PageConfig<Data>; mode: "edit" | "preview"; id: string }) {
  const router = useRouter();
  const [region, setRegion] = useState<DukcapilAggregateRegion<Data> | null>(null);
  const [year, setYear] = useState("");
  const [form, setForm] = useState<Record<keyof Data, string> | null>(null);
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = mode === "edit" && form !== null && JSON.stringify(form) !== initial;
  useUnsavedChanges(dirty);
  useEffect(() => {
    let active = true;
    config.load().then((response) => {
      if (!active) return;
      setYear(response.tahunAnggaran);
      const found = response.regions.find((item) => item.id === id) ?? null;
      setRegion(found);
      if (!found) { setError("Data wilayah tidak ditemukan."); return; }
      const values = toFormValues(found.data, config.fields);
      setForm(values); setInitial(JSON.stringify(values));
    }).catch(() => setError(config.loadErrorMessage)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [config, id]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!form || !region) return;
    setSaving(true); setError(null);
    try { await config.update(region.id, payloadFromForm(form, config.fields)); setInitial(JSON.stringify(form)); router.replace(`${config.routeBase}/${region.id}/preview`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : config.saveErrorMessage); }
    finally { setSaving(false); }
  }
  const title = mode === "edit" ? `Edit ${region?.name ?? config.title}` : region?.name ?? `Detail ${config.title}`;
  return <CrudPage title={title} description={`${config.title} tahun anggaran ${year || "—"}.`} breadcrumbs={[{ label: "Internal", href: "/internal/dashboard" }, { label: "Dukcapil" }, { label: config.title, href: config.routeBase }, { label: mode === "edit" ? "Edit" : "Preview" }]} actions={mode === "preview" && region ? <Button asChild><Link href={`${config.routeBase}/${region.id}/edit`}><Edit3 className="h-4 w-4"/>Edit</Link></Button> : undefined}>
    {loading ? <LoadingState rows={4} message="Memuat data wilayah..." /> : error && !region ? <ErrorState message={error} /> : region && form ? mode === "preview" ? <Card><CardContent><DetailGrid items={[{ label: "Wilayah", value: region.name }, { label: "Jenis", value: region.type }, ...config.fields.map((field) => ({ label: field.label, value: formatNumber(region.data[field.key]) }))]} /></CardContent></Card> : <Card><CardContent><form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{config.fields.map((field) => <label key={field.key} className="grid gap-2"><span className="text-sm font-bold text-pbd-navy">{field.label}</span><span className="text-xs text-slate-500">{field.description}</span><Input type="number" min="0" step="1" required value={form[field.key]} onChange={(event) => /^\d*$/.test(event.target.value) && setForm((current) => current ? { ...current, [field.key]: event.target.value } : current)} /></label>)}</div>{error ? <ErrorState message={error} /> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => confirmDiscard(dirty) && router.push(config.routeBase)}><X className="h-4 w-4"/>Batal</Button><Button disabled={saving}><Save className="h-4 w-4"/>{saving ? "Menyimpan..." : "Simpan"}</Button></div></form></CardContent></Card> : null}
  </CrudPage>;
}

function AggregateDataPage<Data extends NumericData<Data>>({
  config,
}: {
  config: PageConfig<Data>;
}) {
  const [regions, setRegions] = useState<DukcapilAggregateRegion<Data>[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<keyof Data, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await config.load();
        if (!mounted) return;
        setRegions(response.regions);
        setTahunAnggaran(response.tahunAnggaran);
        setEditingId(null);
        setForm(null);
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : config.loadErrorMessage);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [config, reloadKey]);

  const filteredRegions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) return regions;
    return regions.filter((region) =>
      [region.name, region.shortName, region.type]
        .join(" ")
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery),
    );
  }, [query, regions]);

  const editingRegion = editingId
    ? (regions.find((region) => region.id === editingId) ?? null)
    : null;

  const saveData = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingRegion || !form) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = payloadFromForm(form, config.fields);
      const updated = await config.update(editingRegion.id, payload);
      setRegions((current) =>
        current.map((region) => (region.id === updated.id ? updated : region)),
      );
      const refreshed = await config.load();
      setRegions(refreshed.regions);
      setTahunAnggaran(refreshed.tahunAnggaran);
      setEditingId(null);
      setForm(null);
      setMessage(`Data ${updated.shortName || updated.name} berhasil disimpan.`);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : config.saveErrorMessage);
    } finally {
      setSaving(false);
    }
  };

  const Icon = config.icon;
  const columnCount = config.columns.length + 2;

  return (
    <main className="min-w-0 space-y-6">
      <PageHero
        icon={Icon}
        eyebrow="Administrasi Kependudukan"
        title={config.title}
        description={config.description}
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              Tahun {tahunAnggaran || "—"}
            </Badge>
            <Badge variant="outline" className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600">
              {regions.length} kabupaten/kota
            </Badge>
          </div>
        }
        aside={
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href="/internal/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        }
      />

      <div aria-live="polite" className="space-y-3">
        {message ? <SuccessState message={message} /> : null}
        {error ? (
          <div className="space-y-3">
            <ErrorState message={error} />
            {!editingRegion ? (
              <Button type="button" variant="outline" disabled={loading} onClick={() => setReloadKey((value) => value + 1)}>
                <RefreshCw className="h-4 w-4" />
                Muat Ulang
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {legacyInlineCrudEnabled && editingRegion && form ? (
        <div ref={editFormRef} className="scroll-mt-24">
          <SectionCard
            title={`Edit ${editingRegion.name}`}
            description={`Perubahan disimpan untuk tahun anggaran ${tahunAnggaran}.`}
            action={
              <div className="flex justify-start lg:justify-end">
                <Badge variant="outline" className="bg-white text-slate-600">
                  <MapPin className="mr-1 h-3.5 w-3.5" />
                  {editingRegion.type}
                </Badge>
              </div>
            }
          >
            <form onSubmit={saveData} className="space-y-5">
              <fieldset className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                <legend className="px-2 font-bold text-pbd-navy">{config.formTitle}</legend>
                <p className="mb-4 text-sm leading-6 text-slate-500">{config.formDescription}</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {config.fields.map((field) => (
                    <div key={field.key}>
                      <label htmlFor={`dukcapil-${field.key}`} className="text-sm font-bold text-pbd-navy">
                        {field.label}
                      </label>
                      <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{field.description}</p>
                      <Input
                        id={`dukcapil-${field.key}`}
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={form[field.key]}
                        disabled={saving}
                        onKeyDown={(event) => {
                          if (["-", "+", "e", "E", ".", ","].includes(event.key)) event.preventDefault();
                        }}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (!/^\d*$/.test(value)) return;
                          setForm((current) => current ? { ...current, [field.key]: value } : current);
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={saving} onClick={() => { setEditingId(null); setForm(null); setError(null); }}>
                  <X className="h-4 w-4" />
                  Batal
                </Button>
                <Button type="submit" disabled={saving} className="bg-pbd-navy text-white hover:bg-pbd-navy/90">
                  <Save className="h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>
      ) : null}

      <SectionCard
        title="Data Kabupaten/Kota"
        description={config.tableDescription}
        action={
          <div className="relative ml-auto w-full lg:max-w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Cari kabupaten atau kota..." aria-label="Cari kabupaten atau kota" />
          </div>
        }
        contentClassName="p-0"
      >
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 min-w-[230px] bg-slate-50">Wilayah</TableHead>
              {config.columns.map((column) => <TableHead key={column.label}>{column.label}</TableHead>)}
              <TableHead className="sticky right-0 z-20 w-[110px] bg-slate-50 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columnCount} className="p-3">
                    <div className="h-10 animate-pulse rounded-md bg-slate-100" />
                  </TableCell>
                </TableRow>
              ))
            ) : regions.length === 0 ? (
              <TableRow><TableCell colSpan={columnCount} className="py-12 text-center text-sm font-medium text-slate-500">{config.emptyMessage(tahunAnggaran || "ini")}</TableCell></TableRow>
            ) : filteredRegions.length === 0 ? (
              <TableRow><TableCell colSpan={columnCount} className="py-12 text-center text-sm font-medium text-slate-500">Tidak ada kabupaten/kota yang cocok dengan pencarian.</TableCell></TableRow>
            ) : (
              filteredRegions.map((region) => (
                <TableRow key={region.id} aria-expanded={editingId === region.id} data-state={editingId === region.id ? "selected" : undefined}>
                  <TableCell className="sticky left-0 z-10 bg-white">
                    <div className="flex min-w-[200px] items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue"><MapPin className="h-4 w-4" /></div>
                      <div><p className="font-bold text-pbd-navy">{region.name}</p><p className="mt-1 text-xs text-slate-500">{region.type}</p></div>
                    </div>
                  </TableCell>
                  {config.columns.map((column) => (
                    <TableCell key={column.label} className="text-right font-medium tabular-nums">{formatNumber(column.value(region.data))}</TableCell>
                  ))}
                  <TableCell className="sticky right-0 z-10 bg-white text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild type="button" variant="outline" size="sm"><Link href={`${config.routeBase}/${region.id}/preview`}>Lihat</Link></Button>
                      <Button asChild type="button" variant="outline" size="sm"><Link href={`${config.routeBase}/${region.id}/edit`}><Edit3 className="h-4 w-4" />Edit</Link></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </main>
  );
}

function toFormValues<Data extends NumericData<Data>>(
  data: Data,
  fields: readonly FieldDefinition<Extract<keyof Data, string>>[],
) {
  return Object.fromEntries(fields.map((field) => [field.key, String(data[field.key])])) as Record<keyof Data, string>;
}

function payloadFromForm<Data extends NumericData<Data>>(
  form: Record<keyof Data, string>,
  fields: readonly FieldDefinition<Extract<keyof Data, string>>[],
) {
  const entries = fields.map((field) => {
    const value = form[field.key].trim();
    if (value === "") throw new Error(`${field.label} wajib diisi.`);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 2147483647) {
      throw new Error(`${field.label} harus berupa bilangan bulat antara 0 dan 2.147.483.647.`);
    }
    return [field.key, parsed];
  });
  return Object.fromEntries(entries) as Data;
}
