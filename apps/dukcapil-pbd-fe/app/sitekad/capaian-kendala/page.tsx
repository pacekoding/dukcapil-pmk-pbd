"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Edit,
  ExternalLink,
  FileImage,
  MapPinned,
  Plus,
  Search,
  Trash2,
  Trophy,
  UsersRound,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createSitekadCapaianKendala,
  deleteSitekadCapaianKendala,
  getSitekadCapaianKendala,
  getSitekadPotensiKampung,
  updateSitekadCapaianKendala,
} from "@/lib/api/sitekad";
import {
  getCurrentTahunAnggaran,
  getTahunAnggaranOptions,
} from "@/lib/tahun-anggaran";
import type {
  SitekadCapaianKendala,
  SitekadCapaianKendalaPayload,
  SitekadPotensiKampung,
} from "@/types/sitekad";

const PAGE_SIZE = 6;
const MAX_DOCUMENTATION_LINKS = 3;

type FormState = {
  kelompokId: number;
  namaCapaian: string;
  tahunBinaan: string;
  deskripsiCapaian: string;
  kendalaHambatan: string;
  dokumentasiUrls: string[];
};

function initialFormState(): FormState {
  return {
    kelompokId: 0,
    namaCapaian: "",
    tahunBinaan: getCurrentTahunAnggaran(),
    deskripsiCapaian: "",
    kendalaHambatan: "",
    dokumentasiUrls: Array.from(
      { length: MAX_DOCUMENTATION_LINKS },
      () => "",
    ),
  };
}

