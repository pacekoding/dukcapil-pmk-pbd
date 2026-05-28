"use client";

import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  createDokumen as createDokumenRequest,
  deleteDokumen as deleteDokumenRequest,
  getDokumenList,
  updateDokumen as updateDokumenRequest,
} from "@/lib/api/dokumen";
import { formatDateForDisplay, toDateInputValue } from "@/lib/date/date-format";
import { cn } from "@/lib/utils";
import type {
  Dokumen,
  DokumenJenisDokumen,
  DokumenJenisKegiatan,
  DokumenPayload,
} from "@/types/dokumen";

type FilterJenisKegiatan = DokumenJenisKegiatan | "all";

type FilterJenisDokumen = DokumenJenisDokumen | "all";

type ModalMode = "select" | "create" | "detail" | "edit" | "delete" | null;

type DokumenFormState = {
  namaKegiatan: string;
  jenisKegiatan: DokumenJenisKegiatan;
  jenisDokumen: DokumenJenisDokumen;
  tanggal: string;
  dibuatOleh: string;
};

const ITEMS_PER_PAGE = 6;

const DEFAULT_JENIS_KEGIATAN_OPTIONS: DokumenJenisKegiatan[] = [
  "Sosialisasi",
  "Bimtek",
  "Pendampingan",
  "Monev",
];

const DEFAULT_JENIS_DOKUMEN_OPTIONS: DokumenJenisDokumen[] = [
  "TOR",
  "Laporan",
];

const DEFAULT_FORM: DokumenFormState = {
  namaKegiatan: "",
  jenisKegiatan: "Sosialisasi",
  jenisDokumen: "TOR",
  tanggal: "",
  dibuatOleh: "Admin Dinas",
};

const getJenisDotColor = (jenis: DokumenJenisKegiatan) => {
  switch (jenis) {
    case "Sosialisasi":
      return "bg-violet-500";
    case "Bimtek":
      return "bg-blue-500";
    case "Pendampingan":
      return "bg-emerald-500";
    case "Monev":
      return "bg-orange-500";
    default:
      return "bg-slate-500";
  }
};

