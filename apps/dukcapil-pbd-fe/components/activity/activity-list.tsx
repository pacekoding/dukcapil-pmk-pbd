"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  ErrorState,
  LoadingState,
} from "@/components/dashboard/state";
import { Button } from "@/components/ui/button";
import {
  TravelInput as Field,
  TravelSelect as Select,
} from "@/components/travel/form-controls";
import { getActivities } from "@/lib/api/activity-execution";
import { getTravelOptions } from "@/lib/api/travel";
import { getKabKota } from "@/lib/api/kab-kota";
import {
  activityRoot,
  activityTypes,
  activityProgress,
} from "@/lib/activity-execution";
import type { ActivityExecution } from "@/types/activity-execution";
import type { TravelOptions } from "@/types/travel";
import type { KabKota } from "@/types/kab-kota";
export function ActivityList() {
  const [rows, setRows] = useState<ActivityExecution[]>([]),
    [options, setOptions] = useState<TravelOptions | null>(null),
    [cities, setCities] = useState<KabKota[]>([]),
    [filters, setFilters] = useState({
      year: "all",
      search: "",
      status: "",
      activity_type: "",
      subkegiatan_id: "",
      kab_kota_id: "",
    }),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([getTravelOptions(), getKabKota()])
      .then(([o, c]) => {
        if (active) {
          setOptions(o);
          setCities(c);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      setLoading(true);
      getActivities(filters)
        .then((r) => {
          if (active) setRows(r);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [filters, reload]);
  const update = (k: keyof typeof filters, v: string) =>
    setFilters((p) => ({ ...p, [k]: v }));
  return (
    <main className="space-y-6">
      <PageHero
        icon={ClipboardList}
        eyebrow="Administrasi dan Realisasi"
        title="Pelaksanaan Kegiatan"
        description="Pusat dokumen pelaksanaan kegiatan dan subkegiatan."
        aside={
          <Button asChild><Link href={`${activityRoot}/add`}>Buat Kegiatan</Link></Button>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      <SectionCard title="Daftar Kegiatan">
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <Field
            label="Cari kegiatan, nomor surat, pegawai, lokasi"
            value={filters.search}
            onChange={(v) => update("search", v)}
          />
          <Field
            label="Tahun (kosong = semua)"
            type="number"
            value={filters.year === "all" ? "" : filters.year}
            onChange={(v) => update("year", v || "all")}
          />
          <Select
            label="Status"
            allowEmpty
            value={filters.status}
            items={["Draft", "Berjalan", "Selesai", "Dibatalkan"].map((v) => ({
              value: v,
              label: v,
            }))}
            onChange={(v) => update("status", v)}
          />
          <Select
            label="Jenis Kegiatan"
            allowEmpty
            value={filters.activity_type}
            items={activityTypes.map((v) => ({ value: v, label: v }))}
            onChange={(v) => update("activity_type", v)}
          />
          <Select
            label="Subkegiatan"
            allowEmpty
            value={filters.subkegiatan_id}
            items={(options?.subkegiatan ?? []).map((s) => ({
              value: String(s.id),
              label: s.subkegiatan,
            }))}
            onChange={(v) => update("subkegiatan_id", v)}
          />
          <Select
            label="Kabupaten/Kota"
            allowEmpty
            value={filters.kab_kota_id}
            items={cities.map((c) => ({ value: String(c.id), label: c.nama }))}
            onChange={(v) => update("kab_kota_id", v)}
          />
        </div>
        {loading ? (
          <LoadingState rows={3} />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {[
                    "Kegiatan",
                    "Subkegiatan",
                    "Lokasi",
                    "Tanggal",
                    "PPTK",
                    "Dokumen",
                    "Status",
                    "Aksi",
                  ].map((t) => (
                    <th className="p-3" key={t}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const p = activityProgress(a.checklist);
                  return (
                    <tr key={a.id} className="border-b">
                      <td className="min-w-52 p-3 font-semibold">{a.title}</td>
                      <td className="min-w-48 p-3">{a.subkegiatan}</td>
                      <td className="p-3">{a.location}</td>
                      <td className="min-w-40 p-3">
                        {a.startDate} – {a.endDate}
                      </td>
                      <td className="p-3">{a.pptk.name}</td>
                      <td className="p-3">
                        {p.complete}/{p.total} rekomendasi
                      </td>
                      <td className="p-3">{a.status}</td>
                      <td className="p-3">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`${activityRoot}/${a.id}/preview`}>Detail</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-500">
                      Belum ada kegiatan yang sesuai. Buat kegiatan atau ubah
                      filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <Button
        variant="outline"
        onClick={() => {
          setError("");
          setReload((v) => v + 1);
        }}
      >
        Muat Ulang
      </Button>
    </main>
  );
}
