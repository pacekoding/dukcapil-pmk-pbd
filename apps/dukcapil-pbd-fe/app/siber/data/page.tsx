"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Edit3,
  ExternalLink,
  MapPin,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSiberDataWilayah,
  updateSiberDataWilayah,
} from "@/lib/api/data-wilayah";
import { formatNumber } from "@/lib/data-wilayah";
import type {
  CivilRegistrationData,
  PopulationRegistrationData,
  RegionData,
  SiberDataWilayahPayload,
  SiberOapPayload,
} from "@/types/data-wilayah";

type SessionPayload = {
  authenticated?: boolean;
  tahunAnggaran?: string;
};

type NumericStrings<T> = {
  [Key in keyof T]: string;
};

type SiberFormState = {
  registration: NumericStrings<PopulationRegistrationData>;
  civil: NumericStrings<CivilRegistrationData>;
  oap: NumericStrings<SiberOapPayload>;
};

type FieldDefinition<Key extends string> = {
  key: Key;
  label: string;
  description: string;
};

const registrationFields = [
  {
    key: "penerbitanKk",
    label: "Penerbitan KK",
    description: "Jumlah Kartu Keluarga yang diterbitkan.",
  },
  {
    key: "perubahanKk",
    label: "Perubahan KK",
    description: "Jumlah perubahan data Kartu Keluarga.",
  },
  {
    key: "kia",
    label: "Kartu Identitas Anak",
    description: "Jumlah dokumen KIA yang diterbitkan.",
  },
  {
    key: "nikWni",
    label: "Penerbitan NIK WNI",
    description: "Jumlah NIK WNI yang diterbitkan.",
  },
  {
    key: "perekamanKtpEl",
    label: "Perekaman KTP-el",
    description: "Jumlah perekaman KTP elektronik.",
  },
  {
    key: "pencetakanKtpEl",
    label: "Pencetakan KTP-el",
    description: "Jumlah KTP elektronik yang dicetak.",
  },
] satisfies Array<FieldDefinition<keyof PopulationRegistrationData>>;

const civilFields = [
  {
    key: "aktaKelahiran",
    label: "Akta Kelahiran",
    description: "Jumlah akta kelahiran yang tercatat.",
  },
  {
    key: "aktaKematian",
    label: "Akta Kematian",
    description: "Jumlah akta kematian yang tercatat.",
  },
  {
    key: "aktaPerkawinan",
    label: "Akta Perkawinan",
    description: "Jumlah akta perkawinan yang tercatat.",
  },
  {
    key: "aktaPerceraian",
    label: "Akta Perceraian",
    description: "Jumlah akta perceraian yang tercatat.",
  },
] satisfies Array<FieldDefinition<keyof CivilRegistrationData>>;

const oapFields = [
  {
    key: "luasWilayah",
    label: "Luas Wilayah (km²)",
    description: "Luas wilayah kabupaten/kota dalam kilometer persegi.",
  },
  {
    key: "jumlahOap",
    label: "Jumlah OAP",
    description: "Jumlah penduduk Orang Asli Papua.",
  },
  {
    key: "jumlahNonOap",
    label: "Jumlah Non-OAP",
    description: "Jumlah penduduk selain Orang Asli Papua.",
  },
] satisfies Array<FieldDefinition<keyof SiberOapPayload>>;

