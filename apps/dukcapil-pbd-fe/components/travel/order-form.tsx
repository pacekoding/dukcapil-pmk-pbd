"use client";
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { createOrderForm } from "@/lib/travel";
import {
  EmployeeSelect,
  PersonSummary,
  TravelInput,
  TravelSelect,
  TravelText,
} from "./form-controls";
import type {
  TravelApproval,
  TravelAssignment,
  TravelOptions,
  TravelOrderPayload,
} from "@/types/travel";

const blankApproval = (): TravelApproval => ({
  arrivalPlace: "",
  arrivalDate: "",
  departurePlace: "",
  destination: "",
  departureDate: "",
  arrivalOfficerName: "",
  arrivalOfficerNip: "",
  arrivalOfficerPosition: "",
  departureOfficerName: "",
  departureOfficerNip: "",
  departureOfficerPosition: "",
});
export function OrderForm({
  initial,
  assignments,
  options,
  saving,
  onSave,
  onCancel,
}: {
  initial?: TravelOrderPayload;
  assignments: TravelAssignment[];
  options: TravelOptions;
  saving: boolean;
  onSave: (p: TravelOrderPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TravelOrderPayload>(() => {
    const p = initial ?? createOrderForm(options.office.agencyName);
    const a = assignments.find((a) => a.id === p.assignmentLetterId)?.activity;
    return a
      ? {
          ...p,
          activityExecutionId: a.id,
          subkegiatanId: a.subkegiatanId,
          fiscalYear: a.fiscalYear,
          fundingSource: a.fundingSource,
        }
      : p;
  });
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const initialSub = options.subkegiatan.find(
    (s) => s.id === form.subkegiatanId,
  );
  const [program, setProgram] = useState(initialSub?.program ?? "");
  const [kegiatan, setKegiatan] = useState(initialSub?.kegiatan ?? "");
  const set = <K extends keyof TravelOrderPayload>(
    key: K,
    value: TravelOrderPayload[K],
  ) => setForm((p) => ({ ...p, [key]: value }));
  const source = assignments.find((a) => a.id === form.assignmentLetterId);
  const person = source?.employees.find((p) => p.id === form.employeeId);
  const sourceOptions = assignments.filter(
    (a) =>
      a.id === form.assignmentLetterId ||
      (a.status !== "Dibatalkan" &&
        `${a.number} ${a.destination} ${a.employees.map((p) => p.name).join(" ")}`
          .toLowerCase()
          .includes(assignmentSearch.toLowerCase())),
  );
  const programOptions = [
    ...new Set(options.subkegiatan.map((s) => s.program)),
  ];
  const kegiatanOptions = [
    ...new Set(
      options.subkegiatan
        .filter((s) => s.program === program)
        .map((s) => s.kegiatan),
    ),
  ];
  const subOptions = options.subkegiatan.filter(
    (s) => s.program === program && s.kegiatan === kegiatan,
  );
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void onSave(form);
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={saving} className="space-y-5">
        <SectionCard
          title="Informasi SPD"
          description="Nomor boleh kosong saat Draft. Pilih Surat Tugas sebagai sumber perjalanan."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <TravelInput
              label="Lembar ke"
              value={form.sheetNumber}
              onChange={(v) => set("sheetNumber", v)}
            />
            <TravelInput
              label="Kode Nomor"
              value={form.code}
              onChange={(v) => set("code", v)}
            />
            <TravelInput
              label="Nomor SPD"
              value={form.number}
              onChange={(v) => set("number", v)}
            />
            <TravelInput
              required
              label="Tanggal SPD"
              type="date"
              value={form.documentDate}
              onChange={(v) => set("documentDate", v)}
            />
            <TravelInput
              required
              label="Tempat Dikeluarkan"
              value={form.issuePlace}
              onChange={(v) => set("issuePlace", v)}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Pelaksana"
          description="Identitas dan perjalanan berasal dari Surat Tugas. Surat Tugas harus Final sebelum SPD difinalisasi."
        >
          <div className="space-y-4">
            <TravelInput
              label="Cari Surat Tugas"
              value={assignmentSearch}
              onChange={setAssignmentSearch}
            />
            <TravelSelect
              label="Surat Tugas"
              required
              disabled={Boolean(initial)}
              value={
                form.assignmentLetterId ? String(form.assignmentLetterId) : ""
              }
              items={sourceOptions.map((a) => ({
                value: String(a.id),
                label: `${a.number || `Draft #${a.id}`} · ${a.destination} · ${a.status}`,
              }))}
              onChange={(v) => {
                const a = assignments.find((a) => a.id === Number(v));
                setForm((p) => ({
                  ...p,
                  assignmentLetterId: Number(v),
                  employeeId:
                    a?.employeeIds.length === 1 ? a.employeeIds[0] : 0,
                  issuePlace: a?.issuePlace ?? p.issuePlace,
                  signerId: a?.signerId ?? 0,
                  activityExecutionId: a?.activityExecutionId ?? null,
                  subkegiatanId: a?.activity?.subkegiatanId ?? null,
                  fiscalYear: a?.activity?.fiscalYear ?? p.fiscalYear,
                  fundingSource: a?.activity?.fundingSource ?? p.fundingSource,
                }));
              }}
            />
            <TravelSelect
              label="Pelaksana SPD"
              required
              disabled={!source}
              value={form.employeeId ? String(form.employeeId) : ""}
              items={(source?.employees ?? []).map((p) => ({
                value: String(p.id),
                label: `${p.name} · ${p.nip}`,
              }))}
              onChange={(v) => set("employeeId", Number(v))}
            />
            {person ? <PersonSummary person={person} /> : null}
            {!assignments.length ? (
              <p className="text-sm text-amber-700">
                Belum ada Surat Tugas. Buat Surat Tugas terlebih dahulu.
              </p>
            ) : null}
          </div>
        </SectionCard>
        <SectionCard
          title="Detail Perjalanan"
          description="Data ini mengikuti Surat Tugas sumber; tidak perlu diketik ulang."
        >
          {source ? (
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="font-semibold">Maksud Perjalanan</dt>
                <dd className="whitespace-pre-line text-slate-600">
                  {source.instructions
                    .map((s, i) => `${i + 1}. ${s}`)
                    .join("\n")}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Tempat</dt>
                <dd>
                  {source.origin} → {source.destination}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Tanggal dan Lama</dt>
                <dd>
                  {source.departureDate} s.d. {source.returnDate} ·{" "}
                  {source.durationDays} hari (selisih tanggal)
                </dd>
              </div>
              <div>
                <dt className="font-semibold">
                  Transportasi / Jenis Perjalanan
                </dt>
                <dd>
                  {source.transport || "Belum diisi"} · {source.tripType}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              Pilih Surat Tugas untuk memuat detail perjalanan.
            </p>
          )}
          <div className="mt-4">
            <TravelInput
              label="Tingkat Biaya Perjalanan Dinas"
              value={form.expenseLevel}
              onChange={(v) => set("expenseLevel", v)}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Pengikut"
          description="Opsional; pengikut berbeda dengan pelaksana Surat Tugas."
        >
          <div className="space-y-4">
            {form.followers.map((f, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-3"
              >
                <TravelInput
                  required
                  label={`Nama Pengikut ${i + 1}`}
                  value={f.name}
                  onChange={(v) =>
                    set(
                      "followers",
                      form.followers.map((o, j) =>
                        j === i ? { ...o, name: v } : o,
                      ),
                    )
                  }
                />
                <TravelInput
                  label="Tanggal Lahir"
                  type="date"
                  value={f.birthDate}
                  onChange={(v) =>
                    set(
                      "followers",
                      form.followers.map((o, j) =>
                        j === i ? { ...o, birthDate: v } : o,
                      ),
                    )
                  }
                />
                <TravelInput
                  label="Keterangan"
                  value={f.description}
                  onChange={(v) =>
                    set(
                      "followers",
                      form.followers.map((o, j) =>
                        j === i ? { ...o, description: v } : o,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    set(
                      "followers",
                      form.followers.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Pengikut {i + 1}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                set("followers", [
                  ...form.followers,
                  { name: "", birthDate: "", description: "" },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Tambah Pengikut
            </Button>
          </div>
        </SectionCard>
        <SectionCard
          title="Pembebanan Anggaran"
          description="Program, kegiatan, subkegiatan, tahun, dan sumber dana mengikuti kegiatan Surat Tugas sumber."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TravelInput
              required
              label="SKPD / Instansi"
              value={form.skpd}
              onChange={(v) => set("skpd", v)}
            />
            <TravelInput
              required
              disabled={Boolean(source?.activity)}
              label="Tahun Anggaran"
              type="number"
              value={String(form.fiscalYear)}
              onChange={(v) => set("fiscalYear", Number(v))}
            />
            <TravelSelect
              disabled={Boolean(source?.activity)}
              label="Program"
              value={program}
              items={programOptions.map((v) => ({ value: v, label: v }))}
              onChange={(v) => {
                setProgram(v);
                setKegiatan("");
                set("subkegiatanId", null);
              }}
            />
            <TravelSelect
              label="Kegiatan"
              value={kegiatan}
              disabled={Boolean(source?.activity) || !program}
              items={kegiatanOptions.map((v) => ({ value: v, label: v }))}
              onChange={(v) => {
                setKegiatan(v);
                set("subkegiatanId", null);
              }}
            />
            <TravelSelect
              label="Subkegiatan"
              value={form.subkegiatanId ? String(form.subkegiatanId) : ""}
              disabled={Boolean(source?.activity) || !kegiatan}
              items={subOptions.map((s) => ({
                value: String(s.id),
                label: `${s.subkegiatan} · ${s.bidang}`,
              }))}
              onChange={(v) => set("subkegiatanId", Number(v))}
            />
            <TravelInput
              label="Kode Rekening / Akun"
              value={form.accountCode}
              onChange={(v) => set("accountCode", v)}
            />
            <TravelInput
              disabled={Boolean(source?.activity)}
              label="Sumber Dana"
              value={form.fundingSource}
              onChange={(v) => set("fundingSource", v)}
            />
          </div>
          {!options.subkegiatan.length ? (
            <p className="mt-3 text-sm text-amber-700">
              Master Subkegiatan belum tersedia. Administrator perlu mengisinya
              sebelum finalisasi SPD.
            </p>
          ) : null}
        </SectionCard>
        <SectionCard title="Penandatangan">
          <div className="space-y-4">
            <TravelSelect
              label="Kewenangan Penandatangan"
              required
              value={form.signerRole}
              items={[
                "Pejabat Pembuat Komitmen",
                "Pengguna Anggaran",
                "Kuasa Pengguna Anggaran",
              ].map((v) => ({ value: v, label: v }))}
              onChange={(v) => set("signerRole", v)}
            />
            <EmployeeSelect
              label="Pejabat Penandatangan SPD"
              value={form.signerId}
              onChange={(v) => set("signerId", v)}
              employees={options.employees}
              existing={initial?.signerId}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Pengesahan Perjalanan"
          description="Tanggal aktual dan pejabat di setiap tahapan dapat dicatat secara terstruktur. Ruang pengesahan kosong tetap disediakan pada hasil cetak."
        >
          <div className="space-y-4">
            {form.approvals.map((a, i) => (
              <div key={i} className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Tahapan {i + 1}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {(
                    [
                      ["arrivalPlace", "Tiba di", "text"],
                      ["arrivalDate", "Tanggal Tiba", "date"],
                      ["arrivalOfficerName", "Nama Pejabat Kedatangan", "text"],
                      ["arrivalOfficerNip", "NIP Pejabat Kedatangan", "text"],
                      [
                        "arrivalOfficerPosition",
                        "Jabatan Pejabat Kedatangan",
                        "text",
                      ],
                      ["departurePlace", "Berangkat dari", "text"],
                      ["destination", "Ke", "text"],
                      ["departureDate", "Tanggal Berangkat Tahapan", "date"],
                      [
                        "departureOfficerName",
                        "Nama Pejabat Keberangkatan",
                        "text",
                      ],
                      [
                        "departureOfficerNip",
                        "NIP Pejabat Keberangkatan",
                        "text",
                      ],
                      [
                        "departureOfficerPosition",
                        "Jabatan Pejabat Keberangkatan",
                        "text",
                      ],
                    ] as const
                  ).map(([key, label, type]) => (
                    <TravelInput
                      key={key}
                      label={label}
                      type={type}
                      value={a[key]}
                      onChange={(v) =>
                        set(
                          "approvals",
                          form.approvals.map((old, j) =>
                            j === i ? { ...old, [key]: v } : old,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    set(
                      "approvals",
                      form.approvals.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Tahapan {i + 1}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                set("approvals", [...form.approvals, blankApproval()])
              }
            >
              <Plus className="h-4 w-4" />
              Tambah Tahapan
            </Button>
            <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
              <TravelInput
                label="Tiba Kembali di"
                value={form.returnedPlace}
                onChange={(v) => set("returnedPlace", v)}
              />
              <TravelInput
                label="Tanggal Tiba Kembali"
                type="date"
                value={form.returnedDate}
                onChange={(v) => set("returnedDate", v)}
              />
              <TravelInput
                label="Nama Pejabat Pengesahan Akhir"
                value={form.returnOfficerName}
                onChange={(v) => set("returnOfficerName", v)}
              />
              <TravelInput
                label="NIP Pejabat Pengesahan Akhir"
                value={form.returnOfficerNip}
                onChange={(v) => set("returnOfficerNip", v)}
              />
              <TravelInput
                label="Jabatan Pejabat Pengesahan Akhir"
                value={form.returnOfficerPosition}
                onChange={(v) => set("returnOfficerPosition", v)}
              />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Keterangan Lain">
          <TravelText
            label="Keterangan"
            value={form.notes}
            onChange={(v) => set("notes", v)}
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
