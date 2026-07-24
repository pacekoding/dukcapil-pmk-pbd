"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Edit,
  Eye,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { Pagination } from "@/components/dashboard/pagination";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createMacekuPKKProfile,
  deleteMacekuPKKProfile,
  getMacekuPKKOptions,
  getMacekuPKKProfiles,
  updateMacekuPKKProfile,
} from "@/lib/api/maceku-pkk";
import {
  IMAGE_FILE_ACCEPT,
  validateClientUpload,
} from "@/lib/api/file-policy";
import type {
  MacekuPKKListFilters,
  MacekuPKKOptionsResponse,
  MacekuPKKProfileSummary,
  SaveMacekuPKKProfilePayload,
} from "@/types/maceku-pkk";

const initialFormState: SaveMacekuPKKProfilePayload = {
  name: "",
  kabupatenKota: "",
  distrik: "",
  kampung: "",
  secretariatAddress: "",
  chairperson: "",
  secretary: "",
  phone: "",
  email: "",
  managementPeriod: "",
  description: "",
  isActive: true,
  logo: null,
};

const levelOptions = [
  "PKK Kabupaten/Kota",
  "PKK Kecamatan/Distrik",
  "PKK Desa/Kampung",
] as const;

export default function MacekuPkkDataPage() {
  const [items, setItems] = useState<MacekuPKKProfileSummary[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [options, setOptions] = useState<MacekuPKKOptionsResponse>({
    kabupatenKota: [],
    distrik: [],
    kampung: [],
  });
  const [filters, setFilters] = useState<MacekuPKKListFilters>({
    search: "",
    level: "",
    kabupatenKota: "",
    distrik: "",
    kampung: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MacekuPKKProfileSummary | null>(null);
  const [form, setForm] = useState<SaveMacekuPKKProfilePayload>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MacekuPKKProfileSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const response = await getMacekuPKKOptions();
        if (mounted) {
          setOptions(response);
        }
      } catch (loadError) {
        console.error(loadError);
      }
    };

    void loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      setLoading(true);
      try {
        const response = await getMacekuPKKProfiles(filters);
        if (mounted) {
          setItems(response.items);
          setMeta(response.meta);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setItems([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data profil PKK gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadItems();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const filterDistrikOptions = useMemo(
    () =>
      options.distrik.filter(
        (item) =>
          !filters.kabupatenKota || item.kabupatenKota === filters.kabupatenKota,
      ),
    [filters.kabupatenKota, options.distrik],
  );

  const filterKampungOptions = useMemo(
    () =>
      options.kampung.filter(
        (item) =>
          (!filters.kabupatenKota ||
            item.kabupatenKota === filters.kabupatenKota) &&
          (!filters.distrik || item.distrik === filters.distrik),
      ),
    [filters.distrik, filters.kabupatenKota, options.kampung],
  );

  const openCreateForm = () => {
    setEditing(null);
    setForm(initialFormState);
    setError(null);
    setMessage(null);
    setFormOpen(true);
  };

  const openEditForm = (item: MacekuPKKProfileSummary) => {
    setEditing(item);
    setForm({
      ...initialFormState,
      name: item.name,
      kabupatenKota: item.kabupatenKota,
      distrik: item.distrik,
      kampung: item.kampung,
      chairperson: item.chairperson,
      managementPeriod: item.managementPeriod,
      isActive: item.isActive,
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
    setEditing(null);
    setForm(initialFormState);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: SaveMacekuPKKProfilePayload = {
      ...form,
      name: form.name.trim(),
      kabupatenKota: form.kabupatenKota.trim(),
      distrik: form.distrik.trim(),
      kampung: form.kampung.trim(),
      secretariatAddress: form.secretariatAddress.trim(),
      chairperson: form.chairperson.trim(),
      secretary: form.secretary.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      managementPeriod: form.managementPeriod.trim(),
      description: form.description.trim(),
      logo: form.logo ?? null,
    };

    if (!payload.name || !payload.kabupatenKota || !payload.phone) {
      setError("Nama PKK, kabupaten/kota, dan telepon wajib diisi.");
      setMessage(null);
      return;
    }
    if (!payload.kabupatenKota && payload.distrik) {
      setError("Pilih kabupaten/kota sebelum memilih distrik.");
      setMessage(null);
      return;
    }
    if (!payload.distrik && payload.kampung) {
      setError("Pilih distrik sebelum memilih kampung.");
      setMessage(null);
      return;
    }
    if (payload.logo) {
      try {
        validateClientUpload(payload.logo, "image");
      } catch (validationError) {
        setError(
          validationError instanceof Error
            ? validationError.message
            : "Logo tidak valid.",
        );
        setMessage(null);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editing) {
        await updateMacekuPKKProfile(editing.id, payload);
        setMessage(`${payload.name} berhasil diperbarui.`);
      } else {
        await createMacekuPKKProfile(payload);
        setMessage(`${payload.name} berhasil ditambahkan.`);
      }

      setFormOpen(false);
      setEditing(null);
      setForm(initialFormState);
      setFilters((current) => ({ ...current, page: 1 }));
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Profil PKK gagal disimpan.",
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
      await deleteMacekuPKKProfile(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setMessage(`${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
      setFilters((current) => ({ ...current, page: 1 }));
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Profil PKK gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const automaticLevel = derivePkkLevel(form.kabupatenKota, form.distrik, form.kampung);

  return (
    <main className="space-y-6">
      <PageHero
        icon={UsersRound}
        eyebrow="MACEKU PKK"
        title="Profil Organisasi PKK"
        description="Kelola daftar profil PKK dengan wilayah bertingkat, status aktif/nonaktif, dan akses ke halaman detail arsip."
        meta={
          <Badge className="h-8 rounded-full bg-teal-50 px-4 text-sm font-bold text-teal-700">
            {meta.total} total profil
          </Badge>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={openCreateForm}
          >
            <Plus className="h-4 w-4" />
            Tambah Profil PKK
          </Button>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      {formOpen ? (
        <SectionCard
          title={editing ? "Edit Profil PKK" : "Tambah Profil PKK"}
          description="Tingkat PKK dihitung otomatis berdasarkan wilayah yang diisi."
        >
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nama PKK"
                value={form.name}
                placeholder="Contoh: TP PKK Kota Sorong"
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <ReadonlyField label="Tingkat PKK" value={automaticLevel} />
              <SelectField
                label="Kabupaten/Kota"
                value={form.kabupatenKota}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    kabupatenKota: value,
                  }))
                }
                options={options.kabupatenKota}
              />
              <FormInput
                label="Kecamatan/Distrik"
                value={form.distrik}
                placeholder="Tulis nama distrik/kecamatan"
                onChange={(value) => setForm((current) => ({ ...current, distrik: value }))}
              />
              <FormInput
                label="Desa/Kampung"
                value={form.kampung}
                placeholder="Tulis nama desa/kampung"
                onChange={(value) => setForm((current) => ({ ...current, kampung: value }))}
              />
              <FormInput
                label="Periode Kepengurusan"
                value={form.managementPeriod}
                placeholder="Contoh: 2025-2030"
                onChange={(value) =>
                  setForm((current) => ({ ...current, managementPeriod: value }))
                }
              />
              <FormInput
                label="Nama Ketua"
                value={form.chairperson}
                placeholder="Contoh: Maria Y. Karet"
                onChange={(value) =>
                  setForm((current) => ({ ...current, chairperson: value }))
                }
              />
              <FormInput
                label="Nama Sekretaris"
                value={form.secretary}
                placeholder="Contoh: Nia S. Kalami"
                onChange={(value) =>
                  setForm((current) => ({ ...current, secretary: value }))
                }
              />
              <FormInput
                label="Nomor Telepon"
                value={form.phone}
                placeholder="Contoh: 08123456789"
                onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              />
              <FormInput
                label="Email"
                value={form.email}
                placeholder="Contoh: pkk@sorong.go.id"
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              />
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-pbd-navy">Alamat Sekretariat</span>
                <Textarea
                  value={form.secretariatAddress}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      secretariatAddress: event.target.value,
                    }))
                  }
                  placeholder="Masukkan alamat sekretariat"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-pbd-navy">Deskripsi Singkat</span>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Tulis deskripsi singkat organisasi PKK"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-pbd-navy">Logo / Foto PKK</span>
                <Input
                  type="file"
                  accept={IMAGE_FILE_ACCEPT}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      logo: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isActive: event.target.checked }))
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm font-bold text-pbd-navy">Profil aktif</span>
              </label>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {saving
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan Perubahan"
                    : "Tambah Profil"}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Profil PKK"
        description="Gunakan pencarian dan filter bertingkat untuk menemukan profil PKK yang tepat."
        action={
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.search ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                    page: 1,
                  }))
                }
                className="pl-9"
                placeholder="Cari nama PKK..."
              />
            </div>
            <select
              value={filters.level ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  level: event.target.value,
                  page: 1,
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua tingkat</option>
              {levelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={filters.kabupatenKota ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  kabupatenKota: event.target.value,
                  distrik: "",
                  kampung: "",
                  page: 1,
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua kabupaten</option>
              {options.kabupatenKota.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={filters.distrik ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  distrik: event.target.value,
                  kampung: "",
                  page: 1,
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!filters.kabupatenKota}
            >
              <option value="">Semua distrik</option>
              {filterDistrikOptions.map((option) => (
                <option key={`${option.kabupatenKota}-${option.distrik}`} value={option.distrik}>
                  {option.distrik}
                </option>
              ))}
            </select>
            <select
              value={filters.kampung ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  kampung: event.target.value,
                  page: 1,
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!filters.distrik}
            >
              <option value="">Semua kampung</option>
              {filterKampungOptions.map((option) => (
                <option
                  key={`${option.kabupatenKota}-${option.distrik}-${option.kampung}`}
                  value={option.kampung}
                >
                  {option.kampung}
                </option>
              ))}
            </select>
            <select
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value,
                  page: 1,
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        }
        contentClassName="p-0"
      >
        {loading ? (
          <div className="p-5">
            <LoadingState message="Memuat daftar profil PKK..." />
          </div>
        ) : items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama PKK</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead>Ketua</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Arsip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-pbd-navy">{item.name}</TableCell>
                    <TableCell>{item.level}</TableCell>
                    <TableCell className="whitespace-normal">
                      {formatRegion(item.kabupatenKota, item.distrik, item.kampung)}
                    </TableCell>
                    <TableCell>{item.chairperson || "-"}</TableCell>
                    <TableCell>{item.managementPeriod || "-"}</TableCell>
                    <TableCell>{item.documentCount}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.isActive
                            ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-600"
                        }
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon-sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/maceku-pkk/${item.id}`}>
                              <Eye className="h-4 w-4" />
                              Lihat Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditForm(item)}>
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={meta.page}
              pageSize={meta.limit}
              total={meta.total}
              onPageChange={(page) =>
                setFilters((current) => ({
                  ...current,
                  page,
                }))
              }
            />
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={FolderOpen}
              title="Belum ada profil PKK"
              description="Tambahkan profil PKK pertama atau ubah filter pencarian."
            />
          </div>
        )}
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus profil PKK?"
        description={`Profil ${deleteTarget?.name ?? "PKK"} dan seluruh arsip terkait akan dihapus.`}
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
        {value}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Pilih opsi",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">{placeholder}</option>
        {Array.from(new Set(options)).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function derivePkkLevel(kabupatenKota: string, distrik: string, kampung: string) {
  if (kampung.trim()) {
    return "PKK Desa/Kampung";
  }
  if (distrik.trim()) {
    return "PKK Kecamatan/Distrik";
  }
  if (kabupatenKota.trim()) {
    return "PKK Kabupaten/Kota";
  }
  return "-";
}

function formatRegion(kabupatenKota: string, distrik: string, kampung: string) {
  return [kabupatenKota, distrik, kampung].filter(Boolean).join(" / ");
}
