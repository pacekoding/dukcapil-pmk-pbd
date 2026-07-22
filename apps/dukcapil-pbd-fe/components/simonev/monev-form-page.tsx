"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FilePlus2,
  ListChecks,
  Pencil,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import {
  createEmptyFollowUp,
  createEmptyFormState,
  createEmptyChecklistItem,
  createId,
  followUpStatusOptions,
  formatDate,
  initialMonitoringData,
  normalizeFollowUps,
  readMonitoringRecords,
  recordToFormState,
  type ChecklistItem,
  type ChecklistStatus,
  type FollowUpItem,
  type FollowUpStatus,
  type MonitoringFormState,
  type MonitoringRecord,
  writeMonitoringRecords,
} from "@/components/simonev/monitoring-data";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSubkegiatan } from "@/lib/api/subkegiatan";
import { cn } from "@/lib/utils";
import type { Subkegiatan } from "@/types/subkegiatan";

type DialogMode = "create" | "edit";
type SubkegiatanSelectOption = {
  value: string;
  label: string;
};

export function MonevFormPage() {
  const [records, setRecords] = useState<MonitoringRecord[]>(initialMonitoringData);
  const [subkegiatanItems, setSubkegiatanItems] = useState<Subkegiatan[]>([]);
  const [loadingSubkegiatan, setLoadingSubkegiatan] = useState(true);
  const [subkegiatanError, setSubkegiatanError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formState, setFormState] = useState<MonitoringFormState>(
    createEmptyFormState,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecords(readMonitoringRecords());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSubkegiatan = async () => {
      try {
        const response = await getSubkegiatan();
        if (mounted) {
          setSubkegiatanItems(response.items);
          setSubkegiatanError(null);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setSubkegiatanError("Master data subkegiatan gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoadingSubkegiatan(false);
        }
      }
    };

    void loadSubkegiatan();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      writeMonitoringRecords(records);
    }
  }, [hydrated, records]);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return records;
    }

    return records.filter((record) =>
      [
        record.namaMonev,
        record.subkegiatan,
        record.lokus,
        formatDate(record.waktu),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, records]);

  const summary = useMemo(() => {
    const totalChecklist = records.reduce(
      (total, record) => total + record.checklist.length,
      0,
    );
    const checkedChecklist = records.reduce(
      (total, record) =>
        total + record.checklist.filter((item) => item.status).length,
      0,
    );
    const activeFollowUp = records.reduce(
      (total, record) =>
        total + record.tindakLanjut.filter((item) => item.status !== "Selesai").length,
      0,
    );

    return { totalChecklist, checkedChecklist, activeFollowUp };
  }, [records]);

  const subkegiatanOptions = useMemo<SubkegiatanSelectOption[]>(
    () =>
      subkegiatanItems.map((item) => {
        const value = `${item.kode} - ${item.nama}`;
        return { value, label: value };
      }),
    [subkegiatanItems],
  );

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingRecordId(null);
    setFormState(createEmptyFormState());
    setDialogOpen(true);
  };

  const openEditDialog = (record: MonitoringRecord) => {
    setDialogMode("edit");
    setEditingRecordId(record.id);
    setFormState(recordToFormState(record));
    setDialogOpen(true);
  };

  const handleSaveInstrument = () => {
    const normalizedForm: MonitoringFormState = {
      ...formState,
      namaMonev: formState.namaMonev.trim() || "Instrumen Monitoring Baru",
      lokus: formState.lokus.trim() || "-",
      tindakLanjut: normalizeFollowUps(formState.tindakLanjut),
    };

    if (dialogMode === "edit" && editingRecordId) {
      setRecords((current) =>
        current.map((record) =>
          record.id === editingRecordId
            ? { id: editingRecordId, ...normalizedForm }
            : record,
        ),
      );
    } else {
      setRecords((current) => [{ id: createId(), ...normalizedForm }, ...current]);
    }

    setDialogOpen(false);
    setEditingRecordId(null);
  };

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-pbd-navy">
            Data Monitoring
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Kelola instrumen monitoring, checklist lapangan, dan tindak lanjut.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={openCreateDialog}
        >
          <FilePlus2 className="h-4 w-4" />
          Create Instrument Monitoring
        </Button>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={ListChecks}
          label="Total Monev"
          value={records.length.toString()}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Checklist Terisi"
          value={`${summary.checkedChecklist}/${summary.totalChecklist}`}
        />
        <MetricCard
          icon={CalendarDays}
          label="Tindak Lanjut Aktif"
          value={summary.activeFollowUp.toString()}
        />
      </div>

      <SectionCard
        title="Tabel Data Monitoring"
        description="Gunakan pratinjau untuk membuka format monitoring di halaman cetak tersendiri."
        action={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari data monev..."
              className="h-9 rounded-lg pl-9"
            />
          </div>
        }
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">No</TableHead>
              <TableHead className="min-w-[240px]">Nama Monev</TableHead>
              <TableHead className="min-w-[300px]">Subkegiatan</TableHead>
              <TableHead>Lokus</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="w-[160px]">Checklist</TableHead>
              <TableHead className="w-[170px]">Tindak Lanjut</TableHead>
              <TableHead className="w-[220px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record, index) => {
              const checklistDone = record.checklist.filter((item) => item.status).length;
              const activeFollowUp = record.tindakLanjut.filter(
                (item) => item.status !== "Selesai",
              ).length;

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-semibold text-slate-500">
                    {index + 1}
                  </TableCell>
                  <TableCell className="max-w-[280px] whitespace-normal">
                    <p className="font-bold leading-5 text-pbd-navy">
                      {record.namaMonev}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[340px] whitespace-normal leading-5">
                    {record.subkegiatan}
                  </TableCell>
                  <TableCell>{record.lokus}</TableCell>
                  <TableCell>{formatDate(record.waktu)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      {checklistDone}/{record.checklist.length} terisi
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        activeFollowUp
                          ? "border-amber-200 text-amber-700"
                          : "border-emerald-200 text-emerald-700",
                      )}
                    >
                      {activeFollowUp} aktif
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-lg px-3 text-xs"
                        onClick={() => openEditDialog(record)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        className="h-8 rounded-lg px-3 text-xs"
                      >
                        <Link href={`/simonev/data/${record.id}/preview`}>
                          <Eye className="h-3.5 w-3.5" />
                          Pratinjau
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                  Data monitoring tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </SectionCard>

      <InstrumentMonitoringDialog
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formState={formState}
        onFormChange={setFormState}
        subkegiatanOptions={subkegiatanOptions}
        loadingSubkegiatan={loadingSubkegiatan}
        subkegiatanError={subkegiatanError}
        onSave={handleSaveInstrument}
      />
    </main>
  );
}

