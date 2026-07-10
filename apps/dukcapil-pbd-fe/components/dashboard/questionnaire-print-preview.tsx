"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { jsPDF } from "jspdf";

import { Button } from "@/components/ui/button";
import type { SSDDetail } from "@/types/ssd";
import type { Subkegiatan } from "@/types/subkegiatan";

type QuestionnaireItem = {
  id: number;
  namaSDD: string;
  produsenData: string;
  questions: string[];
};

type QuestionnairePrintPreviewProps = {
  subkegiatan: Subkegiatan;
  ssdDetails: SSDDetail[];
  tahunAnggaran: string;
};

const PRINT_INSTRUCTIONS = [
  "Isi jawaban sesuai data yang tersedia.",
  'Jika data tidak tersedia, tuliskan "Tidak tersedia".',
  "Berikan catatan jika diperlukan.",
];

const formatPrintedDate = () =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date());

const sanitizeFilenamePart = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildFallbackQuestion = (namaSDD: string) =>
  `Berapa jumlah ${namaSDD} yang tersedia?`;

const buildQuestionnaireItems = (ssdDetails: SSDDetail[]): QuestionnaireItem[] =>
  ssdDetails.map((ssd) => {
    return {
      id: ssd.id,
      namaSDD: ssd.uraian,
      produsenData: "Belum ditentukan",
      questions: [buildFallbackQuestion(ssd.uraian)],
    };
  });

export function QuestionnairePrintPreview({
  subkegiatan,
  ssdDetails,
  tahunAnggaran,
}: QuestionnairePrintPreviewProps) {
  const printedDate = formatPrintedDate();
  const questionnaireItems = buildQuestionnaireItems(ssdDetails);
  const filename = `kuisioner-sdd-${
    sanitizeFilenamePart(subkegiatan.nama) || "subkegiatan"
  }-TA-${tahunAnggaran}.pdf`;

  const handleDownloadPDF = () => {
    buildQuestionnairePDF({
      printedDate,
      questionnaireItems,
      subkegiatan,
      tahunAnggaran,
    }).save(filename);
  };

  const handlePrintPDF = () => {
    const doc = buildQuestionnairePDF({
      printedDate,
      questionnaireItems,
      subkegiatan,
      tahunAnggaran,
    });
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  };

  return (
    <div className="space-y-5">
      <PrintActionBar
        onDownloadPDF={handleDownloadPDF}
        onPrintPDF={handlePrintPDF}
      />

      <p className="no-print text-sm font-medium text-slate-600">
        Preview dokumen kuisioner siap cetak. Tombol Download PDF dan Cetak PDF
        menghasilkan dokumen tanpa elemen dashboard.
      </p>

      <article className="questionnaire-print-root mx-auto min-h-[297mm] w-full max-w-[210mm] border border-slate-300 bg-white px-[18mm] py-[16mm] text-slate-950">
        <QuestionnaireHeader
          printedDate={printedDate}
          subkegiatan={subkegiatan}
          tahunAnggaran={tahunAnggaran}
        />

        <RespondentIdentity />

        <section className="mt-8 border-y border-slate-300 py-4 text-sm leading-6">
          <h2 className="font-bold uppercase tracking-wide">Petunjuk Pengisian</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {PRINT_INSTRUCTIONS.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
        </section>

        <section className="mt-8 space-y-6">
          <h2 className="border-b border-slate-400 pb-2 text-base font-extrabold uppercase tracking-wide">
            Daftar Pertanyaan
          </h2>
          {questionnaireItems.map((item, index) => (
            <QuestionnaireSection key={item.id} index={index} item={item} />
          ))}
        </section>
      </article>

      <PrintStyles />
    </div>
  );
}

function PrintActionBar({
  onDownloadPDF,
  onPrintPDF,
}: {
  onDownloadPDF: () => void;
  onPrintPDF: () => void;
}) {
  return (
    <div className="no-print flex flex-col gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <Button asChild variant="outline" className="h-10 rounded">
        <Link href="/dashboard/Subkegiatan">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </Button>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onDownloadPDF}
          className="h-10 rounded"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button
          type="button"
          onClick={onPrintPDF}
          className="h-10 rounded bg-slate-900 text-white hover:bg-slate-800"
        >
          <Printer className="h-4 w-4" />
          Cetak PDF
        </Button>
      </div>
    </div>
  );
}

function QuestionnaireHeader({
  printedDate,
  subkegiatan,
  tahunAnggaran,
}: {
  printedDate: string;
  subkegiatan: Subkegiatan;
  tahunAnggaran: string;
}) {
  return (
    <header className="border-b-2 border-slate-950 pb-6 text-center">
      <h1 className="text-lg font-extrabold uppercase tracking-wide">
        Kuisioner Pengumpulan Data
      </h1>

      <div className="mt-6 text-left text-sm leading-6">
        <InfoRow label="Nama Subkegiatan" value={subkegiatan.nama} />
        <InfoRow label="Tahun Anggaran" value={tahunAnggaran} />
        <InfoRow label="Tanggal Cetak" value={printedDate} />
      </div>
    </header>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[145px_12px_1fr] gap-2 py-0.5">
      <span className="font-semibold">{label}</span>
      <span>:</span>
      <span>{value}</span>
    </div>
  );
}

function RespondentIdentity() {
  return (
    <section className="mt-8 text-sm">
      <h2 className="border-b border-slate-400 pb-2 font-bold uppercase tracking-wide">
        Identitas Pengisi
      </h2>
      <div className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        <BlankLine label="Nama Pengisi" />
        <BlankLine label="Jabatan" />
        <BlankLine label="Unit Kerja/OPD" />
        <BlankLine label="Tanggal Pengisian" />
      </div>
    </section>
  );
}

