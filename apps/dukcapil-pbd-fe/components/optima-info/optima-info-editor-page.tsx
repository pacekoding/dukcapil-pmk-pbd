"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowLeft,
  Eye,
  FileText,
  ExternalLink,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";

import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  ErrorState,
  LoadingState,
  SuccessState,
} from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveOptimaInfoArticle,
  createOptimaInfoArticle,
  deleteOptimaInfoContentImage,
  deleteOptimaInfoArticle,
  getOptimaInfoDetail,
  publishOptimaInfoArticle,
  unpublishOptimaInfoArticle,
  updateOptimaInfoArticle,
  uploadOptimaInfoContentImage,
} from "@/lib/api/optima-info";
import {
  IMAGE_FILE_ACCEPT,
  PDF_FILE_ACCEPT,
  validateClientUpload,
} from "@/lib/api/file-policy";
import type { OptimaInfoDetail, SaveOptimaInfoPayload } from "@/types/optima-info";
import type { StoredFileMetadata } from "@/types/stored-file";

import { formatOptimaInfoDate } from "./article-viewer";

type EditorAction = "publish" | "unpublish" | "archive" | "delete" | null;

const initialForm: SaveOptimaInfoPayload = {
  title: "",
  slug: "",
  category: "",
  summary: "",
  content: "",
  externalUrl: "",
  displayOrder: 0,
  isFeatured: false,
  startDate: "",
  endDate: "",
  removeThumbnail: false,
  removeAttachment: false,
  thumbnail: null,
  attachment: null,
  intent: "save",
};

