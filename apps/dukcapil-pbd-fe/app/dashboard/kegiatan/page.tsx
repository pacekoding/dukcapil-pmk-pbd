"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
  ImagePlus,
  Images,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
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
import { Textarea } from "@/components/ui/textarea";
import {
  createKegiatan as createKegiatanRequest,
  deleteKegiatan as deleteKegiatanRequest,
  deleteKegiatanDokumentasi as deleteKegiatanDokumentasiRequest,
  getKegiatanList,
  updateKegiatan as updateKegiatanRequest,
  uploadKegiatanDokumentasi as uploadKegiatanDokumentasiRequest,
  type KegiatanListResponse,
} from "@/lib/api/kegiatan";
import { formatDateForDisplay, toDateInputValue } from "@/lib/date/date-format";
import type {
  Kegiatan,
  KegiatanBidang,
  KegiatanDokumentasiItem,
  KegiatanJenis,
  KegiatanStatus,
} from "@/types/kegiatan";
import { cn } from "@/lib/utils";

type KegiatanStatusFilter = KegiatanStatus | "all";

type ModalMode =
  | "create"
  | "detail"
  | "edit"
  | "delete"
  | "documentation"
  | null;

type KegiatanFormState = {
  nama: string;
  jenis: KegiatanJenis;
  tanggal: string;
  lokasi: string;
  status: KegiatanStatus;
  bidang: KegiatanBidang;
  penanggungJawab: string;
  peserta: string;
  deskripsi: string;
};

const ITEMS_PER_PAGE = 6;
const MAX_DOCUMENTATION_FILE_SIZE_MB = 3;
const MAX_DOCUMENTATION_FILE_SIZE =
  MAX_DOCUMENTATION_FILE_SIZE_MB * 1024 * 1024;

const DEFAULT_FORM: KegiatanFormState = {
  nama: "",
  jenis: "Sosialisasi",
  tanggal: "",
  lokasi: "",
  status: "Draft",
  bidang: "Dukcapil",
  penanggungJawab: "",
  peserta: "0",
  deskripsi: "",
};

const DEFAULT_OPTIONS: KegiatanListResponse["options"] = {
  bidangOptions: [],
  jenisOptions: [],
  statusFilterOptions: [],
  statusFormOptions: [],
};

const getStatusStyle = (status: KegiatanStatus) => {
  switch (status) {
    case "Berjalan":
      return {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        icon: "bg-blue-500",
      };
    case "Selesai":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: "bg-emerald-500",
      };
    case "Draft":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        icon: "bg-amber-500",
      };
    default:
      return {
        badge: "border-slate-200 bg-slate-100 text-slate-700",
        icon: "bg-slate-400",
      };
  }
};

