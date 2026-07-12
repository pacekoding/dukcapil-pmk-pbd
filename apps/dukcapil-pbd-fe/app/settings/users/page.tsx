"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Edit,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
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
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
} from "@/lib/api/admin-users";
import type {
  AdminRole,
  AdminUser,
  CreateAdminUserPayload,
  SystemAccess,
  UpdateAdminUserPayload,
} from "@/types/admin-user";
import { roleOptions, systemAccessOptions } from "@/types/admin-user";

type UserForm = {
  username: string;
  name: string;
  role: AdminRole;
  systemAccess: SystemAccess[];
  password: string;
  isActive: boolean;
};

const emptyForm: UserForm = {
  username: "",
  name: "",
  role: "admin_sekretariat",
  systemAccess: [],
  password: "",
  isActive: true,
};

export default function SettingsUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      try {
        const data = await getAdminUsers();
        if (mounted) {
          setItems(data);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data pengguna gagal dimuat.");
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
      [
        item.name,
        item.username,
        item.role,
        item.systemAccess.join(" "),
        item.isActive ? "aktif" : "nonaktif",
      ]
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

  const openEditForm = (item: AdminUser) => {
    setEditingId(item.id);
    setForm({
      username: item.username,
      name: item.name,
      role: item.role,
      systemAccess: item.systemAccess ?? [],
      password: "",
      isActive: item.isActive,
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

    if (!form.username.trim() || !form.name.trim()) {
      setError("Nama dan username wajib diisi.");
      setMessage(null);
      return;
    }
    if (!editingId && form.password.length < 8) {
      setError("Password awal minimal 8 karakter.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        const payload: UpdateAdminUserPayload = {
          username: form.username.trim(),
          name: form.name.trim(),
          role: form.role,
          systemAccess: form.systemAccess,
          isActive: form.isActive,
        };
        const updated = await updateAdminUser(editingId, payload);
        setItems((current) =>
          current.map((item) => (item.id === editingId ? updated : item)),
        );
        setMessage(`${updated.name} berhasil diperbarui.`);
      } else {
        const payload: CreateAdminUserPayload = {
          username: form.username.trim(),
          name: form.name.trim(),
          role: form.role,
          systemAccess: form.systemAccess,
          password: form.password,
          isActive: form.isActive,
        };
        const created = await createAdminUser(payload);
        setItems((current) => [created, ...current]);
        setMessage(`${created.name} berhasil ditambahkan.`);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Data pengguna gagal disimpan.",
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
      await deleteAdminUser(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setMessage("Pengguna berhasil dihapus.");
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Pengguna gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resetTarget) {
      return;
    }
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await resetAdminUserPassword(resetTarget.id, newPassword);
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`Password ${updated.name} berhasil direset.`);
      setResetTarget(null);
      setNewPassword("");
    } catch (resetError) {
      console.error(resetError);
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Password gagal direset.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={UserCog}
        eyebrow="Pengaturan"
        title="Pengguna Portal"
        description="Kelola akun pengguna, status aktif, role, password, dan hak akses sistem."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {items.length} pengguna
          </Badge>
        }
      />

      {formOpen ? (
        <SectionCard
          title={editingItem ? "Edit Pengguna" : "Tambah Pengguna"}
          description="Atur identitas, role, status, dan hak akses sistem pengguna."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nama"
                value={form.name}
                placeholder="Contoh: James Saputro I. Sraun"
                onChange={(value) =>
                  setForm((current) => ({ ...current, name: value }))
                }
              />
              <FormInput
                label="Username"
                value={form.username}
                placeholder="Contoh: operator.sibum"
                onChange={(value) =>
                  setForm((current) => ({ ...current, username: value }))
                }
              />
              {!editingItem ? (
                <FormInput
                  label="Password Awal"
                  value={form.password}
                  placeholder="Minimal 8 karakter"
                  type="password"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, password: value }))
                  }
                />
              ) : null}
              <label className="grid gap-2">
                <span className="text-sm font-bold text-pbd-navy">Role</span>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value as AdminRole,
                    }))
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm font-bold text-pbd-navy">
                  Pengguna aktif
                </span>
              </label>
              <div className="grid gap-2 md:col-span-2">
                <p className="text-sm font-bold text-pbd-navy">
                  Hak Akses Sistem
                </p>
                <div className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                  {systemAccessOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={form.systemAccess.includes(option.value)}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            systemAccess: event.target.checked
                              ? [...current.systemAccess, option.value]
                              : current.systemAccess.filter(
                                  (value) => value !== option.value,
                                ),
                          }))
                        }
                        className="h-4 w-4"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
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
                    : "Tambah Pengguna"}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Pengguna"
        description="Super admin dapat mengatur akun dan sistem yang dapat dibuka setiap pengguna."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Cari nama, username, role..."
              />
            </div>
            <Button
              type="button"
              className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
              onClick={openCreateForm}
            >
              <Plus className="h-4 w-4" />
              Tambah Pengguna
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
              <TableHead>Nama</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Hak Akses Sistem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat data pengguna...
                </TableCell>
              </TableRow>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold text-pbd-navy">
                    {item.name}
                  </TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>{formatRole(item.role)}</TableCell>
                  <TableCell className="min-w-[260px] whitespace-normal">
                    {formatSystemAccess(item.systemAccess)}
                  </TableCell>
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
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Buka aksi untuk ${item.name}`}
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
                          onClick={() => {
                            setResetTarget(item);
                            setNewPassword("");
                            setError(null);
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                          Reset Password
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Tidak ada pengguna yang sesuai dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <Dialog open={Boolean(resetTarget)} onOpenChange={() => setResetTarget(null)}>
        <DialogContent>
          <form onSubmit={handleResetPassword} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Masukkan password baru untuk {resetTarget?.name}.
              </DialogDescription>
            </DialogHeader>

            <FormInput
              label="Password Baru"
              value={newPassword}
              placeholder="Minimal 8 karakter"
              type="password"
              onChange={setNewPassword}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setResetTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {saving ? "Menyimpan..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Pengguna?"
        description={`Akun ${deleteTarget?.name ?? "pengguna"} akan dihapus dan tidak dapat digunakan lagi.`}
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required
      />
    </label>
  );
}

function formatRole(role: string) {
  return role
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function formatSystemAccess(values: string[]) {
  if (!values || values.length === 0) {
    return "-";
  }

  const labels = new Map(
    systemAccessOptions.map((option) => [option.value, option.label]),
  );

  return values.map((value) => labels.get(value as SystemAccess) ?? value).join(", ");
}
