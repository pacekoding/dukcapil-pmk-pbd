"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Database,
  Download,
  Edit,
  MapPinned,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getKabKota } from "@/lib/api/kab-kota";
import {
  createSikampungData,
  deleteSikampungData,
  getSikampungData,
  updateSikampungData,
} from "@/lib/api/sikampung";
import type {
  SikampungData,
  SikampungPayload,
  SikampungStatusIDM,
} from "@/types/sikampung";
import { sikampungStatusIdmOptions } from "@/types/sikampung";
import type { KabKota } from "@/types/kab-kota";

type SikampungFormState = {
  kodeDesa: string;
  desa: string;
  distrik: string;
  kabupaten: string;
  iks: string;
  ike: string;
  ikl: string;
  statusIdm: SikampungStatusIDM;
};

const initialFormState: SikampungFormState = {
  kodeDesa: "",
  desa: "",
  distrik: "",
  kabupaten: "",
  iks: "",
  ike: "",
  ikl: "",
  statusIdm: "Tertinggal",
};

export default function SikampungDataPage() {
  const [records, setRecords] = useState<SikampungData[]>([]);
  const [kabKotaOptions, setKabKotaOptions] = useState<KabKota[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SikampungData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SikampungData | null>(null);
  const [form, setForm] = useState<SikampungFormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const nilaiIdm = useMemo(
    () => calculateNilaiIdm(form.iks, form.ike, form.ikl),
    [form.ike, form.ikl, form.iks],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      [
        record.kodeDesa,
        record.desa,
        record.distrik,
        record.kabupaten,
        formatIDM(record.iks),
        formatIDM(record.ike),
        formatIDM(record.ikl),
        formatIDM(record.nilaiIdm),
        record.statusIdm,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, records]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [sikampungResponse, kabKotaResponse] = await Promise.all([
        getSikampungData(),
        getKabKota(),
      ]);
      setRecords(sikampungResponse.items);
      setTahunAnggaran(sikampungResponse.tahunAnggaran);
      setKabKotaOptions(kabKotaResponse);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Data SIKAMPUNG atau master Kab/Kota gagal dimuat. Periksa koneksi atau sesi login.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const openCreateForm = () => {
    setEditingRecord(null);
    setForm(initialFormState);
    setFormOpen(true);
    setMessage("");
    setError("");
  };

  const openEditForm = (record: SikampungData) => {
    setEditingRecord(record);
    setForm({
      kodeDesa: record.kodeDesa,
      desa: record.desa,
      distrik: record.distrik,
      kabupaten: record.kabupaten,
      iks: formatIDM(record.iks),
      ike: formatIDM(record.ike),
      ikl: formatIDM(record.ikl),
      statusIdm: record.statusIdm,
    });
    setFormOpen(true);
    setMessage("");
    setError("");
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
    setForm(initialFormState);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildPayload(form, nilaiIdm);
    if (!payload) {
      setError("IKS, IKE, IKL, dan Nilai IDM harus berada pada rentang 0 sampai 1.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingRecord) {
        const updated = await updateSikampungData(editingRecord.id, payload);
        setRecords((current) =>
          current.map((record) => (record.id === updated.id ? updated : record)),
        );
        setMessage("Data kampung berhasil diperbarui.");
      } else {
        const created = await createSikampungData(payload);
        setRecords((current) => [created, ...current]);
        setMessage("Data kampung berhasil ditambahkan.");
      }
      closeForm();
    } catch (submitError) {
      console.error(submitError);
      setError("Data kampung gagal disimpan. Pastikan kode desa belum digunakan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteSikampungData(deleteTarget.id);
      setRecords((current) =>
        current.filter((record) => record.id !== deleteTarget.id),
      );
      setMessage("Data kampung berhasil dihapus.");
    } catch (deleteError) {
      console.error(deleteError);
      setError("Data kampung gagal dihapus.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={Database}
        eyebrow="SIKAMPUNG"
        title="Data Kampung IDM"
        description="Kelola data kampung berdasarkan kode desa, wilayah administrasi, indeks IKS/IKE/IKL, nilai IDM, dan status IDM."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {records.length} data kampung {tahunAnggaran ? `- ${tahunAnggaran}` : ""}
          </Badge>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={openCreateForm}
          >
            <Plus className="h-4 w-4" />
            Tambah Data Kampung
          </Button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      {formOpen ? (
        <SectionCard
          title={editingRecord ? "Edit Data Kampung" : "Tambah Data Kampung"}
          description="Nilai IDM dihitung otomatis dari rata-rata IKS, IKE, dan IKL sampai 4 desimal."
        >
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormInput
                label="Kode Desa"
                value={form.kodeDesa}
                onChange={(value) =>
                  setForm((current) => ({ ...current, kodeDesa: value }))
                }
                placeholder="9201072033"
              />
              <FormInput
                label="Desa"
                value={form.desa}
                onChange={(value) =>
                  setForm((current) => ({ ...current, desa: value }))
                }
                placeholder="Aimo"
              />
              <FormInput
                label="Distrik"
                value={form.distrik}
                onChange={(value) =>
                  setForm((current) => ({ ...current, distrik: value }))
                }
                placeholder="Aimas"
              />
              <FormSelect
                label="Kabupaten"
                value={form.kabupaten}
                options={kabKotaOptions.map((item) => item.nama)}
                placeholder={
                  kabKotaOptions.length
                    ? "Pilih Kabupaten"
                    : "Master Kab/Kota belum tersedia"
                }
                onChange={(value) =>
                  setForm((current) => ({ ...current, kabupaten: value }))
                }
              />
              <NumberInput
                label="IKS"
                value={form.iks}
                onChange={(value) =>
                  setForm((current) => ({ ...current, iks: value }))
                }
                placeholder="0.6571"
              />
              <NumberInput
                label="IKE"
                value={form.ike}
                onChange={(value) =>
                  setForm((current) => ({ ...current, ike: value }))
                }
                placeholder="0.4667"
              />
              <NumberInput
                label="IKL"
                value={form.ikl}
                onChange={(value) =>
                  setForm((current) => ({ ...current, ikl: value }))
                }
                placeholder="0.6000"
              />
              <FormInput
                label="Nilai IDM"
                value={Number.isNaN(nilaiIdm) ? "" : formatIDM(nilaiIdm)}
                onChange={() => undefined}
                placeholder="0.5746"
                readOnly
              />
              <FormSelect
                label="Status IDM"
                value={form.statusIdm}
                options={sikampungStatusIdmOptions}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    statusIdm: value as SikampungStatusIDM,
                  }))
                }
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeForm}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : editingRecord
                    ? "Simpan Perubahan"
                    : "Tambah Data"}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Tabel Data Kampung"
        description="Data tersimpan ke database berdasarkan tahun anggaran aktif."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg"
              disabled={filteredRecords.length === 0}
              onClick={() => downloadKampungCsv(filteredRecords)}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Cari kode, desa, distrik, kabupaten..."
              />
            </div>
          </div>
        }
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Desa</TableHead>
              <TableHead>Desa</TableHead>
              <TableHead>Distrik</TableHead>
              <TableHead>Kabupaten</TableHead>
              <TableHead className="text-right">IKS</TableHead>
              <TableHead className="text-right">IKE</TableHead>
              <TableHead className="text-right">IKL</TableHead>
              <TableHead className="text-right">Nilai IDM</TableHead>
              <TableHead>Status IDM</TableHead>
              <TableHead className="w-[96px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat data kampung...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-bold text-pbd-navy">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                        <MapPinned className="h-4 w-4" />
                      </div>
                      {record.kodeDesa}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {record.desa}
                  </TableCell>
                  <TableCell>{record.distrik}</TableCell>
                  <TableCell>{record.kabupaten}</TableCell>
                  <TableCell className="text-right">{formatIDM(record.iks)}</TableCell>
                  <TableCell className="text-right">{formatIDM(record.ike)}</TableCell>
                  <TableCell className="text-right">{formatIDM(record.ikl)}</TableCell>
                  <TableCell className="text-right font-bold text-pbd-navy">
                    {formatIDM(record.nilaiIdm)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={record.statusIdm} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Buka aksi untuk ${record.desa}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(record)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(record)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Belum ada data kampung yang sesuai dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data Kampung?"
        description={`Data ${deleteTarget?.desa ?? "kampung"} akan dihapus dari database SIKAMPUNG.`}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </main>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        required
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        type="number"
        min={0}
        max={1}
        step="0.0001"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        required
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: SikampungStatusIDM }) {
  const className =
    status === "Mandiri" || status === "Maju"
      ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
      : status === "Berkembang"
        ? "border border-blue-100 bg-blue-50 text-blue-700"
        : status === "Tertinggal"
          ? "border border-amber-100 bg-amber-50 text-amber-700"
          : "border border-red-100 bg-red-50 text-red-700";

  return <Badge className={className}>{status}</Badge>;
}

function calculateNilaiIdm(iks: string, ike: string, ikl: string) {
  const values = [Number(iks), Number(ike), Number(ikl)];

  if (values.some((value) => Number.isNaN(value))) {
    return Number.NaN;
  }

  return roundIDM(values.reduce((total, value) => total + value, 0) / 3);
}

function buildPayload(
  form: SikampungFormState,
  nilaiIdm: number,
): SikampungPayload | null {
  const iks = Number(form.iks);
  const ike = Number(form.ike);
  const ikl = Number(form.ikl);

  if (
    [iks, ike, ikl, nilaiIdm].some(
      (value) => Number.isNaN(value) || value < 0 || value > 1,
    )
  ) {
    return null;
  }

  return {
    kodeDesa: form.kodeDesa.trim(),
    desa: form.desa.trim(),
    distrik: form.distrik.trim(),
    kabupaten: form.kabupaten.trim(),
    iks: roundIDM(iks),
    ike: roundIDM(ike),
    ikl: roundIDM(ikl),
    nilaiIdm,
    statusIdm: form.statusIdm,
  };
}

function roundIDM(value: number) {
  return Math.round(value * 10000) / 10000;
}

function formatIDM(value: number) {
  return value.toFixed(4);
}

function downloadKampungCsv(records: SikampungData[]) {
  const rows = [
    [
      "Kode Desa",
      "Desa",
      "Distrik",
      "Kabupaten",
      "IKS",
      "IKE",
      "IKL",
      "Nilai IDM",
      "Status IDM",
    ],
    ...records.map((record) => [
      record.kodeDesa,
      record.desa,
      record.distrik,
      record.kabupaten,
      formatIDM(record.iks),
      formatIDM(record.ike),
      formatIDM(record.ikl),
      formatIDM(record.nilaiIdm),
      record.statusIdm,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = `data-kampung-idm-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(downloadUrl);
}