const getJenisStyle = (jenis: KegiatanJenis) => {
  switch (jenis) {
    case "Sosialisasi":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "Bimtek":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "Pendampingan":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Monev":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "Rapat":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
};

const getJenisDotColor = (jenis: KegiatanJenis) => {
  switch (jenis) {
    case "Sosialisasi":
      return "bg-violet-500";
    case "Bimtek":
      return "bg-blue-500";
    case "Pendampingan":
      return "bg-emerald-500";
    case "Monev":
      return "bg-orange-500";
    case "Rapat":
      return "bg-amber-500";
    default:
      return "bg-slate-500";
  }
};

const getBidangStyle = (bidang: KegiatanBidang) => {
  switch (bidang) {
    case "Dukcapil":
      return "border-pbd-blue/20 bg-pbd-blue/10 text-pbd-blue";
    case "PMK":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Sekretariat":
      return "border-pbd-gold/40 bg-pbd-gold/20 text-pbd-navy";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const toFormState = (item: Kegiatan): KegiatanFormState => ({
  nama: item.nama,
  jenis: item.jenis,
  tanggal: toDateInputValue(item.tanggal),
  lokasi: item.lokasi,
  status: item.status,
  bidang: item.bidang,
  penanggungJawab: item.penanggungJawab,
  peserta: String(item.peserta),
  deskripsi: item.deskripsi,
});

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
};

const getStatusCompletionValue = (
  status: KegiatanStatus,
  currentValue = 0,
) => {
  if (status === "Selesai") {
    return 100;
  }

  if (status === "Draft") {
    return 0;
  }

  return currentValue;
};

const getDokumentasiCount = (item: Kegiatan) => item.dokumentasi?.length ?? 0;

const formatUploadedAt = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatDateForDisplay(value);
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function KegiatanPage() {
  const [items, setItems] = useState<Kegiatan[]>([]);
  const [options, setOptions] =
    useState<KegiatanListResponse["options"]>(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<KegiatanStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedKegiatan, setSelectedKegiatan] = useState<Kegiatan | null>(
    null,
  );
  const [formData, setFormData] = useState<KegiatanFormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadKegiatan = async () => {
      try {
        const data = await getKegiatanList();

        if (mounted) {
          setItems(data.items);
          setOptions(data.options);
          setPageError("");
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setPageError("Data kegiatan gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadKegiatan();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const berjalan = items.filter((item) => item.status === "Berjalan").length;
    const selesai = items.filter((item) => item.status === "Selesai").length;
    const draft = items.filter((item) => item.status === "Draft").length;
    const totalPeserta = items.reduce((total, item) => total + item.peserta, 0);

    return {
      berjalan,
      selesai,
      draft,
      totalPeserta,
    };
  }, [items]);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          item.nama,
          item.jenis,
          item.tanggal,
          formatDateForDisplay(item.tanggal),
          item.lokasi,
          item.status,
          item.bidang,
          item.penanggungJawab,
          item.deskripsi,
          String(item.peserta),
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesStatus = status === "all" || item.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const showingStart =
    filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length);

  const updateFormField = <Key extends keyof KegiatanFormState>(
    key: Key,
    value: KegiatanFormState[Key],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetModal = () => {
    setModalMode(null);
    setSelectedKegiatan(null);
    setFormData(DEFAULT_FORM);
    setFormError("");
  };

  const openDetailModal = (item: Kegiatan) => {
    setSelectedKegiatan(item);
    setFormError("");
    setModalMode("detail");
  };

  const openEditModal = (item: Kegiatan) => {
    setSelectedKegiatan(item);
    setFormData(toFormState(item));
    setFormError("");
    setModalMode("edit");
  };

  const openDeleteModal = (item: Kegiatan) => {
    setSelectedKegiatan(item);
    setFormError("");
    setModalMode("delete");
  };

  const openDocumentationModal = (item: Kegiatan) => {
    setSelectedKegiatan(item);
    setFormError("");
    setModalMode("documentation");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as KegiatanStatusFilter);
    setPage(1);
  };

  const hasActiveFilters = search.trim().length > 0 || status !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  const validateForm = () => {
    if (!formData.nama.trim()) {
      return "Nama kegiatan wajib diisi.";
    }

    if (!formData.tanggal.trim()) {
      return "Tanggal kegiatan wajib diisi.";
    }

    if (!formData.lokasi.trim()) {
      return "Lokasi kegiatan wajib diisi.";
    }

    if (!formData.penanggungJawab.trim()) {
      return "Penanggung jawab wajib diisi.";
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

    const normalizedItem: Omit<Kegiatan, "id"> = {
      nama: formData.nama.trim(),
      jenis: formData.jenis,
      tanggal: formData.tanggal.trim(),
      lokasi: formData.lokasi.trim(),
      status: formData.status,
      bidang: formData.bidang,
      penanggungJawab: formData.penanggungJawab.trim(),
      peserta: Math.max(0, toNumber(formData.peserta)),
      progres: getStatusCompletionValue(
        formData.status,
        selectedKegiatan?.progres ?? 0,
      ),
      deskripsi: formData.deskripsi.trim() || "Belum ada deskripsi kegiatan.",
    };

    try {
      setSaving(true);

      if (modalMode === "edit" && selectedKegiatan) {
        const updated = await updateKegiatanRequest(
          selectedKegiatan.id,
          normalizedItem,
        );

        setItems((prev) =>
          prev.map((item) => (item.id === selectedKegiatan.id ? updated : item)),
        );
      }

      if (modalMode === "create") {
        const created = await createKegiatanRequest(normalizedItem);

        setItems((prev) => [created, ...prev]);
        setSearch("");
        setStatus("all");
        setPage(1);
      }

      resetModal();
    } catch (error) {
      console.error(error);
      setFormError("Kegiatan gagal disimpan. Coba ulangi beberapa saat lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKegiatan) {
      return;
    }

    try {
      setSaving(true);
      await deleteKegiatanRequest(selectedKegiatan.id);

      setItems((prev) =>
        prev.filter((item) => item.id !== selectedKegiatan.id),
      );
      resetModal();
    } catch (error) {
      console.error(error);
      setFormError("Kegiatan gagal dihapus. Coba ulangi beberapa saat lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentationUpload = async (
    files: File[],
    caption: string,
  ) => {
    if (!selectedKegiatan) {
      return false;
    }

    if (selectedKegiatan.status !== "Selesai") {
      setFormError(
        "Dokumentasi hanya dapat ditambahkan untuk kegiatan berstatus selesai.",
      );
      return false;
    }

    if (files.length === 0) {
      setFormError("Pilih minimal satu foto dokumentasi.");
      return false;
    }

    const hasInvalidType = files.some(
      (file) => !file.type.startsWith("image/"),
    );

    if (hasInvalidType) {
      setFormError("File dokumentasi harus berupa gambar.");
      return false;
    }

    const hasOversizedFile = files.some(
      (file) => file.size > MAX_DOCUMENTATION_FILE_SIZE,
    );

    if (hasOversizedFile) {
      setFormError(
        `Ukuran setiap foto maksimal ${MAX_DOCUMENTATION_FILE_SIZE_MB} MB.`,
      );
      return false;
    }

    try {
      setSaving(true);

      const uploadedItems: KegiatanDokumentasiItem[] = [];

      for (const file of files) {
        const uploaded = await uploadKegiatanDokumentasiRequest(
          selectedKegiatan.id,
          file,
          caption,
        );

        uploadedItems.unshift(uploaded);
      }

      const appendDocumentation = (item: Kegiatan): Kegiatan =>
        item.id === selectedKegiatan.id
          ? {
              ...item,
              dokumentasi: [...uploadedItems, ...(item.dokumentasi ?? [])],
            }
          : item;

      setItems((prev) => prev.map(appendDocumentation));
      setSelectedKegiatan((prev) =>
        prev ? appendDocumentation(prev) : prev,
      );
      setFormError("");

      return true;
    } catch (error) {
      console.error(error);
      setFormError(
        "Foto dokumentasi gagal disimpan. Coba ulangi beberapa saat lagi.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentationDelete = async (documentationId: number) => {
    if (!selectedKegiatan) {
      return;
    }

    try {
      setSaving(true);
      await deleteKegiatanDokumentasiRequest(
        selectedKegiatan.id,
        documentationId,
      );

      const removeDocumentation = (item: Kegiatan): Kegiatan =>
        item.id === selectedKegiatan.id
          ? {
              ...item,
              dokumentasi: (item.dokumentasi ?? []).filter(
                (documentationItem) =>
                  documentationItem.id !== documentationId,
              ),
            }
          : item;

      setItems((prev) => prev.map(removeDocumentation));
      setSelectedKegiatan((prev) =>
        prev ? removeDocumentation(prev) : prev,
      );
      setFormError("");
    } catch (error) {
      console.error(error);
      setFormError(
        "Foto dokumentasi gagal dihapus. Coba ulangi beberapa saat lagi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    {
      title: "Total Kegiatan",
      value: items.length,
      description: `${summary.berjalan} berjalan, ${summary.draft} draft`,
      icon: ClipboardList,
      className: "bg-pbd-navy text-white",
      iconClassName: "bg-white/10 text-pbd-gold",
      inverted: true,
    },
    {
      title: "Kegiatan Selesai",
      value: summary.selesai,
      description: "Sudah masuk arsip pelaksanaan",
      icon: CheckCircle2,
      className: "bg-white text-slate-950",
      iconClassName: "bg-emerald-50 text-emerald-600",
      inverted: false,
    },
    {
      title: "Total Peserta",
      value: summary.totalPeserta,
      description: "Akumulasi semua kegiatan",
      icon: Users,
      className: "bg-white text-slate-950",
      iconClassName: "bg-pbd-blue/10 text-pbd-blue",
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
                Daftar Kegiatan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredData.length} kegiatan ditemukan dari {items.length}{" "}
                kegiatan.
              </p>
            </div>

            <Button asChild className="h-11 rounded-lg px-5">
              <Link href="/dashboard/kegiatan/create">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kegiatan
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px] xl:w-[620px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Cari nama, bidang, lokasi, penanggung jawab..."
                className="h-11 rounded-lg border-slate-200 pl-10"
              />
            </div>

            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-11 rounded-lg border-slate-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {options.statusFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
              {status !== "all" ? (
                <FilterPill label={`Status: ${status}`} />
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
                  <TableHead className="whitespace-nowrap">Bidang</TableHead>
                  <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="w-[132px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
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
                            {item.nama}
                          </button>
                          <p className="text-xs text-slate-500">
                            ID kegiatan #{item.id} -{" "}
                            {getDokumentasiCount(item)} foto
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <KegiatanMarker jenis={item.jenis} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-md border px-2.5 py-1 font-medium",
                            getBidangStyle(item.bidang),
                          )}
                        >
                          {item.bidang}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatDateForDisplay(item.tanggal)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[260px] whitespace-normal text-slate-600">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span className="line-clamp-2">{item.lokasi}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <KegiatanActions
                          item={item}
                          onView={openDetailModal}
                          onDocumentation={openDocumentationModal}
                          onEdit={openEditModal}
                          onDelete={openDeleteModal}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>
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
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        #{showingStart + index} / ID {item.id} -{" "}
                        {getDokumentasiCount(item)} foto
                      </p>
                      <button
                        type="button"
                        onClick={() => openDetailModal(item)}
                        className="mt-1 line-clamp-2 text-left font-semibold leading-6 text-slate-950 transition hover:text-pbd-blue"
                      >
                        {item.nama}
                      </button>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600">
                    <KegiatanMarker jenis={item.jenis} />
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-md border px-2.5 py-1 text-xs font-medium",
                        getBidangStyle(item.bidang),
                      )}
                    >
                      {item.bidang}
                    </span>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      {formatDateForDisplay(item.tanggal)}
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>{item.lokasi}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <KegiatanActions
                      item={item}
                      onView={openDetailModal}
                      onDocumentation={openDocumentationModal}
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
              {filteredData.length} kegiatan
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
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {pageError}
        </section>
      ) : null}

      {(modalMode === "create" || modalMode === "edit") && (
        <KegiatanFormModal
          mode={modalMode}
          formData={formData}
          error={formError}
          saving={saving}
          options={options}
          onClose={resetModal}
          onSubmit={handleSubmit}
          onChange={updateFormField}
        />
      )}

      {modalMode === "detail" && selectedKegiatan && (
        <KegiatanDetailModal
          item={selectedKegiatan}
          onClose={resetModal}
          onDocumentation={() => openDocumentationModal(selectedKegiatan)}
          onEdit={() => openEditModal(selectedKegiatan)}
        />
      )}

      {modalMode === "documentation" && selectedKegiatan && (
        <KegiatanDocumentationModal
          item={selectedKegiatan}
          error={formError}
          saving={saving}
          onClose={resetModal}
          onUpload={handleDocumentationUpload}
          onDelete={handleDocumentationDelete}
        />
      )}

      {modalMode === "delete" && selectedKegiatan && (
        <DeleteKegiatanModal
          item={selectedKegiatan}
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
        "min-h-[150px] rounded-lg border-slate-200 py-0 shadow-sm",
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
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
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

function JenisBadge({ jenis }: { jenis: KegiatanJenis }) {
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

function FilterPill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-8 max-w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600">
      <span className="truncate">{label}</span>
    </span>
  );
}

function KegiatanMarker({ jenis }: { jenis: KegiatanJenis }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-700">
      <span className={cn("h-2.5 w-2.5 rounded-full", getJenisDotColor(jenis))} />
      <span>{jenis}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: KegiatanStatus }) {
  const style = getStatusStyle(status);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium",
        style.badge,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", style.icon)} />
      {status}
    </span>
  );
}

function KegiatanActions({
  item,
  onView,
  onDocumentation,
  onEdit,
  onDelete,
}: {
  item: Kegiatan;
  onView: (item: Kegiatan) => void;
  onDocumentation: (item: Kegiatan) => void;
  onEdit: (item: Kegiatan) => void;
  onDelete: (item: Kegiatan) => void;
}) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Menu kegiatan"
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
          <DropdownMenuItem
            disabled={item.status !== "Selesai"}
            onSelect={() => onDocumentation(item)}
          >
            <Images className="h-4 w-4" />
            Dokumentasi Foto
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
            Edit Kegiatan
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/dokumen/create">
              <FileText className="h-4 w-4" />
              Buat Dokumen
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
            Hapus Kegiatan
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
        Kegiatan tidak ditemukan
      </h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Coba ubah kata kunci pencarian atau reset filter yang sedang aktif.
      </p>
    </div>
  );
}

function KegiatanFormModal({
  mode,
  formData,
  error,
  saving,
  options,
  onClose,
  onSubmit,
  onChange,
}: {
  mode: "create" | "edit";
  formData: KegiatanFormState;
  error: string;
  saving: boolean;
  options: KegiatanListResponse["options"];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof KegiatanFormState>(
    key: Key,
    value: KegiatanFormState[Key],
  ) => void;
}) {
  const title = mode === "create" ? "Tambah Kegiatan" : "Edit Kegiatan";

  return (
    <ModalShell onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Nama Kegiatan"
            htmlFor="nama"
            className="md:col-span-2"
          >
            <Input
              id="nama"
              value={formData.nama}
              onChange={(event) => onChange("nama", event.target.value)}
              placeholder="Contoh: Sosialisasi Administrasi Kependudukan"
              disabled={saving}
              className="h-11 rounded-lg border-slate-200 bg-slate-50"
            />
          </FormField>

          <FormField label="Bidang" htmlFor="bidang">
            <Select
              value={formData.bidang}
              disabled={saving}
              onValueChange={(value) =>
                onChange("bidang", value as KegiatanBidang)
              }
            >
              <SelectTrigger
                id="bidang"
                className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-4"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.bidangOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Jenis Kegiatan" htmlFor="jenis">
            <Select
              value={formData.jenis}
              disabled={saving}
              onValueChange={(value) =>
                onChange("jenis", value as KegiatanJenis)
              }
            >
              <SelectTrigger
                id="jenis"
                className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-4"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.jenisOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
              className="h-11 rounded-lg border-slate-200 bg-slate-50"
            />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <Select
              value={formData.status}
              disabled={saving}
              onValueChange={(value) =>
                onChange("status", value as KegiatanStatus)
              }
            >
              <SelectTrigger
                id="status"
                className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-4"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.statusFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Lokasi" htmlFor="lokasi" className="md:col-span-2">
            <Input
              id="lokasi"
              value={formData.lokasi}
              onChange={(event) => onChange("lokasi", event.target.value)}
              placeholder="Contoh: Kampung Waimuri"
              disabled={saving}
              className="h-11 rounded-lg border-slate-200 bg-slate-50"
            />
          </FormField>

          <FormField
            label="Penanggung Jawab"
            htmlFor="penanggungJawab"
            className="md:col-span-2"
          >
            <Input
              id="penanggungJawab"
              value={formData.penanggungJawab}
              onChange={(event) =>
                onChange("penanggungJawab", event.target.value)
              }
              placeholder="Contoh: Kabid Pelayanan Pendaftaran Penduduk"
              disabled={saving}
              className="h-11 rounded-lg border-slate-200 bg-slate-50"
            />
          </FormField>

          <FormField label="Jumlah Peserta" htmlFor="peserta">
            <Input
              id="peserta"
              type="number"
              min={0}
              value={formData.peserta}
              onChange={(event) => onChange("peserta", event.target.value)}
              disabled={saving}
              className="h-11 rounded-lg border-slate-200 bg-slate-50"
            />
          </FormField>

          <FormField
            label="Deskripsi"
            htmlFor="deskripsi"
            className="md:col-span-2"
          >
            <Textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(event) => onChange("deskripsi", event.target.value)}
              placeholder="Ringkasan pelaksanaan dan tujuan kegiatan"
              disabled={saving}
              className="min-h-28 rounded-lg border-slate-200 bg-slate-50"
            />
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-lg px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 rounded-lg bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            {saving
              ? "Menyimpan..."
              : mode === "create"
                ? "Simpan Kegiatan"
                : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function KegiatanDetailModal({
  item,
  onClose,
  onDocumentation,
  onEdit,
}: {
  item: Kegiatan;
  onClose: () => void;
  onDocumentation: () => void;
  onEdit: () => void;
}) {
  const dokumentasi = item.dokumentasi ?? [];

  return (
    <ModalShell onClose={onClose} title="Detail Kegiatan">
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <JenisBadge jenis={item.jenis} />
                <StatusBadge status={item.status} />
              </div>

              <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-slate-950">
                {item.nama}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.deskripsi}
              </p>
            </div>

            <span
              className={cn(
                "inline-flex shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold",
                getBidangStyle(item.bidang),
              )}
            >
              {item.bidang}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem
            icon={CalendarDays}
            label="Tanggal"
            value={formatDateForDisplay(item.tanggal)}
          />
          <InfoItem icon={MapPin} label="Lokasi" value={item.lokasi} />
          <InfoItem
            icon={Users}
            label="Jumlah Peserta"
            value={`${item.peserta} peserta`}
          />
          <InfoItem
            icon={ClipboardList}
            label="Penanggung Jawab"
            value={item.penanggungJawab}
          />
        </div>

        {item.status === "Selesai" ? (
          <div className="rounded-lg border border-slate-200 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Dokumentasi Foto
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {dokumentasi.length} foto tersimpan untuk kegiatan ini.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onDocumentation}
                className="h-10 rounded-lg px-4"
              >
                <Images className="h-4 w-4" />
                Kelola Foto
              </Button>
            </div>

            {dokumentasi.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {dokumentasi.slice(0, 3).map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-lg">
                    <div
                      className="aspect-[4/3] bg-slate-100 bg-cover bg-center"
                      style={{ backgroundImage: `url(${photo.url})` }}
                    />
                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-slate-600">
                      {photo.caption}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Belum ada foto dokumentasi yang ditambahkan.
              </div>
            )}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-lg px-5"
          >
            Tutup
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            className="h-11 rounded-lg bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            <Pencil className="h-4 w-4" />
            Edit Kegiatan
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function KegiatanDocumentationModal({
  item,
  error,
  saving,
  onClose,
  onUpload,
  onDelete,
}: {
  item: Kegiatan;
  error: string;
  saving: boolean;
  onClose: () => void;
  onUpload: (files: File[], caption: string) => Promise<boolean>;
  onDelete: (documentationId: number) => Promise<void>;
}) {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const dokumentasi = item.dokumentasi ?? [];
  const selectedFilesText =
    files.length > 0
      ? files.map((file) => file.name).join(", ")
      : "Belum ada file dipilih.";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await onUpload(files, caption);

    if (success) {
      setCaption("");
      setFiles([]);
      setInputKey((prev) => prev + 1);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Dokumentasi Foto" size="lg">
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <JenisBadge jenis={item.jenis} />
                <StatusBadge status={item.status} />
              </div>
              <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-slate-950">
                {item.nama}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {formatDateForDisplay(item.tanggal)} - {item.lokasi}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-pbd-blue/10 text-pbd-blue">
              <Images className="h-5 w-5" />
            </div>
          </div>
        </div>

        {item.status === "Selesai" ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
              <FormField label="Foto Dokumentasi" htmlFor="fotoDokumentasi">
                <Input
                  key={inputKey}
                  id="fotoDokumentasi"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={saving}
                  onChange={(event) =>
                    setFiles(Array.from(event.target.files ?? []))
                  }
                  className="h-11 rounded-lg border-slate-200 bg-slate-50 file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-pbd-blue"
                />
                <p className="text-xs leading-5 text-slate-500">
                  Bisa memilih lebih dari satu foto. Maksimal{" "}
                  {MAX_DOCUMENTATION_FILE_SIZE_MB} MB per file.
                </p>
                <p className="line-clamp-2 text-xs font-medium leading-5 text-slate-600">
                  {selectedFilesText}
                </p>
              </FormField>

              <FormField label="Keterangan" htmlFor="keteranganDokumentasi">
                <Textarea
                  id="keteranganDokumentasi"
                  value={caption}
                  disabled={saving}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Contoh: Pembukaan kegiatan bersama peserta kampung"
                  className="min-h-[112px] rounded-lg border-slate-200 bg-slate-50"
                />
              </FormField>
            </div>

            {error ? (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="h-11 rounded-lg px-5"
              >
                Tutup
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-11 rounded-lg bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
              >
                <ImagePlus className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Tambah Foto"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            Dokumentasi foto hanya dapat ditambahkan setelah kegiatan berstatus
            selesai.
          </div>
        )}

        <div className="rounded-lg border border-slate-200 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Foto Tersimpan
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {dokumentasi.length} foto dokumentasi kegiatan.
              </p>
            </div>
          </div>

          {dokumentasi.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dokumentasi.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <div
                    className="aspect-[4/3] bg-slate-100 bg-cover bg-center"
                    style={{ backgroundImage: `url("${photo.url}")` }}
                  />
                  <div className="space-y-3 p-3">
                    <div>
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                        {photo.caption}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatUploadedAt(photo.uploadedAt)}
                      </p>
                      {photo.fileName ? (
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {photo.fileName}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void onDelete(photo.id)}
                      disabled={saving}
                      className="h-9 w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Foto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-500">
                <Images className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-950">
                Belum ada foto dokumentasi
              </p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Tambahkan foto setelah kegiatan selesai agar arsip pelaksanaan
                lebih lengkap.
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteKegiatanModal({
  item,
  error,
  saving,
  onClose,
  onDelete,
}: {
  item: Kegiatan;
  error: string;
  saving: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <ModalShell onClose={onClose} title="Hapus Kegiatan" size="sm">
      <div className="space-y-5">
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-red-900">{item.nama}</p>
              <p className="mt-2 text-sm leading-6 text-red-700">
                Data kegiatan ini akan dihapus dari daftar pada sesi halaman
                saat ini.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-lg px-5"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="h-11 rounded-lg bg-red-600 px-5 text-white hover:bg-red-700"
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
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  size?: "default" | "sm" | "lg";
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
            rounded-lg bg-white
            shadow-2xl
          `,
          size === "sm"
            ? "max-w-lg"
            : size === "lg"
              ? "max-w-5xl"
              : "max-w-3xl",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-pbd-blue">
              Kegiatan
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
  children: React.ReactNode;
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
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
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
