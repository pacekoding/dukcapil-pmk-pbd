"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  TravelInput as Field,
  TravelText as Text,
  TravelSelect as Select,
  EmployeeSelect,
} from "@/components/travel/form-controls";
import {
  activityTypes,
  activityRecommendations,
  activityDocumentLabels,
} from "@/lib/activity-execution";
import { travelToday } from "@/lib/travel";
import type { ActivityPayload } from "@/types/activity-execution";
import type { TravelOptions } from "@/types/travel";
import type { KabKota } from "@/types/kab-kota";
export function ActivityForm({
  initial,
  options,
  cities,
  saving,
  onSave,
  onCancel,
}: {
  initial?: ActivityPayload;
  options: TravelOptions;
  cities: KabKota[];
  saving: boolean;
  onSave: (p: ActivityPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [p, set] = useState<ActivityPayload>(
    initial ?? {
      title: "",
      description: "",
      subkegiatanId: 0,
      startDate: travelToday(),
      endDate: travelToday(),
      location: "",
      fiscalYear: Number(travelToday().slice(0, 4)),
      fundingSource: "",
      pptkEmployeeId: 0,
      responsibleEmployeeId: 0,
      activityType: activityTypes[0],
      kabKotaId: null,
      status: "Draft",
      recommendedDocuments: activityRecommendations(activityTypes[0]),
    },
  );
  const selected = options.subkegiatan.find((s) => s.id === p.subkegiatanId);
  const [program, setProgram] = useState(selected?.program ?? "");
  const [kegiatan, setKegiatan] = useState(selected?.kegiatan ?? "");
  const update = <K extends keyof ActivityPayload>(
    k: K,
    v: ActivityPayload[K],
  ) => set((old) => ({ ...old, [k]: v }));
  const items = (v: string[]) =>
    [...new Set(v)].filter(Boolean).map((x) => ({ value: x, label: x }));
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(p);
      }}
    >
      <fieldset disabled={saving} className="space-y-5">
        <SectionCard
          title={initial ? "Edit Kegiatan" : "Buat Kegiatan Pelaksanaan"}
        >
          {!options.subkegiatan.length ? (
            <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Master Subkegiatan belum tersedia. Administrator perlu mengisinya
              pada Pengaturan sebelum kegiatan dapat disimpan.
            </p>
          ) : null}
          {!options.employees.length ? (
            <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Master Pegawai belum tersedia. Tambahkan pegawai untuk memilih
              PPTK dan penanggung jawab.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nama Pelaksanaan Kegiatan"
              value={p.title}
              onChange={(v) => update("title", v)}
              required
            />
            <Select
              label="Jenis Kegiatan"
              value={p.activityType}
              items={items(activityTypes)}
              onChange={(v) =>
                set((old) => ({
                  ...old,
                  activityType: v,
                  recommendedDocuments: activityRecommendations(v),
                }))
              }
            />
            <Select
              label="Program"
              required
              value={program}
              items={items(options.subkegiatan.map((s) => s.program))}
              onChange={(v) => {
                setProgram(v);
                setKegiatan("");
                update("subkegiatanId", 0);
              }}
            />
            <Select
              label="Kegiatan"
              required
              value={kegiatan}
              items={items(
                options.subkegiatan
                  .filter((s) => s.program === program)
                  .map((s) => s.kegiatan),
              )}
              onChange={(v) => {
                setKegiatan(v);
                update("subkegiatanId", 0);
              }}
            />
            <Select
              label="Subkegiatan"
              required
              value={p.subkegiatanId ? String(p.subkegiatanId) : ""}
              items={options.subkegiatan
                .filter((s) => s.program === program && s.kegiatan === kegiatan)
                .map((s) => ({ value: String(s.id), label: s.subkegiatan }))}
              onChange={(v) => update("subkegiatanId", Number(v))}
            />
            <Field
              label="Tahun Anggaran"
              type="number"
              required
              value={String(p.fiscalYear)}
              onChange={(v) => update("fiscalYear", Number(v))}
            />
            <Field
              label="Tanggal Mulai"
              type="date"
              required
              value={p.startDate}
              onChange={(v) => update("startDate", v)}
            />
            <Field
              label="Tanggal Selesai"
              type="date"
              required
              value={p.endDate}
              onChange={(v) => update("endDate", v)}
            />
            <Field
              label="Lokasi"
              value={p.location}
              required
              onChange={(v) => update("location", v)}
            />
            <Select
              label="Kabupaten/Kota"
              allowEmpty
              value={p.kabKotaId ? String(p.kabKotaId) : ""}
              items={cities.map((c) => ({
                value: String(c.id),
                label: c.nama,
              }))}
              onChange={(v) => update("kabKotaId", v ? Number(v) : null)}
            />
            <Field
              label="Sumber Dana"
              value={p.fundingSource}
              onChange={(v) => update("fundingSource", v)}
            />
            <Select
              label="Status Kegiatan"
              value={p.status}
              items={items(["Draft", "Berjalan", "Selesai", "Dibatalkan"])}
              onChange={(v) => update("status", v)}
            />
            <EmployeeSelect
              label="PPTK"
              value={p.pptkEmployeeId}
              existing={initial?.pptkEmployeeId}
              employees={options.employees}
              onChange={(v) => update("pptkEmployeeId", v)}
            />
            <EmployeeSelect
              label="Penanggung Jawab"
              value={p.responsibleEmployeeId}
              existing={initial?.responsibleEmployeeId}
              employees={options.employees}
              onChange={(v) => update("responsibleEmployeeId", v)}
            />
          </div>
          <div className="mt-4">
            <Text
              label="Deskripsi"
              value={p.description}
              onChange={(v) => update("description", v)}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Rekomendasi Kelengkapan"
          description="Dapat disesuaikan dengan kebutuhan dan ketentuan internal OPD. Rekomendasi tidak menghalangi finalisasi dokumen."
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(activityDocumentLabels).map(([k, label]) => (
              <label key={k} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.recommendedDocuments.includes(k)}
                  onChange={(e) =>
                    update(
                      "recommendedDocuments",
                      e.target.checked
                        ? [...p.recommendedDocuments, k]
                        : p.recommendedDocuments.filter((v) => v !== k),
                    )
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </SectionCard>
        <div className="flex gap-3">
          <Button type="submit">
            {saving ? "Menyimpan..." : "Simpan Kegiatan"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Kembali
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
