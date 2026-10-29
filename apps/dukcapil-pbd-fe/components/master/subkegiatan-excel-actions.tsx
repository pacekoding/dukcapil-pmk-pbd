"use client";

import { useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadSubkegiatanExcel, importSubkegiatan, previewSubkegiatanImport } from "@/lib/api/subkegiatan";
import type { SubkegiatanImportPreview } from "@/types/subkegiatan";

const maxSize = 5 * 1024 * 1024;

export function SubkegiatanExcelActions({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SubkegiatanImportPreview | null>(null);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reset() { setFile(null); setPreview(null); setError(null); setSuccess(null); if (inputRef.current) inputRef.current.value = ""; }
  function changeOpen(value: boolean) { if (!processing) { setOpen(value); if (!value) reset(); } }
  function chooseFile(selected?: File) {
    reset();
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx")) return setError("File harus berformat .xlsx.");
    if (selected.size === 0) return setError("File Excel tidak boleh kosong.");
    if (selected.size > maxSize) return setError("Ukuran file maksimal 5 MB.");
    setFile(selected);
  }
  async function processPreview() {
    if (!file) return setError("Pilih file Excel terlebih dahulu.");
    setProcessing(true); setError(null); setSuccess(null);
    try { setPreview(await previewSubkegiatanImport(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "File gagal diproses."); }
    finally { setProcessing(false); }
  }
  async function commitImport() {
    if (!file || !preview || preview.errorRows > 0) return;
    setProcessing(true); setError(null);
    try {
      const result = await importSubkegiatan(file);
      setSuccess(`${result.importedRows} data berhasil diimport. ${result.skippedRows} data existing dilewati.`);
      onImported();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Import gagal."); }
    finally { setProcessing(false); }
  }
  async function download(kind: "data" | "template") {
    setDownloading(true); setError(null);
    try { await downloadSubkegiatanExcel(kind); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Download gagal."); setOpen(true); }
    finally { setDownloading(false); }
  }

  return <>
    <Button variant="outline" onClick={() => setOpen(true)}><Upload className="h-4 w-4"/>Import Excel</Button>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={downloading}><Download className="h-4 w-4"/>{downloading ? "Mendownload..." : "Download Excel"}<ChevronDown className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => void download("data")}><FileSpreadsheet/>Download Data</DropdownMenuItem><DropdownMenuItem onSelect={() => void download("template")}><FileSpreadsheet/>Download Template Import</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    <Dialog open={open} onOpenChange={changeOpen}><DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>Import Excel Subkegiatan</DialogTitle><DialogDescription>Upload file .xlsx sesuai template. Data divalidasi dan ditampilkan dahulu sebelum disimpan.</DialogDescription></DialogHeader>
      <div className="space-y-4"><div className="rounded-lg border border-dashed p-4"><input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={processing} onChange={event => chooseFile(event.target.files?.[0])} className="block w-full text-sm"/><p className="mt-2 text-xs text-slate-500">Maksimal 5 MB. Baris kosong di akhir file akan diabaikan.</p></div>
        {error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}
        {preview ? <><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Total baris",preview.totalRows],["Valid",preview.validRows],["Existing",preview.existingRows],["Error",preview.errorRows]].map(([label,value])=><div key={String(label)} className="rounded-lg border p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-pbd-navy">{value}</p></div>)}</div>
          {preview.errorRows > 0 ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Perbaiki seluruh baris error, lalu upload ulang file. Data belum disimpan.</div> : null}
          <div className="max-h-[48vh] overflow-auto rounded-lg border"><Table className="min-w-[1050px]"><TableHeader><TableRow><TableHead>Baris</TableHead><TableHead>Bidang</TableHead><TableHead>Program</TableHead><TableHead>Kegiatan</TableHead><TableHead>Subkegiatan</TableHead><TableHead>Status</TableHead><TableHead>Keterangan</TableHead></TableRow></TableHeader><TableBody>{preview.rows.map(row=><TableRow key={row.row}><TableCell>{row.row}</TableCell><TableCell>{row.bidang}</TableCell><TableCell>{row.program}</TableCell><TableCell>{row.kegiatan}</TableCell><TableCell className="font-medium">{row.subkegiatan}</TableCell><TableCell><Badge variant={row.status === "error" ? "destructive" : "outline"} className={row.status === "valid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : row.status === "existing" ? "border-amber-200 bg-amber-50 text-amber-700" : undefined}>{row.status === "valid" ? "Valid" : row.status === "existing" ? "Existing" : "Error"}</Badge></TableCell><TableCell>{row.message}</TableCell></TableRow>)}</TableBody></Table></div></> : null}
      </div><DialogFooter><Button variant="outline" disabled={processing} onClick={() => changeOpen(false)}>Tutup</Button>{!preview ? <Button disabled={!file || processing} onClick={() => void processPreview()}>{processing ? "Memproses file..." : "Preview Data"}</Button> : <Button disabled={processing || preview.errorRows > 0 || preview.validRows === 0 || !!success} onClick={() => void commitImport()}>{processing ? "Mengimport data..." : "Import Data"}</Button>}</DialogFooter>
    </DialogContent></Dialog>
  </>;
}
