"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Database,
  FileText,
  IdCard,
  Landmark,
  MapPin,
  Save,
  UserRound,
  Users,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
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
import {
  getDataWilayah,
  updateDataWilayahRegion,
} from "@/lib/api/data-wilayah";
import {
  defaultRegionData,
  formatArea,
  formatNumber,
  getProvinceTotals,
} from "@/lib/data-wilayah";
import { cn } from "@/lib/utils";
import type { RegionData } from "@/types/data-wilayah";

type NumericPath =
  | "idm.sangatTertinggal"
  | "idm.tertinggal"
  | "idm.berkembang"
  | "idm.maju"
  | "idm.mandiri"
  | "registration.penerbitanKk"
  | "registration.perubahanKk"
  | "registration.kia"
  | "registration.nikWni"
  | "registration.perekamanKtpEl"
  | "registration.pencetakanKtpEl"
  | "oap.luasWilayah"
  | "oap.jumlahOap"
  | "oap.jumlahNonOap"
  | "oap.jumlahJiwa"
  | "civil.aktaKelahiran"
  | "civil.aktaKematian"
  | "civil.aktaPerkawinan"
  | "civil.aktaPerceraian";

type TabKey = "identity" | "idm" | "registration" | "oap" | "civil";

type FieldGroup = {
  key: TabKey;
  title: string;
  description: string;
  icon: React.ElementType;
  fields: Array<{ label: string; path: NumericPath; step?: string }>;
};

const getDataGroups = (tahunAnggaran: string): FieldGroup[] => [
  {
    key: "idm",
    title: "Data IDM",
    description: `Kategori status IDM untuk tahun anggaran ${tahunAnggaran}.`,
    icon: Database,
    fields: [
      { label: "Sangat Tertinggal", path: "idm.sangatTertinggal" },
      { label: "Tertinggal", path: "idm.tertinggal" },
      { label: "Berkembang", path: "idm.berkembang" },
      { label: "Maju", path: "idm.maju" },
      { label: "Mandiri", path: "idm.mandiri" },
    ],
  },
  {
    key: "registration",
    title: "Pendaftaran Penduduk",
    description: `Output layanan administrasi kependudukan ${tahunAnggaran}.`,
    icon: Users,
    fields: [
      { label: "Penerbitan KK", path: "registration.penerbitanKk" },
      { label: "Perubahan KK", path: "registration.perubahanKk" },
      { label: "Kartu Identitas Anak", path: "registration.kia" },
      { label: "Penerbitan NIK WNI", path: "registration.nikWni" },
      { label: "Perekaman KTP-EL", path: "registration.perekamanKtpEl" },
      { label: "Pencetakan KTP-EL", path: "registration.pencetakanKtpEl" },
    ],
  },
  {
    key: "oap",
    title: "Data OAP",
    description: `Luas wilayah dan komposisi penduduk ${tahunAnggaran}.`,
    icon: UserRound,
    fields: [
      { label: "Luas Wilayah", path: "oap.luasWilayah", step: "0.01" },
      { label: "Jumlah OAP", path: "oap.jumlahOap" },
      { label: "Jumlah Non-OAP", path: "oap.jumlahNonOap" },
      { label: "Jumlah Orang", path: "oap.jumlahJiwa" },
    ],
  },
  {
    key: "civil",
    title: "Pencatatan Sipil",
    description: `Output akta pencatatan sipil ${tahunAnggaran}.`,
    icon: FileText,
    fields: [
      { label: "Akta Kelahiran", path: "civil.aktaKelahiran" },
      { label: "Akta Kematian", path: "civil.aktaKematian" },
      { label: "Akta Perkawinan", path: "civil.aktaPerkawinan" },
      { label: "Akta Perceraian", path: "civil.aktaPerceraian" },
    ],
  },
];

const getNumericValue = (region: RegionData, path: NumericPath) => {
  const [group, key] = path.split(".") as [keyof RegionData, string];
  return (region[group] as Record<string, number>)[key];
};

const setNumericValue = (
  region: RegionData,
  path: NumericPath,
  value: number,
): RegionData => {
  const [group, key] = path.split(".") as [keyof RegionData, string];
  return {
    ...region,
    [group]: {
      ...(region[group] as Record<string, number>),
      [key]: value,
    },
  };
};