export default function SiberDataPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SiberFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const session = (await response.json().catch(() => null)) as
          | SessionPayload
          | null;

        if (!response.ok || !session?.authenticated || !session.tahunAnggaran) {
          throw new Error("Sesi atau tahun anggaran tidak tersedia.");
        }

        const data = await getSiberDataWilayah();
        if (!mounted) {
          return;
        }

        setRegions(data.regions);
        setTahunAnggaran(data.tahunAnggaran || session.tahunAnggaran);
        setEditingId(null);
        setForm(null);
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data Dukcapil gagal dimuat.",
          );
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
  }, [reloadKey]);

  const filteredRegions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) {
      return regions;
    }

    return regions.filter((region) =>
      [region.name, region.shortName, region.type, region.id]
        .join(" ")
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery),
    );
  }, [query, regions]);

  const editingRegion = editingId
    ? (regions.find((region) => region.id === editingId) ?? null)
    : null;

  const openEditForm = (region: RegionData) => {
    setEditingId(region.id);
    setForm(formFromRegion(region));
    setError(null);
    setMessage(null);

    window.requestAnimationFrame(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const closeEditForm = () => {
    if (saving) {
      return;
    }
    setEditingId(null);
    setForm(null);
    setError(null);
  };

  const saveData = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingRegion || !form || !tahunAnggaran) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = payloadFromForm(form);
      const updated = await updateSiberDataWilayah(
        editingRegion.id,
        payload,
      );

      setRegions((current) =>
        current.map((region) => (region.id === updated.id ? updated : region)),
      );
      setEditingId(null);
      setForm(null);
      setMessage(`Data ${updated.shortName || updated.name} berhasil disimpan.`);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Data Dukcapil gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const computedPopulation = form
    ? validNumberOrZero(form.oap.jumlahOap) +
      validNumberOrZero(form.oap.jumlahNonOap)
    : 0;
  const publicDataWilayahHref = tahunAnggaran
    ? `/data-wilayah?period=${encodeURIComponent(tahunAnggaran)}&dataset=registration`
    : null;

  return (
    <main className="space-y-6">
      <PageHero
        icon={Database}
        eyebrow="SIBER"
        title="Kelola Data Dukcapil"
        description="Perbarui data pendaftaran penduduk, pencatatan sipil, dan OAP per kabupaten/kota. Total penduduk dihitung otomatis dari OAP dan Non-OAP."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              Tahun {tahunAnggaran || "—"}
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
            >
              {regions.length} kabupaten/kota
            </Badge>
          </div>
        }
        aside={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/siber/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            {publicDataWilayahHref ? (
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <Link href={publicDataWilayahHref}>
                  <ExternalLink className="h-4 w-4" />
                  Lihat Website
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                disabled
              >
                <ExternalLink className="h-4 w-4" />
                Lihat Website
              </Button>
            )}
          </div>
        }
      />

      <div aria-live="polite" className="space-y-3">
        {message ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
          </div>
        ) : null}
        {error ? (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{error}</p>
            {!editingRegion ? (
              <Button
                type="button"
                variant="outline"
                className="border-red-200 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
                disabled={loading}
                onClick={() => setReloadKey((current) => current + 1)}
              >
                <RefreshCw className="h-4 w-4" />
                Muat Ulang
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {editingRegion && form ? (
        <div ref={editFormRef} className="scroll-mt-24">
          <SectionCard
            title={`Edit ${editingRegion.name}`}
            description={`Perubahan disimpan untuk tahun anggaran ${tahunAnggaran}. Data IDM dan BUMDes tidak ikut diubah.`}
            action={
              <Badge variant="outline" className="bg-white text-slate-600">
                <MapPin className="mr-1 h-3.5 w-3.5" />
                {editingRegion.type}
              </Badge>
            }
          >
            <form onSubmit={saveData} className="space-y-5">
              <DataFieldSection
                title="Pendaftaran Penduduk"
                description="Isi seluruh capaian layanan administrasi kependudukan."
                fields={registrationFields}
                values={form.registration}
                disabled={saving}
                prefix="registration"
                onChange={(key, value) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          registration: {
                            ...current.registration,
                            [key]: value,
                          },
                        }
                      : current,
                  )
                }
              />

              <DataFieldSection
                title="Pencatatan Sipil"
                description="Isi jumlah dokumen peristiwa penting yang tercatat."
                fields={civilFields}
                values={form.civil}
                disabled={saving}
                prefix="civil"
                onChange={(key, value) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          civil: { ...current.civil, [key]: value },
                        }
                      : current,
                  )
                }
              />

              <DataFieldSection
                title="Data OAP dan Penduduk"
                description="Total penduduk dihitung otomatis dari jumlah OAP dan Non-OAP."
                fields={oapFields}
                values={form.oap}
                disabled={saving}
                prefix="oap"
                decimalKey="luasWilayah"
                extraField={
                  <div>
                    <label
                      htmlFor="oap-total-penduduk"
                      className="text-sm font-bold text-pbd-navy"
                    >
                      Total Penduduk
                    </label>
                    <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">
                      Hasil penjumlahan OAP dan Non-OAP.
                    </p>
                    <Input
                      id="oap-total-penduduk"
                      value={String(computedPopulation)}
                      readOnly
                      className="bg-slate-50 font-semibold text-slate-600"
                    />
                  </div>
                }
                onChange={(key, value) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          oap: { ...current.oap, [key]: value },
                        }
                      : current,
                  )
                }
              />

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={closeEditForm}
                >
                  <X className="h-4 w-4" />
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
                >
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
        description="Pilih Edit untuk memperbarui statistik Dukcapil pada satu wilayah."
        action={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Cari kabupaten atau kota..."
              aria-label="Cari kabupaten atau kota"
            />
          </div>
        }
        contentClassName="p-0"
      >
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow>
              <TableHead>Wilayah</TableHead>
              <TableHead>Total Penduduk</TableHead>
              <TableHead>OAP</TableHead>
              <TableHead>Cetak KTP-el</TableHead>
              <TableHead>Akta Kelahiran</TableHead>
              <TableHead className="w-[110px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm font-medium text-slate-500"
                >
                  Memuat data Dukcapil...
                </TableCell>
              </TableRow>
            ) : regions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm font-medium text-slate-500"
                >
                  Belum ada data wilayah untuk tahun anggaran {tahunAnggaran || "ini"}.
                </TableCell>
              </TableRow>
            ) : filteredRegions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm font-medium text-slate-500"
                >
                  Tidak ada kabupaten/kota yang cocok dengan pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredRegions.map((region) => (
                <TableRow
                  key={region.id}
                  aria-expanded={editingId === region.id}
                  data-state={editingId === region.id ? "selected" : undefined}
                >
                  <TableCell>
                    <div className="flex min-w-[220px] items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-pbd-navy">{region.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {region.type}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {formatNumber(region.oap.jumlahJiwa)}
                  </TableCell>
                  <TableCell>{formatNumber(region.oap.jumlahOap)}</TableCell>
                  <TableCell>
                    {formatNumber(region.registration.pencetakanKtpEl)}
                  </TableCell>
                  <TableCell>
                    {formatNumber(region.civil.aktaKelahiran)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant={editingId === region.id ? "secondary" : "outline"}
                      size="sm"
                      disabled={saving}
                      onClick={() => openEditForm(region)}
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
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

function DataFieldSection<Key extends string>({
  title,
  description,
  fields,
  values,
  prefix,
  disabled,
  decimalKey,
  extraField,
  onChange,
}: {
  title: string;
  description: string;
  fields: Array<FieldDefinition<Key>>;
  values: Record<Key, string>;
  prefix: string;
  disabled: boolean;
  decimalKey?: Key;
  extraField?: React.ReactNode;
  onChange: (key: Key, value: string) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
      <legend className="px-2 font-bold text-pbd-navy">{title}</legend>
      <p className="mb-4 text-sm leading-6 text-slate-500">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const inputId = `${prefix}-${field.key}`;
          const acceptsDecimal = decimalKey === field.key;

          return (
            <div key={field.key}>
              <label htmlFor={inputId} className="text-sm font-bold text-pbd-navy">
                {field.label}
              </label>
              <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">
                {field.description}
              </p>
              <Input
                id={inputId}
                type="number"
                min="0"
                step={acceptsDecimal ? "0.01" : "1"}
                inputMode={acceptsDecimal ? "decimal" : "numeric"}
                value={values[field.key]}
                disabled={disabled}
                onChange={(event) => onChange(field.key, event.target.value)}
                required
              />
            </div>
          );
        })}
        {extraField}
      </div>
    </fieldset>
  );
}

function formFromRegion(region: RegionData): SiberFormState {
  return {
    registration: {
      penerbitanKk: String(region.registration.penerbitanKk),
      perubahanKk: String(region.registration.perubahanKk),
      kia: String(region.registration.kia),
      nikWni: String(region.registration.nikWni),
      perekamanKtpEl: String(region.registration.perekamanKtpEl),
      pencetakanKtpEl: String(region.registration.pencetakanKtpEl),
    },
    civil: {
      aktaKelahiran: String(region.civil.aktaKelahiran),
      aktaKematian: String(region.civil.aktaKematian),
      aktaPerkawinan: String(region.civil.aktaPerkawinan),
      aktaPerceraian: String(region.civil.aktaPerceraian),
    },
    oap: {
      luasWilayah: String(region.oap.luasWilayah),
      jumlahOap: String(region.oap.jumlahOap),
      jumlahNonOap: String(region.oap.jumlahNonOap),
    },
  };
}

function payloadFromForm(form: SiberFormState): SiberDataWilayahPayload {
  return {
    registration: {
      penerbitanKk: parseCount(form.registration.penerbitanKk, "Penerbitan KK"),
      perubahanKk: parseCount(form.registration.perubahanKk, "Perubahan KK"),
      kia: parseCount(form.registration.kia, "Kartu Identitas Anak"),
      nikWni: parseCount(form.registration.nikWni, "Penerbitan NIK WNI"),
      perekamanKtpEl: parseCount(
        form.registration.perekamanKtpEl,
        "Perekaman KTP-el",
      ),
      pencetakanKtpEl: parseCount(
        form.registration.pencetakanKtpEl,
        "Pencetakan KTP-el",
      ),
    },
    civil: {
      aktaKelahiran: parseCount(form.civil.aktaKelahiran, "Akta Kelahiran"),
      aktaKematian: parseCount(form.civil.aktaKematian, "Akta Kematian"),
      aktaPerkawinan: parseCount(form.civil.aktaPerkawinan, "Akta Perkawinan"),
      aktaPerceraian: parseCount(form.civil.aktaPerceraian, "Akta Perceraian"),
    },
    oap: {
      luasWilayah: parseNonNegativeNumber(form.oap.luasWilayah, "Luas Wilayah"),
      jumlahOap: parseCount(form.oap.jumlahOap, "Jumlah OAP"),
      jumlahNonOap: parseCount(form.oap.jumlahNonOap, "Jumlah Non-OAP"),
    },
  };
}

function parseCount(value: string, label: string) {
  const parsed = parseNonNegativeNumber(value, label);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} harus berupa bilangan bulat.`);
  }
  return parsed;
}

function parseNonNegativeNumber(value: string, label: string) {
  if (value.trim() === "") {
    throw new Error(`${label} wajib diisi.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} harus berupa angka nol atau lebih.`);
  }
  return parsed;
}

function validNumberOrZero(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
