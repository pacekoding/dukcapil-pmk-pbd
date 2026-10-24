"use client";

import Link from "next/link";
import {
  getActivities,
  linkTravelActivity,
} from "@/lib/api/activity-execution";
import { activityRoot } from "@/lib/activity-execution";
import type { ActivityExecution } from "@/types/activity-execution";
import { useEffect, useState } from "react";
import {
  Copy,
  Edit,
  Eye,
  FileDown,
  FileText,
  MoreHorizontal,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import {
  ErrorState,
  LoadingState,
  SuccessState,
} from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getTravelDocuments,
  getTravelOptions,
  getTravelDocument,
  saveTravelAssignment,
  saveTravelOrder,
  travelAction,
  deleteTravelDocument,
} from "@/lib/api/travel";
import {
  assignmentFormPayload,
  createOrderForm,
  isTravelAssignment,
  travelToday,
} from "@/lib/travel";
import { buildTravelPdf, travelLogoDataUrl } from "@/lib/travel-pdf";
import { AssignmentForm } from "./assignment-form";
import { OrderForm } from "./order-form";
import {
  PersonSummary,
  TravelInput,
  TravelSelect,
  TravelText,
} from "./form-controls";
import type {
  TravelAssignment,
  TravelAssignmentPayload,
  TravelDocument,
  TravelFilters,
  TravelKind,
  TravelOptions,
  TravelOrderPayload,
} from "@/types/travel";

const displayDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "UTC" }).format(
    new Date(`${date.slice(0, 10)}T00:00:00Z`),
  );
