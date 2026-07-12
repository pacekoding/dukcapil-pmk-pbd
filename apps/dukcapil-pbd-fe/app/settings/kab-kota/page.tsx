"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Edit, MapPinned, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";

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
  createKabKota,
  deleteKabKota,
  getKabKota,
  updateKabKota,
} from "@/lib/api/kab-kota";
import type { KabKota, KabKotaPayload } from "@/types/kab-kota";

const emptyForm: KabKotaPayload = {
  kodeWilayah: "",
  nama: "",
  provinsi: "Papua Barat Daya",
};

export default function SettingsKabKotaPage() {
  const [items, setItems] = useState<KabKota[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<KabKotaPayload>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KabKota | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      try {
        const data = await getKabKota();
        if (mounted) {
          setItems(data);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data kabupaten/kota gagal dimuat.");
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
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      [item.kodeWilayah, item.nama, item.provinsi]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [items, query]);

  const editingItem = editingId
    ? items.find((item) => item.id === editingId)
    : null;

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  };

  const openEditForm = (item: KabKota) => {
    setEditingId(item.id);
    setForm({
      kodeWilayah: item.kodeWilayah,
      nama: item.nama,
      provinsi: item.provinsi,
    });
    setError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: KabKotaPayload = {
      kodeWilayah: form.kodeWilayah.trim(),
      nama: form.nama.trim(),
      provinsi: form.provinsi.trim(),
    };
    if (!payload.kodeWilayah || !payload.nama || !payload.provinsi) {
      setError("Kode wilayah, nama, dan provinsi wajib diisi.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        const updated = await updateKabKota(editingId, payload);
        setItems((current) =>
          current.map((item) => (item.id === editingId ? updated : item)),
        );
        setMessage(`${updated.nama} berhasil diperbarui.`);
      } else {
        const created = await createKabKota(payload);
        setItems((current) => [created, ...current]);
        setMessage(`${created.nama} berhasil ditambahkan.`);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Data kabupaten/kota gagal disimpan.",
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
      await deleteKabKota(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setMessage("Data kabupaten/kota berhasil dihapus.");
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Data kabupaten/kota gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={MapPinned}
        eyebrow="Pengaturan"
        title="Data Kab/Kota"
        description="Kelola master kabupaten/kota yang digunakan oleh sistem internal."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {items.length} data
          </Badge>
        }
      />

      {formOpen ? (
        <SectionCard
          title={editingItem ? "Edit Kab/Kota" : "Tambah Kab/Kota"}
          description="Lengkapi kode wilayah, nama kabupaten/kota, dan provinsi."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <FormInput
                label="Kode Wilayah"
                value={form.kodeWilayah}
                placeholder="Contoh: 96.01"
                onChange={(value) =>
                  setForm((current) => ({ ...current, kodeWilayah: value }))
                }
              />
              <FormInput
                label="Nama Kab/Kota"
                value={form.nama}
                placeholder="Contoh: Kab. Sorong"
                onChange={(value) =>
                  setForm((current) => ({ ...current, nama: value }))
                }
              />
              <FormInput
                label="Provinsi"
                value={form.provinsi}
                placeholder="Contoh: Papua Barat Daya"
                onChange={(value) =>
                  setForm((current) => ({ ...current, provinsi: value }))
                }
              />
            </div>
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
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {saving
                  ? "Menyimpan..."
                  : editingItem
                    ? "Simpan Perubahan"
                    : "Tambah Data"}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Kab/Kota"
        description="Data tersimpan ke database dan dapat digunakan sebagai referensi wilayah."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Cari kode, nama, provinsi..."
              />
            </div>
            <Button
              type="button"
              className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
              onClick={openCreateForm}
            >
              <Plus className="h-4 w-4" />
              Tambah Kab/Kota
            </Button>
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
              <TableHead>Kode Wilayah</TableHead>
              <TableHead>Nama Kab/Kota</TableHead>
              <TableHead>Provinsi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat data kabupaten/kota...
                </TableCell>
              </TableRow>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold text-pbd-navy">
                    {item.kodeWilayah}
                  </TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>{item.provinsi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Buka aksi untuk ${item.nama}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Tidak ada data kabupaten/kota yang sesuai dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data Kab/Kota?"
        description={`Data ${deleteTarget?.nama ?? "kabupaten/kota"} akan dihapus dan tidak dapat dikembalikan.`}
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
        required
      />
    </label>
  );
}
