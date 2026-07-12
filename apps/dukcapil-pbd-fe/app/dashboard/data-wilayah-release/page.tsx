"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Globe2, RefreshCw, Save } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminDataWilayahSettings,
  updateAdminDataWilayahSettings,
} from "@/lib/api/data-wilayah";
import type { DataWilayahAdminSettings } from "@/types/data-wilayah";

type ReleaseForm = {
  featuredTahunAnggaran: string;
  publishedTahunAnggaran: string[];
};

const emptyForm: ReleaseForm = {
  featuredTahunAnggaran: "",
  publishedTahunAnggaran: [],
};

export default function DataWilayahReleasePage() {
  const [settings, setSettings] = useState<DataWilayahAdminSettings | null>(null);
  const [form, setForm] = useState<ReleaseForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableYears = useMemo(
    () =>
      (settings?.availableTahunAnggaran ?? []).filter(
        (year) => year <= currentReleaseYear(),
      ),
    [settings],
  );
  const publishedCount = form.publishedTahunAnggaran.length;

  const unpublishedYears = useMemo(
    () =>
      availableYears.filter(
        (year) => !form.publishedTahunAnggaran.includes(year),
      ),
    [availableYears, form.publishedTahunAnggaran],
  );

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data = await getAdminDataWilayahSettings();
      const normalized = normalizeReleaseSettings(data);
      setSettings(normalized);
      setForm(releaseFormFromSettings(normalized));
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Pengaturan release data wilayah gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialSettings = async () => {
      try {
        const data = await getAdminDataWilayahSettings();
        if (!mounted) {
          return;
        }

        const normalized = normalizeReleaseSettings(data);
        setSettings(normalized);
        setForm(releaseFormFromSettings(normalized));
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Pengaturan release data wilayah gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const updatePublishedYear = (year: string, checked: boolean) => {
    setMessage(null);
    setError(null);
    setForm((current) => {
      const nextPublished = checked
        ? [...current.publishedTahunAnggaran, year]
        : current.publishedTahunAnggaran.filter((item) => item !== year);
      const orderedPublished = availableYears.filter((item) =>
        nextPublished.includes(item),
      );
      const featuredStillPublished = orderedPublished.includes(
        current.featuredTahunAnggaran,
      );

      return {
        publishedTahunAnggaran: orderedPublished,
        featuredTahunAnggaran: featuredStillPublished
          ? current.featuredTahunAnggaran
          : orderedPublished[0] || "",
      };
    });
  };

  const handleFeaturedChange = (year: string) => {
    setMessage(null);
    setError(null);
    setForm((current) => ({
      featuredTahunAnggaran: year,
      publishedTahunAnggaran: current.publishedTahunAnggaran.includes(year)
        ? current.publishedTahunAnggaran
        : availableYears.filter((item) =>
            [...current.publishedTahunAnggaran, year].includes(item),
          ),
    }));
  };

  const saveSettings = async () => {
    if (!form.featuredTahunAnggaran) {
      setError("Tahun utama wajib dipilih.");
      setMessage(null);
      return;
    }
    if (form.publishedTahunAnggaran.length === 0) {
      setError("Minimal satu tahun release wajib dipilih.");
      setMessage(null);
      return;
    }
    if (!form.publishedTahunAnggaran.includes(form.featuredTahunAnggaran)) {
      setError("Tahun utama wajib termasuk dalam tahun yang dirilis.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await updateAdminDataWilayahSettings(form);
      const normalized = normalizeReleaseSettings(data);
      setSettings(normalized);
      setForm(releaseFormFromSettings(normalized));
      setMessage("Pengaturan release data wilayah berhasil disimpan.");
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Pengaturan release data wilayah gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={CalendarClock}
        eyebrow="Pengaturan Website"
        title="Release Data Wilayah"
        description="Atur tahun data wilayah yang tersedia di halaman website publik dan tentukan periode utama yang tampil otomatis."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              {publishedCount} tahun dirilis
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
            >
              {availableYears.length} tahun tersedia
            </Badge>
          </div>
        }
        aside={
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            disabled={loading || saving}
            onClick={loadSettings}
          >
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard
          label="Tahun Utama"
          value={form.featuredTahunAnggaran || "—"}
          description="Dipakai sebagai periode default di halaman Data Wilayah."
        />
        <SummaryCard
          label="Tahun Dirilis"
          value={`${publishedCount} tahun`}
          description="Muncul sebagai pilihan periode di website publik."
        />
        <SummaryCard
          label="Belum Dirilis"
          value={`${unpublishedYears.length} tahun`}
          description="Tersedia di database, tetapi disembunyikan dari website."
        />
      </div>

      <SectionCard
        title="Pengaturan Release"
        description="Pilih tahun yang boleh tampil di halaman website publik. Tahun utama harus termasuk dalam daftar tahun yang dirilis."
        action={
          <Button
            type="button"
            className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
            disabled={loading || saving || availableYears.length === 0}
            onClick={saveSettings}
          >
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        }
        contentClassName="p-0"
      >
        {message ? (
          <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <label
              htmlFor="featured-tahun-anggaran"
              className="text-sm font-bold text-pbd-navy"
            >
              Tahun utama website
            </label>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Tahun ini menjadi periode default saat pengunjung membuka halaman
              Data Wilayah tanpa parameter periode.
            </p>
          </div>
          <Select
            value={form.featuredTahunAnggaran}
            onValueChange={handleFeaturedChange}
            disabled={loading || availableYears.length === 0}
          >
            <SelectTrigger id="featured-tahun-anggaran" className="h-11">
              <SelectValue placeholder="Pilih tahun utama" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tahun Anggaran</TableHead>
              <TableHead>Status Website</TableHead>
              <TableHead>Tahun Utama</TableHead>
              <TableHead className="text-right">Release</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat pengaturan release data wilayah...
                </TableCell>
              </TableRow>
            ) : availableYears.length > 0 ? (
              availableYears.map((year) => {
                const published = form.publishedTahunAnggaran.includes(year);
                const featured = form.featuredTahunAnggaran === year;

                return (
                  <TableRow key={year}>
                    <TableCell className="font-bold text-pbd-navy">
                      {year}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={published ? "default" : "outline"}
                        className={
                          published
                            ? "bg-blue-50 text-pbd-blue"
                            : "bg-slate-50 text-slate-500"
                        }
                      >
                        {published ? "Dirilis" : "Disembunyikan"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="featured-tahun-anggaran-row"
                          value={year}
                          checked={featured}
                          disabled={loading || !published}
                          onChange={() => handleFeaturedChange(year)}
                          className="h-4 w-4 accent-pbd-navy"
                        />
                        Tahun utama
                      </label>
                    </TableCell>
                    <TableCell className="text-right">
                      <label className="ml-auto inline-flex min-h-11 items-center justify-end gap-3 text-sm font-semibold text-slate-700">
                        <span>{published ? "Aktif" : "Nonaktif"}</span>
                        <Switch
                          checked={published}
                          disabled={loading}
                          aria-label={`Atur release data wilayah tahun ${year}`}
                          onCheckedChange={(checked) =>
                            updatePublishedYear(year, checked)
                          }
                        />
                      </label>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Belum ada tahun data wilayah yang tersedia di database.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title="Dampak ke Website Publik"
        description="Pengaturan ini dipakai oleh endpoint website Data Wilayah."
      >
        <div className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-3">
          <ImpactItem
            title="Pilihan Periode"
            description="Hanya tahun yang dirilis yang muncul di selector periode halaman Data Wilayah."
          />
          <ImpactItem
            title="Periode Default"
            description="Tahun utama dimuat otomatis saat URL tidak menyertakan parameter periode."
          />
          <ImpactItem
            title="Validasi Publik"
            description="Tahun yang belum dirilis tidak dapat dibuka dari endpoint website publik."
          />
        </div>
      </SectionCard>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <section className="app-surface rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-pbd-navy">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
          <Globe2 className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

function ImpactItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-pbd-navy">{title}</h3>
      <p className="mt-1">{description}</p>
    </div>
  );
}

function normalizeReleaseSettings(
  settings: DataWilayahAdminSettings,
): DataWilayahAdminSettings {
  const maxYear = currentReleaseYear();
  const availableTahunAnggaran = settings.availableTahunAnggaran.filter(
    (year) => year <= maxYear,
  );
  const publishedTahunAnggaran = settings.publishedTahunAnggaran.filter((year) =>
    availableTahunAnggaran.includes(year),
  );
  const featuredTahunAnggaran = publishedTahunAnggaran.includes(
    settings.featuredTahunAnggaran,
  )
    ? settings.featuredTahunAnggaran
    : publishedTahunAnggaran[0] || "";

  return {
    ...settings,
    availableTahunAnggaran,
    publishedTahunAnggaran,
    featuredTahunAnggaran,
  };
}

function releaseFormFromSettings(settings: DataWilayahAdminSettings): ReleaseForm {
  return {
    featuredTahunAnggaran: settings.featuredTahunAnggaran,
    publishedTahunAnggaran: settings.publishedTahunAnggaran,
  };
}

function currentReleaseYear() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jayapura",
    year: "numeric",
  }).format(new Date());
}
