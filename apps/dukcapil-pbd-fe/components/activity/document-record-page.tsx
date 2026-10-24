"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { DocumentForm } from "@/components/activity/document-form";
import { CrudPage, DetailGrid } from "@/components/dashboard/crud-page";
import { ErrorState, LoadingState } from "@/components/dashboard/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActivityDocument, getActivityTemplate, saveActivityDocument } from "@/lib/api/activity-execution";
import { getTravelOptions } from "@/lib/api/travel";
import { activityDocumentLabels, activityDocumentRoutes, activityRoot } from "@/lib/activity-execution";
import type { ActivityDocument, ActivityDocumentKind, ActivityDocumentPayload } from "@/types/activity-execution";
import type { TravelPerson } from "@/types/travel";

export function ActivityDocumentRecordPage({ kind, mode, id }: { kind: ActivityDocumentKind; mode: "add" | "edit" | "preview"; id?: number }) {
  const router = useRouter(), label = activityDocumentLabels[kind], base = `${activityRoot}/${activityDocumentRoutes[kind]}`;
  const [record, setRecord] = useState<ActivityDocument | null>(null), [payload, setPayload] = useState<ActivityDocumentPayload | null>(null), [employees, setEmployees] = useState<TravelPerson[]>([]), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState("");
  useEffect(() => { let active = true; async function load() { try { const options = await getTravelOptions(); if (!active) return; setEmployees(options.employees); if (mode === "add") { const activityId = Number(new URL(window.location.href).searchParams.get("activityId")); if (!activityId) throw new Error("Pilih kegiatan dari halaman daftar sebelum membuat dokumen."); const template = await getActivityTemplate(activityId, kind); if (active) setPayload(template); } else if (id) { const doc = await getActivityDocument(id); if (!active) return; if (doc.kind !== kind) throw new Error("Jenis dokumen tidak sesuai."); setRecord(doc); setPayload({ activityExecutionId: doc.activityExecutionId, kind: doc.kind, documentNumber: doc.documentNumber, documentDate: doc.documentDate, content: doc.details.content, participants: doc.participants }); } } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Dokumen gagal dimuat."); } finally { if (active) setLoading(false); } } void load(); return () => { active = false; }; }, [id, kind, mode]);
  async function save(value: ActivityDocumentPayload) { setSaving(true); setError(""); try { const saved = await saveActivityDocument(mode === "edit" ? id ?? null : null, value); router.replace(`${base}/${saved.id}/preview`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Dokumen gagal disimpan."); } finally { setSaving(false); } }
  const title = mode === "add" ? `Buat ${label}` : mode === "edit" ? `Edit ${label}` : `Preview ${label}`;
  return <CrudPage width="max-w-none" title={title} description={mode === "preview" ? "Detail dokumen kegiatan yang tersimpan." : "Lengkapi isi dokumen kegiatan."} breadcrumbs={[{ label: "Internal", href: "/internal/dashboard" }, { label: "Pelaksanaan Kegiatan", href: activityRoot }, { label, href: base }, { label: mode === "add" ? "Tambah" : mode === "edit" ? "Edit" : "Preview" }]} actions={mode === "preview" && record?.status === "Draft" ? <Button asChild><Link href={`${base}/${record.id}/edit`}><Pencil className="h-4 w-4" />Edit Draft</Link></Button> : undefined}>
    {loading ? <LoadingState message="Memuat dokumen..." /> : error && !payload ? <ErrorState message={error} /> : mode === "preview" && record ? <Card><CardContent><DetailGrid items={[{ label: "Nomor Dokumen", value: record.documentNumber || `Draft #${record.id}` }, { label: "Status", value: record.status }, { label: "Tanggal", value: record.documentDate }, { label: "Kegiatan", value: record.details.execution.title }, { label: "Perihal/Judul", value: record.details.content.subject }, { label: "Tanggal Acara", value: record.details.content.eventDate }, { label: "Waktu", value: record.details.content.time }, { label: "Lokasi", value: record.details.content.location }, { label: "Agenda", value: record.details.content.agenda }, { label: "Peserta/Penerima", value: `${record.participants.length} orang` }, { label: "Penandatangan", value: record.details.content.signers.map((value) => value.name).join(", ") }]} /></CardContent></Card> : payload ? <DocumentForm initial={payload} employees={employees} saving={saving} onCancel={() => window.confirm("Batalkan perubahan formulir?") && router.push(base)} onSave={save} /> : null}
    {error ? <ErrorState message={error} /> : null}
  </CrudPage>;
}
