/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentContainer } from "@/components/website/content-container";
import {
  normalizeBackendAssetUrl,
  withInlineBackendAssetDisposition,
} from "@/lib/api/assets";
import type { OptimaInfoDetail } from "@/types/optima-info";

type ArticleViewerProps = {
  article: OptimaInfoDetail;
  backHref: string;
  backLabel: string;
  mode?: "public" | "preview";
};

export function ArticleViewer({
  article,
  backHref,
  backLabel,
  mode = "public",
}: ArticleViewerProps) {
  const [pdfAvailability, setPdfAvailability] = useState<
    "checking" | "ready" | "unavailable"
  >("checking");
  const thumbnailUrl = resolveOptimaInfoMediaUrl(article, "thumbnail", mode);
  const attachmentDownloadUrl = resolveOptimaInfoMediaUrl(article, "attachment", mode);
  const attachmentPreviewUrl = withInlineBackendAssetDisposition(attachmentDownloadUrl);
  const hasAttachment = Boolean(attachmentDownloadUrl);
  const isPdf = isPdfAttachment(article);
  const isImage = isImageAttachment(article);
  const contentImages = (article.contentImages ?? []).map((image) => ({
    ...image,
    resolvedUrl:
      mode === "public"
        ? image.publicPreviewUrl || image.previewUrl
        : image.previewUrl,
  }));

  return (
    <div className="bg-slate-50">
      {mode === "preview" ? (
        <div className="border-y border-blue-200 bg-blue-50">
          <ContentContainer className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-blue-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
                  Mode Preview
                </p>
                <p className="text-sm text-slate-600">
                  Tampilan ini memakai viewer yang sama dengan halaman publik.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="h-10 rounded-lg">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </Button>
          </ContentContainer>
        </div>
      ) : null}

      <ContentContainer className="py-8 sm:py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0 space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,35,80,0.07)] sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="h-8 rounded-full bg-sky-50 px-4 text-sm font-bold text-sky-700">
                {article.category || "Informasi"}
              </Badge>
              {article.isFeatured ? (
                <Badge className="h-8 rounded-full bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
                  Unggulan
                </Badge>
              ) : null}
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-pbd-navy sm:text-4xl">
                {article.title || "Informasi tanpa judul"}
              </h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                {article.publishedAt ? (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Dipublikasikan {formatOptimaInfoDate(article.publishedAt)}
                  </span>
                ) : null}
                {article.authorName ? <span>Penulis: {article.authorName}</span> : null}
                {article.publishedByName ? (
                  <span>Dipublikasikan oleh: {article.publishedByName}</span>
                ) : null}
              </div>
            </div>

            {article.summary ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base leading-8 text-slate-600">
                {article.summary}
              </p>
            ) : null}

            {thumbnailUrl ? (
              <SafeImage
                src={thumbnailUrl}
                alt={article.title || "Thumbnail informasi"}
                className="h-auto max-h-[460px] w-full rounded-[24px] border border-slate-200 object-cover"
              />
            ) : null}

            <div
              className="prose prose-slate max-w-none prose-headings:text-pbd-navy prose-a:text-pbd-blue prose-strong:text-pbd-navy"
              dangerouslySetInnerHTML={{ __html: article.content || "<p>-</p>" }}
            />

            {contentImages.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {contentImages.map((image) => (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <SafeImage
                      src={normalizeBackendAssetUrl(image.resolvedUrl)}
                      alt={image.originalFilename}
                      className="aspect-[16/10] w-full object-cover"
                    />
                    <figcaption className="truncate px-3 py-2 text-xs text-slate-500">
                      {image.originalFilename}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}

            {article.externalUrl ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                <p className="text-sm font-semibold text-pbd-navy">Tautan eksternal</p>
                <Button asChild variant="link" className="mt-1 h-auto p-0 text-pbd-blue">
                  <a href={article.externalUrl} target="_blank" rel="noreferrer">
                    Buka sumber terkait
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : null}
          </article>

          <aside className="space-y-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,35,80,0.07)]">
              <h2 className="text-lg font-bold text-pbd-navy">Informasi File</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <MetaRow label="Status" value={article.status} />
                <MetaRow label="Dibuat" value={formatOptimaInfoDate(article.createdAt)} />
                <MetaRow label="Diperbarui" value={formatOptimaInfoDate(article.updatedAt)} />
              </dl>
            </div>

            {hasAttachment ? (
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,35,80,0.07)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-pbd-navy">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-pbd-navy">Lampiran</h2>
                    <p className="text-sm text-slate-500">
                      {article.attachmentOriginalName || "File pendukung informasi"}
                    </p>
                  </div>
                </div>
                {isPdf && pdfAvailability !== "ready" ? (
                  <Button
                    type="button"
                    disabled
                    className="mt-4 h-11 w-full rounded-xl bg-pbd-navy text-white"
                  >
                    <Download className="h-4 w-4" />
                    {pdfAvailability === "checking"
                      ? "Memeriksa Lampiran"
                      : "File Tidak Tersedia"}
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="mt-4 h-11 w-full rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
                  >
                    <a href={attachmentDownloadUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Unduh Lampiran
                    </a>
                  </Button>
                )}
                {isPdf ? (
                  <PdfAttachmentPreview
                    src={attachmentPreviewUrl}
                    title={article.attachmentOriginalName || article.title}
                    onStateChange={setPdfAvailability}
                  />
                ) : null}
                {isImage ? (
                  <SafeImage
                    src={attachmentDownloadUrl}
                    alt={article.attachmentOriginalName || article.title}
                    className="mt-4 h-auto max-h-[420px] w-full rounded-2xl border border-slate-200 object-cover"
                  />
                ) : null}
              </div>
            ) : null}

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,35,80,0.07)]">
              <Button asChild variant="outline" className="h-11 w-full rounded-xl">
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
            </div>
          </aside>
        </div>

        {article.related.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-pbd-navy">Informasi Terkait</h2>
                <p className="text-sm text-slate-500">
                  Informasi lain yang masih relevan dengan topik ini.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {article.related.map((item) => (
                <Link
                  key={item.id}
                  href={`/informasi/${item.slug}`}
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,35,80,0.06)] transition hover:-translate-y-0.5 hover:border-sky-200"
                >
                  {item.thumbnailUrl ? (
                    <SafeImage
                      src={normalizeBackendAssetUrl(item.thumbnailUrl)}
                      alt={item.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400">
                      <Newspaper className="h-8 w-8" />
                    </div>
                  )}
                  <div className="space-y-3 p-5">
                    <Badge className="bg-sky-50 text-sky-700">{item.category || "Informasi"}</Badge>
                    <h3 className="line-clamp-2 text-lg font-bold text-pbd-navy">
                      {item.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                      {item.summary}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {formatOptimaInfoDate(item.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </ContentContainer>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-pbd-navy">{value || "-"}</dd>
    </div>
  );
}

function PdfAttachmentPreview({
  src,
  title,
  onStateChange,
}: {
  src: string;
  title: string;
  onStateChange: (state: "checking" | "ready" | "unavailable") => void;
}) {
  const [result, setResult] = useState<{
    src: string;
    state: "ready" | "unavailable";
  } | null>(null);
  const state = src
    ? result?.src === src
      ? result.state
      : "checking"
    : "unavailable";

  useEffect(() => {
    if (!src) {
      onStateChange("unavailable");
      return;
    }

    let mounted = true;
    onStateChange("checking");

    const verify = async () => {
      try {
        const response = await fetch(src, {
          cache: "no-store",
          headers: {
            Range: "bytes=0-0",
          },
        });
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        if (mounted) {
          const nextState =
            response.ok && contentType.includes("application/pdf")
              ? "ready"
              : "unavailable";
          setResult({
            src,
            state: nextState,
          });
          onStateChange(nextState);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setResult({ src, state: "unavailable" });
          onStateChange("unavailable");
        }
      }
    };

    void verify();

    return () => {
      mounted = false;
    };
  }, [onStateChange, src]);

  if (state === "checking") {
    return (
      <div className="mt-4 h-[420px] w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    );
  }

  if (state === "unavailable") {
    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
        File lampiran tidak ditemukan di penyimpanan. Unggah ulang PDF dari editor.
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      className="mt-4 h-[420px] w-full rounded-2xl border border-slate-200 bg-white"
    />
  );
}

function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function resolveOptimaInfoMediaUrl(
  article: OptimaInfoDetail,
  kind: "thumbnail" | "attachment",
  mode: "public" | "preview",
) {
  const provided = normalizeBackendAssetUrl(
    kind === "thumbnail" ? article.thumbnailUrl : article.attachmentDownloadUrl,
  );
  const originalName =
    kind === "thumbnail" ? article.thumbnailOriginalName : article.attachmentOriginalName;
  const endpoint = kind === "thumbnail" ? "thumbnail" : "attachment";

  if (provided && !isOptimaInfoStoragePath(provided)) {
    return provided;
  }

  if (
    (originalName || isOptimaInfoStoragePath(provided)) &&
    mode === "preview" &&
    article.id > 0
  ) {
    return `/api/backend/optima-info/${article.id}/${endpoint}`;
  }

  if ((originalName || isOptimaInfoStoragePath(provided)) && article.slug) {
    return `/api/backend/website/informasi/${encodeURIComponent(article.slug)}/${endpoint}`;
  }

  if (article.id > 0 && mode === "preview") {
    return `/api/backend/optima-info/${article.id}/${endpoint}`;
  }

  return "";
}

function isOptimaInfoStoragePath(value: string) {
  return /^\/?uploads\/(?:optima-info|op_info)\//.test(value);
}

function isPdfAttachment(article: OptimaInfoDetail) {
  return (
    article.attachmentMimeType.toLowerCase() === "application/pdf" ||
    article.attachmentOriginalName.toLowerCase().endsWith(".pdf")
  );
}

function isImageAttachment(article: OptimaInfoDetail) {
  const mimeType = article.attachmentMimeType.toLowerCase();
  const originalName = article.attachmentOriginalName.toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    originalName.endsWith(".png") ||
    originalName.endsWith(".jpg") ||
    originalName.endsWith(".jpeg") ||
    originalName.endsWith(".webp")
  );
}

export function formatOptimaInfoDate(value: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(date);
}
