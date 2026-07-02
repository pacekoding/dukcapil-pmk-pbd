"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { CheckCircle2, Globe2, Home, Plus, Save } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { updateDataWilayahSettings } from "@/lib/api/data-wilayah";
import { cn } from "@/lib/utils";
import type { DataWilayahWebsiteSettingsResponse } from "@/types/data-wilayah";

type DataWilayahYearSettingsProps = {
  settings: DataWilayahWebsiteSettingsResponse | null;
  onSettingsChange: Dispatch<
    SetStateAction<DataWilayahWebsiteSettingsResponse | null>
  >;
};

const sortTahunAnggaranDesc = (years: string[]) =>
  Array.from(
    new Set(years.map((year) => year.trim()).filter(Boolean)),
  ).sort((left, right) => right.localeCompare(left));

const tahunAnggaranPattern = /^\d{4}$/;

export function DataWilayahYearSettings({
  settings,
  onSettingsChange,
}: DataWilayahYearSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    if (!settings) {
      return [];
    }

    return sortTahunAnggaranDesc([
      ...settings.availableTahunAnggaran,
      ...settings.publishedTahunAnggaran,
      settings.featuredTahunAnggaran,
    ]);
  }, [settings]);

  const setFeaturedYear = (year: string) => {
    setMessage(null);
    setError(null);
    onSettingsChange((current) =>
      current
        ? {
            ...current,
            featuredTahunAnggaran: year,
            publishedTahunAnggaran: current.publishedTahunAnggaran.includes(
              year,
            )
              ? current.publishedTahunAnggaran
              : sortTahunAnggaranDesc([
                  year,
                  ...current.publishedTahunAnggaran,
                ]),
          }
        : current,
    );
  };

  const togglePublishedYear = (year: string, checked: boolean) => {
    setMessage(null);
    setError(null);
    onSettingsChange((current) => {
      if (!current) {
        return current;
      }

      const nextPublished = checked
        ? sortTahunAnggaranDesc([...current.publishedTahunAnggaran, year])
        : current.publishedTahunAnggaran.filter((item) => item !== year);

      return {
        ...current,
        featuredTahunAnggaran:
          checked || current.featuredTahunAnggaran !== year
            ? current.featuredTahunAnggaran
            : nextPublished[0] ?? "",
        publishedTahunAnggaran: nextPublished,
      };
    });
  };

  const addYear = () => {
    const year = newYear.trim();
    setMessage(null);
    setError(null);

    if (!tahunAnggaranPattern.test(year)) {
      setError("Masukkan tahun dalam format 4 digit, contoh 2027.");
      return;
    }
    if (yearOptions.includes(year)) {
      setError(`Tahun ${year} sudah tersedia di daftar pengaturan.`);
      return;
    }

    onSettingsChange((current) => {
      if (!current) {
        return current;
      }

      const publishedYears = sortTahunAnggaranDesc([
        ...current.publishedTahunAnggaran,
        year,
      ]);

      return {
        ...current,
        availableTahunAnggaran: sortTahunAnggaranDesc([
          ...current.availableTahunAnggaran,
          year,
        ]),
        featuredTahunAnggaran:
          current.featuredTahunAnggaran || publishedYears[0] || year,
        publishedTahunAnggaran: publishedYears,
      };
    });
    setNewYear("");
    setMessage(
      `Tahun ${year} ditambahkan. Simpan pengaturan agar tersedia di website.`,
    );
  };

  const saveSettings = async () => {
    if (!settings) {
      return;
    }
    if (settings.publishedTahunAnggaran.length === 0) {
      setError("Pilih minimal satu tahun untuk ditampilkan di website.");
      return;
    }
    if (
      !settings.publishedTahunAnggaran.includes(
        settings.featuredTahunAnggaran,
      )
    ) {
      setError(
        "Tahun ringkasan home harus termasuk dalam daftar tahun yang ditampilkan.",
      );
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateDataWilayahSettings({
        featuredTahunAnggaran: settings.featuredTahunAnggaran,
        publishedTahunAnggaran: settings.publishedTahunAnggaran,
      });
      onSettingsChange(updated);
      setMessage("Pengaturan tahun website berhasil diperbarui.");
    } catch (saveError) {
      console.error(saveError);
      setError("Pengaturan tahun website gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-[0_14px_40px_rgba(15,35,80,0.08)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold text-pbd-navy">
            Pengaturan Tahun Website
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pilih tahun yang dipakai untuk ringkasan wilayah di halaman home
            website dan tentukan tahun mana saja yang dapat dipilih pada halaman
            Data Wilayah publik.
          </p>
        </div>
        <Button
          type="button"
          onClick={saveSettings}
          disabled={saving || !settings}
          className="h-11 w-full rounded-lg bg-pbd-navy px-5 text-sm font-bold text-white hover:bg-pbd-navy/90 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Pengaturan Website"}
        </Button>
      </div>

      {settings ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Home className="h-4 w-4" />
                Ringkasan Home
              </div>
              <p className="mt-2 text-2xl font-bold text-pbd-navy">
                {settings.featuredTahunAnggaran}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Globe2 className="h-4 w-4" />
                Tampil Publik
              </div>
              <p className="mt-2 text-2xl font-bold text-pbd-navy">
                {settings.publishedTahunAnggaran.length} tahun
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-bold text-slate-600">
                Tambah Tahun
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Contoh 2027"
                  value={newYear}
                  onChange={(event) =>
                    setNewYear(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addYear();
                    }
                  }}
                  className="h-11 rounded-lg border-slate-200 bg-white text-base font-semibold text-pbd-navy"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addYear}
                  disabled={!newYear.trim()}
                  className="h-11 rounded-lg border-slate-200 bg-white px-4 font-bold text-pbd-navy"
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600">
                Tahun Ringkasan Home
              </Label>
              <Select
                value={settings.featuredTahunAnggaran}
                onValueChange={setFeaturedYear}
              >
                <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white px-4 text-base font-semibold text-pbd-navy">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      Tahun Anggaran {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-600">
                Tahun yang Tampil di Halaman Data Wilayah
              </Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {yearOptions.map((year) => {
                  const checked =
                    settings.publishedTahunAnggaran.includes(year);
                  const featured = settings.featuredTahunAnggaran === year;

                  return (
                    <div
                      key={year}
                      className={cn(
                        "rounded-lg border bg-white p-4 transition",
                        featured
                          ? "border-blue-200 shadow-sm ring-1 ring-blue-100"
                          : "border-slate-200",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold leading-none text-pbd-navy">
                            {year}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {featured ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Home
                              </span>
                            ) : null}
                            {checked ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                                Publik
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                                Draft
                              </span>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={(value) =>
                            togglePublishedYear(year, value)
                          }
                        />
                      </div>

                      <Button
                        type="button"
                        variant={featured ? "secondary" : "outline"}
                        onClick={() => setFeaturedYear(year)}
                        disabled={featured}
                        className="mt-4 h-9 w-full rounded-lg text-sm font-bold"
                      >
                        <Home className="h-4 w-4" />
                        {featured ? "Ringkasan Home" : "Jadikan Ringkasan"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}
