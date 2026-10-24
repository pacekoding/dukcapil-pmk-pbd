"use client";

/* eslint-disable @typescript-eslint/no-unused-vars -- legacy inline form is kept inert during route migration */

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
import { Pagination } from "@/components/dashboard/pagination";
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

const PAGE_SIZE = 10;
const legacyInlineCrudEnabled: boolean = false;

export default function InternalSikampungDataPage() {
  const [records, setRecords] = useState<SikampungData[]>([]);
  const [kabKotaOptions, setKabKotaOptions] = useState<KabKota[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SikampungData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SikampungData | null>(null);
  const [form, setForm] = useState<SikampungFormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const requestIdRef = useRef(0);

  const nilaiIdm = useMemo(
    () => calculateNilaiIdm(form.iks, form.ike, form.ikl),
    [form.ike, form.ikl, form.iks],
  );

  const loadData = useCallback(async (targetPage: number, search: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const sikampungResponse = await getSikampungData({
        page: targetPage,
        pageSize: PAGE_SIZE,
        search,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setRecords(sikampungResponse.items);
      setTahunAnggaran(sikampungResponse.tahunAnggaran);
      setTotal(sikampungResponse.total);
      setPage(sikampungResponse.page);
    } catch (loadError) {
      console.error(loadError);
      if (requestId === requestIdRef.current) {
        setError(
          "Data kampung gagal dimuat. Periksa koneksi atau sesi login.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData(page, query);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadData, page, query]);

  useEffect(() => {
    let mounted = true;

    const loadKabKotaOptions = async () => {
      try {
        const response = await getKabKota();
        if (mounted) {
          setKabKotaOptions(response);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Master Kab/Kota gagal dimuat.");
        }
      }
    };

    void loadKabKotaOptions();
    return () => {
      mounted = false;
    };
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
        await updateSikampungData(editingRecord.id, payload);
        setMessage("Data kampung berhasil diperbarui.");
        closeForm();
        await loadData(page, query);
      } else {
        await createSikampungData(payload);
        setMessage("Data kampung berhasil ditambahkan.");
        closeForm();
        if (page === 1) {
          await loadData(1, query);
        } else {
          setPage(1);
        }
      }
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
      setMessage("Data kampung berhasil dihapus.");
      const targetPage = records.length === 1 && page > 1 ? page - 1 : page;
      if (targetPage === page) {
        await loadData(targetPage, query);
      } else {
        setPage(targetPage);
      }
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
        eyebrow="Data Kampung"
        title="Data Kampung IDM"
        description="Kelola data kampung berdasarkan kode desa, wilayah administrasi, indeks IKS/IKE/IKL, nilai IDM, dan status IDM."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {total} data kampung {tahunAnggaran ? `- ${tahunAnggaran}` : ""}
          </Badge>
        }
        aside={
          <Button asChild className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90">
            <Link href="/internal/pmk/data-kampung/add">
            <Plus className="h-4 w-4" />
            Tambah Data Kampung
            </Link>
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

      {legacyInlineCrudEnabled && formOpen ? (
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
              disabled={records.length === 0}
              onClick={() => downloadKampungCsv(records)}
            >
              <Download className="h-4 w-4" />
              Download CSV Halaman Ini
            </Button>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
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
            ) : records.length > 0 ? (
              records.map((record) => (
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
                        <DropdownMenuItem asChild>
                          <Link href={`/internal/pmk/data-kampung/${record.id}/preview`}>Lihat</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/internal/pmk/data-kampung/${record.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          Edit
                          </Link>
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
                  {query.trim()
                    ? "Belum ada data kampung yang sesuai dengan pencarian."
                    : "Belum ada data kampung."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {!loading && total > 0 ? (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        ) : null}
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data Kampung?"
        description={`Data ${deleteTarget?.desa ?? "kampung"} akan dihapus dari basis data kampung.`}
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
