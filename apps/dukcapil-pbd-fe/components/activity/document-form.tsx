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
  blankParty,
  blankParticipant,
  activityDocumentLabels,
} from "@/lib/activity-execution";
import type {
  ActivityDocumentPayload,
  ActivityContent,
  ActivityParty,
  ActivityParticipant,
} from "@/types/activity-execution";
import type { TravelPerson } from "@/types/travel";
function PartyEditor({
  party: p,
  onChange,
  employees,
}: {
  party: ActivityParty;
  onChange: (p: ActivityParty) => void;
  employees: TravelPerson[];
}) {
  const update = (k: keyof ActivityParty, v: string | number | null) =>
    onChange({ ...p, [k]: v });
  return (
    <div className="space-y-3">
      <Select
        label="Sumber Identitas"
        value={p.employeeId !== null ? "internal" : "external"}
        items={[
          { value: "internal", label: "Pegawai Internal" },
          { value: "external", label: "Pihak Eksternal" },
        ]}
        onChange={(v) =>
          onChange({
            ...blankParty(),
            role: p.role,
            employeeId:
              v === "internal"
                ? (employees.find((e) => e.status === "Aktif")?.id ?? 0)
                : null,
          })
        }
      />
      {p.employeeId !== null ? (
        <EmployeeSelect
          label="Pegawai"
          value={p.employeeId}
          existing={p.employeeId}
          employees={employees}
          onChange={(v) => update("employeeId", v)}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(
            [
              ["name", "Nama", true],
              ["nip", "NIP / Identitas", false],
              ["rank", "Pangkat/Golongan", false],
              ["position", "Jabatan", false],
              ["institution", "Instansi", false],
              ["address", "Alamat", false],
            ] as const
          ).map(([k, label, required]) => (
            <Field
              key={k}
              label={label}
              value={p[k]}
              required={required}
              onChange={(v) => update(k, v)}
            />
          ))}
        </div>
      )}
      <Field
        label="Peran (Pihak Pertama, Pihak Kedua, Mengetahui, Saksi, dll.)"
        value={p.role}
        onChange={(v) => update("role", v)}
      />
    </div>
  );
}
function Parties({
  title,
  value,
  onChange,
  employees,
}: {
  title: string;
  value: ActivityParty[];
  onChange: (p: ActivityParty[]) => void;
  employees: TravelPerson[];
}) {
  return (
    <SectionCard title={title}>
      <div className="space-y-4">
        {value.map((p, i) => (
          <div key={i} className="space-y-3 rounded border p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">
                {title} {i + 1}
              </h3>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => onChange(value.filter((_, n) => n !== i))}
              >
                Hapus
              </Button>
            </div>
            <PartyEditor
              party={p}
              employees={employees}
              onChange={(v) =>
                onChange(value.map((old, n) => (n === i ? v : old)))
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...value, blankParty()])}
        >
          Tambah {title}
        </Button>
      </div>
    </SectionCard>
  );
}
function Participants({
  value,
  onChange,
  employees,
  receipts,
}: {
  value: ActivityParticipant[];
  onChange: (p: ActivityParticipant[]) => void;
  employees: TravelPerson[];
  receipts: boolean;
}) {
  const set = (
    i: number,
    k: keyof ActivityParticipant,
    v: string | number | null,
  ) => onChange(value.map((p, n) => (n === i ? { ...p, [k]: v } : p)));
  return (
    <SectionCard
      title={receipts ? "Daftar Penerima" : "Peserta / Pelaksana"}
      description="Pegawai internal dipilih dari master. Kolom tanda tangan pada PDF disediakan kosong untuk tanda tangan manual."
    >
      <div className="space-y-4">
        {value.map((p, i) => (
          <div key={i} className="space-y-3 rounded border p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">
                {receipts ? "Penerima" : "Peserta"} {i + 1}
              </h3>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => onChange(value.filter((_, n) => i !== n))}
              >
                Hapus
              </Button>
            </div>
            <Select
              label="Sumber Peserta"
              value={p.employeeId !== null ? "internal" : "external"}
              items={[
                { value: "internal", label: "Pegawai Internal" },
                { value: "external", label: "Eksternal / Manual" },
              ]}
              onChange={(v) =>
                onChange(
                  value.map((old, n) =>
                    n === i
                      ? {
                          ...blankParticipant(),
                          employeeId:
                            v === "internal"
                              ? (employees.find((e) => e.status === "Aktif")
                                  ?.id ?? 0)
                              : null,
                        }
                      : old,
                  ),
                )
              }
            />
            {p.employeeId !== null ? (
              <EmployeeSelect
                label="Peserta Internal"
                value={p.employeeId}
                existing={p.employeeId}
                employees={employees}
                onChange={(v) => set(i, "employeeId", v)}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Nama"
                  required
                  value={p.name}
                  onChange={(v) => set(i, "name", v)}
                />
                <Field
                  label="NIP / NIK (opsional)"
                  value={p.identification}
                  onChange={(v) => set(i, "identification", v)}
                />
                <Field
                  label="Jabatan"
                  value={p.position}
                  onChange={(v) => set(i, "position", v)}
                />
                <Field
                  label="Instansi"
                  value={p.institution}
                  onChange={(v) => set(i, "institution", v)}
                />
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Nomor HP"
                value={p.phone}
                onChange={(v) => set(i, "phone", v)}
              />
              <Select
                label="Kehadiran"
                value={p.attendanceStatus || "Hadir"}
                items={["Hadir", "Tidak Hadir", "Izin"].map((v) => ({
                  value: v,
                  label: v,
                }))}
                onChange={(v) => set(i, "attendanceStatus", v)}
              />
              {receipts ? (
                <>
                  <Field
                    label="Alamat"
                    value={p.address}
                    onChange={(v) => set(i, "address", v)}
                  />
                  <Field
                    label="Kampung"
                    value={p.village}
                    onChange={(v) => set(i, "village", v)}
                  />
                  <Field
                    label="Kabupaten/Kota"
                    value={p.kabKota}
                    onChange={(v) => set(i, "kabKota", v)}
                  />
                  <Field
                    label="Jenis Bantuan / Barang"
                    value={p.assistanceType}
                    onChange={(v) => set(i, "assistanceType", v)}
                  />
                  <Field
                    label="Jumlah"
                    type="number"
                    value={String(p.quantity)}
                    onChange={(v) => set(i, "quantity", Number(v))}
                  />
                  <Field
                    label="Satuan"
                    value={p.unit}
                    onChange={(v) => set(i, "unit", v)}
                  />
                </>
              ) : null}
              <Field
                label="Keterangan"
                value={p.notes}
                onChange={(v) => set(i, "notes", v)}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...value, blankParticipant()])}
        >
          Tambah {receipts ? "Penerima" : "Peserta"}
        </Button>
      </div>
    </SectionCard>
  );
}
export function DocumentForm({
  initial,
  employees,
  saving,
  onSave,
  onCancel,
}: {
  initial: ActivityDocumentPayload;
  employees: TravelPerson[];
  saving: boolean;
  onSave: (p: ActivityDocumentPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [p, set] = useState(initial),
    c = p.content,
    kind = p.kind;
  const content = <K extends keyof ActivityContent>(
    k: K,
    v: ActivityContent[K],
  ) => set((old) => ({ ...old, content: { ...old.content, [k]: v } }));
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(p);
      }}
    >
      <fieldset disabled={saving} className="space-y-5">
        <SectionCard title={`Draft ${activityDocumentLabels[kind]}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nomor Dokumen"
              value={p.documentNumber}
              onChange={(v) => set((old) => ({ ...old, documentNumber: v }))}
            />
            <Field
              label="Tanggal Dokumen"
              type="date"
              required
              value={p.documentDate}
              onChange={(v) => set((old) => ({ ...old, documentDate: v }))}
            />
            <Field
              label="Hal / Judul"
              value={c.subject}
              onChange={(v) => content("subject", v)}
            />
            <Field
              label="Tanggal Pelaksanaan"
              type="date"
              required
              value={c.eventDate}
              onChange={(v) => content("eventDate", v)}
            />
            <Field
              label="Waktu"
              value={c.time}
              onChange={(v) => content("time", v)}
            />
            <Field
              label="Tempat"
              required
              value={c.location}
              onChange={(v) => content("location", v)}
            />
            {kind === "invitations" ? (
              <>
                <Field
                  label="Sifat"
                  value={c.nature}
                  onChange={(v) => content("nature", v)}
                />
                <Field
                  label="Lampiran"
                  value={c.attachmentNotice}
                  onChange={(v) => content("attachmentNotice", v)}
                />
              </>
            ) : null}
            {kind === "records" ? (
              <Field
                label="Jenis Berita Acara (bebas, mis. Serah Terima)"
                value={c.recordType}
                onChange={(v) => content("recordType", v)}
              />
            ) : null}
          </div>
          <div className="mt-4 space-y-4">
            <Text
              label="Acara / Agenda"
              value={c.agenda}
              onChange={(v) => content("agenda", v)}
            />
            {kind === "minutes" ? (
              <>
                <Field
                  label="Referensi Undangan"
                  value={c.invitationReference}
                  onChange={(v) => content("invitationReference", v)}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <EmployeeSelect
                    label="Pimpinan Rapat / Kegiatan"
                    value={c.chairEmployeeId ?? 0}
                    existing={c.chairEmployeeId ?? 0}
                    employees={employees}
                    onChange={(v) => content("chairEmployeeId", v)}
                  />
                  <EmployeeSelect
                    label="Notulis"
                    value={c.notetakerEmployeeId ?? 0}
                    existing={c.notetakerEmployeeId ?? 0}
                    employees={employees}
                    onChange={(v) => content("notetakerEmployeeId", v)}
                  />
                </div>
              </>
            ) : null}
          </div>
        </SectionCard>
        {kind === "invitations" ? (
          <>
            <Parties
              title="Penerima Undangan"
              value={c.recipients}
              employees={employees}
              onChange={(v) => content("recipients", v)}
            />
            <SectionCard title="Isi Undangan">
              <div className="space-y-4">
                <Text
                  label="Pembuka"
                  value={c.preamble}
                  onChange={(v) => content("preamble", v)}
                />
                <Text
                  label="Penutup"
                  value={c.closing}
                  onChange={(v) => content("closing", v)}
                />
                <Text
                  label="Tembusan (satu per baris)"
                  value={c.copies.join("\n")}
                  onChange={(v) => content("copies", v.split("\n"))}
                />
              </div>
            </SectionCard>
          </>
        ) : null}
        {kind !== "invitations" ? (
          <Participants
            value={p.participants}
            employees={employees}
            receipts={kind === "receipts"}
            onChange={(v) => set((old) => ({ ...old, participants: v }))}
          />
        ) : null}
        {["minutes", "records", "reports"].includes(kind) ? (
          <SectionCard
            title="Isi Dokumen"
            description={
              kind === "reports"
                ? "Template awal diisi dari kegiatan, peserta, notula, berita acara, dan caption dokumentasi. Narasi dapat disesuaikan sebelum Final."
                : undefined
            }
          >
            <div className="space-y-4">
              {c.sections.map((s, i) => (
                <div key={i} className="space-y-3 rounded border p-4">
                  <Field
                    label="Judul Bagian"
                    value={s.title}
                    onChange={(v) =>
                      content(
                        "sections",
                        c.sections.map((old, n) =>
                          n === i ? { ...old, title: v } : old,
                        ),
                      )
                    }
                  />
                  <Text
                    label={s.title || "Narasi"}
                    value={s.body}
                    onChange={(v) =>
                      content(
                        "sections",
                        c.sections.map((old, n) =>
                          n === i ? { ...old, body: v } : old,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      content(
                        "sections",
                        c.sections.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Hapus Bagian
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  content("sections", [
                    ...c.sections,
                    {
                      key: `custom-${Date.now()}`,
                      title: "Bagian Tambahan",
                      body: "",
                    },
                  ])
                }
              >
                Tambah Bagian
              </Button>
            </div>
          </SectionCard>
        ) : null}
        {kind === "minutes" ? (
          <SectionCard title="Tindak Lanjut">
            <div className="space-y-4">
              {c.followUps.map((f, i) => {
                const setFollow = (v: Partial<typeof f>) =>
                  content(
                    "followUps",
                    c.followUps.map((old, n) =>
                      n === i ? { ...old, ...v } : old,
                    ),
                  );
                return (
                  <div key={i} className="space-y-4 rounded border p-4">
                    <Text
                      label="Uraian"
                      required
                      value={f.description}
                      onChange={(v) => setFollow({ description: v })}
                    />
                    <PartyEditor
                      party={f.responsible}
                      employees={employees}
                      onChange={(v) => setFollow({ responsible: v })}
                    />
                    <Field
                      label="Target Waktu"
                      type="date"
                      value={f.dueDate}
                      onChange={(v) => setFollow({ dueDate: v })}
                    />
                    <Select
                      label="Status"
                      value={f.status}
                      items={["Belum Dilaksanakan", "Proses", "Selesai"].map(
                        (v) => ({ value: v, label: v }),
                      )}
                      onChange={(v) => setFollow({ status: v })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        content(
                          "followUps",
                          c.followUps.filter((_, n) => n !== i),
                        )
                      }
                    >
                      Hapus Tindak Lanjut
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  content("followUps", [
                    ...c.followUps,
                    {
                      description: "",
                      responsible: blankParty(),
                      dueDate: "",
                      status: "Belum Dilaksanakan",
                    },
                  ])
                }
              >
                Tambah Tindak Lanjut
              </Button>
            </div>
          </SectionCard>
        ) : null}
        {kind === "records" ? (
          <SectionCard title="Barang / Bantuan (untuk Serah Terima, Distribusi, dll.)">
            <div className="space-y-3">
              {c.goods.map((g, i) => (
                <div
                  key={i}
                  className="grid gap-3 rounded border p-4 md:grid-cols-4"
                >
                  {(
                    [
                      ["name", "Barang / Bantuan"],
                      ["quantity", "Jumlah"],
                      ["unit", "Satuan"],
                      ["condition", "Kondisi"],
                    ] as const
                  ).map(([k, label]) => (
                    <Field
                      key={k}
                      label={label}
                      type={k === "quantity" ? "number" : "text"}
                      value={String(g[k])}
                      onChange={(v) =>
                        content(
                          "goods",
                          c.goods.map((old, n) =>
                            n === i
                              ? {
                                  ...old,
                                  [k]: k === "quantity" ? Number(v) : v,
                                }
                              : old,
                          ),
                        )
                      }
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      content(
                        "goods",
                        c.goods.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Hapus Barang
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  content("goods", [
                    ...c.goods,
                    { name: "", quantity: 0, unit: "", condition: "" },
                  ])
                }
              >
                Tambah Barang
              </Button>
            </div>
          </SectionCard>
        ) : null}
        <Parties
          title="Penandatangan"
          value={c.signers}
          employees={employees}
          onChange={(v) => content("signers", v)}
        />
        <div className="flex gap-3">
          <Button type="submit">
            {saving ? "Menyimpan..." : "Simpan Draft"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Kembali
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
