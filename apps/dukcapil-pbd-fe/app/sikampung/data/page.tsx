"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Database,
  Download,
  Edit,
  MapPinned,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

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

type KampungStatus = "Aktif" | "Tidak Aktif";

type KampungRecord = {
  id: string;
  namaKabKota: string;
  namaDistrik: string;
  namaKampungDesa: string;
  kodeWilayah: string;
  status: KampungStatus;
  catatan: string;
};

type KampungFormState = Omit<KampungRecord, "id">;

const initialFormState: KampungFormState = {
  namaKabKota: "",
  namaDistrik: "",
  namaKampungDesa: "",
  kodeWilayah: "",
  status: "Aktif",
  catatan: "",
};

const initialKampungRecords: KampungRecord[] = [
  {
    id: "kampung-001",
    namaKabKota: "Kab. Sorong",
    namaDistrik: "Aimas",
    namaKampungDesa: "Malawili",
    kodeWilayah: "96.01.01.2001",
    status: "Aktif",
    catatan: "Data awal sudah sesuai.",
  },
  {
    id: "kampung-002",
    namaKabKota: "Kab. Sorong Selatan",
    namaDistrik: "Teminabuan",
    namaKampungDesa: "Keyen",
    kodeWilayah: "96.02.01.2003",
    status: "Aktif",
    catatan: "Perlu pembaruan koordinat wilayah.",
  },
  {
    id: "kampung-003",
    namaKabKota: "Kab. Maybrat",
    namaDistrik: "Aitinyo",
    namaKampungDesa: "Ayata",
    kodeWilayah: "96.05.02.2002",
    status: "Aktif",
    catatan: "Data administrasi lengkap.",
  },
  {
    id: "kampung-004",
    namaKabKota: "Kab. Raja Ampat",
    namaDistrik: "Waisai Kota",
    namaKampungDesa: "Sapordanco",
    kodeWilayah: "96.03.01.2004",
    status: "Tidak Aktif",
    catatan: "Menunggu validasi status administrasi.",
  },
];

export default function SikampungDataPage() {
  const [records, setRecords] = useState(initialKampungRecords);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KampungFormState>(initialFormState);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      [
        record.namaKabKota,
        record.namaDistrik,
        record.namaKampungDesa,
        record.kodeWilayah,
        record.status,
        record.catatan,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, records]);

  const editingRecord = editingId
    ? records.find((record) => record.id === editingId)
    : null;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(initialFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (record: KampungRecord) => {
    setEditingId(record.id);
    setForm({
      namaKabKota: record.namaKabKota,
      namaDistrik: record.namaDistrik,
      namaKampungDesa: record.namaKampungDesa,
      kodeWilayah: record.kodeWilayah,
      status: record.status,
      catatan: record.catatan,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId) {
      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.id === editingId ? { ...record, ...form } : record,
        ),
      );
    } else {
      setRecords((currentRecords) => [
        {
          id: `kampung-${Date.now()}`,
          ...form,
        },
        ...currentRecords,
      ]);
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(initialFormState);
  };

  const handleDelete = (id: string) => {
    setRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== id),
    );
  };

  const handleDownloadXlsx = () => {
    downloadKampungXlsx(filteredRecords);
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={Database}
        eyebrow="SIKAMPUNG"
        title="Data Kampung/Desa"
        description="Kelola data kampung/desa berdasarkan kabupaten/kota, distrik, kode wilayah, status, dan catatan."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {records.length} data kampung/desa
          </Badge>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" />
            Tambah Kampung/Desa
          </Button>
        }
      />

      <SectionCard
        title="Data Kampung/Desa"
        description="Data sementara disimpan pada state halaman dan siap diganti ke API saat backend tersedia."
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
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Cari kampung/desa, distrik, kode..."
              />
            </div>
          </div>
        }
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kab/Kota</TableHead>
              <TableHead>Nama Distrik</TableHead>
              <TableHead>Nama Kampung/Desa</TableHead>
              <TableHead>Kode Wilayah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="min-w-[220px] font-bold text-pbd-navy">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                        <MapPinned className="h-4 w-4" />
                      </div>
                      {record.namaKabKota}
                    </div>
                  </TableCell>
                  <TableCell>{record.namaDistrik}</TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {record.namaKampungDesa}
                  </TableCell>
                  <TableCell>{record.kodeWilayah}</TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="min-w-[220px] whitespace-normal">
                    {record.catatan || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(record)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(record.id)}
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
                  colSpan={7}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Data kampung/desa tidak ditemukan.
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
                {editingRecord
                  ? "Edit Data Kampung/Desa"
                  : "Tambah Data Kampung/Desa"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi identitas kampung/desa sesuai wilayah administrasi.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <FormInput
                label="Nama Kab/Kota"
                value={form.namaKabKota}
                onChange={(value) =>
                  setForm((current) => ({ ...current, namaKabKota: value }))
                }
                placeholder="Contoh: Kab. Sorong"
              />
              <FormInput
                label="Nama Distrik"
                value={form.namaDistrik}
                onChange={(value) =>
                  setForm((current) => ({ ...current, namaDistrik: value }))
                }
                placeholder="Contoh: Aimas"
              />
              <FormInput
                label="Nama Kampung/Desa"
                value={form.namaKampungDesa}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    namaKampungDesa: value,
                  }))
                }
                placeholder="Contoh: Malawili"
              />
              <FormInput
                label="Kode Wilayah"
                value={form.kodeWilayah}
                onChange={(value) =>
                  setForm((current) => ({ ...current, kodeWilayah: value }))
                }
                placeholder="Contoh: 96.01.01.2001"
              />
              <FormSelect
                label="Status"
                value={form.status}
                options={["Aktif", "Tidak Aktif"]}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as KampungStatus,
                  }))
                }
              />
              <FormInput
                label="Catatan"
                value={form.catatan}
                onChange={(value) =>
                  setForm((current) => ({ ...current, catatan: value }))
                }
                placeholder="Contoh: Data sudah valid"
                required={false}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {editingRecord ? "Simpan Perubahan" : "Tambah Data"}
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
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        required
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: KampungStatus }) {
  return (
    <Badge
      className={
        status === "Aktif"
          ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border border-slate-200 bg-slate-100 text-slate-700"
      }
    >
      {status}
    </Badge>
  );
}

function downloadKampungXlsx(records: KampungRecord[]) {
  const rows = [
    [
      "No",
      "Nama Kab/Kota",
      "Nama Distrik",
      "Nama Kampung/Desa",
      "Kode Wilayah",
      "Status",
      "Catatan",
    ],
    ...records.map((record, index) => [
      String(index + 1),
      record.namaKabKota,
      record.namaDistrik,
      record.namaKampungDesa,
      record.kodeWilayah,
      record.status,
      record.catatan,
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
    <sheet name="Data Kampung" sheetId="1" r:id="rId1"/>
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
  anchor.download = `data-kampung-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    <col min="4" max="4" width="28" customWidth="1"/>
    <col min="5" max="5" width="20" customWidth="1"/>
    <col min="6" max="6" width="16" customWidth="1"/>
    <col min="7" max="7" width="36" customWidth="1"/>
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
