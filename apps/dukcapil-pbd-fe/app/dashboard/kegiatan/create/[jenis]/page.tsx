"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import {
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createKegiatan as createKegiatanRequest,
  getKegiatanList,
  type KegiatanListResponse,
} from "@/lib/api/kegiatan";
import {
  getKegiatanFormConfig,
  type KegiatanSpecificField,
} from "@/lib/kegiatan/kegiatan-form-config";
import type {
  KegiatanBidang,
  KegiatanPayload,
  KegiatanStatus,
} from "@/types/kegiatan";

type BaseFormState = {
  nama: string;
  tanggal: string;
  lokasi: string;
  status: KegiatanStatus;
  bidang: KegiatanBidang;
  penanggungJawab: string;
  peserta: string;
  deskripsi: string;
};

const DEFAULT_OPTIONS: KegiatanListResponse["options"] = {
  bidangOptions: [],
  jenisOptions: [],
  statusFilterOptions: [],
  statusFormOptions: [],
};

const getStatusCompletionValue = (status: KegiatanStatus) => {
  if (status === "Selesai") {
    return 100;
  }

  if (status === "Draft") {
    return 0;
  }

  return 25;
};

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
};

export default function CreateKegiatanJenisPage() {
  const params = useParams<{ jenis: string }>();
  const router = useRouter();
  const config = getKegiatanFormConfig(params.jenis);

  const [options, setOptions] =
    useState<KegiatanListResponse["options"]>(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [specificValues, setSpecificValues] = useState<Record<string, string>>(
    {},
  );
  const [formData, setFormData] = useState<BaseFormState>(() => ({
    nama: "",
    tanggal: "",
    lokasi: "",
    status: "Draft",
    bidang: config?.bidangDefault ?? "Dukcapil",
    penanggungJawab: "",
    peserta: "0",
    deskripsi: "",
  }));

  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const data = await getKegiatanList();

        if (mounted) {
          setOptions(data.options);
          setPageError("");
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setPageError("Data pilihan form kegiatan gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const requiredFields = useMemo(() => {
    if (!config) {
      return [];
    }

    return config.sections.flatMap((section) =>
      section.fields.filter((field) => field.required),
    );
  }, [config]);

  const updateBaseField = <Key extends keyof BaseFormState>(
    key: Key,
    value: BaseFormState[Key],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSpecificField = (key: string, value: string) => {
    setSpecificValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.nama.trim()) {
      return "Nama kegiatan wajib diisi.";
    }

    if (!formData.tanggal.trim()) {
      return "Tanggal kegiatan wajib diisi.";
    }

    if (!formData.lokasi.trim()) {
      return "Lokasi kegiatan wajib diisi.";
    }

    if (!formData.penanggungJawab.trim()) {
      return "Penanggung jawab wajib diisi.";
    }

    const emptyRequiredField = requiredFields.find(
      (field) => !specificValues[field.name]?.trim(),
    );

    if (emptyRequiredField) {
      return `${emptyRequiredField.label} wajib diisi.`;
    }

    return "";
  };

  const buildDescription = () => {
    if (!config) {
      return formData.deskripsi.trim();
    }

    const specificDetail = config.sections
      .map((section) => {
        const rows = section.fields.map((field) => {
          const value = specificValues[field.name]?.trim() || "-";

          return `- ${field.label}: ${value}`;
        });

        return `${section.title}\n${rows.join("\n")}`;
      })
      .join("\n\n");

    return [
      formData.deskripsi.trim() || config.description,
      "",
      `Detail ${config.jenis}:`,
      specificDetail,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!config) {
      return;
    }

    const errorMessage = validateForm();

    if (errorMessage) {
      setFormError(errorMessage);
      return;
    }

    const payload: KegiatanPayload = {
      nama: formData.nama.trim(),
      jenis: config.jenis,
      tanggal: formData.tanggal.trim(),
      lokasi: formData.lokasi.trim(),
      status: formData.status,
      bidang: formData.bidang,
      penanggungJawab: formData.penanggungJawab.trim(),
      peserta: Math.max(0, toNumber(formData.peserta)),
      progres: getStatusCompletionValue(formData.status),
      deskripsi: buildDescription(),
    };

    try {
      setSaving(true);
      setFormError("");
      await createKegiatanRequest(payload);
      router.push("/dashboard/kegiatan");
    } catch (error) {
      console.error(error);
      setFormError("Kegiatan gagal disimpan. Coba ulangi beberapa saat lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <main className="space-y-6">
        <Card className="rounded-lg border border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-slate-950">
              Jenis kegiatan tidak ditemukan
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pilih ulang jenis kegiatan dari halaman buat kegiatan.
            </p>
            <Button asChild className="mt-5 h-11 rounded-lg px-5">
              <Link href="/dashboard/kegiatan/create">Pilih Jenis Kegiatan</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-sm"
          >
            <Link
              href="/dashboard/kegiatan"
              className="font-medium text-slate-500 transition hover:text-pbd-blue"
            >
              Kegiatan
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <Link
              href="/dashboard/kegiatan/create"
              className="font-medium text-slate-500 transition hover:text-pbd-blue"
            >
              Buat Kegiatan
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-semibold text-slate-900">{config.jenis}</span>
          </nav>

          <Badge className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
            {config.badge}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {config.title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {config.description}
          </p>
        </div>
      </section>

      {pageError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {pageError}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="rounded-lg border border-slate-200 shadow-sm">
          <CardContent className="p-5 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {formError ? (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{formError}</p>
                </div>
              ) : null}

              <FormSection
                eyebrow="Data Umum"
                title="Informasi Kegiatan"
                description="Data dasar yang digunakan untuk daftar kegiatan, dokumen, dan dashboard."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Nama Kegiatan" className="md:col-span-2">
                    <Input
                      value={formData.nama}
                      onChange={(event) =>
                        updateBaseField("nama", event.target.value)
                      }
                      placeholder={`Contoh: ${config.jenis} Administrasi Kependudukan`}
                      disabled={saving || loading}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Bidang">
                    <Select
                      value={formData.bidang}
                      disabled={saving || loading}
                      onValueChange={(value) =>
                        updateBaseField("bidang", value as KegiatanBidang)
                      }
                    >
                      <SelectTrigger className="h-11 rounded-lg border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.bidangOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Status">
                    <Select
                      value={formData.status}
                      disabled={saving || loading}
                      onValueChange={(value) =>
                        updateBaseField("status", value as KegiatanStatus)
                      }
                    >
                      <SelectTrigger className="h-11 rounded-lg border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.statusFormOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Tanggal">
                    <Input
                      type="date"
                      value={formData.tanggal}
                      onChange={(event) =>
                        updateBaseField("tanggal", event.target.value)
                      }
                      disabled={saving || loading}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label={config.pesertaLabel}>
                    <Input
                      type="number"
                      min={0}
                      value={formData.peserta}
                      onChange={(event) =>
                        updateBaseField("peserta", event.target.value)
                      }
                      placeholder={config.pesertaPlaceholder}
                      disabled={saving || loading}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Lokasi" className="md:col-span-2">
                    <Input
                      value={formData.lokasi}
                      onChange={(event) =>
                        updateBaseField("lokasi", event.target.value)
                      }
                      placeholder="Contoh: Aula Dinas Dukcapil & PMK Papua Barat Daya"
                      disabled={saving || loading}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField
                    label="Penanggung Jawab"
                    className="md:col-span-2"
                  >
                    <Input
                      value={formData.penanggungJawab}
                      onChange={(event) =>
                        updateBaseField("penanggungJawab", event.target.value)
                      }
                      placeholder="Nama jabatan atau unit penanggung jawab"
                      disabled={saving || loading}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Ringkasan" className="md:col-span-2">
                    <Textarea
                      value={formData.deskripsi}
                      onChange={(event) =>
                        updateBaseField("deskripsi", event.target.value)
                      }
                      placeholder="Ringkasan tujuan dan konteks kegiatan"
                      disabled={saving || loading}
                      className="min-h-[120px] rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>
              </FormSection>

              {config.sections.map((section) => (
                <div key={section.title}>
                  <Separator className="mb-8" />
                  <FormSection
                    eyebrow={config.jenis}
                    title={section.title}
                    description={section.description}
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      {section.fields.map((field) => (
                        <SpecificInput
                          key={field.name}
                          field={field}
                          value={specificValues[field.name] ?? ""}
                          disabled={saving || loading}
                          onChange={(value) =>
                            updateSpecificField(field.name, value)
                          }
                        />
                      ))}
                    </div>
                  </FormSection>
                </div>
              ))}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-lg border-slate-200 px-5"
                >
                  <Link href="/dashboard/kegiatan">Batal</Link>
                </Button>

                <Button
                  type="submit"
                  disabled={saving || loading}
                  className="h-11 rounded-lg px-5"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan Kegiatan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <Card className="rounded-lg border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Data yang Dibutuhkan
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Daftar input dibuat berdasarkan kebutuhan umum KAK/TOR dan
                    karakter jenis kegiatan.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {config.requiredData.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-950">
                Catatan Referensi
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Semua form tetap menghasilkan payload kegiatan standar:
                nama, jenis, tanggal, lokasi, bidang, status, peserta,
                penanggung jawab, progres, dan deskripsi terstruktur.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function SpecificInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: KegiatanSpecificField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <FormField
      label={`${field.label}${field.required ? " *" : ""}`}
      className={field.type === "textarea" ? "md:col-span-2" : undefined}
    >
      {field.type === "textarea" ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className="min-h-[128px] rounded-lg border-slate-200"
        />
      ) : (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className="h-11 rounded-lg border-slate-200"
        />
      )}
    </FormField>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      {children}
    </section>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  );
}
