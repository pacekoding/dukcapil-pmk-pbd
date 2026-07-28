"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, FileCheck2, Save } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  defaultPdfPreviewSettings,
  klasifikasiSuratLabels,
} from "@/lib/sisurat/mock-surat";
import {
  formatRadiogramAAA,
  formatRadiogramBlock,
  normalizeRadiogramText,
} from "@/lib/sisurat/radiogram-format";
import { createRadiogramDraft } from "@/lib/sisurat/radiogram-template";
import {
  isNomorSuratDuplicate,
  upsertSuratKeluar,
} from "@/lib/sisurat/surat-store";
import type {
  KlasifikasiSurat,
  RadiogramSectionAAA,
  RadiogramSurat,
  RadiogramTextMode,
} from "@/types/surat";

import { RadiogramDocumentPreview } from "./radiogram-document-preview";

type RadiogramFormProps = {
  initialData?: RadiogramSurat;
};

type ValidationErrors = Record<string, string>;

export function RadiogramForm({ initialData }: RadiogramFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<RadiogramSurat>(() =>
    normalizeInitialData(initialData),
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const preview = useMemo(() => buildPreviewRadiogram(form), [form]);

  const update = <K extends keyof RadiogramSurat>(
    key: K,
    value: RadiogramSurat[K],
  ) => {
    setMessage("");
    setErrors({});
    setDirty(true);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateAAA = <K extends keyof RadiogramSectionAAA>(
    key: K,
    value: RadiogramSectionAAA[K],
  ) => {
    setMessage("");
    setErrors({});
    setDirty(true);
    setForm((current) => ({
      ...current,
      sectionAAA: {
        ...current.sectionAAA!,
        [key]: value,
      },
    }));
  };

  const convertToRadiogram = () => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      textMode: "radiogram",
      amanat: normalizeRadiogramText(current.amanat ?? ""),
      sectionBBB: normalizeRadiogramText(current.sectionBBB ?? ""),
      sectionCCC: normalizeRadiogramText(current.sectionCCC ?? ""),
      sectionDDD: normalizeRadiogramText(current.sectionDDD ?? ""),
      sectionAAA: {
        ...current.sectionAAA!,
        agenda: normalizeRadiogramText(current.sectionAAA?.agenda ?? ""),
        hari: normalizeRadiogramText(current.sectionAAA?.hari ?? ""),
        tanggal: normalizeRadiogramText(current.sectionAAA?.tanggal ?? ""),
        waktuMulai: normalizeRadiogramText(current.sectionAAA?.waktuMulai ?? ""),
        waktuSelesai: normalizeRadiogramText(
          current.sectionAAA?.waktuSelesai ?? "",
        ),
        tempat: normalizeRadiogramText(current.sectionAAA?.tempat ?? ""),
      },
    }));
  };

  const save = (status: "draft" | "selesai") => {
    const validation = validateRadiogram(form, status);
    if (Object.keys(validation).length) {
      setErrors(validation);
      setMessage("Periksa kembali field yang ditandai sebelum menyelesaikan surat.");
      return;
    }

    const timestamp = new Date().toISOString();
    const next = buildPreviewRadiogram({
      ...form,
      status,
      updatedAt: timestamp,
      diubahOleh: form.diubahOleh || "Operator SISURAT",
    });

    upsertSuratKeluar(next);
    setDirty(false);
    setMessage(
      status === "draft"
        ? "Draft radiogram tersimpan."
        : "Radiogram tersimpan sebagai Selesai.",
    );
    router.push("/sisurat/surat-keluar");
  };

  const saveAndPreview = () => {
    const timestamp = new Date().toISOString();
    const next = buildPreviewRadiogram({
      ...form,
      status: "draft",
      updatedAt: timestamp,
    });
    upsertSuratKeluar(next);
    setDirty(false);
    router.push(`/sisurat/surat-keluar/${next.id}`);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(520px,1.04fr)]">
      <form className="space-y-6">
        {message ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            {message}
          </div>
        ) : null}

        <SectionCard title="1. Informasi Surat">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Jenis Surat" required>
              <Input value="Radiogram" readOnly className="h-10 bg-slate-50" />
            </Field>
            <Field label="Klasifikasi" error={errors.klasifikasi} required>
              <Select
                value={form.klasifikasi}
                onValueChange={(value) =>
                  update("klasifikasi", value as KlasifikasiSurat)
                }
              >
                <SelectTrigger className="h-10 w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(klasifikasiSuratLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nomor Surat" error={errors.nomorSurat}>
              <Input
                value={form.nomorSurat}
                onChange={(event) => update("nomorSurat", event.target.value)}
                placeholder="Wajib diisi saat Selesai"
              />
            </Field>
            <Field label="Tanggal Surat" error={errors.tanggalSurat} required>
              <Input
                type="date"
                value={form.tanggalSurat ?? form.tanggalPembuatan}
                onChange={(event) => {
                  update("tanggalSurat", event.target.value);
                  update("tanggalPembuatan", event.target.value);
                }}
              />
            </Field>
            <Field label="Perihal atau Ringkasan">
              <Input
                value={form.perihal}
                onChange={(event) => update("perihal", event.target.value)}
              />
            </Field>
            <Field label="Register No">
              <Input
                value={form.registerNo ?? ""}
                onChange={(event) => update("registerNo", event.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="2. Tujuan Surat">
          <div className="grid gap-4">
            <Field label="Dari" required>
              <Input
                value={form.dari}
                onChange={(event) => update("dari", event.target.value)}
              />
            </Field>
            <Field label="Tujuan" error={errors.tujuan} required>
              <Textarea
                value={form.untuk}
                onChange={(event) => {
                  update("untuk", event.target.value);
                  update("tujuan", event.target.value);
                }}
                className="min-h-28 bg-white leading-6"
              />
            </Field>
            <Field label="Tembusan">
              <Textarea
                value={form.tembusan.join("\n")}
                onChange={(event) =>
                  update(
                    "tembusan",
                    event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
                className="min-h-20 bg-white leading-6"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="3. Dasar dan Pembukaan"
          description="Gunakan mode teks normal untuk menulis biasa, lalu konversi saat siap memfinalkan format radiogram."
          action={
            <Button type="button" variant="outline" onClick={convertToRadiogram}>
              Konversi ke Format Radiogram
            </Button>
          }
        >
          <div className="mb-4 max-w-xs">
            <Label className="mb-2 block text-sm font-bold text-pbd-navy">
              Mode Teks
            </Label>
            <Select
              value={form.textMode ?? "normal"}
              onValueChange={(value) =>
                update("textMode", value as RadiogramTextMode)
              }
            >
              <SelectTrigger className="h-10 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Teks Normal</SelectItem>
                <SelectItem value="radiogram">Format Radiogram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Isi Pembukaan" error={errors.amanat} required>
            <Textarea
              value={form.amanat ?? ""}
              onChange={(event) => update("amanat", event.target.value)}
              className="min-h-44 bg-white leading-6"
            />
          </Field>
        </SectionCard>

        <SectionCard title="4. Bagian AAA">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Judul atau Agenda Kegiatan" error={errors.aaa} required>
              <Textarea
                value={form.sectionAAA?.agenda ?? ""}
                onChange={(event) => updateAAA("agenda", event.target.value)}
                className="min-h-24 bg-white leading-6 md:col-span-2"
              />
            </Field>
            <Field label="Hari" required>
              <Input
                value={form.sectionAAA?.hari ?? ""}
                onChange={(event) => updateAAA("hari", event.target.value)}
              />
            </Field>
            <Field label="Tanggal" required>
              <Input
                value={form.sectionAAA?.tanggal ?? ""}
                onChange={(event) => updateAAA("tanggal", event.target.value)}
              />
            </Field>
            <Field label="Waktu Mulai" required>
              <Input
                value={form.sectionAAA?.waktuMulai ?? ""}
                onChange={(event) => updateAAA("waktuMulai", event.target.value)}
              />
            </Field>
            <Field label="Waktu Selesai" required>
              <Input
                value={form.sectionAAA?.waktuSelesai ?? ""}
                onChange={(event) => updateAAA("waktuSelesai", event.target.value)}
              />
            </Field>
            <Field label="Tempat" required>
              <Textarea
                value={form.sectionAAA?.tempat ?? ""}
                onChange={(event) => updateAAA("tempat", event.target.value)}
                className="min-h-20 bg-white leading-6"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="5. Bagian BBB">
          <Field label="Isi BBB" error={errors.sectionBBB} required>
            <Textarea
              value={form.sectionBBB ?? ""}
              onChange={(event) => update("sectionBBB", event.target.value)}
              className="min-h-32 bg-white leading-6"
            />
          </Field>
        </SectionCard>

        <SectionCard title="6. Bagian CCC">
          <Field label="Isi CCC" error={errors.sectionCCC} required>
            <Textarea
              value={form.sectionCCC ?? ""}
              onChange={(event) => update("sectionCCC", event.target.value)}
              className="min-h-24 bg-white leading-6"
            />
          </Field>
        </SectionCard>

        <SectionCard title="7. Bagian DDD">
          <Field label="Isi DDD" error={errors.sectionDDD} required>
            <Textarea
              value={form.sectionDDD ?? ""}
              onChange={(event) => update("sectionDDD", event.target.value)}
              className="min-h-20 bg-white leading-6"
            />
          </Field>
        </SectionCard>

        <SectionCard title="8. Penandatangan">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Atas Nama">
              <Input
                value={form.pengirimAtasNama ?? ""}
                onChange={(event) =>
                  update("pengirimAtasNama", event.target.value)
                }
              />
            </Field>
            <Field label="Jabatan" error={errors.jabatanPengirim} required>
              <Input
                value={form.jabatanPengirim ?? ""}
                onChange={(event) => update("jabatanPengirim", event.target.value)}
              />
            </Field>
            <Field label="Nama Pejabat" error={errors.namaPenandatangan} required>
              <Input
                value={form.namaPenandatangan ?? ""}
                onChange={(event) =>
                  update("namaPenandatangan", event.target.value)
                }
              />
            </Field>
            <Field label="Pangkat">
              <Input
                value={form.pangkatPenandatangan ?? ""}
                onChange={(event) =>
                  update("pangkatPenandatangan", event.target.value)
                }
              />
            </Field>
            <Field label="NIP">
              <Input
                value={form.nipPenandatangan ?? ""}
                onChange={(event) =>
                  update("nipPenandatangan", event.target.value)
                }
              />
            </Field>
            <Field label="Kode Jabatan">
              <Input
                value={form.kodeJabatan ?? ""}
                onChange={(event) => update("kodeJabatan", event.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,35,80,0.08)] backdrop-blur sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
          <div className="flex flex-wrap justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/sisurat/surat-keluar">
                <ArrowLeft className="h-4 w-4" />
                Batal
              </Link>
            </Button>
            <Button type="button" variant="outline" onClick={() => save("draft")}>
              <Save className="h-4 w-4" />
              Simpan Draft
            </Button>
            <Button type="button" variant="outline" onClick={saveAndPreview}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              type="button"
              className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              onClick={() => save("selesai")}
            >
              <FileCheck2 className="h-4 w-4" />
              Simpan dan Selesaikan
            </Button>
          </div>
        </div>
      </form>

      <section className="space-y-3 xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-bold text-pbd-navy">9. Preview</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Preview diperbarui langsung dari isi form.
          </p>
        </div>
        <RadiogramDocumentPreview
          radiogram={preview}
          settings={defaultPdfPreviewSettings}
        />
      </section>
    </div>
  );
}

function normalizeInitialData(initialData?: RadiogramSurat) {
  return createRadiogramDraft({
    ...(initialData ?? {}),
    sectionAAA:
      initialData?.sectionAAA ?? createRadiogramDraft().sectionAAA,
    sectionBBB:
      initialData?.sectionBBB ??
      initialData?.isiBerita.find((block) => block.kode === "BBB")?.isi,
    sectionCCC:
      initialData?.sectionCCC ??
      initialData?.isiBerita.find((block) => block.kode === "CCC")?.isi,
    sectionDDD:
      initialData?.sectionDDD ??
      initialData?.isiBerita.find((block) => block.kode === "DDD")?.isi,
  });
}

function buildPreviewRadiogram(form: RadiogramSurat): RadiogramSurat {
  const aaa = form.sectionAAA!;
  const useRadiogramMode = form.textMode === "radiogram";
  const text = (value?: string) =>
    useRadiogramMode ? normalizeRadiogramText(value ?? "") : value ?? "";

  return {
    ...form,
    tujuan: form.untuk,
    tanggalPembuatan: form.tanggalSurat || form.tanggalPembuatan,
    amanat: text(form.amanat),
    isiBerita: [
      {
        id: "aaa",
        kode: "AAA",
        isi: formatRadiogramAAA(useRadiogramMode ? normalizeAAA(aaa) : aaa),
      },
      {
        id: "bbb",
        kode: "BBB",
        isi: formatRadiogramBlock("BBB", text(form.sectionBBB)),
      },
      {
        id: "ccc",
        kode: "CCC",
        isi: formatRadiogramBlock("CCC", text(form.sectionCCC)),
      },
      {
        id: "ddd",
        kode: "DDD",
        isi: formatRadiogramBlock("DDD", text(form.sectionDDD)),
      },
    ],
  };
}

function normalizeAAA(section: RadiogramSectionAAA): RadiogramSectionAAA {
  return {
    agenda: normalizeRadiogramText(section.agenda),
    hari: normalizeRadiogramText(section.hari),
    tanggal: normalizeRadiogramText(section.tanggal),
    waktuMulai: normalizeRadiogramText(section.waktuMulai),
    waktuSelesai: normalizeRadiogramText(section.waktuSelesai),
    tempat: normalizeRadiogramText(section.tempat),
  };
}

function validateRadiogram(form: RadiogramSurat, status: "draft" | "selesai") {
  const errors: ValidationErrors = {};

  if (status === "draft") {
    return errors;
  }
  if (!form.klasifikasi) {
    errors.klasifikasi = "Klasifikasi wajib diisi.";
  }
  if (!form.nomorSurat.trim()) {
    errors.nomorSurat = "Nomor surat wajib diisi saat status Selesai.";
  } else if (isNomorSuratDuplicate(form.nomorSurat, form.id)) {
    errors.nomorSurat = "Nomor surat sudah digunakan.";
  }
  if (!form.tanggalSurat?.trim()) {
    errors.tanggalSurat = "Tanggal surat wajib diisi.";
  }
  if (!form.untuk.trim()) {
    errors.tujuan = "Tujuan wajib diisi.";
  }
  if (!form.amanat?.trim()) {
    errors.amanat = "Isi pembukaan wajib diisi.";
  }
  if (!form.sectionAAA?.agenda.trim() || !form.sectionAAA.tempat.trim()) {
    errors.aaa = "Agenda dan tempat wajib diisi.";
  }
  if (!form.sectionBBB?.trim()) {
    errors.sectionBBB = "Bagian BBB wajib diisi.";
  }
  if (!form.sectionCCC?.trim()) {
    errors.sectionCCC = "Bagian CCC wajib diisi.";
  }
  if (!form.sectionDDD?.trim()) {
    errors.sectionDDD = "Bagian DDD wajib diisi.";
  }
  if (!form.namaPenandatangan?.trim()) {
    errors.namaPenandatangan = "Nama penandatangan wajib diisi.";
  }
  if (!form.jabatanPengirim?.trim()) {
    errors.jabatanPengirim = "Jabatan penandatangan wajib diisi.";
  }

  return errors;
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-pbd-navy">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
