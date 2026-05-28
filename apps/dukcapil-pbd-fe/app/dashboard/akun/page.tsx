"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/api/account";

type SessionUser = {
  name: string;
  role: string;
  username: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const result = await response.json();

        if (mounted) {
          setUser(result.user ?? null);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Session akun gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!currentPassword) {
      setError("Password saat ini wajib diisi.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak sama.");
      return;
    }

    try {
      setSaving(true);
      await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password berhasil diganti.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Password gagal diganti.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Badge className="rounded-md">Keamanan Akun</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Ganti Password
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Perbarui password login dashboard secara berkala untuk menjaga akses
          akun tetap aman.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="rounded-lg border border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Akun Login</h2>
                <p className="text-sm text-slate-500">
                  {loading ? "Memuat..." : user?.username ?? "-"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <InfoRow label="Nama" value={user?.name ?? "-"} />
              <InfoRow
                label="Role"
                value={user?.role?.replaceAll("_", " ") ?? "-"}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Password Baru
                </h2>
                <p className="text-sm text-slate-500">
                  Password baru minimal 8 karakter.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 max-w-xl space-y-4">
              <FormField label="Password Saat Ini">
                <Input
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  className="h-11 rounded-lg"
                  autoComplete="current-password"
                />
              </FormField>

              <FormField label="Password Baru">
                <Input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  className="h-11 rounded-lg"
                  autoComplete="new-password"
                />
              </FormField>

              <FormField label="Konfirmasi Password Baru">
                <Input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  className="h-11 rounded-lg"
                  autoComplete="new-password"
                />
              </FormField>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}

              {message ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  {message}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={saving}
                className="h-11 rounded-lg px-5"
              >
                <Save className="mr-2 h-4 w-4" />
                Simpan Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold capitalize text-slate-900">{value}</span>
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
