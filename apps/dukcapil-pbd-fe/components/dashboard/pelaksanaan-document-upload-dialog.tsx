"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileUp, Loader2, Upload, X } from "lucide-react";

import { formatFileSize } from "@/components/dashboard/document-utils";
import { ErrorState } from "@/components/dashboard/state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { uploadDokumenPelaksanaan } from "@/lib/api/pelaksanaan-documents";
import {
  ARCHIVE_FILE_ACCEPT,
  validateClientUpload,
} from "@/lib/api/file-policy";
import { getSubkegiatan } from "@/lib/api/subkegiatan";
import { cn } from "@/lib/utils";
import type { PelaksanaanDocument } from "@/types/pelaksanaan-documents";
import type { Subkegiatan } from "@/types/subkegiatan";

type PelaksanaanDocumentUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (document: PelaksanaanDocument) => void;
  sumberAplikasi: string;
  bidang: "sekretariat" | "dukcapil" | "pmk";
  subkegiatanPrefix?: string;
  subkegiatanRequired?: boolean;
};

type PelaksanaanDocumentUploadFormProps = {
  active?: boolean;
  idPrefix?: string;
  onUploaded: (document: PelaksanaanDocument) => void;
  onCompleted?: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  sumberAplikasi: string;
  bidang: "sekretariat" | "dukcapil" | "pmk";
  subkegiatanPrefix?: string;
  subkegiatanRequired?: boolean;
};

const defaultDocumentName = (fileName: string) =>
  fileName.replace(/\.[^/.]+$/, "");

export function PelaksanaanDocumentUploadForm({
  active = true,
  idPrefix = "dokumen-pelaksanaan",
  onUploaded,
  onCompleted,
  onCancel,
  cancelLabel = "Bersihkan",
  sumberAplikasi,
  bidang,
  subkegiatanPrefix,
  subkegiatanRequired = false,
}: PelaksanaanDocumentUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [subkegiatan, setSubkegiatan] = useState<Subkegiatan[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSubkegiatanId, setSelectedSubkegiatanId] = useState("");
  const [nama, setNama] = useState("");
  const [isDokumenDssd, setIsDokumenDssd] = useState(false);
  const [loadingSubkegiatan, setLoadingSubkegiatan] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    let mounted = true;
    const loadSubkegiatan = async () => {
      setLoadingSubkegiatan(true);
      try {
        const response = await getSubkegiatan({
          kodePrefix: subkegiatanPrefix,
        });
        if (mounted) {
          setSubkegiatan(Array.isArray(response.items) ? response.items : []);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setSubkegiatan([]);
          setSubmitError("Daftar subkegiatan gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoadingSubkegiatan(false);
        }
      }
    };

    void loadSubkegiatan();

    return () => {
      mounted = false;
    };
  }, [active, subkegiatanPrefix]);

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedSubkegiatanId("");
    setNama("");
    setIsDokumenDssd(false);
    setFileError(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sortedSubkegiatan = useMemo(
    () =>
      [...subkegiatan].sort((first, second) =>
        `${first.kode} ${first.nama}`.localeCompare(
          `${second.kode} ${second.nama}`,
        ),
      ),
    [subkegiatan],
  );

  const handleCancel = () => {
    if (uploading) {
      return;
    }

    resetForm();
    onCancel?.();
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFileError(null);

    if (!file) {
      setNama("");
      return;
    }

    setNama(defaultDocumentName(file.name));
    try {
      validateClientUpload(file, "archive");
    } catch (validationError) {
      setFileError(
        validationError instanceof Error
          ? validationError.message
          : "File tidak valid.",
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setFileError("File dokumen wajib diupload.");
      return;
    }
    if (subkegiatanRequired && !selectedSubkegiatanId) {
      setSubmitError("Subkegiatan wajib dipilih.");
      return;
    }
    if (fileError) {
      return;
    }

    setUploading(true);
    setSubmitError(null);
    try {
      const uploaded = await uploadDokumenPelaksanaan({
        file: selectedFile,
        sumberAplikasi,
        bidang,
        nama,
        subkegiatanId: selectedSubkegiatanId || null,
        isDokumenDssd,
      });
      resetForm();
      onCompleted?.();
      onUploaded(uploaded);
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error ? error.message : "Dokumen gagal diupload.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-5">
        {submitError ? <ErrorState message={submitError} /> : null}

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-file`}>File dokumen</Label>
          <Input
            ref={fileInputRef}
            id={`${idPrefix}-file`}
            type="file"
            accept={ARCHIVE_FILE_ACCEPT}
            disabled={uploading}
            onChange={(event) =>
              handleFileChange(event.target.files?.[0] ?? null)
            }
          />
          {selectedFile ? (
            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm",
                fileError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileUp className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selectedFile.name}</p>
                  <p className="text-xs">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={uploading}
                onClick={() => handleFileChange(null)}
                aria-label="Hapus file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          {fileError ? (
            <p className="text-sm font-medium text-red-600">{fileError}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-nama`}>Nama</Label>
          <Input
            id={`${idPrefix}-nama`}
            value={nama}
            disabled={uploading}
            onChange={(event) => setNama(event.target.value)}
            placeholder="Nama dokumen"
          />
        </div>

        <div className="grid gap-2">
          <Label>Subkegiatan</Label>
          <Select
            value={
              selectedSubkegiatanId ||
              (subkegiatanRequired ? undefined : "none")
            }
            disabled={uploading || loadingSubkegiatan}
            onValueChange={(value) =>
              setSelectedSubkegiatanId(value === "none" ? "" : value)
            }
          >
            <SelectTrigger className="h-11 rounded-lg">
              <SelectValue placeholder="Pilih subkegiatan" />
            </SelectTrigger>
            <SelectContent>
              {subkegiatanRequired ? null : (
                <SelectItem value="none">Tanpa subkegiatan</SelectItem>
              )}
              {sortedSubkegiatan.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.kode} - {item.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
          <div>
            <Label htmlFor={`${idPrefix}-dssd`}>Dokumen DSSD</Label>
            <p className="mt-1 text-xs text-slate-500">
              Tandai jika dokumen ini merupakan dokumen DSSD.
            </p>
          </div>
          <Switch
            id={`${idPrefix}-dssd`}
            checked={isDokumenDssd}
            disabled={uploading}
            onCheckedChange={setIsDokumenDssd}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>
    </form>
  );
}

export function PelaksanaanDocumentUploadDialog({
  open,
  onOpenChange,
  onUploaded,
  sumberAplikasi,
  bidang,
  subkegiatanPrefix,
  subkegiatanRequired = false,
}: PelaksanaanDocumentUploadDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Dokumen Pelaksanaan</DialogTitle>
          <DialogDescription>
            Tambahkan dokumen pelaksanaan dan hubungkan dengan subkegiatan jika
            diperlukan.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5">
          <PelaksanaanDocumentUploadForm
            active={open}
            idPrefix="dokumen-pelaksanaan-mobile"
            onUploaded={onUploaded}
            onCompleted={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
            cancelLabel="Batal"
            sumberAplikasi={sumberAplikasi}
            bidang={bidang}
            subkegiatanPrefix={subkegiatanPrefix}
            subkegiatanRequired={subkegiatanRequired}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
