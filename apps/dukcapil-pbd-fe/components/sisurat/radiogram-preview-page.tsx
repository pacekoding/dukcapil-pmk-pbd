"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  defaultPdfPreviewSettings,
  findRadiogram,
  findSuratKeluar,
  jenisSuratLabels,
} from "@/lib/sisurat/mock-surat";
import type { RadiogramSurat } from "@/types/surat";

import { PdfPreviewToolbar } from "./pdf-preview-toolbar";
import { RadiogramDocumentPreview } from "./radiogram-document-preview";

type RadiogramPreviewPageProps = {
  suratId: string;
};

export function RadiogramPreviewPage({ suratId }: RadiogramPreviewPageProps) {
  const surat = findSuratKeluar(suratId);
  const [draftRadiogram] = useState<RadiogramSurat | undefined>(() =>
    readDraftRadiogram(suratId),
  );
  const [settings, setSettings] = useState(defaultPdfPreviewSettings);
  const [message, setMessage] = useState("");
  const radiogram = draftRadiogram ?? findRadiogram(suratId);

  if (!radiogram) {
    return (
      <main className="mx-auto max-w-3xl">
        <div className="app-surface rounded-lg p-8 text-center">
          <FileWarning className="mx-auto h-12 w-12 text-amber-600" />
          <h1 className="mt-4 text-2xl font-bold text-pbd-navy">
            Template surat ini belum tersedia.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {surat
              ? `${jenisSuratLabels[surat.jenisSurat]} belum memiliki template preview/cetak pada prototype ini.`
              : "Data surat tidak ditemukan pada mock data."}
          </p>
          <Button asChild className="mt-6 bg-pbd-navy text-white">
            <Link href="/sisurat/data">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const handlePrint = () => window.print();

  return (
    <main className="space-y-4">
      <div className="print:hidden">
        <Button asChild variant="outline">
          <Link href="/sisurat/data">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar
          </Link>
        </Button>
      </div>

      {message ? (
        <div className="print:hidden rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <RadiogramDocumentPreview radiogram={radiogram} settings={settings} />
        <PdfPreviewToolbar
          settings={settings}
          onChange={setSettings}
          onPrint={handlePrint}
          onDownload={() => {
            setMessage(
              "Gunakan dialog cetak lalu pilih Save as PDF untuk menyimpan dokumen.",
            );
            window.print();
          }}
          onSaveTemplate={() =>
            setMessage("Template tersimpan pada sesi prototype.")
          }
        />
      </div>
    </main>
  );
}

function readDraftRadiogram(suratId: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawDraft = window.sessionStorage.getItem("sisurat:radiogram-draft");
    if (!rawDraft) {
      return undefined;
    }

    const draft = JSON.parse(rawDraft) as RadiogramSurat;
    return draft.id === suratId ? draft : undefined;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