const legacyInlineCrudEnabled: boolean = false;
export function TravelPage({ kind }: { kind: TravelKind }) {
  const assignment = kind === "assignment-letters",
    label = assignment ? "Surat Tugas" : "SPD",
    routeBase = `${activityRoot}/${assignment ? "surat-tugas" : "spd"}`;
  const [activities, setActivities] = useState<ActivityExecution[]>([]);
  const [linkTarget, setLinkTarget] = useState<TravelDocument | null>(null);
  const [linkActivity, setLinkActivity] = useState("");
  const [records, setRecords] = useState<TravelDocument[]>([]);
  const [options, setOptions] = useState<TravelOptions | null>(null);
  const [assignments, setAssignments] = useState<TravelAssignment[]>([]);
  const [filters, setFilters] = useState<TravelFilters>({
    year: travelToday().slice(0, 4),
    status: "",
    search: "",
    employeeId: null,
    destination: "",
  });
  const [reload, setReload] = useState(0);
  const [optionsReload, setOptionsReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setOptionsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<TravelDocument | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [prefill, setPrefill] = useState<TravelOrderPayload | undefined>();
  const [selected, setSelected] = useState<TravelDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TravelDocument | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    doc: TravelDocument;
    action: "finalize" | "cancel";
  } | null>(null);
  const [reason, setReason] = useState("");
  useEffect(() => {
    let mounted = true;
    async function load() {
      setOptionsLoading(true);
      try {
        const [o, a, executions] = await Promise.all([
          getTravelOptions(),
          assignment
            ? Promise.resolve([])
            : getTravelDocuments("assignment-letters", { year: "all" }),
          getActivities({ year: "all" }),
        ]);
        if (mounted) {
          setOptions(o);
          setActivities(executions);
          const activityId = Number(
            new URL(window.location.href).searchParams.get("activityId"),
          );
          if (activityId)
            setFilters((p) => ({ ...p, activityId, year: "all" }));
          setAssignments(a.filter(isTravelAssignment));
          setOptionsError(null);
          if (!assignment) {
            const sourceId = Number(
              new URL(window.location.href).searchParams.get("suratTugasId"),
            );
            const source = a
              .filter(isTravelAssignment)
              .find((item) => item.id === sourceId);
            if (source) {
              setPrefill({
                ...createOrderForm(o.office.agencyName),
                assignmentLetterId: source.id,
                employeeId:
                  source.employeeIds.length === 1 ? source.employeeIds[0] : 0,
                signerId: source.signerId,
                issuePlace: source.issuePlace,
              });
              setFormOpen(true);
            }
          }
        }
      } catch {
        if (mounted)
          setOptionsError(
            "Referensi pegawai, Surat Tugas, atau subkegiatan gagal dimuat.",
          );
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [assignment, optionsReload]);
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const items = await getTravelDocuments(kind, filters);
        if (mounted) {
          setRecords(items);
          setLoadError(null);
        }
      } catch (cause) {
        if (mounted)
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Daftar dokumen gagal dimuat.",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }
    const timer = setTimeout(() => void load(), 200);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [kind, filters, reload]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setPrefill(undefined);
  }
  function openForm(doc: TravelDocument | null) {
    setEditing(doc);
    setPrefill(undefined);
    setFormKey((v) => v + 1);
    setFormOpen(true);
    setSelected(null);
    setPreviewUrl(null);
    setError(null);
    setMessage(null);
  }
  async function save(p: TravelAssignmentPayload | TravelOrderPayload) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if ("employeeIds" in p)
        await saveTravelAssignment(editing?.id ?? null, p);
      else await saveTravelOrder(editing?.id ?? null, p);
      closeForm();
      setMessage(`${label} berhasil disimpan sebagai Draft.`);
      setReload((v) => v + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Dokumen gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function preview(doc: TravelDocument) {
    setPreviewing(true);
    setError(null);
    try {
      const current = await getTravelDocument(kind, doc.id);
      const office = isTravelAssignment(current)
        ? current.office
        : current.details.office;
      const logo = office.logo
        ? await travelLogoDataUrl(office.logo)
        : undefined;
      const pdf = buildTravelPdf(current, logo);
      setSelected(current);
      setPreviewUrl(URL.createObjectURL(pdf.output("blob")));
      closeForm();
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Preview gagal dibuat.",
      );
      return false;
    } finally {
      setPreviewing(false);
    }
  }
  async function exportPdf() {
    if (!selected) return;
    setPreviewing(true);
    try {
      const current = await getTravelDocument(kind, selected.id);
      const office = isTravelAssignment(current)
        ? current.office
        : current.details.office;
      buildTravelPdf(
        current,
        office.logo ? await travelLogoDataUrl(office.logo) : undefined,
      ).save(`${label.toLowerCase().replaceAll(" ", "-")}-${current.id}.pdf`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PDF gagal dibuat.");
    } finally {
      setPreviewing(false);
    }
  }
  async function runAction() {
    if (!actionTarget) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const item = await travelAction(
        kind,
        actionTarget.doc.id,
        actionTarget.action,
        reason,
      );
      setMessage(
        `${label} berhasil ${actionTarget.action === "finalize" ? "difinalisasi" : "dibatalkan"}.`,
      );
      setActionTarget(null);
      setReload((v) => v + 1);
      if (selected?.id === item.id) await preview(item);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Status dokumen gagal diperbarui.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTravelDocument(kind, deleteTarget.id);
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
        setPreviewUrl(null);
      }
      setDeleteTarget(null);
      setMessage(`${label} Draft berhasil dihapus.`);
      setReload((v) => v + 1);
    } catch (cause) {
      setDeleteTarget(null);
      setError(cause instanceof Error ? cause.message : "Draft gagal dihapus.");
    } finally {
      setSaving(false);
    }
  }
  async function duplicate(doc: TravelDocument) {
    setSaving(true);
    setError(null);
    try {
      const item = await travelAction(
        "assignment-letters",
        doc.id,
        "duplicate",
      );
      setMessage("Surat Tugas berhasil diduplikat sebagai Draft tanpa nomor.");
      setReload((v) => v + 1);
      openForm(item);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Duplikasi gagal.");
    } finally {
      setSaving(false);
    }
  }
  const pending = saving || previewing;
  return (
    <main className="space-y-6">
      <Button asChild variant="outline">
        <Link href={activityRoot}>Pusat Pelaksanaan Kegiatan</Link>
      </Button>
      <PageHero
        icon={FileText}
        eyebrow="Pelaksanaan Kegiatan"
        title={assignment ? "Surat Tugas" : "Surat Perjalanan Dinas (SPD)"}
        description={
          assignment
            ? "Kelola Surat Tugas perjalanan dinas pegawai."
            : "Kelola Surat Perjalanan Dinas pegawai."
        }
        aside={
          <Button asChild><Link href={`${routeBase}/add`}><Plus className="h-4 w-4" />Buat {label}</Link></Button>
        }
      />
      <section
        aria-label="Ringkasan sesuai filter"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {["Total", "Draft", "Final", "Dibatalkan"].map((status) => (
          <SectionCard key={status}>
            <p className="text-sm text-slate-500">
              {status} {status === "Total" ? label : ""}
            </p>
            <p className="mt-2 text-2xl font-bold text-pbd-navy">
              {status === "Total"
                ? records.length
                : records.filter((item) => item.status === status).length}
            </p>
          </SectionCard>
        ))}
      </section>
      {optionsError ? (
        <div className="space-y-2">
          <ErrorState message={optionsError} />
          <Button
            variant="outline"
            onClick={() => setOptionsReload((v) => v + 1)}
          >
            Muat Ulang Referensi
          </Button>
        </div>
      ) : null}
      {error ? (
        <div role="alert">
          <ErrorState message={error} />
        </div>
      ) : null}
      {message ? (
        <div role="status">
          <SuccessState message={message} />
        </div>
      ) : null}
      {previewing ? (
        <LoadingState rows={1} message="Menyiapkan dokumen PDF..." />
      ) : null}
      {legacyInlineCrudEnabled && formOpen && options ? (
        <div id="travel-form" className="space-y-4">
          <h2 className="text-xl font-bold text-pbd-navy">
            {editing ? "Edit Draft" : "Buat"} {label}
          </h2>
          {assignment ? (
            <AssignmentForm
              activities={activities}
              key={formKey}
              initial={
                editing && isTravelAssignment(editing)
                  ? assignmentFormPayload(editing)
                  : undefined
              }
              options={options}
              saving={saving}
              onSave={save}
              onCancel={closeForm}
            />
          ) : (
            <OrderForm
              key={formKey}
              initial={
                editing && !isTravelAssignment(editing) ? editing : prefill
              }
              assignments={assignments}
              options={options}
              saving={saving}
              onSave={save}
              onCancel={closeForm}
            />
          )}
        </div>
      ) : null}
      {legacyInlineCrudEnabled && selected && previewUrl ? (
        <SectionCard
          title={`Detail dan Preview ${label}`}
          description="Preview dan unduhan PDF menggunakan template yang sama. Dokumen Final memakai snapshot saat finalisasi."
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => void exportPdf()}
              >
                <FileDown className="h-4 w-4" />
                Cetak / Export PDF
              </Button>
              <Button asChild variant="outline">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4" />
                  Buka PDF untuk Cetak
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tutup Preview"
                onClick={() => {
                  setSelected(null);
                  setPreviewUrl(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <div className="mb-4 space-y-3 text-sm">
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline">{selected.status}</Badge>
              <span>Nomor: {selected.number || "Belum diberi nomor"}</span>
              <span>Tanggal: {displayDate(selected.documentDate)}</span>
              <span>
                Durasi: {selected.durationDays} hari (selisih tanggal)
              </span>
            </div>
            {selected.status === "Dibatalkan" ? (
              <p className="text-red-700">
                Alasan pembatalan: {selected.cancellationReason}
              </p>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {(isTravelAssignment(selected)
                ? selected.employees
                : [selected.details.employee]
              ).map((p) => (
                <PersonSummary key={p.id} person={p} />
              ))}
            </div>
            {selected.status === "Draft" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => openForm(selected)}
                >
                  <Edit className="h-4 w-4" />
                  Edit Draft
                </Button>
                <Button
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    setReason("");
                    setActionTarget({ doc: selected, action: "finalize" });
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Finalisasi
                </Button>
              </div>
            ) : null}
            <p className="text-xs text-slate-500">
              Dibuat {new Date(selected.createdAt).toLocaleString("id-ID")} ·
              Diperbarui {new Date(selected.updatedAt).toLocaleString("id-ID")}
              {selected.finalizedAt
                ? ` · Final ${new Date(selected.finalizedAt).toLocaleString("id-ID")}`
                : ""}
            </p>
          </div>
          <iframe
            title={`Preview ${label}`}
            src={previewUrl}
            className="h-[900px] w-full rounded-lg border bg-slate-100"
          />
        </SectionCard>
      ) : null}
      <SectionCard
        title={`Daftar ${label}`}
        description="Cari dan filter dokumen. Hanya Draft yang dapat diedit atau dihapus."
        contentClassName="p-0"
      >
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <TravelSelect
            label="Kegiatan Pelaksanaan"
            allowEmpty
            value={filters.activityId ? String(filters.activityId) : ""}
            onChange={(v) =>
              setFilters((p) => ({ ...p, activityId: v ? Number(v) : null }))
            }
            items={activities.map((a) => ({
              value: String(a.id),
              label: a.title,
            }))}
          />
          <TravelInput
            label="Pencarian"
            value={filters.search}
            onChange={(v) => setFilters((p) => ({ ...p, search: v }))}
          />
          <TravelInput
            label="Tahun"
            value={filters.year === "all" ? "" : filters.year}
            type="number"
            onChange={(v) => setFilters((p) => ({ ...p, year: v || "all" }))}
          />
          <TravelSelect
            label="Status"
            value={filters.status}
            allowEmpty
            onChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            items={["Draft", "Final", "Dibatalkan"].map((v) => ({
              value: v,
              label: v,
            }))}
            placeholder="Semua Status"
          />
          <TravelSelect
            label="Pegawai"
            value={filters.employeeId ? String(filters.employeeId) : ""}
            allowEmpty
            onChange={(v) =>
              setFilters((p) => ({ ...p, employeeId: v ? Number(v) : null }))
            }
            items={(options?.employees ?? []).map((p) => ({
              value: String(p.id),
              label: `${p.name} · ${p.nip}`,
            }))}
            placeholder="Semua Pegawai"
          />
          <TravelInput
            label="Tujuan"
            value={filters.destination}
            onChange={(v) => setFilters((p) => ({ ...p, destination: v }))}
          />
        </div>
        {loadError ? (
          <div className="space-y-3 p-5">
            <ErrorState message={loadError} />
            <Button variant="outline" onClick={() => setReload((v) => v + 1)}>
              Coba Lagi
            </Button>
          </div>
        ) : loading ? (
          <LoadingState className="p-5" message={`Memuat ${label}...`} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{assignment ? "NOMOR" : "NOMOR SPD"}</TableHead>
                {assignment ? (
                  <>
                    <TableHead>TANGGAL</TableHead>
                    <TableHead>DASAR</TableHead>
                    <TableHead>TUJUAN / PENUGASAN</TableHead>
                    <TableHead>PELAKSANA</TableHead>
                    <TableHead>LOKASI TUJUAN</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>SURAT TUGAS</TableHead>
                    <TableHead>PELAKSANA</TableHead>
                    <TableHead>TUJUAN</TableHead>
                    <TableHead>TANGGAL BERANGKAT</TableHead>
                    <TableHead>TANGGAL KEMBALI</TableHead>
                    <TableHead>LAMA</TableHead>
                  </>
                )}
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length ? (
                records.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`${routeBase}/${item.id}/preview`}
                        className="text-left font-semibold text-pbd-blue underline-offset-4 hover:underline"
                      >
                        {item.number || `Draft #${item.id}`}
                      </Link>
                    </TableCell>
                    {isTravelAssignment(item) ? (
                      <>
                        <TableCell>{displayDate(item.documentDate)}</TableCell>
                        <TableCell className="max-w-48 whitespace-normal">
                          {item.bases.join("; ")}
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal">
                          {item.instructions.join("; ")}
                        </TableCell>
                        <TableCell className="max-w-48 whitespace-normal">
                          {item.employees.map((p) => p.name).join(", ")}
                        </TableCell>
                        <TableCell>{item.destination}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {item.details.assignmentNumber ||
                            `Draft #${item.assignmentLetterId}`}
                        </TableCell>
                        <TableCell>{item.details.employee.name}</TableCell>
                        <TableCell>{item.details.destination}</TableCell>
                        <TableCell>
                          {displayDate(item.details.departureDate)}
                        </TableCell>
                        <TableCell>
                          {displayDate(item.details.returnDate)}
                        </TableCell>
                        <TableCell>{item.durationDays} hari</TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Aksi ${label} ${item.number || item.id}`}
                            disabled={pending}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isTravelAssignment(item) &&
                          !item.activityExecutionId ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setLinkTarget(item);
                                setLinkActivity("");
                                setError(null);
                              }}
                            >
                              Tautkan ke Kegiatan
                            </DropdownMenuItem>
                          ) : null}
                          {item.activityExecutionId ? (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`${activityRoot}/${item.activityExecutionId}`}
                              >
                                Buka Kegiatan dan Dokumen Terkait
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem asChild>
                            <Link href={`${routeBase}/${item.id}/preview`}>
                            <Eye className="h-4 w-4" />
                            Lihat / Preview / Cetak
                            </Link>
                          </DropdownMenuItem>
                          {item.status === "Draft" ? (
                            <DropdownMenuItem asChild>
                              <Link href={`${routeBase}/${item.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              Edit Draft
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {assignment ? (
                            <DropdownMenuItem
                              onClick={() => void duplicate(item)}
                            >
                              <Copy className="h-4 w-4" />
                              Duplikat
                            </DropdownMenuItem>
                          ) : null}
                          {assignment && item.status !== "Dibatalkan" ? (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/internal/pelaksanaan-kegiatan/spd?suratTugasId=${item.id}`}
                              >
                                <Plus className="h-4 w-4" />
                                Buat SPD
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {item.status !== "Dibatalkan" ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setError(null);
                                setReason("");
                                setActionTarget({
                                  doc: item,
                                  action: "cancel",
                                });
                              }}
                            >
                              Batalkan Dokumen
                            </DropdownMenuItem>
                          ) : null}
                          {item.status === "Draft" ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus Draft
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={assignment ? 8 : 9}
                    className="py-10 text-center text-slate-500"
                  >
                    Tidak ada {label} yang sesuai dengan filter. Buat dokumen
                    baru atau ubah filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </SectionCard>
      <Dialog
        open={Boolean(linkTarget)}
        onOpenChange={(open) => {
          if (!open) setLinkTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tautkan Arsip ke Kegiatan</DialogTitle>
            <DialogDescription>
              Penautan memperbarui relasi kegiatan Surat Tugas dan SPD terkait.
              Isi serta snapshot arsip Final tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          {error ? <ErrorState message={error} /> : null}
          <TravelSelect
            label="Kegiatan Pelaksanaan"
            value={linkActivity}
            onChange={setLinkActivity}
            items={activities
              .filter((a) => a.status !== "Dibatalkan")
              .map((a) => ({ value: String(a.id), label: a.title }))}
          />
          <Button
            disabled={!linkActivity || saving}
            onClick={async () => {
              if (!linkTarget) return;
              setSaving(true);
              setError(null);
              try {
                await linkTravelActivity(linkTarget.id, Number(linkActivity));
                setLinkTarget(null);
                setReload((v) => v + 1);
                setMessage("Arsip berhasil ditautkan ke kegiatan.");
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Penautan gagal.",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            Tautkan
          </Button>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={`Hapus Draft ${label}?`}
        description={`Draft ${deleteTarget?.number || `#${deleteTarget?.id ?? ""}`} akan dihapus. Surat Tugas yang sudah memiliki SPD tidak dapat dihapus.`}
        loading={saving}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void remove()}
      />
      <Dialog
        open={Boolean(actionTarget)}
        onOpenChange={(open) => {
          if (!open && !saving) setActionTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === "finalize" ? "Finalisasi" : "Batalkan"}{" "}
              {label}?
            </DialogTitle>
            <DialogDescription>
              {actionTarget?.action === "finalize"
                ? "Pastikan preview dan identitas sudah benar. Dokumen Final menyimpan snapshot dan tidak dapat diedit atau dihapus."
                : "Dokumen tetap disimpan sebagai histori. Pembatalan wajib disertai alasan."}
            </DialogDescription>
          </DialogHeader>
          {error ? <ErrorState message={error} /> : null}
          {actionTarget?.action === "cancel" ? (
            <TravelText
              label="Alasan Pembatalan"
              value={reason}
              onChange={setReason}
              required
            />
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setActionTarget(null)}
            >
              Kembali
            </Button>
            <Button
              disabled={
                saving || (actionTarget?.action === "cancel" && !reason.trim())
              }
              onClick={() => void runAction()}
            >
              {saving
                ? "Memproses..."
                : actionTarget?.action === "finalize"
                  ? "Finalisasi"
                  : "Batalkan Dokumen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
