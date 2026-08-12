"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Database,
  Download,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getKabKota } from "@/lib/api/kab-kota";
import {
  createBumKampung,
  deleteBumKampung,
  getBumKampung,
  updateBumKampung,
} from "@/lib/api/bum-kampung";
import type {
  BumKampung,
  BumKampungPayload,
  BumKampungStatus,
} from "@/types/bum-kampung";
import {
  bumKampungKategoriOptions,
  bumKampungStatusOptions,
} from "@/types/bum-kampung";
import type { KabKota } from "@/types/kab-kota";

const initialFormState: BumKampungPayload = {
  kabupatenKota: "",
  distrik: "",
  kampung: "",
  namaBumKampung: "",
  kategori: "BUMKam",
  status: "Perbaikan Dokumen Badan Hukum",
};

const pageSizeOptions = [10, 25, 50, 100] as const;

export default function SibumDataPage() {
  const [records, setRecords] = useState<BumKampung[]>([]);
  const [kabKotaOptions, setKabKotaOptions] = useState<KabKota[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BumKampung | null>(null);
  const [form, setForm] = useState<BumKampungPayload>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRecords = async () => {
      try {
        const [data, kabKotaData] = await Promise.all([
          getBumKampung(),
          getKabKota(),
        ]);
        if (mounted) {
          setRecords(data.items);
          setKabKotaOptions(kabKotaData);
          setTahunAnggaran(data.tahunAnggaran);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data BUMKam gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadRecords();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      [
        record.kabupatenKota,
        record.distrik,
        record.kampung,
        record.namaBumKampung,
        record.kategori,
        record.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, records]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [currentPage, filteredRecords, pageSize]);

  const editingRecord = editingId
    ? records.find((record) => record.id === editingId)
    : null;

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...initialFormState,
      kabupatenKota: kabKotaOptions[0]?.nama ?? "",
    });
    setError(null);
    setFormOpen(true);
  };

  const openEditForm = (record: BumKampung) => {
    setEditingId(record.id);
    setForm({
      kabupatenKota: record.kabupatenKota,
      distrik: record.distrik,
      kampung: record.kampung,
      namaBumKampung: record.namaBumKampung,
      kategori: record.kategori,
      status: record.status,
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
    setForm(initialFormState);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: BumKampungPayload = {
      kabupatenKota: form.kabupatenKota.trim(),
      distrik: form.distrik.trim(),
      kampung: form.kampung.trim(),
      namaBumKampung: form.namaBumKampung.trim(),
      kategori: form.kategori,
      status: form.status,
    };
    if (
      !payload.kabupatenKota ||
      !payload.distrik ||
      !payload.kampung ||
      !payload.namaBumKampung
    ) {
      setError("Kabupaten/kota, distrik, kampung, dan nama BUM Kampung wajib diisi.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        const updated = await updateBumKampung(editingId, payload);
        setRecords((currentRecords) =>
          currentRecords.map((record) =>
            record.id === editingId ? updated : record,
          ),
        );
        setMessage(`${updated.namaBumKampung} berhasil diperbarui.`);
      } else {
        const created = await createBumKampung(payload);
        setRecords((currentRecords) => [created, ...currentRecords]);
        setMessage(`${created.namaBumKampung} berhasil ditambahkan.`);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(initialFormState);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Data BUMKam gagal disimpan.",
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
      await deleteBumKampung(deleteTarget.id);
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== deleteTarget.id),
      );
      setMessage("Data BUMKam berhasil dihapus.");
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Data BUMKam gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadXlsx = () => {
    downloadBumKamXlsx(filteredRecords);
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={Database}
        eyebrow="SIBUM Kampung"
        title="Data BUMKam"
        description="Kelola data BUM Kampung berdasarkan kabupaten/kota, distrik, kampung, kategori, dan status verifikasi."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {records.length} data BUMKam - {tahunAnggaran}
          </Badge>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={openCreateForm}
          >
            <Plus className="h-4 w-4" />
            Tambah BUMKam
          </Button>
        }
      />

      {formOpen ? (
        <SectionCard
          title={editingRecord ? "Edit Data BUMKam" : "Tambah Data BUMKam"}
          description="Lengkapi identitas BUM Kampung sesuai wilayah administrasi."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label="Kabupaten/Kota"
                value={form.kabupatenKota}
                options={kabKotaOptions.map((item) => item.nama)}
                onChange={(value) =>
                  setForm((current) => ({ ...current, kabupatenKota: value }))
                }
                placeholder="Pilih kabupaten/kota"
              />
              <FormInput
                label="Distrik"
                value={form.distrik}
                onChange={(value) =>
                  setForm((current) => ({ ...current, distrik: value }))
                }
                placeholder="Contoh: Aimas"
              />
              <FormInput
                label="Kampung"
                value={form.kampung}
                onChange={(value) =>
                  setForm((current) => ({ ...current, kampung: value }))
                }
                placeholder="Contoh: Malawili"
              />
              <FormInput
                label="Nama BUM Kampung"
                value={form.namaBumKampung}
                onChange={(value) =>
                  setForm((current) => ({ ...current, namaBumKampung: value }))
                }
                placeholder="Contoh: BUM Kampung Maju Bersama"
              />
              <FormSelect
                label="Kategori"
                value={form.kategori}
                options={[...bumKampungKategoriOptions]}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    kategori: value as BumKampungPayload["kategori"],
                  }))
                }
              />
              <FormSelect
                label="Status"
                value={form.status}
                options={[...bumKampungStatusOptions]}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as BumKampungPayload["status"],
                  }))
                }
              />
            </div>
            {kabKotaOptions.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Data kab/kota belum tersedia. Tambahkan data pada Dashboard - Data Kab/Kota.
              </p>
            ) : null}
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
                disabled={saving || kabKotaOptions.length === 0}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {saving
                  ? "Menyimpan..."
                  : editingRecord
                    ? "Simpan Perubahan"
                    : "Tambah Data"}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar BUMKam"
        description="Data tersimpan ke database berdasarkan tahun anggaran aktif."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg"
              disabled={filteredRecords.length === 0}
              onClick={handleDownloadXlsx}
            >
              <Download className="h-4 w-4" />
              Download XLSX
            </Button>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
                placeholder="Cari BUM Kampung, distrik, status..."
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
              <span className="whitespace-nowrap text-sm font-semibold text-slate-600">
                Tampilkan
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value) as (typeof pageSizeOptions)[number]);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-20 rounded-md border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="whitespace-nowrap text-sm font-semibold text-slate-600">
                data
              </span>
            </div>
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
              <TableHead>Kabupaten/Kota</TableHead>
              <TableHead>Distrik</TableHead>
              <TableHead>Kampung</TableHead>
              <TableHead>Nama BUM Kampung</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[96px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat data BUMKam...
                </TableCell>
              </TableRow>
            ) : paginatedRecords.length > 0 ? (
              paginatedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="min-w-[220px] font-bold text-pbd-navy">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                        <Building2 className="h-4 w-4" />
                      </div>
                      {record.kabupatenKota}
                    </div>
                  </TableCell>
                  <TableCell>{record.distrik}</TableCell>
                  <TableCell>{record.kampung}</TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {record.namaBumKampung}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.kategori}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Buka aksi untuk ${record.namaBumKampung}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(record)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(record)}
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
                  colSpan={7}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Tidak ada data yang sesuai dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {!loading ? (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filteredRecords.length}
            onPageChange={setPage}
          />
        ) : null}
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data BUMKam?"
        description={`Data ${deleteTarget?.namaBumKampung ?? "BUMKam"} akan dihapus dan tidak dapat dikembalikan.`}
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Pilih data",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={options.length === 0}
        className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        required
      >
        {value === "" ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: BumKampungStatus }) {
  const isVerified =
    status === "Dokumen Badan Hukum Terverifikasi" ||
    status === "Nama Terverifikasi";

  return (
    <Badge
      className={
        isVerified
          ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border border-amber-100 bg-amber-50 text-amber-700"
      }
    >
      {status}
    </Badge>
  );
}

