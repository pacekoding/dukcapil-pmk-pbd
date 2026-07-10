"use client";

import { useEffect, useState } from "react";
import { FileArchive, Upload } from "lucide-react";

import { formatDate } from "@/components/dashboard/document-utils";
import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
import { PelaksanaanDocumentUploadDialog } from "@/components/dashboard/pelaksanaan-document-upload-dialog";
import { SearchInput } from "@/components/dashboard/search-input";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState, ErrorState, SuccessState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPelaksanaanDocuments,
} from "@/lib/api/pelaksanaan-documents";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getCurrentTahunAnggaran } from "@/lib/tahun-anggaran";
import type {
  PelaksanaanDocument,
  PelaksanaanDocumentMeta,
} from "@/types/pelaksanaan-documents";

const PAGE_SIZE = 10;

const emptyMeta: PelaksanaanDocumentMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function SidokaDataPage() {
  const [documents, setDocuments] = useState<PelaksanaanDocument[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [tahunAnggaran, setTahunAnggaran] = useState(getCurrentTahunAnggaran);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const result = await response.json();
        if (mounted && result.tahunAnggaran) {
          setTahunAnggaran(result.tahunAnggaran);
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

  useEffect(() => {
    let mounted = true;

    const loadDocuments = async () => {
      setLoading(true);
      try {
        const response = await getPelaksanaanDocuments({
          search: query,
          page,
          limit: PAGE_SIZE,
        });
        if (mounted) {
          setDocuments(Array.isArray(response.data) ? response.data : []);
          setMeta({ ...emptyMeta, ...response.meta });
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setDocuments([]);
          setMeta({ ...emptyMeta, page });
          setError("Dokumen pelaksanaan gagal dimuat.");
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
  }, [query, page, reloadKey]);

  const handleUploadSuccess = (document: PelaksanaanDocument) => {
    setMessage(`${document.nama || "Dokumen"} berhasil diupload.`);
    setError(null);
    setPage(1);
    setReloadKey((current) => current + 1);
  };

  return (
    <div className="space-y-6">
      <PageHero
        icon={FileArchive}
        eyebrow="SIDOKA"
        title="Data Dokumen Pelaksanaan"
        description="Kelola dokumen pelaksanaan berdasarkan nama, subkegiatan, status DSSD, dan tanggal upload."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {tahunAnggaran}
          </p>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload Dokumen
          </Button>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      <SectionCard contentClassName="p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">
                Dokumen Pelaksanaan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {meta.total} dokumen ditampilkan.
              </p>
            </div>
            <div className="lg:w-[420px]">
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Cari nama atau subkegiatan..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">No</TableHead>
                <TableHead className="min-w-[260px]">Nama</TableHead>
                <TableHead className="min-w-[300px]">Subkegiatan</TableHead>
                <TableHead className="w-[160px]">Dokumen DSSD</TableHead>
                <TableHead className="w-[180px]">Tanggal Upload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-slate-500"
                  >
                    Memuat dokumen pelaksanaan...
                  </TableCell>
                </TableRow>
              ) : documents.length > 0 ? (
                documents.map((document, index) => (
                  <TableRow key={document.id}>
                    <TableCell className="text-slate-500">
                      {(meta.page - 1) * meta.limit + index + 1}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <a
                        href={apiEndpoints.pelaksanaanDocumentDownload(
                          document.id,
                        )}
                        className="font-semibold text-pbd-navy hover:text-pbd-blue"
                      >
                        {document.nama}
                      </a>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {document.subkegiatanId ? (
                        <>
                          <div className="font-semibold text-slate-800">
                            {document.subkegiatanCode || "-"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {document.subkegiatanName ||
                              "Subkegiatan tidak ditemukan"}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-500">
                          Tanpa subkegiatan
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          document.isDokumenDssd
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {document.isDokumenDssd ? "Ya" : "Tidak"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {formatDate(document.tanggalUpload)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-6">
                    <EmptyState
                      title="Belum ada dokumen pelaksanaan."
                      description="Upload dokumen pelaksanaan untuk menampilkan data pada tabel ini."
                      icon={FileArchive}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          page={meta.page}
          pageSize={meta.limit}
          total={meta.total}
          onPageChange={setPage}
        />
      </SectionCard>

      <PelaksanaanDocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={handleUploadSuccess}
      />
    </div>
  );
}
