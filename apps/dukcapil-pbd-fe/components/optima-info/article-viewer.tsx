/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
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
  const thumbnailUrl = resolveOptimaInfoMediaUrl(article, "thumbnail", mode);
  const attachmentDownloadUrl = resolveOptimaInfoMediaUrl(article, "attachment", mode);
  const attachmentPreviewUrl = withInlineBackendAssetDisposition(attachmentDownloadUrl);
  const hasAttachment = Boolean(attachmentDownloadUrl);
  const isPdf = isPdfAttachment(article);
  const showPdfBody = hasAttachment && isPdf;

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

      <ContentContainer className="max-w-5xl py-8 sm:py-10 lg:py-12">
        <article className="space-y-8">
          <header className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              <Button asChild variant="outline" className="h-10 w-full rounded-lg sm:w-auto">
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
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
          </header>

          {thumbnailUrl ? (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <SafeImage
                src={thumbnailUrl}
                alt={article.title || "Thumbnail informasi"}
                className="max-h-[520px] w-full object-cover"
              />
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-pbd-navy">Deskripsi</h2>
            <p className="mt-3 text-base leading-8 text-slate-600">
              {article.summary || "Tidak ada deskripsi."}
            </p>
            {showPdfBody ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-2">
                <PdfAttachmentPreview
                  src={attachmentPreviewUrl}
                  title={article.attachmentOriginalName || article.title}
                />
              </div>
              ) : null}
          </section>
        </article>
      </ContentContainer>
    </div>
  );
}

function PdfAttachmentPreview({
  src,
  title,
}: {
  src: string;
  title: string;
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
      return;
    }

    let mounted = true;

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
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setResult({ src, state: "unavailable" });
        }
      }
    };

    void verify();

    return () => {
      mounted = false;
    };
  }, [src]);

  if (state === "checking") {
    return (
      <div className="h-[70vh] min-h-[520px] w-full animate-pulse rounded-md bg-slate-200" />
    );
  }

  if (state === "unavailable") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
        File lampiran tidak ditemukan di penyimpanan. Unggah ulang PDF dari editor.
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      className="h-[70vh] min-h-[520px] w-full rounded-md border-0 bg-white"
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
