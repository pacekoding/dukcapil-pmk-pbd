"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Images,
  Info,
  Maximize,
  MonitorPlay,
  Pause,
  Play,
  RotateCcw,
  Save,
  Settings,
  Share2,
  UploadCloud,
  Volume2,
  type LucideIcon,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

type OptimaInfoType = "video" | "carousel" | "document";

type OptimaInfoForm = {
  type: OptimaInfoType;
  title: string;
  description: string;
  publishedDate: string;
  publisher: string;
  category: string;
  periodStart: string;
  periodEnd: string;
  videoUrl: string;
  imageUrls: string;
  documentUrl: string;
  documentPages: string;
};

const storageKey = "optima-info-dashboard-draft";

const defaultForm: OptimaInfoForm = {
  type: "video",
  title: "Sosialisasi Program Adminduk Go Digital",
  description:
    "Dinas Dukcapil dan PMK Provinsi Papua Barat Daya melaksanakan sosialisasi program Administrasi Kependudukan berbasis digital kepada masyarakat dan perangkat kampung.",
  publishedDate: "2026-06-12",
  publisher: "Dinas Dukcapil dan PMK",
  category: "Program & Kegiatan",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-30",
  videoUrl: "https://example.go.id/video/adminduk-go-digital.mp4",
  imageUrls:
    "https://example.go.id/galeri/pelayanan-keliling-1.jpg\nhttps://example.go.id/galeri/pelayanan-keliling-2.jpg\nhttps://example.go.id/galeri/pelayanan-keliling-3.jpg",
  documentUrl: "https://example.go.id/dokumen/laporan-kinerja-juni-2026.pdf",
  documentPages: "12",
};

const infoTypes: Array<{
  value: OptimaInfoType;
  title: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    value: "video",
    title: "Video Player",
    label: "Video",
    description: "Untuk sosialisasi, sambutan, atau video program.",
    icon: MonitorPlay,
    tone: "blue",
  },
  {
    value: "carousel",
    title: "Image Carousel",
    label: "Galeri Foto",
    description: "Untuk dokumentasi kegiatan dengan beberapa foto.",
    icon: Images,
    tone: "green",
  },
  {
    value: "document",
    title: "PDF / Text Viewer",
    label: "Dokumen",
    description: "Untuk laporan, publikasi, atau dokumen periodik.",
    icon: FileText,
    tone: "purple",
  },
];

const typeStyles: Record<
  OptimaInfoType,
  {
    badge: string;
    soft: string;
    text: string;
    button: string;
    line: string;
  }
> = {
  video: {
    badge: "bg-blue-50 text-blue-700",
    soft: "bg-blue-50",
    text: "text-blue-700",
    button: "bg-blue-700 hover:bg-blue-800",
    line: "border-blue-100 bg-blue-50/70 text-blue-700",
  },
  carousel: {
    badge: "bg-emerald-50 text-emerald-700",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
    button: "bg-emerald-700 hover:bg-emerald-800",
    line: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
  },
  document: {
    badge: "bg-violet-50 text-violet-700",
    soft: "bg-violet-50",
    text: "text-violet-700",
    button: "bg-violet-700 hover:bg-violet-800",
    line: "border-violet-100 bg-violet-50/70 text-violet-700",
  },
};