function downloadBumKamXlsx(records: BumKampung[]) {
  const rows = [
    [
      "No",
      "Kabupaten/Kota",
      "Distrik",
      "Kampung",
      "Nama BUM Kampung",
      "Kategori",
      "Status",
    ],
    ...records.map((record, index) => [
      String(index + 1),
      record.kabupatenKota,
      record.distrik,
      record.kampung,
      record.namaBumKampung,
      record.kategori,
      record.status,
    ]),
  ];
  const files = [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      path: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Data BUMKam" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      path: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`,
    },
    {
      path: "xl/worksheets/sheet1.xml",
      content: buildWorksheetXml(rows),
    },
  ];
  const zipBytes = createZip(files);
  const blob = new Blob([zipBytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = `data-bumkam-${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(downloadUrl);
}

function buildWorksheetXml(rows: string[][]) {
  const rowXml = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row
        .map((value, columnIndex) => {
          const cellReference = `${columnName(columnIndex + 1)}${rowNumber}`;
          const style = rowIndex === 0 ? ' s="1"' : "";

          return `<c r="${cellReference}" t="inlineStr"${style}><is><t>${escapeXml(value)}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="8" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="22" customWidth="1"/>
    <col min="4" max="4" width="24" customWidth="1"/>
    <col min="5" max="5" width="32" customWidth="1"/>
    <col min="6" max="6" width="24" customWidth="1"/>
    <col min="7" max="7" width="42" customWidth="1"/>
  </cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function createZip(files: Array<{ path: string; content: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const fileName = encoder.encode(file.path);
    const content = encoder.encode(file.content);
    const crc = crc32(content);
    const localHeader = new Uint8Array(30 + fileName.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, content.length, true);
    localView.setUint32(22, content.length, true);
    localView.setUint16(26, fileName.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(fileName, 30);
    localParts.push(localHeader, content);

    const centralHeader = new Uint8Array(46 + fileName.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, content.length, true);
    centralView.setUint32(24, content.length, true);
    centralView.setUint16(28, fileName.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(fileName, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + content.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralParts.reduce(
    (total, part) => total + part.length,
    0,
  );
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, centralDirectoryOffset, true);
  endView.setUint16(20, 0, true);

  return concatUint8Arrays([...localParts, ...centralParts, endRecord]);
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

function columnName(index: number) {
  let name = "";
  let current = index;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
