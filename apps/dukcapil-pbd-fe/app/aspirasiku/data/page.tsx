"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHero } from "@/components/dashboard/page-hero";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAspirasi,
  getAspirasiMessages,
  updateAspirasiStatus,
} from "@/lib/api/aspirasiku";
import { cn } from "@/lib/utils";
import type { Aspirasi, AspirasiStatus } from "@/types/aspirasiku";
import { aspirasiStatusOptions } from "@/types/aspirasiku";

export default function AspirasikuDataPage() {
  const [records, setRecords] = useState<Aspirasi[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Aspirasi | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAspirasiMessages();
      setRecords(data.items);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data aspirasi gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      try {
        const data = await getAspirasiMessages();
        if (mounted) {
          setRecords(data.items);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data aspirasi gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInitial();

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
      [record.jenis, record.judul, record.isi, record.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, records]);

  const unreadCount = records.filter((record) => record.status === "Baru").length;

  const handleStatusChange = async (record: Aspirasi, status: AspirasiStatus) => {
    if (record.status === status) {
      return;
    }

    setSavingId(record.id);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateAspirasiStatus(record.id, status);
      setRecords((currentRecords) =>
        currentRecords.map((item) => (item.id === record.id ? updated : item)),
      );
      setMessage("Status aspirasi berhasil diperbarui.");
    } catch (statusError) {
      console.error(statusError);
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Status aspirasi gagal diperbarui.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setMessage(null);
    setError(null);
    try {
      await deleteAspirasi(deleteTarget.id);
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== deleteTarget.id),
      );
      setMessage("Aspirasi berhasil dihapus.");
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Aspirasi gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={Inbox}
        eyebrow="ASPIRASIKU"
        title="Data Aspirasi"
        description="Kelola aspirasi anonim yang dikirim melalui link publik website. Pesan tidak memuat identitas pengirim."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              {records.length} aspirasi
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
            >
              {unreadCount} belum dibaca
            </Badge>
          </div>
        }
        aside={
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            disabled={loading}
            onClick={loadRecords}
          >
            Muat Ulang
          </Button>
        }
      />

      <SectionCard
        title="Pesan Masuk"
        description="Status dapat ditandai sebagai Baru, Dibaca, atau Selesai."
        action={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Cari jenis, judul, isi..."
            />
          </div>
        }
        contentClassName="p-0"
      >
        {message ? (
          <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Jenis</TableHead>
              <TableHead>Aspirasi</TableHead>
              <TableHead className="w-[170px]">Tanggal</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat aspirasi...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <JenisBadge jenis={record.jenis} />
                  </TableCell>
                  <TableCell className="min-w-[320px]">
                    <div className="font-bold text-pbd-navy">
                      {record.judul || "Tanpa judul"}
                    </div>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">
                      {record.isi}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600">
                    {formatDateTime(record.createdAt)}
                  </TableCell>
                  <TableCell>
                    <select
                      value={record.status}
                      disabled={savingId === record.id}
                      onChange={(event) =>
                        void handleStatusChange(
                          record,
                          event.target.value as AspirasiStatus,
                        )
                      }
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 outline-none focus:border-pbd-blue focus:ring-2 focus:ring-pbd-blue/15"
                    >
                      {aspirasiStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Buka aksi aspirasi"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  colSpan={5}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Tidak ada aspirasi yang sesuai dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Aspirasi?"
        description="Aspirasi ini akan dihapus dan tidak dapat dikembalikan."
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

function JenisBadge({ jenis }: { jenis: Aspirasi["jenis"] }) {
  const className =
    jenis === "Saran"
      ? "border-green-100 bg-green-50 text-green-700"
      : jenis === "Masukan"
        ? "border-blue-100 bg-blue-50 text-blue-700"
        : jenis === "Keluhan"
          ? "border-orange-100 bg-orange-50 text-orange-700"
          : jenis === "Pendapat"
            ? "border-violet-100 bg-violet-50 text-violet-700"
            : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={cn("font-bold", className)}>
      {jenis}
    </Badge>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