function InstrumentMonitoringDialog({
  mode,
  open,
  onOpenChange,
  formState,
  onFormChange,
  subkegiatanOptions,
  loadingSubkegiatan,
  subkegiatanError,
  onSave,
}: {
  mode: DialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: MonitoringFormState;
  onFormChange: (state: MonitoringFormState) => void;
  subkegiatanOptions: SubkegiatanSelectOption[];
  loadingSubkegiatan: boolean;
  subkegiatanError: string | null;
  onSave: () => void;
}) {
  const selectOptions = useMemo(() => {
    if (
      formState.subkegiatan &&
      !subkegiatanOptions.some((option) => option.value === formState.subkegiatan)
    ) {
      return [
        { value: formState.subkegiatan, label: formState.subkegiatan },
        ...subkegiatanOptions,
      ];
    }

    return subkegiatanOptions;
  }, [formState.subkegiatan, subkegiatanOptions]);

  const updateChecklist = (
    id: string,
    patch: Partial<Pick<ChecklistItem, "indikator" | "status" | "keterangan">>,
  ) => {
    onFormChange({
      ...formState,
      checklist: formState.checklist.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Instrument Monitoring" : "Create Instrument Monitoring"}
          </DialogTitle>
          <DialogDescription>
            Isi data dasar, checklist monitoring, dan daftar tindak lanjut dalam satu form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Subkegiatan">
              <NativeSelect
                value={formState.subkegiatan}
                onChange={(value) => onFormChange({ ...formState, subkegiatan: value })}
              >
                <option value="">Pilih subkegiatan</option>
                {loadingSubkegiatan ? (
                  <option value="" disabled>
                    Memuat master subkegiatan...
                  </option>
                ) : null}
                {!loadingSubkegiatan && subkegiatanError ? (
                  <option value="" disabled>
                    {subkegiatanError}
                  </option>
                ) : null}
                {!loadingSubkegiatan && !subkegiatanError && selectOptions.length === 0 ? (
                  <option value="" disabled>
                    Master subkegiatan belum tersedia.
                  </option>
                ) : null}
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Lokus">
              <Input
                value={formState.lokus}
                onChange={(event) =>
                  onFormChange({ ...formState, lokus: event.target.value })
                }
                placeholder="Kabupaten/Kota/Distrik/Kampung"
                className="h-11 rounded-lg"
              />
            </Field>
            <Field label="Waktu">
              <Input
                type="date"
                value={formState.waktu}
                onChange={(event) =>
                  onFormChange({ ...formState, waktu: event.target.value })
                }
                className="h-11 rounded-lg"
              />
            </Field>
            <Field label="Nama Monev">
              <Input
                value={formState.namaMonev}
                onChange={(event) =>
                  onFormChange({ ...formState, namaMonev: event.target.value })
                }
                placeholder="Nama kegiatan monitoring"
                className="h-11 rounded-lg"
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-pbd-navy">Checklist Monitoring</h3>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg"
                onClick={() =>
                  onFormChange({
                    ...formState,
                    checklist: [
                      ...formState.checklist,
                      createEmptyChecklistItem(),
                    ],
                  })
                }
              >
                <FilePlus2 className="h-4 w-4" />
                Tambah
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left">No</th>
                    <th className="px-3 py-3 text-left">Indikator</th>
                    <th className="w-36 px-3 py-3 text-left">Jawaban</th>
                    <th className="w-56 px-3 py-3 text-left">Keterangan</th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {formState.checklist.map((item, index) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-semibold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          value={item.indikator}
                          onChange={(event) =>
                            updateChecklist(item.id, { indikator: event.target.value })
                          }
                          className="h-10 rounded-lg"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <NativeSelect
                          value={item.status}
                          onChange={(value) =>
                            updateChecklist(item.id, {
                              status: value as ChecklistStatus,
                            })
                          }
                        >
                          <option value="">-</option>
                          <option value="Ya">Ya</option>
                          <option value="Tidak">Tidak</option>
                        </NativeSelect>
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          value={item.keterangan}
                          onChange={(event) =>
                            updateChecklist(item.id, { keterangan: event.target.value })
                          }
                          className="h-10 rounded-lg"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-9 rounded-lg p-0 text-red-600"
                          aria-label="Hapus checklist"
                          title="Hapus checklist"
                          onClick={() =>
                            onFormChange({
                              ...formState,
                              checklist: formState.checklist.filter(
                                (checklist) => checklist.id !== item.id,
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <FollowUpEditor
            items={formState.tindakLanjut}
            onItemsChange={(items) => onFormChange({ ...formState, tindakLanjut: items })}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={onSave}
          >
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Instrument"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowUpEditor({
  items,
  onItemsChange,
}: {
  items: FollowUpItem[];
  onItemsChange: (items: FollowUpItem[]) => void;
}) {
  const updateItem = (id: string, patch: Partial<FollowUpItem>) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-pbd-navy">Daftar Tindak Lanjut</h3>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg"
          onClick={() => onItemsChange([...items, createEmptyFollowUp()])}
        >
          <FilePlus2 className="h-4 w-4" />
          Tambah
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-bold text-slate-700">Tindak lanjut {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-9 rounded-lg p-0 text-red-600"
                aria-label="Hapus tindak lanjut"
                title="Hapus tindak lanjut"
                onClick={() => onItemsChange(items.filter((entry) => entry.id !== item.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Permasalahan">
                <Textarea
                  value={item.permasalahan}
                  onChange={(event) =>
                    updateItem(item.id, { permasalahan: event.target.value })
                  }
                  className="min-h-20 rounded-lg"
                />
              </Field>
              <Field label="Rekomendasi">
                <Textarea
                  value={item.rekomendasi}
                  onChange={(event) =>
                    updateItem(item.id, { rekomendasi: event.target.value })
                  }
                  className="min-h-20 rounded-lg"
                />
              </Field>
              <Field label="Penanggung Jawab">
                <Input
                  value={item.penanggungJawab}
                  onChange={(event) =>
                    updateItem(item.id, { penanggungJawab: event.target.value })
                  }
                  className="h-11 rounded-lg"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Target Waktu">
                  <Input
                    type="date"
                    value={item.targetWaktu}
                    onChange={(event) =>
                      updateItem(item.id, { targetWaktu: event.target.value })
                    }
                    className="h-11 rounded-lg"
                  />
                </Field>
                <Field label="Status">
                  <NativeSelect
                    value={item.status}
                    onChange={(value) =>
                      updateItem(item.id, { status: value as FollowUpStatus })
                    }
                  >
                    {followUpStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function NativeSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/20"
    >
      {children}
    </select>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="app-surface rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-pbd-navy">{value}</p>
        </div>
      </div>
    </div>
  );
}
