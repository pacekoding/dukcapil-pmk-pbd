"use client";
import Link from "next/link";
import {
  validateClientUpload,
  DEFAULT_MAX_UPLOAD_SIZE_MB,
} from "@/lib/api/file-policy";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  ErrorState,
  LoadingState,
  SuccessState,
} from "@/components/dashboard/state";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  TravelInput as Field,
  TravelSelect as Select,
  TravelText as Text,
} from "@/components/travel/form-controls";
import {
  getActivities,
  getActivityAttachments,
  uploadActivityAttachment,
  updateActivityAttachment,
  deleteActivityAttachment,
} from "@/lib/api/activity-execution";
import { activityRoot } from "@/lib/activity-execution";
import type {
  ActivityAttachment,
  ActivityExecution,
} from "@/types/activity-execution";
const empty = {
  kind: "photo" as "photo" | "support",
  category: "Dokumentasi",
  caption: "",
  takenAt: "",
  locationDescription: "",
};
const legacyInlineCrudEnabled: boolean = false;
export function ActivityFiles({
  activityId,
  kind,
  onChange,
}: {
  activityId?: number;
  kind?: "photo" | "support";
  onChange?: () => void;
}) {
  const [rows, setRows] = useState<ActivityAttachment[]>([]),
    [activities, setActivities] = useState<ActivityExecution[]>([]),
    [chosen, setChosen] = useState(activityId ? String(activityId) : ""),
    [p, set] = useState({ ...empty, kind: kind ?? "photo" }),
    [file, setFile] = useState<File | null>(null),
    [editing, setEditing] = useState<ActivityAttachment | null>(null),
    [deleting, setDeleting] = useState<ActivityAttachment | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false),
    [loading, setLoading] = useState(true),
    [reload, setReload] = useState(0),
    [fileKey, setFileKey] = useState(0);
  useEffect(() => {
    let active = true;
    getActivities({ year: "all" })
      .then((a) => {
        if (active) {
          setActivities(a);
          if (!activityId)
            setChosen(
              new URL(window.location.href).searchParams.get("activityId") ||
                "",
            );
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [activityId]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    getActivityAttachments(chosen ? Number(chosen) : undefined, kind)
      .then((a) => {
        if (active) setRows(a);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [chosen, kind, reload]);
  const update = (k: keyof typeof p, v: string) =>
    set((old) => ({ ...old, [k]: v }));
  const refresh = () => {
    setReload((v) => v + 1);
    onChange?.();
  };
  return (
    <SectionCard
      title={
        kind === "support"
          ? "Lampiran / Dokumen Pendukung"
          : "Dokumentasi Kegiatan"
      }
      description={
        kind === "support"
          ? "Arsipkan TOR/KAK, DPA, dokumen keuangan, materi, bukti distribusi, atau lampiran lainnya."
          : "Unggah foto atau PDF dokumentasi. Foto dapat menjadi lampiran laporan."
      }
      action={activityId ? <Button asChild><Link href={`${activityRoot}/${activityId}/lampiran/add`}>Tambah Lampiran</Link></Button> : undefined}
    >
      <div className="space-y-5">
        {error ? <ErrorState message={error} /> : null}
        {message ? <SuccessState message={message} /> : null}
        {!activityId ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Select
            label="Filter Kegiatan / Tujuan Unggah"
            allowEmpty
            value={chosen}
            onChange={(v) => {
              setChosen(v);
              setEditing(null);
            }}
            items={activities.map((a) => ({
              value: String(a.id),
              label: a.title,
            }))}
          />
          <Button asChild={Boolean(chosen)} disabled={!chosen}>
            {chosen ? <Link href={`${activityRoot}/${chosen}/lampiran/add`}>Tambah Lampiran</Link> : <span>Tambah Lampiran</span>}
          </Button>
          </div>
        ) : null}
        {legacyInlineCrudEnabled ? <form
          className="rounded-lg border bg-slate-50 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!chosen && !editing) {
              setError("Pilih kegiatan sebelum mengunggah.");
              return;
            }
            setSaving(true);
            setError("");
            try {
              if (editing) await updateActivityAttachment(editing.id, p);
              else {
                if (!file) throw new Error("Pilih file yang akan diunggah.");
                validateClientUpload(
                  file,
                  p.kind === "photo" ? "archive" : "activity-attachment",
                );
                const data = new FormData();
                data.set("file", file);
                Object.entries(p).forEach(([k, v]) => data.set(k, v));
                await uploadActivityAttachment(Number(chosen), data);
              }
              setEditing(null);
              set({
                ...empty,
                kind: kind ?? "photo",
                category:
                  kind === "support" ? "Dokumen lainnya" : "Dokumentasi",
              });
              setFile(null);
              setFileKey((v) => v + 1);
              setMessage("Lampiran berhasil disimpan.");
              refresh();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Gagal menyimpan lampiran.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <fieldset disabled={saving} className="space-y-4">
            <h3 className="font-semibold">
              {editing ? "Edit Informasi Lampiran" : "Unggah Lampiran"}
            </h3>
            {!editing ? (
              <label className="grid gap-2 text-sm">
                File *
                <input
                  key={fileKey}
                  type="file"
                  required
                  accept={
                    (kind ?? p.kind) === "photo"
                      ? ".jpg,.jpeg,.png,.webp,.pdf"
                      : ".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp"
                  }
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="text-xs text-slate-500">
                  {(kind ?? p.kind) === "photo"
                    ? "JPG, JPEG, PNG, WEBP, PDF"
                    : "PDF, DOCX, XLSX, JPG, JPEG, PNG, WEBP"}
                  . Maksimal {DEFAULT_MAX_UPLOAD_SIZE_MB} MB.
                </span>
              </label>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Kategori"
                required
                value={p.category}
                onChange={(v) => update("category", v)}
              />
              <Field
                label="Tanggal Pengambilan (opsional)"
                type="date"
                value={p.takenAt}
                onChange={(v) => update("takenAt", v)}
              />
              <Text
                label="Caption / Uraian"
                value={p.caption}
                onChange={(v) => update("caption", v)}
              />
              <Field
                label="Keterangan Lokasi"
                value={p.locationDescription}
                onChange={(v) => update("locationDescription", v)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!chosen && !editing}>
                {saving
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan Perubahan"
                    : "Unggah"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    set({ ...empty, kind: kind ?? "photo" });
                  }}
                >
                  Batal Edit
                </Button>
              ) : null}
            </div>
          </fieldset>
        </form> : null}
        {loading ? (
          <LoadingState rows={2} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((f) => (
              <article key={f.id} className="overflow-hidden rounded-lg border">
                <button
                  type="button"
                  className="block w-full bg-slate-100 text-center"
                  onClick={() => window.location.assign(`${activityRoot}/${f.activityExecutionId}/lampiran/${f.id}/preview`)}
                  aria-label={`Preview ${f.caption || f.file.originalFilename}`}
                >
                  {f.file.mimeType.startsWith("image/") ? (
                    <Image
                      src={f.file.previewUrl}
                      alt={f.caption || f.file.originalFilename}
                      width={400}
                      height={240}
                      unoptimized
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center font-semibold text-slate-500">
                      {f.file.originalFilename.split(".").pop()?.toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="space-y-2 p-3 text-sm">
                  <p className="break-all font-semibold">
                    {f.file.originalFilename}
                  </p>
                  <p>{f.caption}</p>
                  <p className="text-xs text-slate-500">
                    {[f.category, f.takenAt, f.locationDescription]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {!activityId ? (
                    <Link
                      className="text-pbd-blue underline"
                      href={`${activityRoot}/${f.activityExecutionId}`}
                    >
                      {activities.find((a) => a.id === f.activityExecutionId)
                        ?.title ?? `Kegiatan #${f.activityExecutionId}`}
                    </Link>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={f.file.downloadUrl}>Unduh</a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.assign(`${activityRoot}/${f.activityExecutionId}/lampiran/${f.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleting(f)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {!rows.length ? (
              <p className="p-4 text-sm text-slate-500">Belum ada lampiran.</p>
            ) : null}
          </div>
        )}
      </div>
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Hapus Lampiran?"
        description="Lampiran yang telah digunakan dalam snapshot laporan tidak dapat dihapus."
        loading={saving}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting) return;
          setSaving(true);
          try {
            await deleteActivityAttachment(deleting.id);
            setDeleting(null);
            refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal menghapus.");
            setDeleting(null);
          } finally {
            setSaving(false);
          }
        }}
      />
    </SectionCard>
  );
}
