"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, FileSpreadsheet, Save } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSSDDetail, updateSSD } from "@/lib/api/ssd";
import { cn } from "@/lib/utils";
import type { SSDDetail, SSDPayload } from "@/types/ssd";

const createEmptyPayload = (): SSDPayload => ({
  kode: "",
  uraian: "",
  satuan: "",
  definisiOperasional: "",
});

export default function DashboardSSDDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ssdID = Number(params.id);
  const isValidSSDID = Number.isFinite(ssdID) && ssdID > 0;

  const [detail, setDetail] = useState<SSDDetail | null>(null);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [form, setForm] = useState<SSDPayload>(createEmptyPayload);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(isValidSSDID);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDetail = async () => {
      try {
        const item = await getSSDDetail(ssdID);
        if (!mounted) {
          return;
        }

        setDetail(item);
        setTahunAnggaran(item.tahunAnggaran);
        setForm({
          kode: item.kode,
          uraian: item.uraian,
          satuan: item.satuan,
          definisiOperasional: item.definisiOperasional,
        });
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Detail SSD gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (isValidSSDID) {
      void loadDetail();
    }

    return () => {
      mounted = false;
    };
  }, [isValidSSDID, ssdID]);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const result = await response.json();
        if (mounted) {
          setIsSuperAdmin(result.user?.role === "superadmin");
        }
      } catch (sessionError) {
        console.error(sessionError);
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat mengubah identitas SSD.");
      return;
    }
    if (!form.kode.trim() || !form.uraian.trim()) {
      setError("Kode dan uraian SSD wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: SSDPayload = {
        kode: form.kode.trim(),
        uraian: form.uraian.trim(),
        satuan: form.satuan.trim(),
        definisiOperasional: form.definisiOperasional.trim(),
      };

      const saved = await updateSSD(ssdID, payload);
      setDetail(saved);
      setForm(payload);
      setMessage("Identitas SSD berhasil disimpan.");
    } catch (saveError) {
      console.error(saveError);
      setError("Identitas SSD gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="h-40 animate-pulse rounded-lg bg-white" />
      </main>
    );
  }

  if (!isValidSSDID) {
    return (
      <main className="space-y-6">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
          ID SSD tidak valid.
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <PageHero
        icon={FileSpreadsheet}
        eyebrow="Identitas Data"
        title={`${isSuperAdmin ? "Kelola" : "Detail"} Identitas ${detail?.kode ?? "SSD"}`}
        description={
          isSuperAdmin
            ? "Perbarui kode, uraian, satuan, dan definisi operasional SSD."
            : "Lihat kode, uraian, satuan, dan definisi operasional SSD."
        }
        meta={
          <div className="flex flex-wrap gap-2">
            <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
              Tahun Anggaran {tahunAnggaran}
            </p>
            {detail?.isActive === false ? (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                SSD Nonaktif
              </Badge>
            ) : null}
          </div>
        }
        aside={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-12 rounded-xl">
              <Link href="/dashboard/SDD">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-slate-200 bg-white px-5 text-pbd-navy shadow-sm"
            >
              <Link href="https://romantik.web.bps.go.id/" target="_blank">
                Lihat Panduan
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      {message ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {message}
        </section>
      ) : null}
      {error ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
          {error}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,35,80,0.08)]">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryStat label="Kode SSD" value={form.kode || "-"} />
          <SummaryStat label="Satuan" value={form.satuan || "-"} />
          <SummaryStat
            label="Status"
            value={detail?.isActive === false ? "Nonaktif" : "Aktif"}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,35,80,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-pbd-navy">Identitas SSD</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isSuperAdmin
                ? "Informasi dasar SSD yang digunakan sebagai referensi data."
                : "Role Anda hanya dapat melihat identitas SSD."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/SDD")}
              className="h-11 rounded-xl"
            >
              {isSuperAdmin ? "Batal" : "Kembali"}
            </Button>
            {isSuperAdmin ? (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan Identitas"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField label="Kode SSD *">
            <Input
              value={form.kode}
              disabled={!isSuperAdmin}
              onChange={(event) =>
                setForm((current) => ({ ...current, kode: event.target.value }))
              }
              className="h-11 rounded-lg"
            />
          </FormField>
          <FormField label="Satuan SSD">
            <Input
              value={form.satuan}
              disabled={!isSuperAdmin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  satuan: event.target.value,
                }))
              }
              className="h-11 rounded-lg"
            />
          </FormField>
          <FormField label="Uraian SSD *" className="md:col-span-2">
            <Textarea
              value={form.uraian}
              disabled={!isSuperAdmin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  uraian: event.target.value,
                }))
              }
              className="min-h-24 rounded-lg"
            />
          </FormField>
          <FormField label="Definisi Operasional SSD" className="md:col-span-2">
            <Textarea
              value={form.definisiOperasional}
              disabled={!isSuperAdmin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  definisiOperasional: event.target.value,
                }))
              }
              className="min-h-24 rounded-lg"
            />
          </FormField>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-bold uppercase tracking-wide text-slate-700">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-pbd-navy">{value}</p>
    </div>
  );
}
