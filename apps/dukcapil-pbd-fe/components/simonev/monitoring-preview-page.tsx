"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileWarning,
  Home,
  Printer,
} from "lucide-react";

import {
  readMonitoringRecords,
  slugify,
  type MonitoringRecord,
} from "@/components/simonev/monitoring-data";
import { PrintableMonitoring } from "@/components/simonev/printable-monitoring";
import { Button } from "@/components/ui/button";

type MonitoringPreviewPageProps = {
  recordId: string;
};

export function MonitoringPreviewPage({ recordId }: MonitoringPreviewPageProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecords(readMonitoringRecords());
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const record = useMemo(
    () => records.find((item) => item.id === recordId),
    [recordId, records],
  );

  const handlePrint = () => {
    if (record) {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    const element = previewRef.current;
    if (!element || !record) {
      return;
    }

    setExportingPdf(true);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      await html2pdf()
        .set({
          margin: [6, 6, 6, 6],
          filename: `${slugify(record.namaMonev)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
          },
        })
        .from(element)
        .save();
    } finally {
      setExportingPdf(false);
    }
  };

  if (loaded && !record) {
    return (
      <main className="space-y-6">
        <PreviewBreadcrumb current="Data tidak ditemukan" />
        <div className="app-surface mx-auto max-w-3xl rounded-lg p-8 text-center">
          <FileWarning className="mx-auto h-12 w-12 text-amber-600" />
          <h1 className="mt-4 text-2xl font-bold text-pbd-navy">
            Data monitoring tidak ditemukan.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Data mungkin belum tersimpan di browser ini. Kembali ke tabel data
            monitoring untuk membuat atau memilih instrumen.
          </p>
          <Button asChild className="mt-6 bg-pbd-navy text-white">
            <Link href="/simonev/data">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Data Monitoring
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="print:hidden">
        <PreviewBreadcrumb current="Pratinjau Format Monitoring" />
      </div>

      <section className="print:hidden flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-pbd-navy">
            Pratinjau Format Monitoring
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {record?.namaMonev ?? "Memuat data monitoring..."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="h-10 rounded-lg">
            <Link href="/simonev/data">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg border-blue-200 text-blue-700"
            onClick={handleDownloadPdf}
            disabled={!record || exportingPdf}
          >
            <Download className="h-4 w-4" />
            {exportingPdf ? "Menyiapkan..." : "Unduh PDF"}
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={handlePrint}
            disabled={!record}
          >
            <Printer className="h-4 w-4" />
            Cetak
          </Button>
        </div>
      </section>

      <section className="overflow-auto rounded-lg bg-slate-100 p-4 print:overflow-visible print:rounded-none print:bg-white print:p-0">
        {record ? (
          <div
            ref={previewRef}
            className="simonev-print-area mx-auto box-border min-h-[297mm] w-[210mm] bg-white px-[12mm] py-[10mm] text-[11px] leading-normal text-black shadow-xl print:shadow-none"
          >
            <PrintableMonitoring record={record} />
          </div>
        ) : (
          <div className="app-surface rounded-lg p-8 text-center text-sm font-medium text-slate-500">
            Memuat pratinjau...
          </div>
        )}
      </section>
    </main>
  );
}

function PreviewBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="app-surface rounded-lg px-4 py-3">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <li>
          <Link
            href="/simonev/dashboard"
            className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-pbd-blue"
          >
            <Home className="h-4 w-4" />
            Simonev
          </Link>
        </li>
        <li className="inline-flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <Link
            href="/simonev/data"
            className="font-medium text-slate-600 hover:text-pbd-blue"
          >
            Data Monitoring
          </Link>
        </li>
        <li className="inline-flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-pbd-navy">{current}</span>
        </li>
      </ol>
    </nav>
  );
}
