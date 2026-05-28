"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  ChevronRight,
  Eye,
  FileText,
  Plus,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createDokumen, getDokumenFormMeta } from "@/lib/api/dokumen";
import { toDateInputValue } from "@/lib/date/date-format";
import type { DokumenFormMeta } from "@/types/dokumen";
import type { TorBiayaItem, TorRundownItem } from "@/types/tor";

const listValue = (items: string[]) => items.join("\n");

export default function CreateDokumenPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<DokumenFormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedKegiatanId, setSelectedKegiatanId] = useState("");
  const [rundownRows, setRundownRows] = useState<TorRundownItem[]>([]);
  const [biayaRows, setBiayaRows] = useState<TorBiayaItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      try {
        const data = await getDokumenFormMeta();

        if (mounted) {
          setMeta(data);
          setSelectedKegiatanId(String(data.kegiatanOptions[0]?.id ?? ""));
          setRundownRows(data.torData.rundown.map((item) => ({ ...item })));
          setBiayaRows(data.torData.biaya.map((item) => ({ ...item })));
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Data form dokumen gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadMeta();

    return () => {
      mounted = false;
    };
  }, []);

  const addRundownRow = () => {
    setRundownRows((current) => [
      ...current,
      {
        waktu: "",
        kegiatan: "",
        keterangan: "",
      },
    ]);
  };

  const updateRundownRow = (
    index: number,
    field: keyof TorRundownItem,
    value: string,
  ) => {
    setRundownRows((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const removeRundownRow = (index: number) => {
    setRundownRows((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const addBiayaRow = () => {
    setBiayaRows((current) => [
      ...current,
      {
        no: current.length + 1,
        uraian: "",
        volume: "",
        harga: "",
        jumlah: "",
      },
    ]);
  };

  const updateBiayaRow = (
    index: number,
    field: keyof TorBiayaItem,
    value: string,
  ) => {
    setBiayaRows((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === "no" ? Number(value) : value,
            }
          : item,
      ),
    );
  };

  const removeBiayaRow = (index: number) => {
    setBiayaRows((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({
          ...item,
          no: itemIndex + 1,
        })),
    );
  };

  const handleSave = async (preview = false) => {
    if (!meta) {
      return;
    }

    const kegiatan = meta.kegiatanOptions.find(
      (item) => String(item.id) === selectedKegiatanId,
    );
    if (!kegiatan) {
      setError("Pilih kegiatan terlebih dahulu.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const created = await createDokumen({
        namaKegiatan: kegiatan.nama,
        jenisKegiatan: kegiatan.jenis ?? "Sosialisasi",
        jenisDokumen: "TOR",
        tanggal: kegiatan.tanggal || new Date().toISOString().slice(0, 10),
        dibuatOleh: "Admin Perencanaan",
      });
      router.push(
        preview
          ? `/dashboard/dokumen/${created.id}/cetak`
          : "/dashboard/dokumen",
      );
    } catch (err) {
      console.error(err);
      setError("Dokumen TOR gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !meta) {
    return (
      <main className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          {error ? (
            <p className="mt-4 text-sm font-medium text-red-700">{error}</p>
          ) : null}
        </section>
      </main>
    );
  }

  const { kegiatanOptions, torData, torPdfSections } = meta;

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-sm"
          >
            <Link
              href="/dashboard/dokumen"
              className="font-medium text-slate-500 transition hover:text-pbd-blue"
            >
              Dokumen
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-semibold text-slate-900">TOR</span>
          </nav>

          <Badge className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
            Format TOR
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Buat Dokumen TOR
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Form dibuat mengikuti urutan dan kebutuhan data pada preview PDF
            TOR.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-lg px-5"
          disabled={saving}
          onClick={() => void handleSave(true)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview PDF
        </Button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="rounded-lg border border-slate-200 shadow-sm">
          <CardContent className="p-5 sm:p-6 lg:p-8">
            <FormSection
              eyebrow="Cover TOR"
              title="Informasi Utama"
              description="Data berikut tampil pada halaman cover PDF TOR."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Pilih Kegiatan">
                  <Select
                    value={selectedKegiatanId}
                    onValueChange={setSelectedKegiatanId}
                  >
                    <SelectTrigger className="h-11 rounded-lg border-slate-200">
                      <SelectValue placeholder="Pilih kegiatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {kegiatanOptions.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Tahun Anggaran">
                  <Input
                    type="number"
                    defaultValue={torData.tahun}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Unit Kerja">
                  <Input
                    defaultValue={torData.unitKerja}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Judul Kegiatan" className="md:col-span-2">
                  <Textarea
                    defaultValue={torData.judul}
                    className="min-h-[92px] rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="IKU" className="md:col-span-2">
                  <Input
                    defaultValue={torData.iku}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Target IKU">
                  <Input
                    defaultValue={torData.targetIku}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="IKK">
                  <Input
                    defaultValue={torData.ikk}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Target IKK" className="md:col-span-2">
                  <Input
                    defaultValue={torData.targetIkk}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="A - E"
              title="Isi Kegiatan"
              description="Bagian ini mengikuti halaman isi TOR."
            >
              <div className="grid gap-5">
                <FormField label="A. Latar Belakang">
                  <Textarea
                    defaultValue={torData.latarBelakang}
                    className="min-h-[140px] rounded-lg border-slate-200"
                  />
                </FormField>

                <div className="grid gap-5 lg:grid-cols-3">
                  <FormField label="B. Tujuan Kegiatan">
                    <Textarea
                      defaultValue={listValue(torData.tujuan)}
                      className="min-h-[180px] rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="C. Sasaran Kegiatan">
                    <Textarea
                      defaultValue={listValue(torData.sasaran)}
                      className="min-h-[180px] rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="D. Output Kegiatan">
                    <Textarea
                      defaultValue={listValue(torData.outputs)}
                      className="min-h-[180px] rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Tanggal">
                    <DateInput defaultValue={torData.tanggal} />
                  </FormField>

                  <FormField label="Waktu">
                    <Input
                      defaultValue={torData.waktu}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Tempat">
                    <Input
                      defaultValue={torData.lokasi}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Jumlah Peserta">
                    <Input
                      type="number"
                      defaultValue={torData.peserta}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="F"
              title="Rundown Kegiatan"
              description="Kolom dibuat sama dengan tabel rundown pada PDF."
            >
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[150px_1fr_1fr_72px] bg-slate-50 text-sm font-semibold text-slate-600">
                    <div className="border-r border-slate-200 px-4 py-3">
                      Waktu
                    </div>
                    <div className="border-r border-slate-200 px-4 py-3">
                      Kegiatan
                    </div>
                    <div className="border-r border-slate-200 px-4 py-3">
                      Keterangan
                    </div>
                    <div className="px-4 py-3 text-center">Aksi</div>
                  </div>

                  {rundownRows.map((item, index) => (
                    <div
                      key={`rundown-${index}`}
                      className="grid grid-cols-[150px_1fr_1fr_72px] border-t border-slate-200"
                    >
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          value={item.waktu}
                          onChange={(event) =>
                            updateRundownRow(index, "waktu", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          value={item.kegiatan}
                          onChange={(event) =>
                            updateRundownRow(
                              index,
                              "kegiatan",
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          value={item.keterangan}
                          onChange={(event) =>
                            updateRundownRow(
                              index,
                              "keterangan",
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="flex items-center justify-center p-3">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={rundownRows.length === 1}
                          aria-label="Hapus baris rundown"
                          onClick={() => removeRundownRow(index)}
                          className="h-10 w-10 rounded-lg text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addRundownRow}
                className="mt-4 h-10 rounded-lg border-slate-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Rundown
              </Button>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="G"
              title="Rincian Biaya"
              description="Kolom dibuat sama dengan tabel rincian biaya pada PDF."
            >
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[1040px]">
                  <div className="grid grid-cols-[72px_1.3fr_1fr_1fr_1fr_72px] bg-slate-50 text-sm font-semibold text-slate-600">
                    <div className="border-r border-slate-200 px-4 py-3">
                      No
                    </div>
                    <div className="border-r border-slate-200 px-4 py-3">
                      Uraian
                    </div>
                    <div className="border-r border-slate-200 px-4 py-3">
                      Volume
                    </div>
                    <div className="border-r border-slate-200 px-4 py-3">
                      Harga
                    </div>
                    <div className="border-r border-slate-200 px-4 py-3">
                      Jumlah
                    </div>
                    <div className="px-4 py-3 text-center">Aksi</div>
                  </div>

                  {biayaRows.map((item, index) => (
                    <div
                      key={`biaya-${index}`}
                      className="grid grid-cols-[72px_1.3fr_1fr_1fr_1fr_72px] border-t border-slate-200"
                    >
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          type="number"
                          value={item.no}
                          onChange={(event) =>
                            updateBiayaRow(index, "no", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          value={item.uraian}
                          onChange={(event) =>
                            updateBiayaRow(index, "uraian", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          value={item.volume}
                          onChange={(event) =>
                            updateBiayaRow(index, "volume", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          value={item.harga}
                          onChange={(event) =>
                            updateBiayaRow(index, "harga", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="border-r border-slate-200 p-3">
                        <Input
                          value={item.jumlah}
                          onChange={(event) =>
                            updateBiayaRow(index, "jumlah", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="flex items-center justify-center p-3">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={biayaRows.length === 1}
                          aria-label="Hapus baris biaya"
                          onClick={() => removeBiayaRow(index)}
                          className="h-10 w-10 rounded-lg text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addBiayaRow}
                className="mt-4 h-10 rounded-lg border-slate-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Rincian Biaya
              </Button>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FormField label="Total Biaya">
                  <Input
                    defaultValue={torData.totalBiaya}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="H"
              title="Penutup dan Tanda Tangan"
              description="Data tanda tangan tampil pada akhir PDF TOR."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Penanggung Jawab">
                  <Input
                    defaultValue={torData.penanggungJawab}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Pejabat Penandatangan">
                  <Input
                    defaultValue={torData.pejabat}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="NIP">
                  <Input
                    defaultValue={torData.nip}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>
              </div>
            </FormSection>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-lg border-slate-200 px-5"
              >
                <Link href="/dashboard/dokumen">Batal</Link>
              </Button>

              <Button
                type="button"
                className="h-11 rounded-lg px-5"
                disabled={saving}
                onClick={() => void handleSave(false)}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan TOR"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <Card className="rounded-lg border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Struktur PDF TOR
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Urutan bagian sesuai preview cetak.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {torPdfSections.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950">
                    Lampiran Pendukung
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    PDF, DOCX, XLSX, JPG, PNG. Maks 10 MB.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                Upload Lampiran
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      {children}
    </section>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  );
}

function DateInput({ defaultValue }: { defaultValue: string }) {
  return (
    <Input
      type="date"
      defaultValue={toDateInputValue(defaultValue)}
      className="h-11 rounded-lg border-slate-200"
    />
  );
}