export default function OptimaInfoDashboardPage() {
  const [form, setForm] = useState<OptimaInfoForm>(defaultForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadDraft = async () => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        await Promise.resolve();

        if (mounted && stored) {
          setForm({ ...defaultForm, ...JSON.parse(stored) });
        }
      } catch (storageError) {
        console.error(storageError);
      }
    };

    void loadDraft();

    return () => {
      mounted = false;
    };
  }, []);

  const activeType = useMemo(
    () => infoTypes.find((item) => item.value === form.type) ?? infoTypes[0],
    [form.type],
  );
  const periodLabel = `${formatDate(form.periodStart)} - ${formatDate(
    form.periodEnd,
  )}`;
  const imageList = form.imageUrls
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const updateField = <Key extends keyof OptimaInfoForm>(
    key: Key,
    value: OptimaInfoForm[Key],
  ) => {
    setMessage(null);
    setError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetDraft = () => {
    setForm(defaultForm);
    setMessage("Draft dikembalikan ke contoh awal.");
    setError(null);
  };

  const saveDraft = () => {
    if (!form.title.trim()) {
      setError("Judul informasi wajib diisi.");
      setMessage(null);
      return;
    }
    if (!form.periodStart || !form.periodEnd) {
      setError("Periode tayang wajib diisi lengkap.");
      setMessage(null);
      return;
    }
    if (form.periodStart > form.periodEnd) {
      setError("Tanggal mulai periode tidak boleh melewati tanggal selesai.");
      setMessage(null);
      return;
    }

    setSaving(true);
    window.localStorage.setItem(storageKey, JSON.stringify(form));
    window.setTimeout(() => {
      setSaving(false);
      setError(null);
      setMessage("Konfigurasi OPTIMA-INFO berhasil disimpan sebagai draft.");
    }, 350);
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={MonitorPlay}
        eyebrow="OPTIMA-INFO"
        title="OPTIMA-INFO"
        description="Kelola satu informasi aktif untuk satu periode tayang. Pilih tipe informasi, lengkapi konten, lalu cek pratinjau halaman publik tanpa menu."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-slate-100 px-4 text-sm font-bold text-pbd-navy">
              1 informasi aktif
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
            >
              {periodLabel}
            </Badge>
          </div>
        }
        aside={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg"
              onClick={resetDraft}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
              disabled={saving}
              onClick={saveDraft}
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Draft"}
            </Button>
          </div>
        }
      />

      {message ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {infoTypes.map((item) => {
          const Icon = item.icon;
          const active = form.type === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => updateField("type", item.value)}
              className={cn(
                "app-surface rounded-lg p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,35,80,0.09)]",
                active && "border-pbd-navy ring-2 ring-pbd-navy/10",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    typeStyles[item.value].soft,
                    typeStyles[item.value].text,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {active ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : null}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                Design {infoTypes.indexOf(item) + 1}
              </p>
              <h2 className="mt-1 text-lg font-bold text-pbd-navy">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </button>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(560px,1.3fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Konten Informasi"
            description="Konten ini menjadi satu-satunya informasi yang tampil selama periode aktif."
          >
            <div className="grid gap-4">
              <Field label="Jenis Informasi" htmlFor="info-type">
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    updateField("type", value as OptimaInfoType)
                  }
                >
                  <SelectTrigger id="info-type" className="h-11">
                    <SelectValue placeholder="Pilih jenis informasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {infoTypes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Judul" htmlFor="info-title">
                <Input
                  id="info-title"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="h-11"
                />
              </Field>

              <Field label="Deskripsi" htmlFor="info-description">
                <Textarea
                  id="info-description"
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className="min-h-28 rounded-md bg-white"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal Publikasi" htmlFor="published-date">
                  <Input
                    id="published-date"
                    type="date"
                    value={form.publishedDate}
                    onChange={(event) =>
                      updateField("publishedDate", event.target.value)
                    }
                    className="h-11"
                  />
                </Field>
                <Field label="Kategori" htmlFor="category">
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    className="h-11"
                  />
                </Field>
              </div>

              <Field label="Dipublikasikan oleh" htmlFor="publisher">
                <Input
                  id="publisher"
                  value={form.publisher}
                  onChange={(event) =>
                    updateField("publisher", event.target.value)
                  }
                  className="h-11"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Periode Tayang"
            description="Satu periode hanya memiliki satu jenis informasi aktif."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mulai" htmlFor="period-start">
                <Input
                  id="period-start"
                  type="date"
                  value={form.periodStart}
                  onChange={(event) =>
                    updateField("periodStart", event.target.value)
                  }
                  className="h-11"
                />
              </Field>
              <Field label="Selesai" htmlFor="period-end">
                <Input
                  id="period-end"
                  type="date"
                  value={form.periodEnd}
                  onChange={(event) =>
                    updateField("periodEnd", event.target.value)
                  }
                  className="h-11"
                />
              </Field>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-pbd-blue" />
                <p>
                  Saat tipe informasi diganti, preview dan kebutuhan media ikut
                  berubah. Periode tetap sama sehingga hanya satu tampilan aktif
                  untuk rentang waktu tersebut.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={`Media ${activeType.label}`}
            description="Masukkan sumber media sesuai jenis informasi yang dipilih."
          >
            <MediaFields
              form={form}
              imageCount={imageList.length}
              updateField={updateField}
            />
          </SectionCard>
        </div>

        <SectionCard
          title="Pratinjau Halaman Publik"
          description="Tampilan informasi tanpa menu website."
          action={
            <Badge className={cn("h-8 rounded-full px-4", typeStyles[form.type].badge)}>
              <Eye className="h-3.5 w-3.5" />
              {activeType.title}
            </Badge>
          }
          className="xl:sticky xl:top-6 xl:self-start"
          contentClassName="bg-slate-100 p-4 sm:p-5"
        >
          <InfoPreview
            form={form}
            periodLabel={periodLabel}
            imageCount={imageList.length}
          />
        </SectionCard>
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="font-bold text-pbd-navy">
        {label}
      </Label>
      {children}
    </div>
  );
}

function MediaFields({
  form,
  imageCount,
  updateField,
}: {
  form: OptimaInfoForm;
  imageCount: number;
  updateField: <Key extends keyof OptimaInfoForm>(
    key: Key,
    value: OptimaInfoForm[Key],
  ) => void;
}) {
  if (form.type === "video") {
    return (
      <div className="space-y-4">
        <Field label="URL Video" htmlFor="video-url">
          <Input
            id="video-url"
            value={form.videoUrl}
            onChange={(event) => updateField("videoUrl", event.target.value)}
            className="h-11"
            placeholder="https://..."
          />
        </Field>
        <UploadHint text="Format yang disiapkan untuk website: MP4 atau embed video internal." />
      </div>
    );
  }

  if (form.type === "carousel") {
    return (
      <div className="space-y-4">
        <Field label="URL Gambar" htmlFor="image-urls">
          <Textarea
            id="image-urls"
            value={form.imageUrls}
            onChange={(event) => updateField("imageUrls", event.target.value)}
            className="min-h-32 rounded-md bg-white"
            placeholder="Satu URL gambar per baris"
          />
        </Field>
        <UploadHint text={`${imageCount} gambar siap masuk carousel. Gunakan minimal 3 gambar untuk thumbnail yang rapi.`} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="URL Dokumen" htmlFor="document-url">
        <Input
          id="document-url"
          value={form.documentUrl}
          onChange={(event) => updateField("documentUrl", event.target.value)}
          className="h-11"
          placeholder="https://..."
        />
      </Field>
      <Field label="Jumlah Halaman" htmlFor="document-pages">
        <Input
          id="document-pages"
          type="number"
          min="1"
          value={form.documentPages}
          onChange={(event) => updateField("documentPages", event.target.value)}
          className="h-11"
        />
      </Field>
      <UploadHint text="Dokumen akan tampil dalam viewer dan dapat diunduh oleh pengunjung." />
    </div>
  );
}

function UploadHint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
      <UploadCloud className="mt-0.5 h-4 w-4 shrink-0 text-pbd-blue" />
      <p>{text}</p>
    </div>
  );
}

function InfoPreview({
  form,
  periodLabel,
  imageCount,
}: {
  form: OptimaInfoForm;
  periodLabel: string;
  imageCount: number;
}) {
  const style = typeStyles[form.type];
  const label =
    infoTypes.find((item) => item.value === form.type)?.label ?? "Informasi";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <Image src="/logo-pbd.png" alt="Logo PBD" fill className="object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold leading-5 text-slate-950">
              Dinas Dukcapil & PMK
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Provinsi Papua Barat Daya
            </p>
          </div>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600">
          <CalendarDays className="h-4 w-4" />
          {periodLabel}
        </div>
      </header>

      <div className="grid gap-6 p-4 lg:grid-cols-[0.78fr_1fr] lg:p-7">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn("h-7 rounded-md px-3 font-bold uppercase", style.badge)}>
              {label}
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              {formatDate(form.publishedDate)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-950 lg:text-3xl">
            {form.title || "Judul informasi"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {form.description || "Deskripsi informasi akan tampil di sini."}
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <MetaItem icon={CalendarDays} label="Tanggal" value={formatDate(form.publishedDate)} />
            <MetaItem icon={Settings} label="Dipublikasikan oleh" value={form.publisher} />
            <MetaItem icon={Info} label="Kategori" value={form.category} />
          </div>

          <Button
            type="button"
            className={cn("mt-5 h-10 rounded-md text-white", style.button)}
          >
            {form.type === "document" ? (
              <Download className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {form.type === "document" ? "Unduh Dokumen" : "Bagikan Informasi"}
          </Button>
        </article>

        <div className="min-w-0">
          {form.type === "video" ? <VideoPreview title={form.title} /> : null}
          {form.type === "carousel" ? (
            <CarouselPreview imageCount={imageCount} />
          ) : null}
          {form.type === "document" ? (
            <DocumentPreview pages={form.documentPages} />
          ) : null}
        </div>
      </div>

      <footer className={cn("mx-4 mb-4 flex flex-col gap-2 rounded-md border px-4 py-3 text-xs font-medium sm:flex-row sm:items-center sm:justify-between lg:mx-7 lg:mb-6", style.line)}>
        <span>Informasi ini berlaku untuk periode {periodLabel}</span>
        <span>Terakhir diperbarui: {formatDate(form.publishedDate)}</span>
      </footer>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[18px_104px_minmax(0,1fr)] items-start gap-3 text-slate-600">
      <Icon className="mt-0.5 h-4 w-4 text-pbd-blue" />
      <span>{label}</span>
      <span className="font-semibold text-slate-700">{value || "-"}</span>
    </div>
  );
}

function VideoPreview({ title }: { title: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-sm">
      <div className="relative flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(59,130,246,0.35),transparent_32%),linear-gradient(135deg,#081632,#0f2f6d_58%,#071020)]">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle,#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25">
            <Image src="/logo-pbd.png" alt="Logo PBD" width={42} height={42} className="object-contain" />
          </div>
          <p className="mx-auto max-w-sm px-5 text-xl font-extrabold leading-tight">
            {title || "Judul video"}
          </p>
          <p className="mt-3 text-sm font-medium text-white/80">
            Dinas Dukcapil & PMK Provinsi Papua Barat Daya
          </p>
        </div>
      </div>
      <div className="space-y-2 px-4 pb-4">
        <div className="h-1 rounded-full bg-white/25">
          <div className="h-1 w-[42%] rounded-full bg-white" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Play className="h-4 w-4 fill-white" />
            <Volume2 className="h-4 w-4" />
            <span>0:02 / 04:35</span>
          </div>
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4" />
            <Maximize className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CarouselPreview({ imageCount }: { imageCount: number }) {
  const thumbnails = Array.from({ length: Math.max(imageCount, 5) }).slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#dbeafe,#f0fdf4)]">
        <div className="aspect-video p-6">
          <div className="flex h-full items-end rounded-lg bg-[linear-gradient(145deg,#ffffff_0%,#e0f2fe_48%,#bbf7d0_100%)] p-5 shadow-inner">
            <div className="rounded-lg bg-white/85 px-4 py-3 shadow-sm">
              <p className="text-sm font-extrabold text-slate-900">
                Pelayanan keliling administrasi kependudukan
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Galeri kegiatan lapangan
              </p>
            </div>
          </div>
        </div>
        <CarouselButton side="left" />
        <CarouselButton side="right" />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {thumbnails.map((_, index) => (
          <div
            key={index}
            className={cn(
              "aspect-[4/3] rounded-md border bg-[linear-gradient(135deg,#e0f2fe,#dcfce7)]",
              index === 0 ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function CarouselButton({ side }: { side: "left" | "right" }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      className={cn(
        "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm",
        side === "left" ? "left-3" : "right-3",
      )}
      aria-label={side === "left" ? "Sebelumnya" : "Berikutnya"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function DocumentPreview({ pages }: { pages: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800 text-white shadow-sm">
      <div className="flex h-10 items-center justify-between bg-slate-900 px-4 text-xs">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4" />
          <span>1 / {pages || "12"}</span>
          <span className="text-white/50">|</span>
          <span>100%</span>
        </div>
        <div className="flex items-center gap-3">
          <Download className="h-4 w-4" />
          <Pause className="h-4 w-4" />
          <Settings className="h-4 w-4" />
        </div>
      </div>
      <div className="grid min-h-[320px] grid-cols-[88px_minmax(0,1fr)]">
        <aside className="space-y-4 border-r border-slate-700 bg-slate-900/70 p-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={cn(
                "mx-auto aspect-[3/4] w-12 rounded-sm bg-white",
                item === 1 && "ring-2 ring-blue-400",
              )}
            />
          ))}
        </aside>
        <div className="bg-slate-200 p-6">
          <div className="mx-auto flex aspect-[3/4] max-h-[420px] max-w-[290px] flex-col bg-white p-8 text-slate-950 shadow">
            <Image src="/logo-pbd.png" alt="Logo PBD" width={52} height={52} className="object-contain" />
            <p className="mt-6 text-[10px] font-bold uppercase leading-4">
              Dinas Kependudukan dan Pencatatan Sipil serta Pemberdayaan
              Masyarakat dan Kampung
            </p>
            <h3 className="mt-8 text-2xl font-extrabold leading-tight">
              LAPORAN KINERJA BULANAN
            </h3>
            <p className="mt-4 text-lg font-bold text-violet-700">Juni 2026</p>
            <div className="mt-auto h-16 rounded-t-full bg-violet-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
