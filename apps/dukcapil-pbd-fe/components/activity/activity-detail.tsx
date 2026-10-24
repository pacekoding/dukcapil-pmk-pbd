"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { ErrorState, LoadingState } from "@/components/dashboard/state";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  getActivity,
  saveActivity,
  deleteActivity,
} from "@/lib/api/activity-execution";
import { getTravelOptions } from "@/lib/api/travel";
import { getKabKota } from "@/lib/api/kab-kota";
import {
  activityRoot,
  activityDocumentLabels,
  activityDocumentHref,
} from "@/lib/activity-execution";
import { ActivityForm } from "./activity-form";
import { ActivityFiles } from "./activity-files";
import type { ActivityDetail as Detail } from "@/types/activity-execution";
import type { TravelOptions } from "@/types/travel";
import type { KabKota } from "@/types/kab-kota";
export function ActivityDetail({ id }: { id: number }) {
  const [detail, setDetail] = useState<Detail | null>(null),
    [options, setOptions] = useState<TravelOptions | null>(null),
    [cities, setCities] = useState<KabKota[]>([]),
    [editing, setEditing] = useState(false),
    [deleting, setDeleting] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([getActivity(id), getTravelOptions(), getKabKota()])
      .then(([d, o, c]) => {
        if (active) {
          setDetail(d);
          setOptions(o);
          setCities(c);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, reload]);
  const refresh = () => setReload((v) => v + 1);
  const a = detail?.execution;
  return (
    <main className="space-y-6">
      <Button asChild variant="outline">
        <Link href={activityRoot}>Semua Kegiatan</Link>
      </Button>
      {error ? <ErrorState message={error} /> : null}
      {!a || !detail ? (
        <LoadingState />
      ) : (
        <>
          <PageHero
            icon={ClipboardList}
            eyebrow={a.activityType}
            title={a.title}
            description={`${a.location} · ${a.startDate} – ${a.endDate}`}
            aside={
              <div className="flex gap-2">
                <Button asChild><Link href={`${activityRoot}/${id}/edit`}>Edit Kegiatan</Link></Button>
                {a.status === "Draft" ? (
                  <Button variant="outline" onClick={() => setDeleting(true)}>
                    Hapus Draft
                  </Button>
                ) : null}
              </div>
            }
          />
          {editing && options ? (
            <ActivityForm
              key={a.updatedAt}
              initial={a}
              options={options}
              cities={cities}
              saving={saving}
              onCancel={() => setEditing(false)}
              onSave={async (p) => {
                setSaving(true);
                setError("");
                try {
                  await saveActivity(id, p);
                  setEditing(false);
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Gagal menyimpan.");
                } finally {
                  setSaving(false);
                }
              }}
            />
          ) : null}
          <SectionCard title="Informasi Kegiatan">
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              {[
                ["Program", a.program],
                ["Kegiatan", a.kegiatan],
                ["Subkegiatan", a.subkegiatan],
                [
                  "Tahun / Sumber Dana",
                  `${a.fiscalYear} / ${a.fundingSource || "—"}`,
                ],
                ["PPTK", a.pptk.name],
                ["Penanggung Jawab", a.responsible.name],
                ["Kabupaten/Kota", a.kabKotaName || "—"],
                ["Status", a.status],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 whitespace-pre-wrap text-sm">{a.description}</p>
          </SectionCard>
          <SectionCard
            title="Kelengkapan Realisasi"
            description="Status terisi berasal dari dokumen Final dan lampiran aktif. Rekomendasi dapat disesuaikan melalui Edit Kegiatan."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {a.checklist.map((c) => (
                <Link
                  key={c.kind}
                  href={
                    c.kind === "support"
                      ? "#lampiran"
                      : activityDocumentHref(c.kind, id)
                  }
                  className="rounded-lg border p-4 hover:bg-slate-50"
                >
                  <p className="font-semibold">
                    {c.finalCount > 0 ? "✓" : "○"}{" "}
                    {activityDocumentLabels[c.kind]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.finalCount}{" "}
                    {c.kind === "photo" || c.kind === "support"
                      ? "file"
                      : "Final"}{" "}
                    · {c.draftCount} Draft ·{" "}
                    {c.recommended ? "Direkomendasikan" : "Opsional"}
                  </p>
                </Link>
              ))}
            </div>
          </SectionCard>
          <SectionCard
            title="Dokumen Kegiatan"
            description="Buka jenis dokumen untuk membuat, mengedit Draft, memfinalisasi, dan mencetak."
          >
            <div className="space-y-3">
              {[
                ...detail.assignments.map((d) => ({
                  id: d.id,
                  kind: "assignment-letters",
                  number: d.number,
                  status: d.status,
                })),
                ...detail.orders.map((d) => ({
                  id: d.id,
                  kind: "spd",
                  number: d.number,
                  status: d.status,
                })),
                ...detail.documents.map((d) => ({
                  id: d.id,
                  kind: d.kind,
                  number: d.documentNumber,
                  status: d.status,
                })),
              ].map((d) => (
                <Link
                  key={`${d.kind}-${d.id}`}
                  className="flex flex-wrap justify-between gap-3 rounded border p-3 text-sm hover:bg-slate-50"
                  href={`${activityDocumentHref(d.kind, id)}&documentId=${d.id}`}
                >
                  <span>
                    {activityDocumentLabels[d.kind]} ·{" "}
                    {d.number || `Draft #${d.id}`}
                  </span>
                  <span>{d.status}</span>
                </Link>
              ))}
              {!detail.documents.length &&
              !detail.assignments.length &&
              !detail.orders.length ? (
                <p className="text-sm text-slate-500">
                  Belum ada dokumen. Pilih jenis dokumen pada Kelengkapan
                  Realisasi.
                </p>
              ) : null}
              <Button asChild variant="outline">
                <Link href={activityDocumentHref("receipts", id)}>
                  Tanda Terima / Daftar Penerima
                </Link>
              </Button>
            </div>
          </SectionCard>
          <ActivityFiles activityId={id} kind="photo" onChange={refresh} />
          <div id="lampiran">
            <ActivityFiles activityId={id} kind="support" onChange={refresh} />
          </div>
          <p className="text-xs text-slate-500">
            Dibuat oleh #{a.createdBy} ·{" "}
            {new Date(a.createdAt).toLocaleString("id-ID")} · Diubah oleh #
            {a.updatedBy}
          </p>
        </>
      )}
      <ConfirmDeleteDialog
        open={deleting}
        title="Hapus Draft Kegiatan?"
        description="Kegiatan yang sudah memiliki dokumen atau lampiran tidak dapat dihapus."
        loading={saving}
        onOpenChange={setDeleting}
        onConfirm={async () => {
          setSaving(true);
          try {
            await deleteActivity(id);
            window.location.assign(activityRoot);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal menghapus.");
            setDeleting(false);
          } finally {
            setSaving(false);
          }
        }}
      />
    </main>
  );
}
