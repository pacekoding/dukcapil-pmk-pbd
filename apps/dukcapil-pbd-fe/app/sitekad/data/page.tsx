"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
import { SectionCard } from "@/components/dashboard/section-card";
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
import {
  createSitekadPotensiKampung,
  deleteSitekadPotensiKampung,
  getSitekadOptions,
  getSitekadPotensiKampung,
  updateSitekadPotensiKampung,
} from "@/lib/api/sitekad";
import { cn } from "@/lib/utils";
import type {
  SitekadKampungOption,
  SitekadPotensiKampung,
  SitekadPotensiKampungPayload,
} from "@/types/sitekad";
import { sitekadKategoriUsahaOptions } from "@/types/sitekad";

const PAGE_SIZE = 10;

const initialFormState: SitekadPotensiKampungPayload = {
  kode: "",
  kabupatenKota: "",
  distrik: "",
  kampung: "",
  namaKelompok: "",
  kategoriUsaha: "Pertanian",
  komoditas: "",
  jumlahAnggota: 0,
  danaAlokasi: 0,
};

export default function SitekadDataPage() {
  const [records, setRecords] = useState<SitekadPotensiKampung[]>([]);
  const [kabupatenOptions, setKabupatenOptions] = useState<string[]>([]);
  const [kampungOptions, setKampungOptions] = useState<SitekadKampungOption[]>(
    [],
  );
  const [query, setQuery] = useState("");
  const [kabupatenFilter, setKabupatenFilter] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<SitekadPotensiKampung | null>(null);
  const [detailTarget, setDetailTarget] =
    useState<SitekadPotensiKampung | null>(null);
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
          setError("Data kelompok binaan SITEKAD gagal dimuat.");
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

  const distrikOptions = useMemo(
    () => getDistrikOptions(filteredKampungOptions),
    [filteredKampungOptions],
  );

  const desaOptions = useMemo(
    () => getKampungOptionsByDistrik(filteredKampungOptions, form.distrik),
    [filteredKampungOptions, form.distrik],
  );

  const selectedKampungValue =
    form.distrik && form.kampung
      ? makeKampungOptionValue(form.distrik, form.kampung)
      : "";

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return records.filter((record) => {
      if (
        kabupatenFilter &&
        normalizeKabupatenName(record.kabupatenKota) !==
          normalizeKabupatenName(kabupatenFilter)
      ) {
        return false;
      }
      if (kategoriFilter && record.kategoriUsaha !== kategoriFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return [
        record.kode,
        record.kabupatenKota,
        record.distrik,
        record.kampung,
        record.namaKelompok,
        record.kategoriUsaha,
        record.komoditas,
        String(record.jumlahAnggota),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [kabupatenFilter, kategoriFilter, query, records]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredRecords]);

  const openCreateForm = () => {
    setEditingRecord(null);
    setForm({
      ...initialFormState,
      kabupatenKota: kabupatenOptions[0] ?? "",
    });
    setError(null);
    setMessage(null);
    setFormOpen(true);
  };

  const openEditForm = (record: SitekadPotensiKampung) => {
    setDetailTarget(null);
    setEditingRecord(record);
    setForm({
      kode: record.kode,
      kabupatenKota: record.kabupatenKota,
      distrik: record.distrik,
      kampung: record.kampung,
      namaKelompok: record.namaKelompok || record.kode,
      kategoriUsaha: record.kategoriUsaha,
      komoditas: record.komoditas,
      jumlahAnggota: record.jumlahAnggota,
      danaAlokasi: record.danaAlokasi,
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
    setEditingRecord(null);
    setForm(initialFormState);
  };

  const handleKabupatenChange = (value: string) => {
    setForm((current) => ({
      ...current,
      kabupatenKota: value,
      distrik: "",
      kampung: "",
    }));
  };

  const handleDistrikChange = (value: string) => {
    setForm((current) => ({
      ...current,
      distrik: value,
      kampung: "",
    }));
  };

  const handleKampungChange = (value: string) => {
    const selected = desaOptions.find(
      (item) => makeKampungOptionValue(item.distrik, item.kampung) === value,
    );

    setForm((current) => ({
      ...current,
      distrik: selected?.distrik ?? current.distrik,
      kampung: selected?.kampung ?? "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: SitekadPotensiKampungPayload = {
      kode: form.kode.trim(),
      kabupatenKota: form.kabupatenKota.trim(),
      distrik: form.distrik.trim(),
      kampung: form.kampung.trim(),
      namaKelompok: form.namaKelompok.trim(),
      kategoriUsaha: form.kategoriUsaha,
      komoditas: form.komoditas.trim(),
      jumlahAnggota: Number(form.jumlahAnggota) || 0,
      danaAlokasi: Number(form.danaAlokasi) || 0,
    };

    if (
      !payload.kode ||
      !payload.kabupatenKota ||
      !payload.distrik ||
      !payload.kampung ||
      !payload.namaKelompok ||
      !payload.komoditas
    ) {
      setError("Seluruh informasi kelompok binaan wajib dilengkapi.");
      setMessage(null);
      return;
    }
    if (payload.jumlahAnggota <= 0) {
      setError("Jumlah anggota minimal 1 orang.");
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
      if (editingRecord) {
        const updated = await updateSitekadPotensiKampung(
          editingRecord.id,
          payload,
        );
        setRecords((currentRecords) =>
          currentRecords.map((record) =>
            record.id === editingRecord.id ? updated : record,
          ),
        );
        setMessage(`${updated.namaKelompok} berhasil diperbarui.`);
      } else {
        const created = await createSitekadPotensiKampung(payload);
        setRecords((currentRecords) => [created, ...currentRecords]);
        setMessage(`${created.namaKelompok} berhasil ditambahkan.`);
      }

      setFormOpen(false);
      setEditingRecord(null);
      setForm(initialFormState);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Data kelompok binaan gagal disimpan.",
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
      setMessage(`${deleteTarget.namaKelompok} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Data kelompok binaan gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const requestDelete = (record: SitekadPotensiKampung) => {
    setDetailTarget(null);
    setDeleteTarget(record);
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={UsersRound}
        eyebrow="SITEKAD"
        title="Data Kelompok Binaan"
        description="Data kelompok binaan Program TEKAD pada Kabupaten Maybrat dan Kabupaten Raja Ampat, lengkap dengan informasi wilayah, usaha, anggota, dan alokasi dana."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {loading ? "Memuat data..." : `${records.length} kelompok binaan`}
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
              ? "Edit Data Kelompok Binaan"
              : "Tambah Data Kelompok Binaan"
          }
          description="Lengkapi identitas, wilayah, usaha, dan hasil pendampingan kelompok Program TEKAD."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormInput
                label="Kode Data"
                value={form.kode}
                onChange={(value) =>
                  setForm((current) => ({ ...current, kode: value }))
                }
                placeholder="Contoh: TEKAD-001"
              />
              <FormInput
                label="Nama Kelompok"
                value={form.namaKelompok}
                onChange={(value) =>
                  setForm((current) => ({ ...current, namaKelompok: value }))
                }
                placeholder="Contoh: Kelompok Tani Rakam"
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
              <SearchableSelect
                label="Kecamatan/Distrik"
                value={form.distrik}
                fallbackLabel={form.distrik}
                options={distrikOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                onChange={handleDistrikChange}
                placeholder={
                  form.kabupatenKota
                    ? "Pilih kecamatan/distrik"
                    : "Pilih kabupaten dahulu"
                }
                searchPlaceholder="Cari kecamatan/distrik..."
                emptyText="Kecamatan/distrik tidak ditemukan."
                disabled={!form.kabupatenKota || distrikOptions.length === 0}
              />
              <SearchableSelect
                label="Desa/Kampung"
                value={selectedKampungValue}
                fallbackLabel={form.kampung}
                options={desaOptions.map((item) => ({
                  label: item.kampung,
                  value: makeKampungOptionValue(item.distrik, item.kampung),
                  description: item.distrik,
                }))}
                onChange={handleKampungChange}
                placeholder={
                  form.distrik
                    ? "Pilih desa/kampung"
                    : "Pilih kecamatan dahulu"
                }
                searchPlaceholder="Cari desa/kampung..."
                emptyText="Desa/kampung tidak ditemukan."
                disabled={!form.distrik || desaOptions.length === 0}
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
                label="Komoditas"
                value={form.komoditas}
                onChange={(value) =>
                  setForm((current) => ({ ...current, komoditas: value }))
                }
                placeholder="Contoh: Budidaya Ikan Nila"
              />
              <FormInput
                label="Jumlah Anggota"
                value={String(form.jumlahAnggota || "")}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    jumlahAnggota: Number(value.replace(/\D/g, "")) || 0,
                  }))
                }
                placeholder="Contoh: 12"
                inputMode="numeric"
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
            {kabupatenOptions.length === 0 || kampungOptions.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Data kabupaten, kecamatan, atau desa belum tersedia. Pastikan
                master data wilayah sudah tersimpan di database.
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
                  (!form.distrik && distrikOptions.length === 0)
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
        title="Daftar Kelompok Binaan"
        description="Cari dan filter kelompok binaan pada kabupaten lokus Program TEKAD."
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

        <div className="grid gap-3 border-b border-slate-200 p-5 lg:grid-cols-[minmax(260px,1.4fr)_minmax(200px,1fr)_minmax(200px,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="pl-9"
              placeholder="Cari nama kelompok, kampung, atau distrik..."
              aria-label="Cari kelompok binaan"
            />
          </div>
          <FilterSelect
            value={kabupatenFilter}
            onChange={(value) => {
              setKabupatenFilter(value);
              setPage(1);
            }}
            ariaLabel="Filter kabupaten"
            placeholder="Semua Kabupaten"
            options={kabupatenOptions}
          />
          <FilterSelect
            value={kategoriFilter}
            onChange={(value) => {
              setKategoriFilter(value);
              setPage(1);
            }}
            ariaLabel="Filter kategori usaha"
            placeholder="Semua Kategori"
            options={sitekadKategoriUsahaOptions}
          />
        </div>

        <Table className="min-w-[1360px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No.</TableHead>
              <TableHead>Kabupaten</TableHead>
              <TableHead>Distrik</TableHead>
              <TableHead>Kampung</TableHead>
              <TableHead>Nama Kelompok</TableHead>
              <TableHead>Kategori Usaha</TableHead>
              <TableHead>Komoditas</TableHead>
              <TableHead className="text-center">Anggota</TableHead>
              <TableHead>Dana Alokasi</TableHead>
              <TableHead className="w-[120px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat data kelompok binaan...
                </TableCell>
              </TableRow>
            ) : paginatedRecords.length > 0 ? (
              paginatedRecords.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell className="font-semibold text-slate-500">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell className="min-w-[150px] font-semibold text-slate-800">
                    {record.kabupatenKota}
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    {record.distrik || "-"}
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    {record.kampung}
                  </TableCell>
                  <TableCell className="min-w-[210px] whitespace-normal font-bold text-pbd-navy">
                    {record.namaKelompok || record.kode}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      {record.kategoriUsaha}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[180px] whitespace-normal">
                    {record.komoditas || "-"}
                  </TableCell>
                  <TableCell className="text-center font-bold text-pbd-navy">
                    {record.jumlahAnggota}
                  </TableCell>
                  <TableCell className="min-w-[170px] font-semibold text-pbd-navy">
                    {formatCurrency(record.danaAlokasi)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDetailTarget(record)}
                    >
                      <Eye className="h-4 w-4" />
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Tidak ada kelompok binaan yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {!loading ? (
          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredRecords.length}
            onPageChange={setPage}
          />
        ) : null}
      </SectionCard>

      <Dialog
        open={Boolean(detailTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTarget(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100svh-2rem)] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Kelompok Binaan</DialogTitle>
            <DialogDescription>
              Informasi lengkap kelompok binaan dan perkembangan Program TEKAD.
            </DialogDescription>
          </DialogHeader>

          {detailTarget ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Nama Kelompok">
                  {detailTarget.namaKelompok || detailTarget.kode}
                </DetailField>
                <DetailField label="Kode Data">
                  {detailTarget.kode}
                </DetailField>
                <DetailField label="Kabupaten">
                  {detailTarget.kabupatenKota}
                </DetailField>
                <DetailField label="Distrik / Kampung">
                  {[detailTarget.distrik, detailTarget.kampung]
                    .filter(Boolean)
                    .join(" / ")}
                </DetailField>
                <DetailField label="Kategori Usaha">
                  {detailTarget.kategoriUsaha}
                </DetailField>
                <DetailField label="Komoditas">
                  {detailTarget.komoditas || "-"}
                </DetailField>
                <DetailField label="Jumlah Anggota">
                  {detailTarget.jumlahAnggota} orang
                </DetailField>
                <DetailField label="Dana Alokasi">
                  {formatCurrency(detailTarget.danaAlokasi)}
                </DetailField>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailTarget(null)}
            >
              Tutup
            </Button>
            {detailTarget ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => requestDelete(detailTarget)}
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
                <Button
                  type="button"
                  className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
                  onClick={() => openEditForm(detailTarget)}
                >
                  <Edit className="h-4 w-4" />
                  Edit Data
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data Kelompok Binaan?"
        description={`Data ${deleteTarget?.namaKelompok || deleteTarget?.kode || "kelompok binaan"} akan dihapus dan tidak dapat dikembalikan.`}
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "numeric";
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        required={!disabled}
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
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={options.length === 0}
        className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

function SearchableSelect({
  label,
  value,
  fallbackLabel,
  options,
  onChange,
  placeholder = "Pilih data",
  searchPlaceholder = "Cari data...",
  emptyText = "Data tidak ditemukan.",
  disabled = false,
}: {
  label: string;
  value: string;
  fallbackLabel?: string;
  options: Array<{ label: string; value: string; description?: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? fallbackLabel;
  const visibleOptions = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      [option.label, option.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, searchQuery]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setSearchQuery("");
          setOpen((current) => !current);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          open && "border-ring ring-[3px] ring-ring/20",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selectedLabel && "text-slate-400",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                }
                if (event.key === "Escape") {
                  setOpen(false);
                  setSearchQuery("");
                }
              }}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
          <div
            role="listbox"
            className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-100"
          >
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                      selected && "bg-blue-50 text-pbd-navy",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="block truncate text-xs text-slate-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-center text-sm font-medium text-slate-500">
                {emptyText}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  ariaLabel,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-sm font-semibold leading-6 text-pbd-navy">
        {children}
      </div>
    </div>
  );
}

function getKampungOptionsByKabupaten(
  options: SitekadKampungOption[],
  kabupatenKota: string,
) {
  const uniqueOptions = new Map<string, SitekadKampungOption>();

  for (const option of options) {
    if (
      normalizeKabupatenName(option.kabupatenKota) !==
      normalizeKabupatenName(kabupatenKota)
    ) {
      continue;
    }

    const key = makeKampungOptionValue(option.distrik, option.kampung);
    if (!uniqueOptions.has(key)) {
      uniqueOptions.set(key, option);
    }
  }

  return Array.from(uniqueOptions.values());
}

function getDistrikOptions(options: SitekadKampungOption[]) {
  const uniqueOptions = new Set<string>();

  for (const option of options) {
    if (option.distrik.trim()) {
      uniqueOptions.add(option.distrik);
    }
  }

  return Array.from(uniqueOptions).sort((a, b) => a.localeCompare(b, "id"));
}

function getKampungOptionsByDistrik(
  options: SitekadKampungOption[],
  distrik: string,
) {
  const uniqueOptions = new Map<string, SitekadKampungOption>();

  for (const option of options) {
    if (option.distrik !== distrik) {
      continue;
    }

    const key = makeKampungOptionValue(option.distrik, option.kampung);
    if (!uniqueOptions.has(key)) {
      uniqueOptions.set(key, option);
    }
  }

  return Array.from(uniqueOptions.values());
}

function makeKampungOptionValue(distrik: string, kampung: string) {
  return `${distrik}::${kampung}`;
}

function normalizeKabupatenName(value: string) {
  return value
    .toLowerCase()
    .replace(/^(kabupaten|kota)\s+/, "")
    .trim();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
