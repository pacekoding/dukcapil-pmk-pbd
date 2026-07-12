"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ClipboardList,
  Edit,
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
import {
  createSitekadPotensiKampung,
  deleteSitekadPotensiKampung,
  getSitekadOptions,
  getSitekadPotensiKampung,
  updateSitekadPotensiKampung,
} from "@/lib/api/sitekad";
import type {
  SitekadKampungOption,
  SitekadPotensiKampung,
  SitekadPotensiKampungPayload,
} from "@/types/sitekad";
import { sitekadKategoriUsahaOptions } from "@/types/sitekad";

const initialFormState: SitekadPotensiKampungPayload = {
  kode: "",
  kabupatenKota: "",
  kampung: "",
  kategoriUsaha: "Pertanian",
  danaAlokasi: 0,
  capaianUtama: "",
  kendalaLapangan: "",
};

export default function SitekadDataPage() {
  const [records, setRecords] = useState<SitekadPotensiKampung[]>([]);
  const [kabupatenOptions, setKabupatenOptions] = useState<string[]>([]);
  const [kampungOptions, setKampungOptions] = useState<SitekadKampungOption[]>(
    [],
  );
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SitekadPotensiKampung | null>(null);
  const [form, setForm] =
    useState<SitekadPotensiKampungPayload>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRecords = async () => {
      try {
        const [data, options] = await Promise.all([
          getSitekadPotensiKampung(),
          getSitekadOptions(),
        ]);
        if (mounted) {
          setRecords(data.items);
          setKabupatenOptions(options.kabupatenKota);
          setKampungOptions(options.kampung ?? []);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data SiTEKAD gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadRecords();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredKampungOptions = useMemo(
    () => getKampungOptionsByKabupaten(kampungOptions, form.kabupatenKota),
    [form.kabupatenKota, kampungOptions],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      [
        record.kode,
        record.kabupatenKota,
        record.kampung,
        record.kategoriUsaha,
        record.capaianUtama,
        record.kendalaLapangan,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, records]);

  const editingRecord = editingId
    ? records.find((record) => record.id === editingId)
    : null;

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...initialFormState,
      kabupatenKota: kabupatenOptions[0] ?? "",
    });
    setError(null);
    setMessage(null);
    setFormOpen(true);
  };

  const openEditForm = (record: SitekadPotensiKampung) => {
    setEditingId(record.id);
    setForm({
      kode: record.kode,
      kabupatenKota: record.kabupatenKota,
      kampung: record.kampung,
      kategoriUsaha: record.kategoriUsaha,
      danaAlokasi: record.danaAlokasi,
      capaianUtama: record.capaianUtama,
      kendalaLapangan: record.kendalaLapangan,
    });
    setError(null);
    setMessage(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingId(null);
    setForm(initialFormState);
  };

  const handleKabupatenChange = (value: string) => {
    const availableKampung = getKampungOptionsByKabupaten(
      kampungOptions,
      value,
    );
    setForm((current) => ({
      ...current,
      kabupatenKota: value,
      kampung: availableKampung.some((item) => item.kampung === current.kampung)
        ? current.kampung
        : "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: SitekadPotensiKampungPayload = {
      kode: form.kode.trim(),
      kabupatenKota: form.kabupatenKota.trim(),
      kampung: form.kampung.trim(),
      kategoriUsaha: form.kategoriUsaha,
      danaAlokasi: Number(form.danaAlokasi) || 0,
      capaianUtama: form.capaianUtama.trim(),
      kendalaLapangan: form.kendalaLapangan.trim(),
    };

    if (
      !payload.kode ||
      !payload.kabupatenKota ||
      !payload.kampung ||
      !payload.capaianUtama ||
      !payload.kendalaLapangan
    ) {
      setError("Kode, kabupaten, kampung, capaian, dan kendala wajib diisi.");
      setMessage(null);
      return;
    }
    if (payload.danaAlokasi < 0) {
      setError("Dana alokasi tidak boleh bernilai negatif.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        const updated = await updateSitekadPotensiKampung(editingId, payload);
        setRecords((currentRecords) =>
          currentRecords.map((record) =>
            record.id === editingId ? updated : record,
          ),
        );
        setMessage(`${updated.kode} berhasil diperbarui.`);
      } else {
        const created = await createSitekadPotensiKampung(payload);
        setRecords((currentRecords) => [created, ...currentRecords]);
        setMessage(`${created.kode} berhasil ditambahkan.`);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(initialFormState);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Data SiTEKAD gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      await deleteSitekadPotensiKampung(deleteTarget.id);
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== deleteTarget.id),
      );
      setMessage("Data SiTEKAD berhasil dihapus.");
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Data SiTEKAD gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={ClipboardList}
        eyebrow="SiTEKAD"
        title="Data Potensi Kampung"
        description="Input dan kelola data evaluasi potensi kampung. Kabupaten dan nama kampung diambil dari data wilayah yang sudah tersedia di database."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {records.length} data potensi kampung
          </Badge>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={openCreateForm}
          >
            <Plus className="h-4 w-4" />
            Tambah Data
          </Button>
        }
      />

      {formOpen ? (
        <SectionCard
          title={
            editingRecord
              ? "Edit Data Evaluasi Kampung"
              : "Input Data Evaluasi Kampung"
          }
          description="Lengkapi data potensi kampung sesuai formulir SiTEKAD."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="ID Data Kampung (Kode)"
                value={form.kode}
                onChange={(value) =>
                  setForm((current) => ({ ...current, kode: value }))
                }
                placeholder="Contoh: TEKAD-11"
              />
              <FormSelect
                label="Kabupaten"
                value={form.kabupatenKota}
                options={kabupatenOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                onChange={handleKabupatenChange}
                placeholder="Pilih kabupaten"
              />
              <FormSelect
                label="Nama Kampung"
                value={form.kampung}
                options={filteredKampungOptions.map((item) => ({
                  label: item.distrik
                    ? `${item.kampung} - ${item.distrik}`
                    : item.kampung,
                  value: item.kampung,
                }))}
                onChange={(value) =>
                  setForm((current) => ({ ...current, kampung: value }))
                }
                placeholder="Pilih kampung"
              />
              <FormSelect
                label="Kategori Usaha"
                value={form.kategoriUsaha}
                options={sitekadKategoriUsahaOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    kategoriUsaha:
                      value as SitekadPotensiKampungPayload["kategoriUsaha"],
                  }))
                }
              />
              <FormInput
                label="Dana Alokasi (Rupiah)"
                value={String(form.danaAlokasi || "")}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    danaAlokasi: Number(value.replace(/\D/g, "")) || 0,
                  }))
                }
                placeholder="Contoh: 100000000"
                inputMode="numeric"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormTextarea
                label="Capaian Utama"
                value={form.capaianUtama}
                onChange={(value) =>
                  setForm((current) => ({ ...current, capaianUtama: value }))
                }
                placeholder="Sebutkan hasil kemajuan kelompok tani..."
              />
              <FormTextarea
                label="Kendala Lapangan"
                value={form.kendalaLapangan}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    kendalaLapangan: value,
                  }))
                }
                placeholder="Sebutkan masalah logistik atau teknis..."
              />
            </div>
            {kabupatenOptions.length === 0 || kampungOptions.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Data kabupaten atau kampung belum tersedia. Pastikan data
                wilayah/kampung sudah tersimpan di database.
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={closeForm}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  kabupatenOptions.length === 0 ||
                  filteredKampungOptions.length === 0
                }
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
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
        title="Daftar Potensi Kampung"
        description="Data SiTEKAD tersimpan ke database dan dapat dikelola kembali dari halaman ini."
        action={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Cari kode, kampung, kategori..."
            />
          </div>
        }
        contentClassName="p-0"
      >
        {message ? (
          <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Kabupaten</TableHead>
              <TableHead>Kampung</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Dana Alokasi</TableHead>
              <TableHead>Capaian</TableHead>
              <TableHead className="w-[96px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat data SiTEKAD...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="min-w-[140px] font-bold text-pbd-navy">
                    {record.kode}
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    {record.kabupatenKota}
                  </TableCell>
                  <TableCell className="min-w-[180px] font-semibold text-slate-800">
                    {record.kampung}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.kategoriUsaha}</Badge>
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    {formatCurrency(record.danaAlokasi)}
                  </TableCell>
                  <TableCell className="min-w-[240px] max-w-sm">
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                      {record.capaianUtama}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Buka aksi untuk ${record.kode}`}
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
                  colSpan={7}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Tidak ada data yang sesuai dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data SiTEKAD?"
        description={`Data ${deleteTarget?.kode ?? "SiTEKAD"} akan dihapus dan tidak dapat dikembalikan.`}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </main>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "numeric";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        required
      />
    </label>
  );
}

function FormTextarea({
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
      <span className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
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
  placeholder = "Pilih data",
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={options.length === 0}
        className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        required
      >
        {value === "" ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getKampungOptionsByKabupaten(
  options: SitekadKampungOption[],
  kabupatenKota: string,
) {
  const uniqueByKampung = new Map<string, SitekadKampungOption>();

  for (const option of options) {
    if (option.kabupatenKota !== kabupatenKota) {
      continue;
    }
    if (!uniqueByKampung.has(option.kampung)) {
      uniqueByKampung.set(option.kampung, option);
    }
  }

  return Array.from(uniqueByKampung.values());
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
