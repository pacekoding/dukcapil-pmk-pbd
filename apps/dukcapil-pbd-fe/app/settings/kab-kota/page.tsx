"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Edit, MapPinned, Plus, Search, Trash2 } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getKabKota();
      setItems(data);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setError("Data kabupaten/kota gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
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

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: KabKota) => {
    setEditingId(item.id);
    setForm({
      kodeWilayah: item.kodeWilayah,
      nama: item.nama,
      provinsi: item.provinsi,
    });
    setError(null);
    setDialogOpen(true);
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

      setDialogOpen(false);
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

  const handleDelete = async (id: number) => {
    setError(null);
    setMessage(null);
    try {
      await deleteKabKota(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Data kabupaten/kota berhasil dihapus.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Data kabupaten/kota gagal dihapus.",
      );
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
              onClick={openCreateDialog}
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
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
                  Data kabupaten/kota tidak ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Kab/Kota" : "Tambah Kab/Kota"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi kode wilayah, nama kabupaten/kota, dan provinsi.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setDialogOpen(false)}
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
