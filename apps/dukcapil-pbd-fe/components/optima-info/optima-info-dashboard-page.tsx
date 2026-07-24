/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Eye,
  FilePlus2,
  FileText,
  Pencil,
  RotateCcw,
  SearchX,
  Send,
  Trash2,
} from "lucide-react";

import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { Pagination } from "@/components/dashboard/pagination";
import { PageHero } from "@/components/dashboard/page-hero";
import { SearchInput } from "@/components/dashboard/search-input";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SuccessState,
} from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  archiveOptimaInfoArticle,
  deleteOptimaInfoArticle,
  getOptimaInfoArticles,
  publishOptimaInfoArticle,
  unpublishOptimaInfoArticle,
} from "@/lib/api/optima-info";
import type {
  OptimaInfoAdminListResponse,
  OptimaInfoFilters,
  OptimaInfoSummary,
} from "@/types/optima-info";

import { formatOptimaInfoDate } from "./article-viewer";

const emptyResponse: OptimaInfoAdminListResponse = {
  items: [],
  meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
  stats: { total: 0, draft: 0, published: 0, archived: 0 },
  categories: [],
};

type ActionState =
  | {
      type: "publish" | "unpublish" | "archive" | "delete";
      item: OptimaInfoSummary;
    }
  | null;

export function OptimaInfoDashboardPage() {
  const [response, setResponse] = useState<OptimaInfoAdminListResponse>(emptyResponse);
  const [filters, setFilters] = useState<OptimaInfoFilters>({
    search: "",
    category: "",
    status: "",
    year: "",
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getOptimaInfoArticles(filters);
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
              : "Dashboard OPTIMA INFO gagal dimuat.",
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

  const stats = useMemo(
    () => [
      {
        label: "Total Informasi",
        value: `${response.stats.total}`,
        description: "Seluruh draft, publikasi, dan arsip",
        icon: FileText,
        tone: "blue" as const,
      },
      {
        label: "Draft",
        value: `${response.stats.draft}`,
        description: "Informasi yang masih disiapkan",
        icon: Pencil,
        tone: "slate" as const,
      },
      {
        label: "Published",
        value: `${response.stats.published}`,
        description: "Sudah tampil di website publik",
        icon: Send,
        tone: "emerald" as const,
      },
      {
        label: "Archived",
        value: `${response.stats.archived}`,
        description: "Disimpan tanpa tampil publik",
        icon: Archive,
        tone: "indigo" as const,
      },
    ],
    [response.stats],
  );

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "",
      status: "",
      year: "",
      page: 1,
      limit: 10,
    });
  };

  const handleAction = async () => {
    if (!actionState) {
      return;
    }

    setActing(true);
    setError(null);
    setMessage(null);
    try {
      switch (actionState.type) {
        case "publish":
          await publishOptimaInfoArticle(actionState.item.id);
          setMessage(`"${actionState.item.title || "Informasi"}" berhasil diterbitkan.`);
          break;
        case "unpublish":
          await unpublishOptimaInfoArticle(actionState.item.id);
          setMessage(`Publikasi "${actionState.item.title || "Informasi"}" berhasil dibatalkan.`);
          break;
        case "archive":
          await archiveOptimaInfoArticle(actionState.item.id);
          setMessage(`"${actionState.item.title || "Informasi"}" berhasil diarsipkan.`);
          break;
        case "delete":
          await deleteOptimaInfoArticle(actionState.item.id);
          setMessage(`"${actionState.item.title || "Informasi"}" berhasil dihapus.`);
          break;
      }
      setActionState(null);
      setFilters((current) => ({ ...current }));
    } catch (actionError) {
      console.error(actionError);
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Aksi informasi gagal diproses.",
      );
    } finally {
      setActing(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/portal" className="hover:text-pbd-navy">
          Portal
        </Link>
        <span>/</span>
        <span className="font-medium text-pbd-navy">OPTIMA INFO</span>
      </div>

      <PageHero
        icon={FileText}
        eyebrow="OPTIMA INFO"
        title="Dashboard OPTIMA INFO"
        description="Kelola seluruh informasi Dukcapil yang tampil pada menu Informasi website, mulai dari draft, preview, publish, hingga arsip."
        meta={
          <Badge className="h-8 rounded-full bg-sky-50 px-4 text-sm font-bold text-sky-700">
            {response.meta.total} informasi
          </Badge>
        }
        aside={
          <Button
            asChild
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
          >
            <Link href="/optima-info/create">
              <FilePlus2 className="h-4 w-4" />
              Tambah Informasi
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            description={item.description}
            icon={item.icon}
            tone={item.tone}
          />
        ))}
      </section>

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      <SectionCard
        title="Pencarian dan Filter"
        description="Saring daftar informasi berdasarkan judul, kategori, status, dan tahun publikasi."
        action={
          <Button type="button" variant="outline" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Reset Filter
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SearchInput
            value={filters.search ?? ""}
            onChange={(value) =>
              setFilters((current) => ({ ...current, search: value, page: 1 }))
            }
            placeholder="Cari judul, kategori, atau penulis..."
            className="xl:col-span-2"
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
            className="h-11 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">Semua kategori</option>
            {response.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filters.status ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
                page: 1,
              }))
            }
            className="h-11 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">Semua status</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
          <input
            value={filters.year ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                year: event.target.value,
                page: 1,
              }))
            }
            inputMode="numeric"
            placeholder="Tahun publikasi"
            className="h-11 rounded-md border border-input bg-white px-3 text-sm"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Daftar Informasi"
        description="Preview, edit, publish, batalkan publikasi, arsipkan, atau hapus informasi dari satu dashboard."
        contentClassName="p-0"
      >
        {loading ? (
          <div className="p-5">
            <LoadingState rows={5} message="Memuat daftar informasi..." />
          </div>
        ) : response.items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={SearchX}
              title="Belum ada informasi"
              description="Tambahkan informasi pertama atau ubah filter pencarian."
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Publikasi</TableHead>
                    <TableHead>Diperbarui</TableHead>
                    <TableHead>Pengelola</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title || "Thumbnail informasi"}
                            className="h-14 w-20 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="space-y-1">
                          <p className="font-bold text-pbd-navy">
                            {item.title || "Tanpa judul"}
                          </p>
                          <p className="line-clamp-2 text-sm text-slate-500">
                            {item.summary || item.slug}
                          </p>
                          {item.isFeatured ? (
                            <Badge className="bg-emerald-50 text-emerald-700">
                              Unggulan
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>{formatOptimaInfoDate(item.publishedAt)}</TableCell>
                      <TableCell>{formatOptimaInfoDate(item.updatedAt)}</TableCell>
                      <TableCell>{item.authorName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <ActionButtons
                            item={item}
                            onAction={setActionState}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 p-5 md:hidden">
              {response.items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title || "Thumbnail informasi"}
                      className="h-44 w-full object-cover"
                    />
                  ) : null}
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      {item.isFeatured ? (
                        <Badge className="bg-emerald-50 text-emerald-700">
                          Unggulan
                        </Badge>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-pbd-navy">
                        {item.title || "Tanpa judul"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.summary || item.slug}
                      </p>
                    </div>
                    <dl className="grid gap-2 text-sm">
                      <MetaLine label="Kategori" value={item.category || "-"} />
                      <MetaLine label="Publikasi" value={formatOptimaInfoDate(item.publishedAt)} />
                      <MetaLine label="Diperbarui" value={formatOptimaInfoDate(item.updatedAt)} />
                      <MetaLine label="Pengelola" value={item.authorName || "-"} />
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <ActionButtons item={item} onAction={setActionState} />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-slate-200 p-5">
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
      </SectionCard>

      <ConfirmActionDialog
        open={Boolean(actionState)}
        title={dialogTitle(actionState)}
        description={dialogDescription(actionState)}
        confirmLabel={dialogConfirmLabel(actionState)}
        tone={actionState?.type === "delete" ? "destructive" : "default"}
        loading={acting}
        onOpenChange={(open) => {
          if (!open) {
            setActionState(null);
          }
        }}
        onConfirm={() => void handleAction()}
      />
    </main>
  );
}

function ActionButtons({
  item,
  onAction,
}: {
  item: OptimaInfoSummary;
  onAction: (value: ActionState) => void;
}) {
  return (
    <>
      <Button asChild size="icon-sm" variant="outline" title="Preview">
        <Link href={`/optima-info/preview/${item.id}`} target="_blank">
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild size="icon-sm" variant="outline" title="Edit">
        <Link href={`/optima-info/${item.id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      {item.status !== "Published" ? (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          title="Terbitkan"
          onClick={() => onAction({ type: "publish", item })}
        >
          <Send className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          title="Batalkan publikasi"
          onClick={() => onAction({ type: "unpublish", item })}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        title="Arsipkan"
        onClick={() => onAction({ type: "archive", item })}
      >
        <Archive className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        title="Hapus"
        onClick={() => onAction({ type: "delete", item })}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}

function StatusBadge({ status }: { status: OptimaInfoSummary["status"] }) {
  const styles =
    status === "Published"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Archived"
        ? "bg-indigo-50 text-indigo-700"
        : "bg-slate-100 text-slate-700";
  return <Badge className={styles}>{status}</Badge>;
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-pbd-navy">{value}</dd>
    </div>
  );
}

function dialogTitle(state: ActionState) {
  switch (state?.type) {
    case "publish":
      return "Terbitkan informasi?";
    case "unpublish":
      return "Batalkan publikasi?";
    case "archive":
      return "Arsipkan informasi?";
    case "delete":
      return "Hapus informasi?";
    default:
      return "Konfirmasi aksi";
  }
}

function dialogDescription(state: ActionState) {
  if (!state) {
    return "";
  }
  const title = state.item.title || "informasi ini";
  switch (state.type) {
    case "publish":
      return `Informasi "${title}" akan tampil pada menu Informasi website jika masih berada pada periode tayang aktif.`;
    case "unpublish":
      return `Informasi "${title}" akan dikembalikan menjadi Draft tanpa menghapus isinya.`;
    case "archive":
      return `Informasi "${title}" akan dipindahkan ke status Archived dan tidak lagi tampil di daftar publik.`;
    case "delete":
      return `Informasi "${title}" beserta thumbnail dan lampirannya akan dihapus permanen.`;
  }
}

function dialogConfirmLabel(state: ActionState) {
  switch (state?.type) {
    case "publish":
      return "Terbitkan";
    case "unpublish":
      return "Batalkan Publikasi";
    case "archive":
      return "Arsipkan";
    case "delete":
      return "Hapus";
    default:
      return "Lanjutkan";
  }
}
