"use client";

import Link from "next/link";
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
import { getDokumenFormMeta } from "@/lib/api/dokumen";
import { toDateInputValue } from "@/lib/date/date-format";
import type { DokumenFormMeta } from "@/types/dokumen";
import type {
  LaporanBiayaItem,
  LaporanDokumentasiItem,
  LaporanPesertaItem,
} from "@/types/laporan";

const listValue = (items: string[]) => items.join("\n");

export default function CreateLaporanPage() {
  const [meta, setMeta] = useState<DokumenFormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pesertaRows, setPesertaRows] = useState<LaporanPesertaItem[]>([]);
  const [dokumentasiRows, setDokumentasiRows] = useState<
    LaporanDokumentasiItem[]
  >([]);
  const [biayaRows, setBiayaRows] = useState<LaporanBiayaItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      try {
        const data = await getDokumenFormMeta();

        if (mounted) {
          setMeta(data);
          setPesertaRows(
            data.laporanPelaksanaanData.pesertaDetail.map((item) => ({
              ...item,
            })),
          );
          setDokumentasiRows(
            data.laporanPelaksanaanData.dokumentasi.map((item) => ({
              ...item,
            })),
          );
          setBiayaRows(
            data.laporanPelaksanaanData.realisasiBiaya.map((item) => ({
              ...item,
            })),
          );
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Data form laporan gagal dimuat.");
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

  const addPesertaRow = () => {
    setPesertaRows((current) => [
      ...current,
      {
        no: current.length + 1,
        nama: "",
        unsur: "",
        jumlah: 0,
      },
    ]);
  };

  const updatePesertaRow = (
    index: number,
    field: keyof LaporanPesertaItem,
    value: string,
  ) => {
    setPesertaRows((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "no" || field === "jumlah" ? Number(value) : value,
            }
          : item,
      ),
    );
  };

  const removePesertaRow = (index: number) => {
    setPesertaRows((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({
          ...item,
          no: itemIndex + 1,
        })),
    );
  };

  const addDokumentasiRow = () => {
    setDokumentasiRows((current) => [
      ...current,
      {
        no: current.length + 1,
        kegiatan: "",
        keterangan: "",
      },
    ]);
  };

  const updateDokumentasiRow = (
    index: number,
    field: keyof LaporanDokumentasiItem,
    value: string,
  ) => {
    setDokumentasiRows((current) =>
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

  const removeDokumentasiRow = (index: number) => {
    setDokumentasiRows((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({
          ...item,
          no: itemIndex + 1,
        })),
    );
  };

  const addBiayaRow = () => {
    setBiayaRows((current) => [
      ...current,
      {
        no: current.length + 1,
        uraian: "",
        volume: "",
        satuan: "",
        biaya: "",
        jumlah: "",
      },
    ]);
  };

  const updateBiayaRow = (
    index: number,
    field: keyof LaporanBiayaItem,
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

  if (loading || !meta) {
    return (
      <main className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          {error ? (
            <p className="mt-4 text-sm font-medium text-red-700">{error}</p>
          ) : null}
        </section>
      </main>
    );
  }

  const { kegiatanOptions, laporanPelaksanaanData, laporanPdfSections } = meta;

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
            <span className="font-semibold text-slate-900">
              Laporan Pelaksanaan
            </span>
          </nav>

          <Badge className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            Format Laporan
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Buat Laporan Pelaksanaan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Form dibuat mengikuti urutan dan kebutuhan data pada preview PDF
            laporan pelaksanaan.
          </p>
        </div>

        <Button asChild variant="outline" className="h-11 rounded-lg px-5">
          <Link href="/dashboard/dokumen/5/cetak">
            <Eye className="mr-2 h-4 w-4" />
            Preview PDF
          </Link>
        </Button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="rounded-lg border border-slate-200 shadow-sm">
          <CardContent className="p-5 sm:p-6 lg:p-8">
            <FormSection
              eyebrow="Cover Laporan"
              title="Identitas Dokumen"
              description="Data berikut tampil pada halaman cover PDF laporan."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Pilih Kegiatan">
                  <Select defaultValue={String(kegiatanOptions[0]?.id ?? "")}>
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
                    defaultValue={laporanPelaksanaanData.tahun}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Nomor Dokumen">
                  <Input
                    defaultValue={laporanPelaksanaanData.nomorDokumen}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Tanggal Laporan">
                  <DateInput
                    defaultValue={laporanPelaksanaanData.tanggalLaporan}
                  />
                </FormField>

                <FormField label="Pemerintah Daerah">
                  <Input
                    defaultValue={laporanPelaksanaanData.kementerian}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Unit Kerja">
                  <Input
                    defaultValue={laporanPelaksanaanData.unitKerja}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Dinas" className="md:col-span-2">
                  <Textarea
                    defaultValue={laporanPelaksanaanData.dinas}
                    className="min-h-[84px] rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Nama Kegiatan" className="md:col-span-2">
                  <Textarea
                    defaultValue={laporanPelaksanaanData.namaKegiatan}
                    className="min-h-[92px] rounded-lg border-slate-200"
                  />
                </FormField>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="A"
              title="Pendahuluan"
              description="Bagian ini mengikuti halaman A pada PDF laporan."
            >
              <div className="grid gap-5">
                <FormField label="Latar Belakang">
                  <Textarea
                    defaultValue={laporanPelaksanaanData.latarBelakang}
                    className="min-h-[140px] rounded-lg border-slate-200"
                  />
                </FormField>

                <div className="grid gap-5 lg:grid-cols-2">
                  <FormField label="Dasar Pelaksanaan">
                    <Textarea
                      defaultValue={listValue(
                        laporanPelaksanaanData.dasarPelaksanaan,
                      )}
                      className="min-h-[180px] rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Maksud dan Tujuan">
                    <Textarea
                      defaultValue={listValue(
                        laporanPelaksanaanData.maksudTujuan,
                      )}
                      className="min-h-[180px] rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="B"
              title="Pelaksanaan Kegiatan"
              description="Data kegiatan, narasumber, metode, dan uraian pelaksanaan."
            >
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Tanggal Kegiatan">
                    <DateInput defaultValue={laporanPelaksanaanData.tanggal} />
                  </FormField>

                  <FormField label="Waktu">
                    <Input
                      defaultValue={laporanPelaksanaanData.waktu}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Tempat">
                    <Input
                      defaultValue={laporanPelaksanaanData.lokasi}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Jumlah Peserta">
                    <Input
                      type="number"
                      defaultValue={laporanPelaksanaanData.peserta}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Pelaksana">
                    <Input
                      defaultValue={laporanPelaksanaanData.pelaksana}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Metode">
                    <Input
                      defaultValue={laporanPelaksanaanData.metode}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <FormField label="Narasumber">
                    <Textarea
                      defaultValue={listValue(
                        laporanPelaksanaanData.narasumber,
                      )}
                      className="min-h-[180px] rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Uraian Pelaksanaan">
                    <Textarea
                      defaultValue={listValue(
                        laporanPelaksanaanData.uraianPelaksanaan,
                      )}
                      className="min-h-[180px] rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="C"
              title="Hasil Pelaksanaan"
              description="Capaian, kendala, dan tindak lanjut laporan."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <FormField label="Hasil Pelaksanaan">
                  <Textarea
                    defaultValue={listValue(
                      laporanPelaksanaanData.hasilPelaksanaan,
                    )}
                    className="min-h-[180px] rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Capaian Output">
                  <Textarea
                    defaultValue={listValue(
                      laporanPelaksanaanData.capaianOutput,
                    )}
                    className="min-h-[180px] rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Kendala">
                  <Textarea
                    defaultValue={listValue(laporanPelaksanaanData.kendala)}
                    className="min-h-[160px] rounded-lg border-slate-200"
                  />
                </FormField>

                <FormField label="Tindak Lanjut">
                  <Textarea
                    defaultValue={listValue(
                      laporanPelaksanaanData.tindakLanjut,
                    )}
                    className="min-h-[160px] rounded-lg border-slate-200"
                  />
                </FormField>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="D"
              title="Peserta dan Dokumentasi"
              description="Kolom dibuat sama dengan tabel peserta dan dokumentasi pada PDF."
            >
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[880px]">
                  <div className="grid grid-cols-[72px_1.3fr_1fr_120px_72px] bg-slate-50 text-sm font-semibold text-slate-600">
                    <TableHeaderCell>No</TableHeaderCell>
                    <TableHeaderCell>Peserta</TableHeaderCell>
                    <TableHeaderCell>Unsur</TableHeaderCell>
                    <TableHeaderCell>Jumlah</TableHeaderCell>
                    <div className="px-4 py-3 text-center">Aksi</div>
                  </div>

                  {pesertaRows.map((item, index) => (
                    <div
                      key={`peserta-${index}`}
                      className="grid grid-cols-[72px_1.3fr_1fr_120px_72px] border-t border-slate-200"
                    >
                      <TableInputCell>
                        <Input
                          type="number"
                          value={item.no}
                          onChange={(event) =>
                            updatePesertaRow(index, "no", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.nama}
                          onChange={(event) =>
                            updatePesertaRow(index, "nama", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.unsur}
                          onChange={(event) =>
                            updatePesertaRow(index, "unsur", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          type="number"
                          value={item.jumlah}
                          onChange={(event) =>
                            updatePesertaRow(
                              index,
                              "jumlah",
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <ActionCell>
                        <RemoveRowButton
                          disabled={pesertaRows.length === 1}
                          onClick={() => removePesertaRow(index)}
                        />
                      </ActionCell>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addPesertaRow}
                className="mt-4 h-10 rounded-lg border-slate-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Peserta
              </Button>

              <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[72px_1fr_1fr_72px] bg-slate-50 text-sm font-semibold text-slate-600">
                    <TableHeaderCell>No</TableHeaderCell>
                    <TableHeaderCell>Kegiatan</TableHeaderCell>
                    <TableHeaderCell>Keterangan</TableHeaderCell>
                    <div className="px-4 py-3 text-center">Aksi</div>
                  </div>

                  {dokumentasiRows.map((item, index) => (
                    <div
                      key={`dokumentasi-${index}`}
                      className="grid grid-cols-[72px_1fr_1fr_72px] border-t border-slate-200"
                    >
                      <TableInputCell>
                        <Input
                          type="number"
                          value={item.no}
                          onChange={(event) =>
                            updateDokumentasiRow(
                              index,
                              "no",
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.kegiatan}
                          onChange={(event) =>
                            updateDokumentasiRow(
                              index,
                              "kegiatan",
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.keterangan}
                          onChange={(event) =>
                            updateDokumentasiRow(
                              index,
                              "keterangan",
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <ActionCell>
                        <RemoveRowButton
                          disabled={dokumentasiRows.length === 1}
                          onClick={() => removeDokumentasiRow(index)}
                        />
                      </ActionCell>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addDokumentasiRow}
                className="mt-4 h-10 rounded-lg border-slate-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Dokumentasi
              </Button>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="E"
              title="Realisasi Biaya"
              description="Kolom dibuat sama dengan tabel realisasi biaya pada PDF."
            >
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[1120px]">
                  <div className="grid grid-cols-[72px_1.3fr_1fr_1fr_1fr_1fr_72px] bg-slate-50 text-sm font-semibold text-slate-600">
                    <TableHeaderCell>No</TableHeaderCell>
                    <TableHeaderCell>Uraian</TableHeaderCell>
                    <TableHeaderCell>Volume</TableHeaderCell>
                    <TableHeaderCell>Satuan</TableHeaderCell>
                    <TableHeaderCell>Biaya</TableHeaderCell>
                    <TableHeaderCell>Jumlah</TableHeaderCell>
                    <div className="px-4 py-3 text-center">Aksi</div>
                  </div>

                  {biayaRows.map((item, index) => (
                    <div
                      key={`biaya-${index}`}
                      className="grid grid-cols-[72px_1.3fr_1fr_1fr_1fr_1fr_72px] border-t border-slate-200"
                    >
                      <TableInputCell>
                        <Input
                          type="number"
                          value={item.no}
                          onChange={(event) =>
                            updateBiayaRow(index, "no", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.uraian}
                          onChange={(event) =>
                            updateBiayaRow(index, "uraian", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.volume}
                          onChange={(event) =>
                            updateBiayaRow(index, "volume", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.satuan}
                          onChange={(event) =>
                            updateBiayaRow(index, "satuan", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.biaya}
                          onChange={(event) =>
                            updateBiayaRow(index, "biaya", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <TableInputCell>
                        <Input
                          value={item.jumlah}
                          onChange={(event) =>
                            updateBiayaRow(index, "jumlah", event.target.value)
                          }
                          className="h-10 rounded-lg border-slate-200"
                        />
                      </TableInputCell>
                      <ActionCell>
                        <RemoveRowButton
                          disabled={biayaRows.length === 1}
                          onClick={() => removeBiayaRow(index)}
                        />
                      </ActionCell>
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
                Tambah Realisasi Biaya
              </Button>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FormField label="Total Realisasi">
                  <Input
                    defaultValue={laporanPelaksanaanData.totalRealisasi}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </FormField>
              </div>
            </FormSection>

            <Separator className="my-8" />

            <FormSection
              eyebrow="F"
              title="Penutup dan Tanda Tangan"
              description="Lampiran dan data tanda tangan tampil pada akhir PDF laporan."
            >
              <div className="grid gap-5">
                <FormField label="Lampiran">
                  <Textarea
                    defaultValue={listValue(laporanPelaksanaanData.lampiran)}
                    className="min-h-[140px] rounded-lg border-slate-200"
                  />
                </FormField>

                <div className="grid gap-5 md:grid-cols-3">
                  <FormField label="Jabatan Penandatangan">
                    <Input
                      defaultValue={laporanPelaksanaanData.jabatanPenandatangan}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="Pejabat Penandatangan">
                    <Input
                      defaultValue={laporanPelaksanaanData.pejabat}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>

                  <FormField label="NIP">
                    <Input
                      defaultValue={laporanPelaksanaanData.nip}
                      className="h-11 rounded-lg border-slate-200"
                    />
                  </FormField>
                </div>
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

              <Button className="h-11 rounded-lg px-5">
                <Save className="mr-2 h-4 w-4" />
                Simpan Laporan
              </Button>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <Card className="rounded-lg border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Struktur PDF Laporan
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Urutan bagian sesuai preview cetak.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {laporanPdfSections.map((item, index) => (
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
                    Daftar hadir, foto kegiatan, materi, dan bukti realisasi.
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
        <p className="text-xs font-semibold uppercase text-emerald-600">
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

function TableHeaderCell({ children }: { children: ReactNode }) {
  return <div className="border-r border-slate-200 px-4 py-3">{children}</div>;
}

function TableInputCell({ children }: { children: ReactNode }) {
  return <div className="border-r border-slate-200 p-3">{children}</div>;
}

function ActionCell({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-center p-3">{children}</div>;
}

function RemoveRowButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      disabled={disabled}
      aria-label="Hapus baris"
      onClick={onClick}
      className="h-10 w-10 rounded-lg text-slate-500 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