const getJenisStyle = (jenis: DokumenJenisKegiatan) => {
  switch (jenis) {
    case "Sosialisasi":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "Bimtek":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "Pendampingan":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Monev":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
};

const getDocumentStyle = (jenis: DokumenJenisDokumen) => {
  if (jenis === "TOR") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const toFormState = (item: Dokumen): DokumenFormState => ({
  namaKegiatan: item.namaKegiatan,
  jenisKegiatan: item.jenisKegiatan,
  jenisDokumen: item.jenisDokumen,
  tanggal: toDateInputValue(item.tanggal),
  dibuatOleh: item.dibuatOleh,
});

export default function DokumenPage() {
  const [documents, setDocuments] = useState<Dokumen[]>([]);
  const [jenisKegiatanOptions, setJenisKegiatanOptions] = useState<
    DokumenJenisKegiatan[]
  >(DEFAULT_JENIS_KEGIATAN_OPTIONS);
  const [jenisDokumenOptions, setJenisDokumenOptions] = useState<
    DokumenJenisDokumen[]
  >(DEFAULT_JENIS_DOKUMEN_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] =
    useState<FilterJenisKegiatan>("all");
  const [filterDokumen, setFilterDokumen] =
    useState<FilterJenisDokumen>("all");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedDokumen, setSelectedDokumen] = useState<Dokumen | null>(null);
  const [formData, setFormData] = useState<DokumenFormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDocuments = async () => {
      try {
        const data = await getDokumenList();

        if (mounted) {
          setDocuments(data.documents);
          setJenisKegiatanOptions(
            data.jenisKegiatanOptions.length
              ? data.jenisKegiatanOptions
              : DEFAULT_JENIS_KEGIATAN_OPTIONS,
          );
          setJenisDokumenOptions(
            data.jenisDokumenOptions.length
              ? data.jenisDokumenOptions
              : DEFAULT_JENIS_DOKUMEN_OPTIONS,
          );
          setPageError("");
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setPageError("Data dokumen gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalTor = documents.filter((item) => item.jenisDokumen === "TOR")
      .length;
    const totalLaporan = documents.filter(
      (item) => item.jenisDokumen === "Laporan",
    ).length;
    const totalKegiatan = new Set(documents.map((item) => item.namaKegiatan))
      .size;

    return {
      totalTor,
      totalLaporan,
      totalKegiatan,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          item.namaKegiatan,
          item.jenisKegiatan,
          item.jenisDokumen,
          item.tanggal,
          formatDateForDisplay(item.tanggal),
          item.dibuatOleh,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesJenis =
        filterJenis === "all" || item.jenisKegiatan === filterJenis;

      const matchesDokumen =
        filterDokumen === "all" || item.jenisDokumen === filterDokumen;

      return matchesSearch && matchesJenis && matchesDokumen;
    });
  }, [documents, filterDokumen, filterJenis, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const showingStart =
    filteredDocuments.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingEnd = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredDocuments.length,
  );

  const updateFormField = <Key extends keyof DokumenFormState>(
    key: Key,
    value: DokumenFormState[Key],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetModal = () => {
    setModalMode(null);
    setSelectedDokumen(null);
    setFormData(DEFAULT_FORM);
    setFormError("");
  };

  const openCreateModal = () => {
    setSelectedDokumen(null);
    setFormData(DEFAULT_FORM);
    setFormError("");
    setModalMode("select");
  };

  const openDetailModal = (item: Dokumen) => {
    setSelectedDokumen(item);
    setFormError("");
    setModalMode("detail");
  };

  const openEditModal = (item: Dokumen) => {
    setSelectedDokumen(item);
    setFormData(toFormState(item));
    setFormError("");
    setModalMode("edit");
  };

  const openDeleteModal = (item: Dokumen) => {
    setSelectedDokumen(item);
    setFormError("");
    setModalMode("delete");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleJenisChange = (value: string) => {
    setFilterJenis(value as FilterJenisKegiatan);
    setPage(1);
  };

  const handleDokumenChange = (value: string) => {
    setFilterDokumen(value as FilterJenisDokumen);
    setPage(1);
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    filterJenis !== "all" ||
    filterDokumen !== "all";

  const resetFilters = () => {
    setSearch("");
    setFilterJenis("all");
    setFilterDokumen("all");
    setPage(1);
  };

  const validateForm = () => {
    if (!formData.namaKegiatan.trim()) {
      return "Nama kegiatan wajib diisi.";
    }

    if (!formData.tanggal.trim()) {
      return "Tanggal dokumen wajib diisi.";
    }

    if (!formData.dibuatOleh.trim()) {
      return "Pembuat dokumen wajib diisi.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errorMessage = validateForm();

    if (errorMessage) {
      setFormError(errorMessage);
      return;
    }

    const normalizedItem: DokumenPayload = {
      namaKegiatan: formData.namaKegiatan.trim(),
      jenisKegiatan: formData.jenisKegiatan,
      jenisDokumen: formData.jenisDokumen,
      tanggal: formData.tanggal.trim(),
      dibuatOleh: formData.dibuatOleh.trim(),
    };

    try {
      setSaving(true);

      if (modalMode === "edit" && selectedDokumen) {
        const updated = await updateDokumenRequest(
          selectedDokumen.id,
          normalizedItem,
        );

        setDocuments((prev) =>
          prev.map((item) => (item.id === selectedDokumen.id ? updated : item)),
        );
      }

      if (modalMode === "create") {
        const created = await createDokumenRequest(normalizedItem);

        setDocuments((prev) => [created, ...prev]);
        setSearch("");
        setFilterJenis("all");
        setFilterDokumen("all");
        setPage(1);
      }

      resetModal();
    } catch (error) {
      console.error(error);
      setFormError("Dokumen gagal disimpan. Coba ulangi beberapa saat lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDokumen) {
      return;
    }

    try {
      setSaving(true);
      await deleteDokumenRequest(selectedDokumen.id);

      setDocuments((prev) =>
        prev.filter((item) => item.id !== selectedDokumen.id),
      );
      resetModal();
    } catch (error) {
      console.error(error);
      setFormError("Dokumen gagal dihapus. Coba ulangi beberapa saat lagi.");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    {
      title: "Total Dokumen",
      value: documents.length,
      description: `${summary.totalKegiatan} kegiatan terhubung`,
      icon: FileText,
      className: "bg-pbd-navy text-white",
      iconClassName: "bg-white/10 text-pbd-gold",
      inverted: true,
    },
    {
      title: "Dokumen TOR",
      value: summary.totalTor,
      description: "Dokumen perencanaan kegiatan",
      icon: ClipboardList,
      className: "bg-white text-slate-950",
      iconClassName: "bg-blue-50 text-blue-600",
      inverted: false,
    },
    {
      title: "Laporan",
      value: summary.totalLaporan,
      description: "Dokumen pelaksanaan kegiatan",
      icon: CheckCircle2,
      className: "bg-white text-slate-950",
      iconClassName: "bg-emerald-50 text-emerald-600",
      inverted: false,
    },
  ];

  return (
    <main className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      <Card className="rounded-lg border border-slate-200 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Daftar Dokumen
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredDocuments.length} dokumen ditemukan dari{" "}
                {documents.length} dokumen.
              </p>
            </div>

            <Button
              type="button"
              onClick={openCreateModal}
              disabled={loading}
              className="h-11 rounded-lg px-5"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Dokumen
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_190px] xl:w-[760px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Cari kegiatan, dokumen, pembuat..."
                className="h-11 rounded-lg border-slate-200 pl-10"
              />
            </div>

            <Select value={filterJenis} onValueChange={handleJenisChange}>
              <SelectTrigger className="h-11 rounded-lg border-slate-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kegiatan</SelectItem>
                {jenisKegiatanOptions.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDokumen} onValueChange={handleDokumenChange}>
              <SelectTrigger className="h-11 rounded-lg border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Dokumen</SelectItem>
                {jenisDokumenOptions.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {search.trim() ? (
                <FilterPill label={`Pencarian: ${search.trim()}`} />
              ) : null}
              {filterJenis !== "all" ? (
                <FilterPill label={`Kegiatan: ${filterJenis}`} />
              ) : null}
              {filterDokumen !== "all" ? (
                <FilterPill label={`Dokumen: ${filterDokumen}`} />
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="h-8 rounded-lg px-3 text-xs text-slate-600"
                onClick={resetFilters}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Reset filter
              </Button>
            </div>
          ) : null}

          <div className="mt-6 hidden overflow-hidden rounded-lg border border-slate-200 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[72px] whitespace-nowrap">
                    No
                  </TableHead>
                  <TableHead>Nama Kegiatan</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Jenis Kegiatan
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Dokumen</TableHead>
                  <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Dibuat Oleh
                  </TableHead>
                  <TableHead className="w-[132px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedDocuments.length > 0 ? (
                  paginatedDocuments.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <TableCell className="font-medium text-slate-500">
                        {showingStart + index}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[360px]">
                          <button
                            type="button"
                            onClick={() => openDetailModal(item)}
                            className="line-clamp-2 text-left font-medium leading-6 text-slate-950 transition hover:text-pbd-blue"
                          >
                            {item.namaKegiatan}
                          </button>
                          <p className="text-xs text-slate-500">
                            ID dokumen #{item.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <KegiatanMarker jenis={item.jenisKegiatan} />
                      </TableCell>
                      <TableCell>
                        <DocumentBadge jenis={item.jenisDokumen} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatDateForDisplay(item.tanggal)}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {item.dibuatOleh}
                      </TableCell>
                      <TableCell>
                        <DokumenActions
                          item={item}
                          onView={openDetailModal}
                          onEdit={openEditModal}
                          onDelete={openDeleteModal}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-lg bg-slate-100"
                />
              ))
            ) : paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        #{showingStart + index} / ID {item.id}
                      </p>
                      <button
                        type="button"
                        onClick={() => openDetailModal(item)}
                        className="mt-1 line-clamp-2 text-left font-semibold leading-6 text-slate-950 transition hover:text-pbd-blue"
                      >
                        {item.namaKegiatan}
                      </button>
                    </div>
                    <DocumentBadge jenis={item.jenisDokumen} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600">
                    <KegiatanMarker jenis={item.jenisKegiatan} />
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      {formatDateForDisplay(item.tanggal)}
                    </div>
                    <div>Dibuat oleh {item.dibuatOleh}</div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <DokumenActions
                      item={item}
                      onView={openDetailModal}
                      onEdit={openEditModal}
                      onDelete={openDeleteModal}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200">
                <EmptyState />
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan {showingStart} - {showingEnd} dari{" "}
              {filteredDocuments.length} dokumen
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                aria-label="Halaman sebelumnya"
                className="h-10 w-10 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700">
                {currentPage} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                aria-label="Halaman berikutnya"
                className="h-10 w-10 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pageError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {pageError}
        </section>
      ) : null}

      {modalMode === "select" && (
        <CreateDokumenChoiceModal onClose={resetModal} />
      )}

      {(modalMode === "create" || modalMode === "edit") && (
        <DokumenFormModal
          mode={modalMode}
          formData={formData}
          error={formError}
          saving={saving}
          jenisKegiatanOptions={jenisKegiatanOptions}
          jenisDokumenOptions={jenisDokumenOptions}
          onClose={resetModal}
          onSubmit={handleSubmit}
          onChange={updateFormField}
        />
      )}

      {modalMode === "detail" && selectedDokumen && (
        <DokumenDetailModal
          item={selectedDokumen}
          onClose={resetModal}
          onEdit={() => openEditModal(selectedDokumen)}
        />
      )}

      {modalMode === "delete" && selectedDokumen && (
        <DeleteDokumenModal
          item={selectedDokumen}
          error={formError}
          saving={saving}
          onClose={resetModal}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  iconClassName,
  inverted,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  className: string;
  iconClassName: string;
  inverted: boolean;
}) {
  return (
    <Card
      className={cn(
        "min-h-[150px] rounded-3xl border-slate-200 py-0 shadow-sm",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <p
            className={cn(
              "text-sm font-medium",
              inverted ? "text-white/75" : "text-slate-500",
            )}
          >
            {title}
          </p>

          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              iconClassName,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
          <p
            className={cn(
              "mt-2 text-sm",
              inverted ? "text-white/65" : "text-slate-500",
            )}
          >
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function JenisBadge({ jenis }: { jenis: DokumenJenisKegiatan }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        getJenisStyle(jenis),
      )}
    >
      {jenis}
    </span>
  );
}

function DocumentBadge({ jenis }: { jenis: DokumenJenisDokumen }) {
  return (
    <Badge
      className={cn(
        "rounded-md border px-2.5 py-1 font-medium",
        getDocumentStyle(jenis),
      )}
    >
      {jenis}
    </Badge>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-8 max-w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600">
      <span className="truncate">{label}</span>
    </span>
  );
}

function KegiatanMarker({ jenis }: { jenis: DokumenJenisKegiatan }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-700">
      <span className={cn("h-2.5 w-2.5 rounded-full", getJenisDotColor(jenis))} />
      <span>{jenis}</span>
    </div>
  );
}

function DokumenActions({
  item,
  onView,
  onEdit,
  onDelete,
}: {
  item: Dokumen;
  onView: (item: Dokumen) => void;
  onEdit: (item: Dokumen) => void;
  onDelete: (item: Dokumen) => void;
}) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Menu dokumen"
            className="rounded-lg"
          >
            <MoreVertical className="h-4 w-4 text-slate-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => onView(item)}>
            <Eye className="h-4 w-4" />
            Lihat Detail
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
            Edit Dokumen
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/dokumen/${item.id}/cetak`}>
              <FileText className="h-4 w-4" />
              Preview dan Cetak
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
            Hapus Dokumen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">
        Dokumen tidak ditemukan
      </h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Coba ubah kata kunci pencarian atau reset filter yang sedang aktif.
      </p>
    </div>
  );
}

function CreateDokumenChoiceModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} title="Tambah Dokumen">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-heading text-2xl font-bold leading-tight text-slate-950">
            Pilih format dokumen
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Setiap format memiliki form input yang mengikuti struktur PDF
            masing-masing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/dokumen/create/tor"
            className="group rounded-3xl border border-slate-200 p-5 transition hover:border-pbd-blue hover:bg-blue-50/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">
              Dokumen TOR
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Form perencanaan kegiatan, rundown, rincian biaya, dan tanda
              tangan TOR.
            </p>
          </Link>

          <Link
            href="/dashboard/dokumen/create/laporan"
            className="group rounded-3xl border border-slate-200 p-5 transition hover:border-emerald-500 hover:bg-emerald-50/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">
              Dokumen Laporan
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Form laporan pelaksanaan, hasil kegiatan, dokumentasi, realisasi
              biaya, dan penutup.
            </p>
          </Link>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-2xl px-5"
          >
            Batal
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function DokumenFormModal({
  mode,
  formData,
  error,
  saving,
  jenisKegiatanOptions,
  jenisDokumenOptions,
  onClose,
  onSubmit,
  onChange,
}: {
  mode: "create" | "edit";
  formData: DokumenFormState;
  error: string;
  saving: boolean;
  jenisKegiatanOptions: DokumenJenisKegiatan[];
  jenisDokumenOptions: DokumenJenisDokumen[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof DokumenFormState>(
    key: Key,
    value: DokumenFormState[Key],
  ) => void;
}) {
  const title = mode === "create" ? "Tambah Dokumen" : "Edit Dokumen";

  return (
    <ModalShell onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Nama Kegiatan"
            htmlFor="namaKegiatan"
            className="md:col-span-2"
          >
            <Input
              id="namaKegiatan"
              value={formData.namaKegiatan}
              onChange={(event) =>
                onChange("namaKegiatan", event.target.value)
              }
              placeholder="Contoh: Sosialisasi Administrasi Kependudukan"
              disabled={saving}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
            />
          </FormField>

          <FormField label="Jenis Kegiatan" htmlFor="jenisKegiatan">
            <Select
              value={formData.jenisKegiatan}
              disabled={saving}
              onValueChange={(value) =>
                onChange("jenisKegiatan", value as DokumenJenisKegiatan)
              }
            >
              <SelectTrigger
                id="jenisKegiatan"
                className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50 px-4"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jenisKegiatanOptions.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Jenis Dokumen" htmlFor="jenisDokumen">
            <Select
              value={formData.jenisDokumen}
              disabled={saving}
              onValueChange={(value) =>
                onChange("jenisDokumen", value as DokumenJenisDokumen)
              }
            >
              <SelectTrigger
                id="jenisDokumen"
                className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50 px-4"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jenisDokumenOptions.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Tanggal" htmlFor="tanggal">
            <Input
              id="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={(event) => onChange("tanggal", event.target.value)}
              disabled={saving}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
            />
          </FormField>

          <FormField label="Dibuat Oleh" htmlFor="dibuatOleh">
            <Input
              id="dibuatOleh"
              value={formData.dibuatOleh}
              onChange={(event) => onChange("dibuatOleh", event.target.value)}
              placeholder="Contoh: Admin Dinas"
              disabled={saving}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
            />
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-2xl px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 rounded-2xl bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            {saving
              ? "Menyimpan..."
              : mode === "create"
                ? "Simpan Dokumen"
                : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function DokumenDetailModal({
  item,
  onClose,
  onEdit,
}: {
  item: Dokumen;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <ModalShell onClose={onClose} title="Detail Dokumen">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <JenisBadge jenis={item.jenisKegiatan} />
                <DocumentBadge jenis={item.jenisDokumen} />
              </div>

              <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-slate-950">
                {item.namaKegiatan}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Dokumen #{item.id} dibuat oleh {item.dibuatOleh}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem
            icon={CalendarDays}
            label="Tanggal"
            value={formatDateForDisplay(item.tanggal)}
          />
          <InfoItem
            icon={ClipboardList}
            label="Jenis Kegiatan"
            value={item.jenisKegiatan}
          />
          <InfoItem
            icon={FileText}
            label="Jenis Dokumen"
            value={item.jenisDokumen}
          />
          <InfoItem
            icon={UserRound}
            label="Dibuat Oleh"
            value={item.dibuatOleh}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-2xl px-5"
          >
            Tutup
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            className="h-11 rounded-2xl bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            <Pencil className="h-4 w-4" />
            Edit Dokumen
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteDokumenModal({
  item,
  error,
  saving,
  onClose,
  onDelete,
}: {
  item: Dokumen;
  error: string;
  saving: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <ModalShell onClose={onClose} title="Hapus Dokumen" size="sm">
      <div className="space-y-5">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-red-900">
                {item.namaKegiatan}
              </p>
              <p className="mt-2 text-sm leading-6 text-red-700">
                Data dokumen ini akan dihapus dari daftar pada sesi halaman
                saat ini.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-2xl px-5"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="h-11 rounded-2xl bg-red-600 px-5 text-white hover:bg-red-700"
          >
            {saving ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,
  title,
  onClose,
  size = "default",
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  size?: "default" | "sm";
}) {
  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center
        justify-center
        bg-slate-950/50
        px-4 py-6
        backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          `
            max-h-[calc(100vh-3rem)]
            w-full overflow-hidden
            rounded-3xl bg-white
            shadow-2xl
          `,
          size === "sm" ? "max-w-lg" : "max-w-3xl",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-pbd-blue">
              Dokumen
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold text-slate-950">
              {title}
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup modal"
            className="h-10 w-10 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700">
        {label}
      </Label>
      {children}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