export function OptimaInfoEditorPage({ articleId }: { articleId?: number }) {
  const router = useRouter();
  const [article, setArticle] = useState<OptimaInfoDetail | null>(null);
  const [form, setForm] = useState<SaveOptimaInfoPayload>(initialForm);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [action, setAction] = useState<EditorAction>(null);
  const [contentImage, setContentImage] = useState<File | null>(null);
  const [contentImageInputKey, setContentImageInputKey] = useState(0);
  const [contentImageBusy, setContentImageBusy] = useState(false);
  const [contentImageToDelete, setContentImageToDelete] =
    useState<StoredFileMetadata | null>(null);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getOptimaInfoDetail(articleId);
        if (!mounted) {
          return;
        }
        setArticle(data);
        setForm(buildFormFromArticle(data));
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Informasi gagal dimuat.",
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
  }, [articleId]);

  const modeTitle = articleId ? "Edit Informasi" : "Tambah Informasi";
  const statusLabel = article?.status ?? "Draft";

  const canPreview = useMemo(
    () => Boolean(articleId || form.title.trim() || form.content.trim() || form.category.trim()),
    [articleId, form.category, form.content, form.title],
  );

  const onTitleChange = (value: string) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugTouched ? current.slug : slugifyClient(value),
    }));
  };

  const persist = async (intent: SaveOptimaInfoPayload["intent"]) => {
    const payload: SaveOptimaInfoPayload = {
      ...form,
      displayOrder: article?.displayOrder ?? form.displayOrder,
      isFeatured: article?.isFeatured ?? form.isFeatured,
      startDate: article?.startDate ?? form.startDate,
      endDate: article?.endDate ?? form.endDate,
      intent,
    };
    validateClientFiles(payload);

    const saved = articleId
      ? await updateOptimaInfoArticle(articleId, payload)
      : await createOptimaInfoArticle(payload);
    const latest = await getOptimaInfoDetail(saved.id);

    setArticle(latest);
    setForm(buildFormFromArticle(latest));
    if (!articleId) {
      router.replace(`/optima-info/${saved.id}/edit`);
    }
    return latest;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await persist("save");
      setMessage(
        saved.status === "Published"
          ? "Perubahan informasi berhasil disimpan."
          : "Draft informasi berhasil disimpan.",
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Informasi gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setError("Browser memblokir tab preview. Izinkan popup lalu coba lagi.");
      return;
    }
    previewWindow.document.write(
      "<!doctype html><title>Memuat Preview</title><body style='font-family:sans-serif;padding:24px'>Menyimpan draft dan membuka preview...</body>",
    );

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await persist("preview");
      setMessage("Draft terbaru berhasil disimpan. Preview dibuka pada tab baru.");
      previewWindow.location.href = `/optima-info/preview/${saved.id}`;
    } catch (previewError) {
      previewWindow.close();
      console.error(previewError);
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Preview informasi gagal dibuka.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!action) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (action === "publish") {
        const saved = await persist("publish");
        const published = await publishOptimaInfoArticle(saved.id);
        setArticle(published);
        setMessage(`"${published.title || "Informasi"}" berhasil diterbitkan.`);
      }
      if (action === "unpublish" && article) {
        const unpublished = await unpublishOptimaInfoArticle(article.id);
        setArticle(unpublished);
        setMessage(`Publikasi "${unpublished.title || "Informasi"}" berhasil dibatalkan.`);
      }
      if (action === "archive" && article) {
        const archived = await archiveOptimaInfoArticle(article.id);
        setArticle(archived);
        setMessage(`"${archived.title || "Informasi"}" berhasil diarsipkan.`);
      }
      if (action === "delete" && article) {
        await deleteOptimaInfoArticle(article.id);
        router.push("/optima-info/dashboard");
        router.refresh();
        return;
      }
      setAction(null);
    } catch (actionError) {
      console.error(actionError);
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Aksi informasi gagal diproses.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleContentImageUpload = async () => {
    if (!article || !contentImage) {
      return;
    }
    setContentImageBusy(true);
    setError(null);
    setMessage(null);
    try {
      validateClientUpload(contentImage, "image");
      await uploadOptimaInfoContentImage(article.id, contentImage);
      const latest = await getOptimaInfoDetail(article.id);
      setArticle(latest);
      setContentImage(null);
      setContentImageInputKey((current) => current + 1);
      setMessage("Gambar informasi berhasil diunggah.");
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gambar informasi gagal diunggah.",
      );
    } finally {
      setContentImageBusy(false);
    }
  };

  const handleContentImageDelete = async () => {
    if (!article || !contentImageToDelete) {
      return;
    }
    setContentImageBusy(true);
    setError(null);
    setMessage(null);
    try {
      await deleteOptimaInfoContentImage(article.id, contentImageToDelete.id);
      const latest = await getOptimaInfoDetail(article.id);
      setArticle(latest);
      setContentImageToDelete(null);
      setMessage("Gambar informasi berhasil dihapus.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gambar informasi gagal dihapus.",
      );
    } finally {
      setContentImageBusy(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/portal" className="hover:text-pbd-navy">
          Portal
        </Link>
        <span>/</span>
        <Link href="/optima-info/dashboard" className="hover:text-pbd-navy">
          OPTIMA INFO
        </Link>
        <span>/</span>
        <span className="font-medium text-pbd-navy">{modeTitle}</span>
      </div>

      <PageHero
        icon={FileText}
        eyebrow="OPTIMA INFO"
        title={modeTitle}
        description="Simpan sebagai Draft, buka Preview dengan viewer publik yang sama, lalu terbitkan ketika konten sudah siap."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-sky-50 px-4 text-sm font-bold text-sky-700">
              Status: {statusLabel}
            </Badge>
            {article?.publishedAt ? (
              <Badge className="h-8 rounded-full bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
                Publikasi: {formatOptimaInfoDate(article.publishedAt)}
              </Badge>
            ) : null}
          </div>
        }
        aside={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/optima-info/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              disabled={saving || loading || !canPreview}
              onClick={() => void handlePreview()}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              type="submit"
              form="optima-info-editor-form"
              className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
              disabled={saving || loading}
            >
              <Save className="h-4 w-4" />
              Simpan Draft
            </Button>
          </div>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      {loading ? (
        <SectionCard title="Memuat Informasi">
          <LoadingState rows={6} message="Mengambil detail informasi..." />
        </SectionCard>
      ) : (
        <>
          <form id="optima-info-editor-form" onSubmit={(event) => void handleSave(event)}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <SectionCard
                  title="Konten Utama"
                  description="Judul, slug, kategori, ringkasan, dan isi informasi."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Judul Informasi" className="md:col-span-2">
                      <Input
                        value={form.title}
                        onChange={(event) => onTitleChange(event.target.value)}
                        placeholder="Contoh: Jadwal pelayanan keliling Dukcapil"
                      />
                    </Field>
                    <Field label="Slug" hint="Otomatis dari judul, masih bisa diubah manual.">
                      <Input
                        value={form.slug}
                        onChange={(event) => {
                          setSlugTouched(true);
                          setForm((current) => ({ ...current, slug: slugifyClient(event.target.value) }));
                        }}
                        placeholder="jadwal-pelayanan-keliling-dukcapil"
                      />
                    </Field>
                    <Field label="Kategori Informasi">
                      <Input
                        value={form.category}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, category: event.target.value }))
                        }
                        placeholder="Contoh: Pengumuman"
                      />
                    </Field>
                    <Field label="Ringkasan" className="md:col-span-2">
                      <Textarea
                        value={form.summary}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, summary: event.target.value }))
                        }
                        placeholder="Tulis ringkasan singkat yang akan tampil di daftar informasi."
                        rows={4}
                      />
                    </Field>
                    <Field
                      label="Isi Informasi"
                      hint="HTML sederhana didukung. Konten akan disanitasi di backend."
                      className="md:col-span-2"
                    >
                      <Textarea
                        value={form.content}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, content: event.target.value }))
                        }
                        placeholder="<p>Tulis isi informasi...</p>"
                        rows={16}
                      />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Media dan Lampiran"
                  description="Tambahkan thumbnail, lampiran, atau tautan eksternal jika diperlukan."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Thumbnail / Gambar Sampul">
                      <Input
                        type="file"
                        accept={IMAGE_FILE_ACCEPT}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            removeThumbnail: false,
                            thumbnail: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                      {article?.thumbnailOriginalName ? (
                        <FileMeta
                          name={article.thumbnailOriginalName}
                          actionLabel="Hapus thumbnail saat simpan"
                          checked={form.removeThumbnail}
                          onCheckedChange={(checked) =>
                            setForm((current) => ({
                              ...current,
                              removeThumbnail: checked,
                              thumbnail: checked ? null : current.thumbnail,
                            }))
                          }
                        />
                      ) : null}
                    </Field>
                    <Field label="Lampiran">
                      <Input
                        type="file"
                        accept={PDF_FILE_ACCEPT}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            removeAttachment: false,
                            attachment: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                      {article?.attachmentOriginalName ? (
                        <FileMeta
                          name={article.attachmentOriginalName}
                          actionLabel="Hapus lampiran saat simpan"
                          checked={form.removeAttachment}
                          onCheckedChange={(checked) =>
                            setForm((current) => ({
                              ...current,
                              removeAttachment: checked,
                              attachment: checked ? null : current.attachment,
                            }))
                          }
                        />
                      ) : null}
                    </Field>
                    {article ? (
                      <div className="space-y-3 md:col-span-2">
                        <span className="text-sm font-bold text-pbd-navy">
                          Gambar Isi Informasi
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            key={contentImageInputKey}
                            type="file"
                            accept={IMAGE_FILE_ACCEPT}
                            onChange={(event) =>
                              setContentImage(event.target.files?.[0] ?? null)
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 shrink-0"
                            disabled={!contentImage || contentImageBusy}
                            onClick={() => void handleContentImageUpload()}
                          >
                            <Upload className="h-4 w-4" />
                            {contentImageBusy ? "Mengunggah..." : "Unggah Gambar"}
                          </Button>
                        </div>
                        {(article.contentImages ?? []).length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {article.contentImages.map((image) => (
                              <div
                                key={image.id}
                                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                              >
                                <div className="relative aspect-[16/9] bg-slate-100">
                                  <Image
                                    src={image.previewUrl}
                                    alt={image.originalFilename}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 320px"
                                    className="object-cover"
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="absolute right-2 top-2 h-8 w-8"
                                    aria-label={`Hapus ${image.originalFilename}`}
                                    title="Hapus gambar"
                                    disabled={contentImageBusy}
                                    onClick={() => setContentImageToDelete(image)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="truncate px-3 py-2 text-xs text-slate-600">
                                  {image.originalFilename}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <Field label="Tautan Eksternal">
                      <Input
                        value={form.externalUrl}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, externalUrl: event.target.value }))
                        }
                        placeholder="https://..."
                      />
                    </Field>
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard
                  title="Publikasi"
                  description="Simpan draft, terbitkan, batalkan publikasi, arsipkan, atau hapus."
                >
                  <div className="space-y-3">
                    <Button
                      type="button"
                      className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={saving || loading}
                      onClick={() => setAction(article?.status === "Published" ? "unpublish" : "publish")}
                    >
                      {article?.status === "Published" ? (
                        <>
                          <Upload className="h-4 w-4" />
                          Batalkan Publikasi
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Terbitkan Informasi
                        </>
                      )}
                    </Button>
                    {form.externalUrl ? (
                      <Button asChild type="button" variant="outline" className="h-11 w-full rounded-xl">
                        <a href={form.externalUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Buka Tautan Eksternal
                        </a>
                      </Button>
                    ) : null}
                    {article ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full rounded-xl"
                          disabled={saving || loading}
                          onClick={() => setAction("archive")}
                        >
                          <Archive className="h-4 w-4" />
                          Arsipkan
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full rounded-xl text-red-600 hover:text-red-700"
                          disabled={saving || loading}
                          onClick={() => setAction("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </Button>
                      </>
                    ) : null}
                  </div>
                </SectionCard>
              </div>
            </div>
          </form>

          <ConfirmActionDialog
            open={Boolean(action)}
            title={actionTitle(action)}
            description={actionDescription(action, article?.title || form.title)}
            confirmLabel={actionLabel(action)}
            tone={action === "delete" ? "destructive" : "default"}
            loading={saving}
            onOpenChange={(open) => {
              if (!open) {
                setAction(null);
              }
            }}
            onConfirm={() => void handleConfirmedAction()}
          />
          <ConfirmActionDialog
            open={Boolean(contentImageToDelete)}
            title="Hapus gambar informasi?"
            description={`Gambar "${contentImageToDelete?.originalFilename ?? ""}" akan dihapus dari informasi ini.`}
            confirmLabel="Hapus Gambar"
            tone="destructive"
            loading={contentImageBusy}
            onOpenChange={(open) => {
              if (!open) {
                setContentImageToDelete(null);
              }
            }}
            onConfirm={() => void handleContentImageDelete()}
          />
        </>
      )}
    </main>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-2 ${className ?? ""}`}>
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function FileMeta({
  name,
  actionLabel,
  checked,
  onCheckedChange,
}: {
  name: string;
  actionLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <p className="font-medium text-pbd-navy">{name}</p>
      <label className="flex items-center gap-3 text-slate-600">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="h-4 w-4"
        />
        {actionLabel}
      </label>
    </div>
  );
}

function validateClientFiles(payload: SaveOptimaInfoPayload) {
  if (payload.thumbnail) {
    validateClientUpload(payload.thumbnail, "image");
  }
  if (payload.attachment) {
    validateClientUpload(payload.attachment, "pdf");
  }
}

function buildFormFromArticle(article: OptimaInfoDetail): SaveOptimaInfoPayload {
  return {
    title: article.title,
    slug: article.slug,
    category: article.category,
    summary: article.summary,
    content: article.content,
    externalUrl: article.externalUrl,
    displayOrder: article.displayOrder,
    isFeatured: article.isFeatured,
    startDate: article.startDate,
    endDate: article.endDate,
    removeThumbnail: false,
    removeAttachment: false,
    thumbnail: null,
    attachment: null,
    intent: "save",
  };
}

function slugifyClient(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function actionTitle(action: EditorAction) {
  switch (action) {
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

function actionLabel(action: EditorAction) {
  switch (action) {
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

function actionDescription(action: EditorAction, title: string) {
  const safeTitle = title || "informasi ini";
  switch (action) {
    case "publish":
      return `Draft terbaru akan disimpan terlebih dahulu, lalu "${safeTitle}" diterbitkan ke halaman publik.`;
    case "unpublish":
      return `Informasi "${safeTitle}" akan dikembalikan ke status Draft.`;
    case "archive":
      return `Informasi "${safeTitle}" akan disimpan sebagai arsip dan tidak tampil di publik.`;
    case "delete":
      return `Informasi "${safeTitle}" beserta file yang terkait akan dihapus permanen.`;
    default:
      return "";
  }
}