export default function SitekadCapaianKendalaPage() {
  const [records, setRecords] = useState<SitekadCapaianKendala[]>([]);
  const [kelompok, setKelompok] = useState<SitekadPotensiKampung[]>([]);
  const [query, setQuery] = useState("");
  const [kabupatenFilter, setKabupatenFilter] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [tahunFilter, setTahunFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<SitekadCapaianKendala | null>(null);
  const [detailTarget, setDetailTarget] =
    useState<SitekadCapaianKendala | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SitekadCapaianKendala | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [capaianData, kelompokData] = await Promise.all([
          getSitekadCapaianKendala(),
          getSitekadPotensiKampung(),
        ]);
        if (mounted) {
          setRecords(capaianData.items ?? []);
          setKelompok(kelompokData.items ?? []);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data capaian dan kendala SITEKAD gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const kabupatenOptions = useMemo(
    () =>
      Array.from(
        new Set(
          kelompok.map((item) => item.kabupatenKota).filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [kelompok],
  );

  const kategoriOptions = useMemo(
    () =>
      Array.from(
        new Set(kelompok.map((item) => item.kategoriUsaha).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [kelompok],
  );

  const tahunOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...getTahunAnggaranOptions(),
          ...records.map((record) => record.tahunBinaan),
          form.tahunBinaan,
        ]),
      )
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a)),
    [form.tahunBinaan, records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const group = record.kelompok;
      if (kabupatenFilter && group.kabupatenKota !== kabupatenFilter) {
        return false;
      }
      if (kategoriFilter && group.kategoriUsaha !== kategoriFilter) {
        return false;
      }
      if (tahunFilter && record.tahunBinaan !== tahunFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return [
        record.namaCapaian,
        record.deskripsiCapaian,
        record.kendalaHambatan,
        group.namaKelompok,
        group.kode,
        group.kabupatenKota,
        group.distrik,
        group.kampung,
        group.kategoriUsaha,
        group.komoditas,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [kabupatenFilter, kategoriFilter, query, records, tahunFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredRecords]);

  const stats = useMemo(() => {
    const kelompokTerlibat = new Set(records.map((record) => record.kelompokId));
    const kabupaten = new Set(
      records.map((record) => record.kelompok.kabupatenKota).filter(Boolean),
    );
    const kendala = records.filter((record) =>
      record.kendalaHambatan.trim(),
    ).length;

    return [
      {
        label: "Total Capaian",
        value: loading ? "..." : String(records.length),
        description: "Riwayat terdokumentasi",
        icon: Trophy,
        tone: "emerald" as const,
      },
      {
        label: "Kelompok Terlibat",
        value: loading ? "..." : String(kelompokTerlibat.size),
        description: "Kelompok memiliki capaian",
        icon: UsersRound,
        tone: "blue" as const,
      },
      {
        label: "Kendala Dicatat",
        value: loading ? "..." : String(kendala),
        description: "Hambatan lapangan",
        icon: AlertTriangle,
        tone: "amber" as const,
      },
      {
        label: "Kabupaten Lokus",
        value: loading ? "..." : String(kabupaten.size),
        description: "Wilayah capaian",
        icon: MapPinned,
        tone: "indigo" as const,
      },
    ];
  }, [loading, records]);

  const selectedGroup = useMemo(
    () => kelompok.find((item) => item.id === form.kelompokId) ?? null,
    [form.kelompokId, kelompok],
  );

  const openCreateForm = () => {
    if (kelompok.length === 0) {
      setError("Tambahkan data kelompok binaan terlebih dahulu.");
      setMessage(null);
      return;
    }

    setEditingRecord(null);
    setForm({ ...initialFormState(), kelompokId: kelompok[0].id });
    setError(null);
    setMessage(null);
    setFormOpen(true);
  };

  const openEditForm = (record: SitekadCapaianKendala) => {
    setDetailTarget(null);
    setEditingRecord(record);
    setForm({
      kelompokId: record.kelompokId,
      namaCapaian: record.namaCapaian,
      tahunBinaan: record.tahunBinaan,
      deskripsiCapaian: record.deskripsiCapaian,
      kendalaHambatan: record.kendalaHambatan,
      dokumentasiUrls: Array.from(
        { length: MAX_DOCUMENTATION_LINKS },
        (_, index) => record.dokumentasiUrls[index] ?? "",
      ),
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
    setForm(initialFormState());
  };

  const updateDocumentationURL = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      dokumentasiUrls: current.dokumentasiUrls.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dokumentasiUrls = Array.from(
      new Set(form.dokumentasiUrls.map((value) => value.trim()).filter(Boolean)),
    );
    const payload: SitekadCapaianKendalaPayload = {
      kelompokId: form.kelompokId,
      namaCapaian: form.namaCapaian.trim(),
      tahunBinaan: form.tahunBinaan.trim(),
      deskripsiCapaian: form.deskripsiCapaian.trim(),
      kendalaHambatan: form.kendalaHambatan.trim(),
      dokumentasiUrls,
    };

    if (
      payload.kelompokId <= 0 ||
      !payload.namaCapaian ||
      !payload.tahunBinaan ||
      !payload.deskripsiCapaian
    ) {
      setError("Kelompok, nama capaian, tahun, dan deskripsi wajib diisi.");
      setMessage(null);
      return;
    }
    if (dokumentasiUrls.some((value) => !isValidHttpURL(value))) {
      setError("Tautan dokumentasi harus berupa URL HTTP/HTTPS yang valid.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingRecord) {
        const updated = await updateSitekadCapaianKendala(
          editingRecord.id,
          payload,
        );
        setRecords((current) =>
          current.map((record) =>
            record.id === editingRecord.id ? updated : record,
          ),
        );
        setMessage(`${updated.namaCapaian} berhasil diperbarui.`);
      } else {
        const created = await createSitekadCapaianKendala(payload);
        setRecords((current) => [created, ...current]);
        setMessage(`${created.namaCapaian} berhasil ditambahkan.`);
      }

      setFormOpen(false);
      setEditingRecord(null);
      setForm(initialFormState());
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Data capaian dan kendala gagal disimpan.",
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
      await deleteSitekadCapaianKendala(deleteTarget.id);
      setRecords((current) =>
        current.filter((record) => record.id !== deleteTarget.id),
      );
      setMessage(`${deleteTarget.namaCapaian} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Data capaian dan kendala gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={Trophy}
        eyebrow="SITEKAD"
        title="Capaian & Kendala Program"
        description="Dokumentasikan perkembangan, hasil kegiatan, hambatan lapangan, dan bukti pendukung setiap kelompok binaan Program TEKAD."
        meta={
          <Badge className="h-8 rounded-full bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
            {loading ? "Memuat data..." : `${records.length} capaian tercatat`}
          </Badge>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={openCreateForm}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            Tambah Capaian
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {kelompok.length === 0 && !loading ? (
        <SectionCard
          title="Data Kelompok Belum Tersedia"
          description="Setiap capaian harus terhubung dengan satu kelompok binaan."
        >
          <Button asChild className="bg-pbd-navy text-white hover:bg-pbd-navy/90">
            <Link href="/sitekad/data">
              <UsersRound className="h-4 w-4" />
              Tambah Kelompok Binaan
            </Link>
          </Button>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Capaian & Kendala"
        description="Gunakan pencarian dan filter untuk menemukan riwayat perkembangan kelompok."
        contentClassName="p-0"
      >
        <div className="grid gap-3 border-b border-slate-200 p-5 lg:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(170px,1fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="pl-9"
              placeholder="Cari capaian, kelompok, kampung, atau komoditas..."
              aria-label="Cari capaian dan kendala"
            />
          </div>
          <FilterSelect
            value={kabupatenFilter}
            onChange={(value) => {
              setKabupatenFilter(value);
              setPage(1);
            }}
            label="Semua Kabupaten"
            options={kabupatenOptions}
          />
          <FilterSelect
            value={kategoriFilter}
            onChange={(value) => {
              setKategoriFilter(value);
              setPage(1);
            }}
            label="Semua Kategori"
            options={kategoriOptions}
          />
          <FilterSelect
            value={tahunFilter}
            onChange={(value) => {
              setTahunFilter(value);
              setPage(1);
            }}
            label="Semua Tahun"
            options={tahunOptions}
          />
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-sm font-medium text-slate-500">
              Memuat capaian dan kendala...
            </div>
          ) : paginatedRecords.length > 0 ? (
            paginatedRecords.map((record) => (
              <CapaianCard
                key={record.id}
                record={record}
                onDetail={() => setDetailTarget(record)}
                onEdit={() => openEditForm(record)}
                onDelete={() => setDeleteTarget(record)}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <Trophy className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Belum ada capaian yang sesuai dengan filter.
              </p>
            </div>
          )}
        </div>

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
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeForm();
          }
        }}
      >
        <DialogContent className="max-h-[calc(100svh-2rem)] max-w-4xl overflow-y-auto p-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b border-slate-200 bg-slate-50/60 p-6 text-left">
              <DialogTitle>
                {editingRecord
                  ? "Edit Capaian & Kendala"
                  : "Tambah Capaian & Kendala"}
              </DialogTitle>
              <DialogDescription>
                Pilih kelompok binaan lalu isi hasil perkembangan dan hambatan lapangan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 p-6">
              <label className="grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <span className="text-sm font-bold text-emerald-800">
                  Pilih Kelompok Binaan <Required />
                </span>
                <select
                  value={String(form.kelompokId || "")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      kelompokId: Number(event.target.value),
                    }))
                  }
                  className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  required
                >
                  <option value="" disabled>
                    Pilih kelompok binaan
                  </option>
                  {kelompok.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.namaKelompok} — {item.kampung}, {item.distrik}
                    </option>
                  ))}
                </select>
                <span className="text-xs leading-5 text-emerald-700">
                  Wilayah, kategori usaha, dan komoditas mengikuti data kelompok terpilih.
                </span>
              </label>

              {selectedGroup ? (
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ReadonlyField label="Kabupaten" value={selectedGroup.kabupatenKota} />
                  <ReadonlyField label="Distrik / Kampung" value={`${selectedGroup.distrik} / ${selectedGroup.kampung}`} />
                  <ReadonlyField label="Kategori" value={selectedGroup.kategoriUsaha} />
                  <ReadonlyField label="Komoditas" value={selectedGroup.komoditas} />
                </div>
              ) : null}

              <FormField label="Nama Capaian / Produk" required>
                <Input
                  value={form.namaCapaian}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      namaCapaian: event.target.value,
                    }))
                  }
                  maxLength={200}
                  placeholder="Contoh: Keripik Keladi Kemasan"
                  required
                />
              </FormField>

              <FormField label="Tahun Binaan" required>
                <select
                  value={form.tahunBinaan}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tahunBinaan: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  required
                >
                  {tahunOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Deskripsi Capaian" required>
                <Textarea
                  value={form.deskripsiCapaian}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deskripsiCapaian: event.target.value,
                    }))
                  }
                  maxLength={5000}
                  className="min-h-28 bg-white"
                  placeholder="Jelaskan hasil, perkembangan, atau produk yang berhasil dicapai..."
                  required
                />
              </FormField>

              <FormField label="Kendala / Hambatan">
                <Textarea
                  value={form.kendalaHambatan}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      kendalaHambatan: event.target.value,
                    }))
                  }
                  maxLength={5000}
                  className="min-h-24 bg-white"
                  placeholder="Catat kendala teknis, logistik, pemasaran, atau hambatan lainnya..."
                />
              </FormField>

              <div className="space-y-3 border-t border-slate-200 pt-5">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-pbd-navy">
                    <FileImage className="h-4 w-4 text-emerald-700" />
                    Tautan Foto Dokumentasi / Google Drive
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Opsional, maksimal tiga tautan HTTP/HTTPS.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {form.dokumentasiUrls.map((value, index) => (
                    <Input
                      key={index}
                      type="url"
                      value={value}
                      onChange={(event) =>
                        updateDocumentationURL(index, event.target.value)
                      }
                      maxLength={2048}
                      placeholder={`Tautan dokumentasi ${index + 1}`}
                      aria-label={`Tautan dokumentasi ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {error && formOpen ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <DialogFooter className="border-t border-slate-200 bg-slate-50/60 p-5">
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
                disabled={saving || kelompok.length === 0}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {saving
                  ? "Menyimpan..."
                  : editingRecord
                    ? "Simpan Perubahan"
                    : "Simpan Capaian"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <DialogTitle>Detail Capaian & Kendala</DialogTitle>
            <DialogDescription>
              Riwayat perkembangan kelompok binaan Program TEKAD.
            </DialogDescription>
          </DialogHeader>

          {detailTarget ? <CapaianDetail record={detailTarget} /> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailTarget(null)}
            >
              Tutup
            </Button>
            {detailTarget ? (
              <Button
                type="button"
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
                onClick={() => openEditForm(detailTarget)}
              >
                <Edit className="h-4 w-4" />
                Edit Data
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Capaian & Kendala?"
        description={
          deleteTarget
            ? `${deleteTarget.namaCapaian} akan dihapus permanen dari riwayat kelompok ${deleteTarget.kelompok.namaKelompok}.`
            : "Data capaian akan dihapus permanen."
        }
        loading={deleting}
        confirmLabel="Hapus Capaian"
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

function CapaianCard({
  record,
  onDetail,
  onEdit,
  onDelete,
}: {
  record: SitekadCapaianKendala;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const group = record.kelompok;

  return (
    <article className="flex min-h-[430px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="relative overflow-hidden bg-gradient-to-br from-pbd-navy via-slate-800 to-emerald-900 p-5 text-white">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-white/10 bg-white/5" />
        <div className="relative flex items-center justify-between gap-3">
          <Badge className="border-0 bg-amber-300 text-amber-950">
            <MapPinned className="h-3.5 w-3.5" />
            {group.kabupatenKota}
          </Badge>
          <Badge className="border border-white/20 bg-white/10 text-white">
            {record.tahunBinaan}
          </Badge>
        </div>
        <p className="relative mt-5 text-xs font-bold uppercase tracking-wide text-emerald-300">
          {group.kategoriUsaha}
        </p>
        <h2 className="relative mt-1 line-clamp-2 text-lg font-extrabold leading-6">
          {record.namaCapaian}
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="border-b border-slate-100 pb-4">
          <p className="flex items-start gap-2 font-bold text-pbd-navy">
            <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <span className="line-clamp-1">{group.namaKelompok}</span>
          </p>
          <p className="mt-1 pl-6 text-sm text-slate-500">
            {group.distrik}, Kampung {group.kampung}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Capaian / Dokumentasi
          </p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
            {record.deskripsiCapaian}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Kendala Lapangan
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">
            {record.kendalaHambatan || "Tidak ada kendala yang dicatat."}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <FileImage className="h-4 w-4" />
            {record.dokumentasiUrls.length} dokumentasi
          </span>
          <div className="flex gap-1">
            <Button type="button" size="icon" variant="ghost" onClick={onEdit} aria-label={`Edit ${record.namaCapaian}`}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onDelete} aria-label={`Hapus ${record.namaCapaian}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" className="bg-pbd-navy text-white hover:bg-pbd-navy/90" onClick={onDetail}>
              Detail
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CapaianDetail({ record }: { record: SitekadCapaianKendala }) {
  const group = record.kelompok;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailField label="Nama Capaian / Produk">{record.namaCapaian}</DetailField>
        <DetailField label="Tahun Binaan">{record.tahunBinaan}</DetailField>
        <DetailField label="Kelompok Binaan">{group.namaKelompok}</DetailField>
        <DetailField label="Kode Kelompok">{group.kode}</DetailField>
        <DetailField label="Wilayah">
          {group.kabupatenKota} / {group.distrik} / {group.kampung}
        </DetailField>
        <DetailField label="Usaha / Komoditas">
          {group.kategoriUsaha} / {group.komoditas}
        </DetailField>
      </div>
      <DetailField label="Deskripsi Capaian">{record.deskripsiCapaian}</DetailField>
      <DetailField label="Kendala / Hambatan">
        {record.kendalaHambatan || "Tidak ada kendala yang dicatat."}
      </DetailField>
      <DetailField label="Dokumentasi">
        {record.dokumentasiUrls.length > 0 ? (
          <div className="space-y-2">
            {record.dokumentasiUrls.map((value, index) => (
              <a
                key={value}
                href={value}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-pbd-blue hover:underline"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">Dokumentasi {index + 1}: {value}</span>
              </a>
            ))}
          </div>
        ) : (
          "Belum ada tautan dokumentasi."
        )}
      </DetailField>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">
        {label} {required ? <Required /> : null}
      </span>
      {children}
    </label>
  );
}

function Required() {
  return <span className="text-red-600">*</span>;
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-pbd-navy">
        {value || "-"}
      </p>
    </div>
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
      <div className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-pbd-navy">
        {children}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function isValidHttpURL(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
