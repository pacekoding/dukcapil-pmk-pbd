/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Newspaper } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/website/breadcrumb";
import { ContentContainer } from "@/components/website/content-container";
import { FilterBar } from "@/components/website/filter-bar";
import { PageHeader } from "@/components/website/page-header";
import { Pagination } from "@/components/website/pagination";
import { SearchInput } from "@/components/website/search-input";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/state";
import { normalizeBackendAssetUrl } from "@/lib/api/assets";
import { getWebsiteInformasi } from "@/lib/api/optima-info";
import type {
  OptimaInfoPublicFilters,
  OptimaInfoPublicListResponse,
} from "@/types/optima-info";

import { formatOptimaInfoDate } from "./article-viewer";

const emptyResponse: OptimaInfoPublicListResponse = {
  items: [],
  featured: [],
  meta: { page: 1, limit: 9, total: 0, totalPages: 1 },
  categories: [],
};

export function OptimaInfoPublicListPage() {
  const [response, setResponse] =
    useState<OptimaInfoPublicListResponse>(emptyResponse);
  const [filters, setFilters] = useState<OptimaInfoPublicFilters>({
    search: "",
    category: "",
    page: 1,
    limit: 9,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getWebsiteInformasi(filters);
        if (mounted) {
          setResponse(data);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setResponse(emptyResponse);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Informasi publik gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [filters]);

  return (
    <div className="bg-slate-50">
      <Breadcrumb items={[{ label: "Informasi" }]} />
      <PageHeader
        eyebrow="Informasi Publik"
        title="Informasi Dukcapil Papua Barat Daya"
        description="Pengumuman, agenda layanan, dokumentasi kegiatan, dan informasi resmi lainnya yang sudah diterbitkan melalui OPTIMA INFO."
        icon={Newspaper}
      />

      <ContentContainer className="space-y-8 py-8 sm:py-10">
        <FilterBar>
          <div className="grid w-full gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <SearchInput
              value={filters.search ?? ""}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  search: value,
                  page: 1,
                }))
              }
              placeholder="Cari judul atau isi informasi..."
            />
            <select
              value={filters.category ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value,
                  page: 1,
                }))
              }
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Semua kategori</option>
              {response.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </FilterBar>

        {loading ? (
          <LoadingState rows={4} message="Memuat informasi publik..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {response.featured.length > 0 ? (
              <section>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700">
                      Sorotan
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-pbd-navy">
                      Informasi Unggulan
                    </h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {response.featured.map((item) => (
                    <Link
                      key={`featured-${item.id}`}
                      href={`/informasi/${item.slug}`}
                      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_46px_rgba(15,35,80,0.07)] transition hover:-translate-y-0.5 hover:border-sky-200"
                    >
                      <ArticleThumbnail
                        src={item.thumbnailUrl}
                        slug={item.slug}
                        alt={item.title || "Thumbnail informasi"}
                        className="h-64"
                        iconClassName="h-10 w-10"
                      />
                      <div className="space-y-4 p-6">
                        <Badge className="bg-emerald-50 text-emerald-700">
                          Unggulan
                        </Badge>
                        <h3 className="text-2xl font-bold text-pbd-navy">
                          {item.title || "Tanpa judul"}
                        </h3>
                        <p className="text-sm leading-7 text-slate-600">
                          {item.summary}
                        </p>
                        <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
                          <span>{item.category || "Informasi"}</span>
                          <span>{formatOptimaInfoDate(item.publishedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700">
                    Terbaru
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-pbd-navy">
                    Daftar Informasi
                  </h2>
                </div>
              </div>
              {response.items.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    icon={Newspaper}
                    title="Belum ada informasi yang tayang"
                    description="Informasi akan muncul di sini setelah diterbitkan dan masih berada dalam periode tayang."
                  />
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {response.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/informasi/${item.slug}`}
                        className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,35,80,0.06)] transition hover:-translate-y-0.5 hover:border-sky-200"
                      >
                        <ArticleThumbnail
                          src={item.thumbnailUrl}
                          slug={item.slug}
                          alt={item.title || "Thumbnail informasi"}
                          className="h-48"
                          iconClassName="h-8 w-8"
                        />
                        <div className="space-y-3 p-5">
                          <Badge className="bg-sky-50 text-sky-700">
                            {item.category || "Informasi"}
                          </Badge>
                          <h3 className="line-clamp-2 text-lg font-bold text-pbd-navy">
                            {item.title || "Tanpa judul"}
                          </h3>
                          <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                            {item.summary}
                          </p>
                          <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
                            <span>
                              {formatOptimaInfoDate(item.publishedAt)}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-pbd-blue">
                              Baca
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Pagination
                      page={response.meta.page}
                      pageSize={response.meta.limit}
                      total={response.meta.total}
                      onPageChange={(page) =>
                        setFilters((current) => ({
                          ...current,
                          page,
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </ContentContainer>
    </div>
  );
}

function ArticleThumbnail({
  src,
  slug,
  alt,
  className,
  iconClassName,
}: {
  src: string;
  slug?: string;
  alt: string;
  className: string;
  iconClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveOptimaInfoThumbnailUrl(src, slug);

  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={`${className} w-full object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex ${className} items-center justify-center bg-slate-100 text-slate-400`}
    >
      <Newspaper className={iconClassName} />
    </div>
  );
}

function resolveOptimaInfoThumbnailUrl(value: string, slug?: string) {
  const trimmed = normalizeBackendAssetUrl(value ?? "");
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/api/backend/")) {
    return trimmed;
  }

  if (
    trimmed.startsWith("/uploads/optima-info/") ||
    trimmed.startsWith("uploads/optima-info/")
  ) {
    return slug
      ? `/api/backend/website/informasi/${encodeURIComponent(slug)}/thumbnail`
      : trimmed.startsWith("/")
        ? trimmed
        : `/${trimmed}`;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
