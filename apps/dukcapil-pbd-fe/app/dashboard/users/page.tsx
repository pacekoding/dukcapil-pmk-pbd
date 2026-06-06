"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
} from "@/lib/api/users";
import type {
  AdminRole,
  AdminUser,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from "@/types/user";

type SessionUser = {
  username: string;
  name: string;
  role: AdminRole;
};

type UserFormState = {
  username: string;
  name: string;
  role: AdminRole;
  password: string;
  isActive: boolean;
};

const roleOptions: Array<{ value: AdminRole; label: string }> = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin_dukcapil", label: "Admin Dukcapil" },
  { value: "admin_pmk", label: "Admin PMK" },
  { value: "admin_sekretariat", label: "Admin Sekretariat" },
];

const defaultForm: UserFormState = {
  username: "",
  name: "",
  role: "admin_dukcapil",
  password: "",
  isActive: true,
};

function roleLabel(role: AdminRole) {
  return roleOptions.find((item) => item.value === role)?.label ?? role;
}

export default function UsersPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<UserFormState>(defaultForm);
  const [resetPassword, setResetPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const isSuperAdmin = sessionUser?.role === "superadmin";
  const isEditing = Boolean(selectedUser);

  const activeUsers = useMemo(
    () => users.filter((item) => item.isActive).length,
    [users],
  );

  const loadUsers = async () => {
    const [sessionResponse, userItems] = await Promise.all([
      fetch("/api/auth/session", {
        cache: "no-store",
      }).then((response) => response.json()),
      getAdminUsers(),
    ]);

    setSessionUser(sessionResponse.user ?? null);
    setUsers(userItems);
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [sessionResponse, userItems] = await Promise.all([
          fetch("/api/auth/session", {
            cache: "no-store",
          }).then((response) => response.json()),
          getAdminUsers(),
        ]);

        if (mounted) {
          setSessionUser(sessionResponse.user ?? null);
          setUsers(userItems);
          setPageError("");
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setPageError("Data user gagal dimuat.");
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

  const resetForm = () => {
    setSelectedUser(null);
    setFormData(defaultForm);
    setFormError("");
  };

  const editUser = (user: AdminUser) => {
    setSelectedUser(user);
    setResetTarget(null);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: "",
      isActive: user.isActive,
    });
    setFormError("");
    setMessage("");
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return "Username wajib diisi.";
    }
    if (!formData.name.trim()) {
      return "Nama user wajib diisi.";
    }
    if (!isEditing && formData.password.length < 8) {
      return "Password awal minimal 8 karakter.";
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setMessage("");

      if (selectedUser) {
        const payload: UpdateAdminUserPayload = {
          username: formData.username.trim(),
          name: formData.name.trim(),
          role: formData.role,
          isActive: formData.isActive,
        };

        await updateAdminUser(selectedUser.id, payload);
        setMessage("User berhasil diperbarui.");
      } else {
        const payload: CreateAdminUserPayload = {
          username: formData.username.trim(),
          name: formData.name.trim(),
          role: formData.role,
          password: formData.password,
          isActive: formData.isActive,
        };

        await createAdminUser(payload);
        setMessage("User berhasil dibuat.");
      }

      await loadUsers();
      resetForm();
    } catch (error) {
      console.error(error);
      setFormError(
        error instanceof Error ? error.message : "User gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Hapus user ${user.username}?`)) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      await deleteAdminUser(user.id);
      await loadUsers();
      if (selectedUser?.id === user.id) {
        resetForm();
      }
      setMessage("User berhasil dihapus.");
    } catch (error) {
      console.error(error);
      setPageError(error instanceof Error ? error.message : "User gagal dihapus.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();

    if (!resetTarget) {
      return;
    }
    if (resetPassword.length < 8) {
      setFormError("Password reset minimal 8 karakter.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setMessage("");
      await resetAdminUserPassword(resetTarget.id, {
        newPassword: resetPassword,
      });
      setResetTarget(null);
      setResetPassword("");
      setMessage("Password user berhasil direset.");
    } catch (error) {
      console.error(error);
      setFormError(
        error instanceof Error ? error.message : "Password gagal direset.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="space-y-6">
        <LoadingState message="Memuat user admin..." />
      </main>
    );
  }

  if (!isSuperAdmin) {
    return (
      <main className="space-y-6">
        <ErrorState message="Halaman ini hanya dapat diakses oleh Super Admin." />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <PageHero
        icon={ShieldCheck}
        eyebrow="User Admin"
        title="Kelola Akses Dashboard"
        description="Kelola akun dashboard, role admin bidang, status akses, dan reset password."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Akses Super Admin
          </p>
        }
        aside={
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Summary label="Total User" value={String(users.length)} />
            <Summary label="Aktif" value={String(activeUsers)} />
          </div>
        }
      />

      {pageError ? (
        <ErrorState message={pageError} />
      ) : null}

      {message ? (
        <SuccessState message={message} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <SectionCard id="user-form-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditing ? "Edit User" : "Tambah User"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isEditing
                    ? "Perbarui identitas dan status akses."
                    : "Buat akun admin baru untuk dashboard."}
                </p>
              </div>

              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={resetForm}
                  className="rounded-xl"
                  aria-label="Batalkan edit"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <FormField label="Username">
                <Input
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="h-11 rounded-lg"
                  autoComplete="username"
                />
              </FormField>

              <FormField label="Nama">
                <Input
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-11 rounded-lg"
                  autoComplete="name"
                />
              </FormField>

              <FormField label="Role">
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      role: value as AdminRole,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {!isEditing ? (
                <FormField label="Password Awal">
                  <Input
                    value={formData.password}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="h-11 rounded-lg"
                    type="password"
                    autoComplete="new-password"
                  />
                </FormField>
              ) : null}

              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Aktif</p>
                  <p className="text-xs text-slate-500">
                    User aktif dapat login ke dashboard.
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((current) => ({
                      ...current,
                      isActive: checked,
                    }))
                  }
                />
              </div>

              {formError ? (
                <ErrorState message={formError} />
              ) : null}

              <Button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-lg"
              >
                {isEditing ? (
                  <Pencil className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Simpan Perubahan" : "Tambah User"}
              </Button>
            </form>

            {resetTarget ? (
              <form
                onSubmit={handleResetPassword}
                className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4"
              >
                <h3 className="font-semibold text-slate-900">
                  Reset Password
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {resetTarget.username}
                </p>
                <Input
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  className="mt-3 h-11 rounded-lg bg-white"
                  type="password"
                  placeholder="Password baru"
                  autoComplete="new-password"
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-10 rounded-lg"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResetTarget(null);
                      setResetPassword("");
                    }}
                    className="h-10 rounded-lg bg-white"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            ) : null}
        </SectionCard>

        <SectionCard contentClassName="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-lg border-blue-200 bg-blue-50 text-blue-700"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {roleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.isActive
                            ? "rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "rounded-lg border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => editUser(user)}
                          className="h-9 w-9 rounded-lg"
                          aria-label={`Edit ${user.username}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setResetTarget(user);
                            setSelectedUser(null);
                            setResetPassword("");
                          }}
                          className="h-9 w-9 rounded-lg"
                          aria-label={`Reset password ${user.username}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => void handleDelete(user)}
                          className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700"
                          aria-label={`Hapus ${user.username}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6">
                      <EmptyState title="User admin belum tersedia" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </SectionCard>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
