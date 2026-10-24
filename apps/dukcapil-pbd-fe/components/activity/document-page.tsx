"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  ErrorState,
  LoadingState,
  SuccessState,
} from "@/components/dashboard/state";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TravelSelect as Select,
  TravelInput as Field,
  TravelText as Text,
} from "@/components/travel/form-controls";
import {
  getActivities,
  getActivityDocuments,
  getActivityDocument,
  saveActivityDocument,
  deleteActivityDocument,
  activityDocumentAction,
} from "@/lib/api/activity-execution";
import { getTravelOptions } from "@/lib/api/travel";
import {
  activityRoot,
  activityDocumentLabels,
  activityDocumentHref,
  activityDocumentRoutes,
} from "@/lib/activity-execution";
import { buildActivityPdf } from "@/lib/activity-pdf";
import { travelLogoDataUrl } from "@/lib/travel-pdf";
import { DocumentForm } from "./document-form";
import type {
  ActivityDocument,
  ActivityDocumentKind,
  ActivityDocumentPayload,
  ActivityExecution,
} from "@/types/activity-execution";
import type { TravelPerson } from "@/types/travel";
const legacyInlineCrudEnabled: boolean = false;
export function ActivityDocumentPage({ kind }: { kind: ActivityDocumentKind }) {
  const label = activityDocumentLabels[kind],
    routeBase = `${activityRoot}/${activityDocumentRoutes[kind]}`;
  const [rows, setRows] = useState<ActivityDocument[]>([]),
    [activities, setActivities] = useState<ActivityExecution[]>([]),
    [employees, setEmployees] = useState<TravelPerson[]>([]),
    [activity, setActivity] = useState(""),
    [search, setSearch] = useState(""),
    [year, setYear] = useState("all"),
    [status, setStatus] = useState(""),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [reload, setReload] = useState(0),
    [form, setForm] = useState<{
      id: number | null;
      payload: ActivityDocumentPayload;
    } | null>(null),
    [selected, setSelected] = useState<ActivityDocument | null>(null),
    [preview, setPreview] = useState(""),
    [deleting, setDeleting] = useState<ActivityDocument | null>(null),
    [action, setAction] = useState<"finalize" | "cancel" | null>(null),
    [reason, setReason] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([getActivities({ year: "all" }), getTravelOptions()])
      .then(([a, o]) => {
        if (active) {
          setActivities(a);
          setEmployees(o.employees);
          setActivity(
            new URL(window.location.href).searchParams.get("activityId") || "",
          );
          setReady(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      getActivityDocuments({
        kind,
        year,
        search,
        status,
        activity_execution_id: activity,
      })
        .then((a) => {
          if (active) {
            setRows(a);
            const id = Number(
              new URL(window.location.href).searchParams.get("documentId"),
            );
            if (id && !selected) {
              const doc = a.find((d) => d.id === id);
              if (doc) setSelected(doc);
            }
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    }; /* selected is deliberately handled by explicit actions */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, activity, year, search, status, ready, reload]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function run(task: () => Promise<void>) {
    setSaving(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operasi gagal.");
    } finally {
      setSaving(false);
    }
  }
  async function pdf(doc: ActivityDocument, download = false) {
    const current = await getActivityDocument(doc.id),
      d = current.snapshot ?? current.details;
    const images: Record<number, string> = {};
    for (const f of d.photos ?? [])
      if (f.file.mimeType.startsWith("image/"))
        images[f.id] = await travelLogoDataUrl(f.file.previewUrl);
    const rendered = buildActivityPdf(
      current,
      d.office.logo ? await travelLogoDataUrl(d.office.logo) : undefined,
      images,
    );
    if (download) rendered.save(`${kind}-${current.id}.pdf`);
    else {
      setSelected(current);
      setPreview(URL.createObjectURL(rendered.output("blob")));
    }
  }
  return (
    <main className="space-y-6">
      <Button asChild variant="outline">
        <Link href={activity ? `${activityRoot}/${activity}` : activityRoot}>
          Pusat Kegiatan dan Dokumen Terkait
        </Link>
      </Button>
      <PageHero
        icon={FileText}
        eyebrow="Pelaksanaan Kegiatan"
        title={label}
        description="Kelola Draft, periksa preview, lalu finalisasi untuk mengarsipkan identitas dan isi dokumen."
        aside={
          <Button asChild={Boolean(activity)} disabled={!ready || saving || !activity}>
            {activity ? <Link href={`${routeBase}/add?activityId=${activity}`}>Buat {label}</Link> : <span>Buat {label}</span>}
          </Button>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      {message ? <SuccessState message={message} /> : null}
      <SectionCard title="Filter Dokumen">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Kegiatan Pelaksanaan"
            allowEmpty
            value={activity}
            onChange={(v) => {
              setActivity(v);
              setForm(null);
            }}
            items={activities.map((a) => ({
              value: String(a.id),
              label: a.title,
            }))}
          />
          <Field label="Pencarian" value={search} onChange={setSearch} />
          <Field
            label="Tahun (kosong = semua)"
            type="number"
            value={year === "all" ? "" : year}
            onChange={(v) => setYear(v || "all")}
          />
          <Select
            label="Status"
            allowEmpty
            value={status}
            items={["Draft", "Final", "Dibatalkan"].map((v) => ({
              value: v,
              label: v,
            }))}
            onChange={setStatus}
          />
        </div>
        {!activity ? (
          <p className="mt-4 text-sm text-slate-500">
            Pilih kegiatan untuk membuat dokumen baru.
          </p>
        ) : null}
      </SectionCard>
      {legacyInlineCrudEnabled && form ? (
        <DocumentForm
          key={`${form.id}-${form.payload.activityExecutionId}`}
          initial={form.payload}
          employees={employees}
          saving={saving}
          onCancel={() => setForm(null)}
          onSave={(p) =>
            run(async () => {
              const saved = await saveActivityDocument(form.id, p);
              setForm(null);
              setSelected(saved);
              setPreview("");
              setReload((v) => v + 1);
              setMessage("Draft berhasil disimpan.");
            })
          }
        />
      ) : null}
      <SectionCard title={`Daftar ${label}`}>
        {loading ? (
          <LoadingState rows={3} />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {[
                    "Nomor / Judul",
                    "Kegiatan",
                    "Tanggal",
                    "Status",
                    "Aksi",
                  ].map((h) => (
                    <th className="p-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr className="border-b" key={d.id}>
                    <td className="p-3 font-semibold">
                      {d.documentNumber || `Draft #${d.id}`}
                      <p className="text-xs font-normal">
                        {d.details.content.subject}
                      </p>
                    </td>
                    <td className="p-3">
                      <Link
                        className="text-pbd-blue underline"
                        href={`${activityRoot}/${d.activityExecutionId}`}
                      >
                        {d.details.execution.title}
                      </Link>
                    </td>
                    <td className="p-3">{d.documentDate}</td>
                    <td className="p-3">{d.status}</td>
                    <td className="p-3">
                      <Button asChild size="sm" variant="outline"><Link href={`${routeBase}/${d.id}/preview`}>Lihat / Kelola</Link></Button>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Belum ada dokumen yang sesuai.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      {legacyInlineCrudEnabled && selected ? (
        <SectionCard
          title={`${label} ${selected.documentNumber || `#${selected.id}`}`}
          description={`${selected.status} · ${selected.details.execution.title}`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => void run(() => pdf(selected))}
              >
                Preview
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => void run(() => pdf(selected, true))}
              >
                Cetak PDF
              </Button>
              {preview ? (
                <Button asChild variant="outline">
                  <a href={preview} target="_blank" rel="noopener noreferrer">
                    Buka untuk Cetak
                  </a>
                </Button>
              ) : null}
              {selected.status === "Draft" ? (
                <>
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() =>
                      void run(async () => {
                        const d = await getActivityDocument(selected.id);
                        setForm({
                          id: d.id,
                          payload: {
                            activityExecutionId: d.activityExecutionId,
                            kind: d.kind,
                            documentNumber: d.documentNumber,
                            documentDate: d.documentDate,
                            content: d.details.content,
                            participants: d.participants,
                          },
                        });
                        setSelected(null);
                        setPreview("");
                      })
                    }
                  >
                    Edit Draft
                  </Button>
                  <Button
                    disabled={saving}
                    onClick={() => {
                      setAction("finalize");
                      setReason("");
                    }}
                  >
                    Finalisasi
                  </Button>
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => setDeleting(selected)}
                  >
                    Hapus Draft
                  </Button>
                </>
              ) : null}
              {selected.status !== "Dibatalkan" ? (
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    setAction("cancel");
                    setReason("");
                  }}
                >
                  Batalkan Dokumen
                </Button>
              ) : null}
            </div>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap">
              {selected.details.content.subject} ·{" "}
              {selected.details.content.eventDate} ·{" "}
              {selected.details.content.location}
            </p>
            <p>
              {selected.participants.length} peserta/penerima ·{" "}
              {selected.details.content.signers.map((p) => p.name).join(", ")}
            </p>
            {selected.cancellationReason ? (
              <p>Alasan pembatalan: {selected.cancellationReason}</p>
            ) : null}
            <p className="text-xs text-slate-500">
              Dibuat #{selected.createdBy} ·{" "}
              {new Date(selected.createdAt).toLocaleString("id-ID")} · Diubah #
              {selected.updatedBy}
              {selected.finalizedAt
                ? ` · Final oleh #${selected.finalizedBy} ${new Date(selected.finalizedAt).toLocaleString("id-ID")}`
                : ""}
              {selected.cancelledAt
                ? ` · Dibatalkan oleh #${selected.cancelledBy} ${new Date(selected.cancelledAt).toLocaleString("id-ID")}`
                : ""}
            </p>
            <Button asChild variant="outline">
              <Link href={`${activityRoot}/${selected.activityExecutionId}`}>
                Buka Kegiatan dan Semua Dokumen
              </Link>
            </Button>
            {selected.details.relatedDocuments?.length ? (
              <ul className="space-y-2">
                {selected.details.relatedDocuments.map((d) => (
                  <li key={`${d.kind}-${d.id}`}>
                    <Link
                      className="text-pbd-blue underline"
                      href={`${activityDocumentHref(d.kind, selected.activityExecutionId)}&documentId=${d.id}`}
                    >
                      {activityDocumentLabels[d.kind]} ·{" "}
                      {d.number || `#${d.id}`}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {preview ? (
              <iframe
                title={`Preview ${label}`}
                src={preview}
                className="h-[850px] w-full rounded border"
              />
            ) : (
              <p className="text-slate-500">
                Pilih Preview untuk memeriksa seluruh isi dan tata letak PDF.
              </p>
            )}
          </div>
        </SectionCard>
      ) : null}
      <Dialog
        open={Boolean(action)}
        onOpenChange={(v) => {
          if (!v && !saving) setAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "finalize" ? "Finalisasi" : "Batalkan"} {label}?
            </DialogTitle>
            <DialogDescription>
              {action === "finalize"
                ? "Periksa preview terlebih dahulu. Isi, identitas pegawai, penandatangan, dan OPD disimpan sebagai snapshot. Dokumen Final tidak dapat diedit atau dihapus."
                : "Dokumen dipertahankan sebagai histori. Isi alasan pembatalan."}
            </DialogDescription>
          </DialogHeader>
          {error ? <ErrorState message={error} /> : null}
          {action === "cancel" ? (
            <Text
              label="Alasan Pembatalan"
              required
              value={reason}
              onChange={setReason}
            />
          ) : null}
          <Button
            disabled={saving || (action === "cancel" && !reason.trim())}
            onClick={() =>
              void run(async () => {
                if (!selected || !action) return;
                const d = await activityDocumentAction(
                  selected.id,
                  action,
                  reason,
                );
                setSelected(d);
                setPreview("");
                setAction(null);
                setReload((v) => v + 1);
                setMessage(`Dokumen ${d.status}.`);
              })
            }
          >
            {saving
              ? "Memproses..."
              : action === "finalize"
                ? "Finalisasi"
                : "Batalkan Dokumen"}
          </Button>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title={`Hapus Draft ${label}?`}
        description="Draft akan dihapus beserta daftar pesertanya."
        loading={saving}
        onOpenChange={(v) => {
          if (!v) setDeleting(null);
        }}
        onConfirm={() =>
          void run(async () => {
            if (!deleting) return;
            await deleteActivityDocument(deleting.id);
            setDeleting(null);
            setSelected(null);
            setPreview("");
            setReload((v) => v + 1);
          })
        }
      />
    </main>
  );
}
