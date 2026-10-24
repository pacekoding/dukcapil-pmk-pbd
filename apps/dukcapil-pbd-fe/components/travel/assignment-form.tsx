"use client";
import Link from "next/link";
import type { ActivityExecution } from "@/types/activity-execution";
import { activityRoot } from "@/lib/activity-execution";
import { useState, type FormEvent } from "react";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAssignmentForm, travelDuration } from "@/lib/travel";
import {
  EmployeeSelect,
  PersonSummary,
  TravelInput,
  TravelLines,
  TravelSelect,
} from "./form-controls";
import type { TravelAssignmentPayload, TravelOptions } from "@/types/travel";

export function AssignmentForm({
  initial,
  activities,
  options,
  saving,
  onSave,
  onCancel,
}: {
  initial?: TravelAssignmentPayload;
  activities: ActivityExecution[];
  options: TravelOptions;
  saving: boolean;
  onSave: (p: TravelAssignmentPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TravelAssignmentPayload>(() => {
    const p = initial ?? createAssignmentForm();
    const id =
      typeof window !== "undefined"
        ? Number(new URL(window.location.href).searchParams.get("activityId"))
        : 0;
    const a = activities.find((a) => a.id === id);
    return !initial && a
      ? {
          ...p,
          activityExecutionId: a.id,
          destination: a.location,
          departureDate: a.startDate,
          returnDate: a.endDate,
          instructions: [a.title],
          signerId: a.responsibleEmployeeId,
        }
      : p;
  });
  const [search, setSearch] = useState("");
  const set = <K extends keyof TravelAssignmentPayload>(
    key: K,
    value: TravelAssignmentPayload[K],
  ) => setForm((p) => ({ ...p, [key]: value }));
  const employees = options.employees.filter(
    (p) =>
      (p.status === "Aktif" || initial?.employeeIds.includes(p.id)) &&
      `${p.name} ${p.nip}`.toLowerCase().includes(search.toLowerCase()),
  );
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void onSave(form);
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={saving} className="space-y-5">
        <SectionCard
          title="Kegiatan Pelaksanaan"
          description="Metadata diisi dari kegiatan sumber. Tempat berangkat dan identitas pelaksana tetap diperiksa sesuai penugasan."
        >
          <TravelSelect
            label="Kegiatan Pelaksanaan"
            required
            disabled={Boolean(initial?.activityExecutionId)}
            value={
              form.activityExecutionId ? String(form.activityExecutionId) : ""
            }
            items={activities
              .filter(
                (a) =>
                  a.status !== "Dibatalkan" ||
                  a.id === form.activityExecutionId,
              )
              .map((a) => ({
                value: String(a.id),
                label: `${a.title} · ${a.fiscalYear}`,
              }))}
            onChange={(value) => {
              const a = activities.find((a) => a.id === Number(value));
              if (a)
                setForm((p) => ({
                  ...p,
                  activityExecutionId: a.id,
                  destination: a.location,
                  departureDate: a.startDate,
                  returnDate: a.endDate,
                  instructions: [a.title],
                  signerId: a.responsibleEmployeeId,
                }));
            }}
          />
          {form.activityExecutionId ? (
            <Link
              className="mt-3 inline-block text-sm text-pbd-blue underline"
              href={`${activityRoot}/${form.activityExecutionId}`}
            >
              Buka pusat dokumen kegiatan
            </Link>
          ) : (
            <Link
              className="mt-3 inline-block text-sm text-pbd-blue underline"
              href={activityRoot}
            >
              Buat Kegiatan Pelaksanaan terlebih dahulu
            </Link>
          )}
        </SectionCard>
        <SectionCard
          title="Informasi Surat"
          description="Nomor boleh kosong saat Draft. Penomoran mengikuti administrasi instansi."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <TravelInput
              label="Nomor Surat Tugas"
              value={form.number}
              onChange={(v) => set("number", v)}
            />
            <TravelInput
              label="Tanggal Surat"
              required
              type="date"
              value={form.documentDate}
              onChange={(v) => set("documentDate", v)}
            />
            <TravelInput
              label="Tempat Dikeluarkan"
              required
              value={form.issuePlace}
              onChange={(v) => set("issuePlace", v)}
            />
          </div>
        </SectionCard>
        <SectionCard title="Dasar">
          <TravelLines
            label="Dasar"
            lines={form.bases}
            onChange={(v) => set("bases", v)}
          />
        </SectionCard>
        <SectionCard
          title="Pelaksana"
          description="Pilih satu atau lebih pegawai dari master Pegawai."
        >
          <div className="space-y-4">
            <Input
              aria-label="Cari pelaksana"
              placeholder="Cari nama atau NIP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border p-3 md:grid-cols-2">
              {employees.length ? (
                employees.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                  >
                    <input
                      className="mt-1 h-4 w-4"
                      type="checkbox"
                      checked={form.employeeIds.includes(p.id)}
                      onChange={(e) =>
                        set(
                          "employeeIds",
                          e.target.checked
                            ? [...form.employeeIds, p.id]
                            : form.employeeIds.filter((id) => id !== p.id),
                        )
                      }
                    />
                    <span>
                      <span className="block font-semibold">{p.name}</span>
                      <span>
                        {p.nip} · {p.position || "Jabatan belum diisi"}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Tidak ada pegawai yang sesuai. Pastikan master Pegawai sudah
                  diisi.
                </p>
              )}
            </div>
            <p className="text-sm font-semibold">
              {form.employeeIds.length} pelaksana dipilih
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {form.employeeIds.map((id) => {
                const p = options.employees.find((p) => p.id === id);
                return p ? <PersonSummary key={id} person={p} /> : null;
              })}
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Detail Perjalanan">
          <div className="grid gap-4 md:grid-cols-2">
            <TravelInput
              label="Tempat Berangkat"
              required
              value={form.origin}
              onChange={(v) => set("origin", v)}
            />
            <TravelInput
              label="Tempat Tujuan"
              required
              value={form.destination}
              onChange={(v) => set("destination", v)}
            />
            <TravelInput
              label="Tanggal Berangkat"
              required
              type="date"
              value={form.departureDate}
              onChange={(v) => set("departureDate", v)}
            />
            <TravelInput
              label="Tanggal Kembali"
              required
              type="date"
              value={form.returnDate}
              onChange={(v) => set("returnDate", v)}
            />
            <TravelSelect
              label="Jenis Perjalanan"
              required
              value={form.tripType}
              onChange={(v) => set("tripType", v)}
              items={["Dalam Daerah", "Luar Daerah", "Luar Negeri"].map(
                (v) => ({ value: v, label: v }),
              )}
            />
            <TravelInput
              label="Transportasi"
              value={form.transport}
              onChange={(v) => set("transport", v)}
            />
            <p className="text-sm text-slate-600 md:col-span-2">
              Lama perjalanan:{" "}
              <strong>
                {travelDuration(form.departureDate, form.returnDate)} hari
              </strong>{" "}
              (selisih tanggal kembali dan berangkat).
            </p>
          </div>
        </SectionCard>
        <SectionCard title="Isi Penugasan">
          <TravelLines
            label="Untuk"
            lines={form.instructions}
            onChange={(v) => set("instructions", v)}
          />
        </SectionCard>
        <SectionCard title="Penandatangan">
          <EmployeeSelect
            label="Pejabat Penandatangan"
            value={form.signerId}
            onChange={(v) => set("signerId", v)}
            employees={options.employees}
            existing={initial?.signerId}
          />
        </SectionCard>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            {saving ? "Menyimpan..." : "Simpan Draft"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