export default function DashboardDataWilayahPage() {
  const [regions, setRegions] = useState<RegionData[]>(defaultRegionData);
  const [selectedRegionId, setSelectedRegionId] = useState(
    defaultRegionData[0].id,
  );
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [activeTab, setActiveTab] = useState<TabKey>("identity");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await getDataWilayah();
        if (mounted && data.regions.length > 0) {
          setTahunAnggaran(data.tahunAnggaran);
          setRegions(data.regions);
          setSelectedRegionId(data.regions[0].id);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data dari server belum dapat dimuat. Menampilkan data default.");
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
  }, []);

  const selectedRegion =
    regions.find((region) => region.id === selectedRegionId) ?? regions[0];
  const totals = useMemo(() => getProvinceTotals(regions), [regions]);
  const dataGroups = useMemo(
    () => getDataGroups(tahunAnggaran),
    [tahunAnggaran],
  );
  const activeGroup = dataGroups.find((group) => group.key === activeTab);

  const updateSelectedRegion = (updater: (region: RegionData) => RegionData) => {
    setMessage(null);
    setError(null);
    setRegions((current) =>
      current.map((region) =>
        region.id === selectedRegion.id ? updater(region) : region,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateDataWilayahRegion(
        selectedRegion.id,
        selectedRegion,
      );
      setRegions((current) =>
        current.map((region) => (region.id === updated.id ? updated : region)),
      );
      setMessage(`${updated.name} berhasil diperbarui.`);
    } catch (saveError) {
      console.error(saveError);
      setError("Data wilayah gagal disimpan. Periksa koneksi API dan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        icon={Landmark}
        eyebrow="Data Wilayah"
        title="Kelola Data Kabupaten/Kota"
        description="Perubahan data wilayah akan digunakan oleh website publik pada menu Data Wilayah."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {tahunAnggaran}
          </p>
        }
        aside={
          <Button
            asChild
            variant="outline"
            className="relative h-12 rounded-xl border-slate-200 bg-white px-5 text-pbd-navy shadow-sm"
          >
            <Link href="/data-wilayah" target="_blank">
              <ArrowUpRight className="h-4 w-4" />
              Lihat Website
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Users} label="Total Orang" value={totals.totalJiwa} />
        <SummaryCard icon={UserRound} label="Total OAP" value={totals.totalOap} />
        <SummaryCard
          icon={IdCard}
          label="Pencetakan KTP-EL"
          value={totals.totalKtpEl}
        />
        <SummaryCard
          icon={Building2}
          label="Total Desa IDM"
          value={totals.totalDesaIdm}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,35,80,0.08)] lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full max-w-xl">
            <Label className="text-sm font-bold text-slate-600">
              Pilih Kabupaten/Kota
            </Label>
            <Select
              value={selectedRegion.id}
              onValueChange={(value) => {
                setSelectedRegionId(value);
                setMessage(null);
                setError(null);
              }}
            >
              <SelectTrigger className="mt-3 h-14 w-full rounded-xl border-slate-200 bg-white px-4 text-base font-semibold text-pbd-navy shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-500">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                {selectedRegion.name}
              </span>
              <span className="hidden text-slate-300 sm:inline">•</span>
              <span>{formatArea(selectedRegion.oap.luasWilayah)}</span>
              <span className="hidden text-slate-300 sm:inline">•</span>
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                {formatNumber(selectedRegion.oap.jumlahJiwa)} orang
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="h-14 rounded-xl bg-blue-600 px-8 text-base font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
          >
            <Save className="h-5 w-5" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>

        {message ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 border-t border-slate-200 pt-5">
          <div className="flex gap-4 overflow-x-auto border-b border-slate-200">
            <TabButton
              active={activeTab === "identity"}
              icon={Database}
              label="Identitas Wilayah"
              onClick={() => setActiveTab("identity")}
            />
            {dataGroups.map((group) => (
              <TabButton
                key={group.key}
                active={activeTab === group.key}
                icon={group.icon}
                label={group.title}
                onClick={() => setActiveTab(group.key)}
              />
            ))}
          </div>

          <div className="pt-7">
            {activeTab === "identity" ? (
              <div>
                <SectionHeading icon={FileText} title="Identitas Wilayah" />
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <TextField
                    label="Nama Wilayah"
                    value={selectedRegion.name}
                    onChange={(value) =>
                      updateSelectedRegion((region) => ({
                        ...region,
                        name: value,
                      }))
                    }
                  />
                  <TextField
                    label="Nama Singkat"
                    value={selectedRegion.shortName}
                    onChange={(value) =>
                      updateSelectedRegion((region) => ({
                        ...region,
                        shortName: value,
                      }))
                    }
                  />
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">
                      Jenis Wilayah
                    </Label>
                    <Select
                      value={selectedRegion.type}
                      onValueChange={(value) =>
                        updateSelectedRegion((region) => ({
                          ...region,
                          type: value === "Kota" ? "Kota" : "Kabupaten",
                        }))
                      }
                    >
                      <SelectTrigger className="h-13 w-full rounded-xl border-slate-200 px-4 text-base font-semibold text-pbd-navy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kabupaten">Kabupaten</SelectItem>
                        <SelectItem value="Kota">Kota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField
                    label="Label Peta"
                    value={selectedRegion.mapLabel}
                    onChange={(value) =>
                      updateSelectedRegion((region) => ({
                        ...region,
                        mapLabel: value,
                      }))
                    }
                  />
                </div>
              </div>
            ) : activeGroup ? (
              <div>
                <SectionHeading
                  icon={activeGroup.icon}
                  title={activeGroup.title}
                  description={activeGroup.description}
                />
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {activeGroup.fields.map((field) => (
                    <NumberField
                      key={field.path}
                      label={field.label}
                      value={getNumericValue(selectedRegion, field.path)}
                      step={field.step}
                      onChange={(value) =>
                        updateSelectedRegion((region) =>
                          setNumericValue(region, field.path, value),
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,35,80,0.08)]">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-pbd-navy">
          {formatNumber(value)}
        </p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex min-w-fit items-center gap-3 px-5 pb-5 text-sm font-bold transition",
        active ? "text-pbd-blue" : "text-slate-500 hover:text-pbd-navy",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
      {active ? (
        <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-blue-600" />
      ) : null}
    </button>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-pbd-blue">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-pbd-navy">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-slate-600">{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-13 rounded-xl border-slate-200 px-4 text-base font-semibold text-pbd-navy"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  step = "1",
  onChange,
}: {
  label: string;
  value: number;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-slate-600">{label}</Label>
      <Input
        type="number"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-13 rounded-xl border-slate-200 px-4 text-base font-semibold text-pbd-navy"
      />
    </div>
  );
}