function BlankLine({ label }: { label: string }) {
  return (
    <div>
      <p className="font-semibold">{label}</p>
      <div className="mt-4 border-b border-slate-700" />
    </div>
  );
}

function QuestionnaireSection({
  index,
  item,
}: {
  index: number;
  item: QuestionnaireItem;
}) {
  return (
    <section className="break-inside-avoid border border-slate-400 p-5">
      <div className="space-y-4 text-sm leading-6">
        <p className="text-sm font-bold">No. {index + 1}</p>
        <div>
          <p className="text-sm font-bold">Nama Data:</p>
          <h3 className="mt-1 text-base font-semibold leading-6">
            {item.namaSDD}
          </h3>
        </div>
        <div>
          <p className="text-sm font-bold">Produsen Data:</p>
          <p className="mt-1 text-sm leading-6">{item.produsenData}</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {item.questions.map((question, questionIndex) => (
          <QuestionBlock
            key={`${item.id}-${questionIndex}`}
            question={question}
            showNumber={item.questions.length > 1}
            questionIndex={questionIndex}
          />
        ))}
      </div>
    </section>
  );
}

function QuestionBlock({
  question,
  questionIndex,
  showNumber,
}: {
  question: string;
  questionIndex: number;
  showNumber: boolean;
}) {
  return (
    <div className="break-inside-avoid border-t border-slate-300 pt-4">
      <p className="text-sm font-bold leading-6">
        Pertanyaan{showNumber ? ` ${questionIndex + 1}` : ""}
      </p>
      <p className="mt-2 text-sm leading-6">{question}</p>

      <p className="mt-5 text-sm font-bold">
        Jawaban
      </p>
      <AnswerLines count={3} />

      <p className="mt-5 text-sm font-bold">
        Catatan
      </p>
      <AnswerLines count={1} />
    </div>
  );
}

function AnswerLines({ count }: { count: number }) {
  return (
    <div className="mt-2 space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-b border-slate-700" />
      ))}
    </div>
  );
}

function buildQuestionnairePDF({
  printedDate,
  questionnaireItems,
  subkegiatan,
  tahunAnggaran,
}: {
  printedDate: string;
  questionnaireItems: QuestionnaireItem[];
  subkegiatan: Subkegiatan;
  tahunAnggaran: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - margin) {
      return;
    }
    doc.addPage();
    y = margin;
  };

  const addWrappedText = (
    text: string,
    x: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    doc.text(lines, x, y);
    y += lines.length * lineHeight;
    return lines.length;
  };

  const addAnswerLines = (
    label: string,
    x: number,
    width: number,
    count: number,
  ) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    y += 6;
    for (let index = 0; index < count; index += 1) {
      doc.line(x, y, x + width, y);
      y += 8;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("KUISIONER PENGUMPULAN DATA", pageWidth / 2, y, {
    align: "center",
  });
  y += 7;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const infoRows = [
    ["Nama Subkegiatan", subkegiatan.nama],
    ["Tahun Anggaran", tahunAnggaran],
    ["Tanggal Cetak", printedDate],
  ];
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.text(":", margin + 36, y);
    doc.setFont("helvetica", "normal");
    addWrappedText(value, margin + 41, contentWidth - 41, 5);
    y += 1;
  });

  y += 7;
  ensureSpace(38);
  doc.setFont("helvetica", "bold");
  doc.text("IDENTITAS PENGISI", margin, y);
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  ["Nama Pengisi", "Jabatan", "Unit Kerja/OPD", "Tanggal Pengisian"].forEach(
    (label) => {
      doc.text(`${label}:`, margin, y);
      doc.line(margin + 38, y + 1, pageWidth - margin, y + 1);
      y += 8;
    },
  );

  y += 5;
  ensureSpace(34);
  doc.setFont("helvetica", "bold");
  doc.text("PETUNJUK PENGISIAN", margin, y);
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  PRINT_INSTRUCTIONS.forEach((instruction, index) => {
    doc.text(`${index + 1}.`, margin, y);
    addWrappedText(instruction, margin + 7, contentWidth - 7, 5);
    y += 1;
  });
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("DAFTAR PERTANYAAN", margin, y);
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  questionnaireItems.forEach((item, index) => {
    ensureSpace(92);

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`No. ${index + 1}`, margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Nama Data", margin, y);
    y += 6;
    addWrappedText(item.namaSDD, margin, contentWidth, 5);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.text("Produsen Data", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    addWrappedText(item.produsenData, margin, contentWidth, 5);
    y += 5;

    item.questions.forEach((question, questionIndex) => {
      ensureSpace(76);
      doc.setFont("helvetica", "bold");
      const questionLabel =
        item.questions.length > 1
          ? `Pertanyaan ${questionIndex + 1}`
          : "Pertanyaan";
      doc.text(questionLabel, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      addWrappedText(question, margin, contentWidth, 5);
      y += 6;

      addAnswerLines("Jawaban", margin, contentWidth, 3);
      y += 2;
      addAnswerLines("Catatan", margin, contentWidth, 1);
      y += 6;
    });

    y += 6;
  });

  return doc;
}

function PrintStyles() {
  return (
    <style jsx global>{`
      @page {
        size: A4 portrait;
        margin: 12mm;
      }

      @media print {
        body {
          background: white !important;
        }

        body * {
          visibility: hidden !important;
        }

        .questionnaire-print-root,
        .questionnaire-print-root * {
          visibility: visible !important;
        }

        .questionnaire-print-root {
          position: absolute !important;
          inset: 0 auto auto 0 !important;
          width: 100% !important;
          border: 0 !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }

        .no-print {
          display: none !important;
        }
      }
    `}</style>
  );
}
