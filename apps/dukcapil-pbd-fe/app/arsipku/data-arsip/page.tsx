"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FilterX,
  FolderArchive,
  Search,
  UserRound,
} from "lucide-react";

import { EmployeePhoto } from "@/components/arsipku/employee-photo";
import { formatFileSize } from "@/components/dashboard/document-utils";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { ErrorState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getArsipPegawai } from "@/lib/api/arsipku";
import { withInlineBackendAssetDisposition } from "@/lib/api/assets";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  PegawaiArchive,
  PegawaiDocument,
} from "@/types/arsipku";

type ArchiveRecord = {
  employee: PegawaiArchive;
  document: PegawaiDocument;
};

type ArchiveGroupBy = "none" | "employee" | "category" | "year";
const documentCategoryOptions = [
  "SK CPNS",
  "SK PNS",
  "SPMT",
  "Ijazah",
  "KTP",
  "Sertifikat",
];

export default function DaftarArsipPegawaiPage() {
  const [employees, setEmployees] = useState<PegawaiArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<ArchiveGroupBy>("none");

  useEffect(() => {
    let mounted = true;

    const loadArchives = async () => {
      setLoading(true);
      try {
        const records = await getArsipPegawai();
        if (mounted) {
          setEmployees(Array.isArray(records) ? records : []);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setEmployees([]);
          setError("Daftar arsip pegawai gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadArchives();
    return () => {
      mounted = false;
    };
  }, []);

  const archives = useMemo(
    () =>
      employees.flatMap((employee) =>
        employee.documents.map((document) => ({ employee, document })),
      ),
    [employees],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...documentCategoryOptions,
          ...archives.map(({ document }) => document.category),
        ]),
      ).sort((left, right) => left.localeCompare(right, "id")),
    [archives],
  );
  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          archives
            .map(({ document }) => document.year)
            .filter((year) => year),
        ),
      ).sort((left, right) => right.localeCompare(left)),
    [archives],
  );
  const filteredArchives = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return archives.filter(({ employee, document }) => {
      if (
        normalizedSearch &&
        ![
          employee.name,
          employee.nip,
          employee.nik,
          employee.bidang,
          employee.unit,
          document.title,
          document.year,
          document.category,
          document.storedFileName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }
      if (
        categoryFilter !== "all" &&
        document.category !== categoryFilter
      ) {
        return false;
      }
      if (yearFilter !== "all" && document.year !== yearFilter) {
        return false;
      }
      return true;
    });
  }, [
    archives,
    categoryFilter,
    search,
    yearFilter,
  ]);
  const archiveGroups = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "", records: filteredArchives }];
    }

    const groups = new Map<string, ArchiveRecord[]>();
    for (const record of filteredArchives) {
      const key =
        groupBy === "employee"
          ? record.employee.name
          : groupBy === "category"
            ? record.document.category
            : record.document.year || "Tanpa Tahun";
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right, "id"))
      .map(([key, records]) => ({
        key,
        label: archiveGroupLabel(groupBy, key),
        records,
      }));
  }, [filteredArchives, groupBy]);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setYearFilter("all");
    setGroupBy("none");
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={FolderArchive}
        eyebrow="Sistem ARSIPKU"
        title="Data Arsip"
        description="Cari, filter, dan kelompokkan seluruh dokumen arsip dari semua pegawai."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              {archives.length} dokumen
            </Badge>
            <Badge variant="outline" className="h-8 rounded-full px-4 text-sm">
              {employees.length} pegawai
            </Badge>
          </div>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <SectionCard
        title="Semua Arsip Pegawai"
        description={`${filteredArchives.length} dari ${archives.length} dokumen ditampilkan.`}
        contentClassName="p-0"
      >
        <div className="border-b border-slate-200 p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-pbd-navy">
                Cari Arsip
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Pegawai, NIP, nama dokumen, tahun, atau file..."
                />
              </div>
            </label>
            <ArchiveSelect
              label="Kategori"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={[
                { value: "all", label: "Semua kategori" },
                ...categoryOptions.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />
            <ArchiveSelect
              label="Tahun Dokumen"
              value={yearFilter}
              onValueChange={setYearFilter}
              options={[
                { value: "all", label: "Semua tahun" },
                ...yearOptions.map((year) => ({ value: year, label: year })),
              ]}
            />
            <ArchiveSelect
              label="Kelompokkan"
              value={groupBy}
              onValueChange={(value) => setGroupBy(value as ArchiveGroupBy)}
              options={[
                { value: "none", label: "Tanpa kelompok" },
                { value: "employee", label: "Pegawai" },
                { value: "category", label: "Kategori" },
                { value: "year", label: "Tahun" },
              ]}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resetFilters}
              >
                <FilterX className="h-4 w-4" />
                Reset Filter
              </Button>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pegawai</TableHead>
              <TableHead>Nama Dokumen</TableHead>
              <TableHead>Tahun Dokumen</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>File</TableHead>
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
                  Memuat seluruh arsip pegawai...
                </TableCell>
              </TableRow>
            ) : filteredArchives.length > 0 ? (
              archiveGroups.map((group) => (
                <Fragment key={group.key}>
                  {groupBy !== "none" ? (
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableCell
                        colSpan={6}
                        className="py-3 font-extrabold text-pbd-navy"
                      >
                        <div className="flex items-center gap-2">
                          {group.label}
                          <Badge variant="outline" className="bg-white">
                            {group.records.length} dokumen
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {group.records.map(({ employee, document }) => (
                    <ArchiveTableRow
                      key={`${employee.id}-${document.id}`}
                      employee={employee}
                      document={document}
                    />
                  ))}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  {archives.length > 0
                    ? "Tidak ada arsip yang sesuai dengan pencarian dan filter."
                    : "Belum ada dokumen arsip pegawai."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </main>
  );
}

function ArchiveTableRow({
  employee,
  document,
}: {
  employee: PegawaiArchive;
  document: PegawaiDocument;
}) {
  return (
    <TableRow>
      <TableCell className="min-w-[240px] whitespace-normal">
        <Link
          href={`/arsipku/data-pegawai/${employee.id}`}
          className="flex items-center gap-3"
        >
          <EmployeePhoto
            employee={employee}
            className="h-10 w-10 shrink-0 rounded-lg text-xs"
            sizes="40px"
          />
          <div>
            <p className="font-bold text-pbd-navy hover:text-pbd-blue">
              {employee.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">{employee.nip}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell className="min-w-[240px] whitespace-normal">
        <p className="font-bold text-pbd-navy">{document.title}</p>
      </TableCell>
      <TableCell>{document.year || "-"}</TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-slate-50">
          {document.category}
        </Badge>
      </TableCell>
      <TableCell className="min-w-[220px] whitespace-normal">
        <p className="font-semibold text-slate-700">
          {document.storedFileName}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {document.fileType} • {formatFileSize(document.fileSize)}
        </p>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link href={`/arsipku/data-pegawai/${employee.id}`}>
              <UserRound className="h-4 w-4" />
              Detail
            </Link>
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a
              href={withInlineBackendAssetDisposition(
                document.previewUrl ??
                  apiEndpoints.arsipPegawaiDocumentDownload(
                    employee.id,
                    document.id,
                  ),
              )}
              target="_blank"
              rel="noreferrer"
            >
              <Eye className="h-4 w-4" />
              Lihat
            </a>
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a
              href={apiEndpoints.arsipPegawaiDocumentDownload(
                employee.id,
                document.id,
              )}
            >
              <Download className="h-4 w-4" />
              Unduh
            </a>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ArchiveSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function archiveGroupLabel(groupBy: ArchiveGroupBy, key: string) {
  if (groupBy === "year") {
    return key === "Tanpa Tahun" ? key : `Tahun ${key}`;
  }
  return key;
}
