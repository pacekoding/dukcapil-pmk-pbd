"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { CrudPage, DetailGrid } from "@/components/dashboard/crud-page";
import { ErrorState, LoadingState } from "@/components/dashboard/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createKabKota, getKabKota, updateKabKota } from "@/lib/api/kab-kota";
import { confirmDiscard, useUnsavedChanges } from "@/lib/use-unsaved-changes";
import type { KabKota, KabKotaPayload } from "@/types/kab-kota";

const base = "/internal/pengaturan/kab-kota";
const emptyForm: KabKotaPayload = { kodeWilayah: "", nama: "", provinsi: "Papua Barat Daya" };

export function KabKotaRecordPage({ mode, id }: { mode: "add" | "edit" | "preview"; id?: number }) {
  const router = useRouter();
  const [record, setRecord] = useState<KabKota | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [initial, setInitial] = useState(JSON.stringify(emptyForm));
  const [loading, setLoading] = useState(mode !== "add");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = mode !== "preview" && JSON.stringify(form) !== initial;
  useUnsavedChanges(dirty);

  useEffect(() => {
    if (mode === "add") return;
    let active = true;
    getKabKota().then((items) => {
      if (!active) return;
      const found = items.find((item) => item.id === id) ?? null;
      setRecord(found);
      if (found) {
        const value = { kodeWilayah: found.kodeWilayah, nama: found.nama, provinsi: found.provinsi };
        setForm(value);
        setInitial(JSON.stringify(value));
      } else setError("Data kabupaten/kota tidak ditemukan.");
    }).catch(() => setError("Data kabupaten/kota gagal dimuat.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, mode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = { kodeWilayah: form.kodeWilayah.trim(), nama: form.nama.trim(), provinsi: form.provinsi.trim() };
    if (!payload.kodeWilayah || !payload.nama || !payload.provinsi) return setError("Semua kolom wajib diisi.");
    setSaving(true); setError(null);
    try {
      const saved = mode === "edit" && id ? await updateKabKota(id, payload) : await createKabKota(payload);
      setInitial(JSON.stringify(payload));
      router.replace(`${base}/${saved.id}/preview`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data gagal disimpan.");
    } finally { setSaving(false); }
  }

  const title = mode === "add" ? "Tambah Kab/Kota" : mode === "edit" ? "Edit Kab/Kota" : record?.nama ?? "Detail Kab/Kota";
  return <CrudPage title={title} description={mode === "preview" ? "Informasi master wilayah yang tersimpan." : "Lengkapi data master wilayah."} breadcrumbs={[
    { label: "Internal", href: "/internal/dashboard" }, { label: "Pengaturan" }, { label: "Kab/Kota", href: base }, { label: mode === "add" ? "Tambah" : mode === "edit" ? "Edit" : "Preview" },
  ]} actions={mode === "preview" && record ? <Button asChild><Link href={`${base}/${record.id}/edit`}><Pencil className="h-4 w-4" />Edit</Link></Button> : undefined}>
    {loading ? <LoadingState message="Memuat data..." /> : error && !record && mode !== "add" ? <ErrorState message={error} /> : mode === "preview" && record ? (
      <Card><CardContent><DetailGrid items={[{ label: "Kode Wilayah", value: record.kodeWilayah }, { label: "Nama Kab/Kota", value: record.nama }, { label: "Provinsi", value: record.provinsi }]} /></CardContent></Card>
    ) : (
      <Card><CardContent><form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {([ ["kodeWilayah", "Kode Wilayah", "96.01"], ["nama", "Nama Kab/Kota", "Kab. Sorong"], ["provinsi", "Provinsi", "Papua Barat Daya"] ] as const).map(([key,label,placeholder]) => <label key={key} className="grid gap-2"><span className="text-sm font-bold text-pbd-navy">{label}</span><Input required value={form[key]} placeholder={placeholder} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} /></label>)}
        </div>
        {error ? <ErrorState message={error} /> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => confirmDiscard(dirty) && router.push(base)}><ArrowLeft className="h-4 w-4" />Batal</Button><Button disabled={saving} type="submit">{saving ? "Menyimpan..." : "Simpan"}</Button></div>
      </form></CardContent></Card>
    )}
  </CrudPage>;
}
