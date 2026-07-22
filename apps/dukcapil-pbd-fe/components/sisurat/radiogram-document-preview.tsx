"use client";

import Image from "next/image";

import { klasifikasiSuratLabels } from "@/lib/sisurat/mock-surat";
import type { PdfPreviewSettings, RadiogramSurat } from "@/types/surat";

const paperDimensions: Record<PdfPreviewSettings["paperSize"], { width: string; height: string }> = {
  A4: { width: "210mm", height: "297mm" },
  F4: { width: "215mm", height: "330mm" },
  Legal: { width: "216mm", height: "356mm" },
  Letter: { width: "216mm", height: "279mm" },
};

const marginMap: Record<PdfPreviewSettings["margin"], string> = {
  normal: "14mm",
  sempit: "9mm",
  lebar: "20mm",
  custom: "16mm",
};

type RadiogramDocumentPreviewProps = {
  radiogram: RadiogramSurat;
  settings: PdfPreviewSettings;
};

export function RadiogramDocumentPreview({
  radiogram,
  settings,
}: RadiogramDocumentPreviewProps) {
  const dimensions = paperDimensions[settings.paperSize];
  const portrait = settings.orientation === "portrait";
  const sheetStyle = {
    width: portrait ? dimensions.width : dimensions.height,
    minHeight: portrait ? dimensions.height : dimensions.width,
    padding: marginMap[settings.margin],
    fontFamily: settings.fontFamily,
    fontSize: `${settings.bodyFontSize}px`,
    lineHeight: settings.lineSpacing,
  };

  return (
    <div className="sisurat-print-area overflow-x-auto bg-slate-200/80 p-4 sm:p-6 lg:p-8 print:bg-white print:p-0">
      <article
        className="sisurat-document-sheet mx-auto bg-white text-black shadow-2xl print:shadow-none"
        style={sheetStyle}
      >
        <header className="text-center">
          <div className="grid grid-cols-[72px_1fr_72px] items-center gap-3">
            <div className="flex justify-start">
              {settings.showLogo ? (
                <Image
                  src="/logo-pbd.png"
                  alt="Logo Papua Barat Daya"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
              ) : null}
            </div>
            <div
              className="font-bold uppercase leading-tight"
              style={{ fontSize: `${settings.headerFontSize}px` }}
            >
              <p>PEMERINTAH PROVINSI PAPUA BARAT DAYA</p>
              <p>SEKRETARIAT DAERAH</p>
              <p className="mt-1 text-[0.86em] font-semibold normal-case">
                Kompleks Perkantoran Pemerintah Provinsi Papua Barat Daya
              </p>
              <p className="text-[0.86em] font-semibold normal-case">
                Sorong, Papua Barat Daya
              </p>
            </div>
            <div />
          </div>

          {settings.showHeaderLine ? (
            <div className="mt-5 space-y-1">
              <div className="h-[3px] bg-black" />
              <div className="h-[1px] bg-black" />
            </div>
          ) : null}
        </header>

        <section className="mt-8 border border-black">
          <div className="border-b border-black py-2 text-center text-sm font-bold uppercase">
            Formulir Berita
          </div>
          <div className="grid grid-cols-[1fr_150px] border-b border-black">
            <div />
            <div className="border-l border-black px-3 py-2 text-sm">
              Register No: {radiogram.registerNo}
            </div>
          </div>
          <div className="grid grid-cols-4 border-b border-black text-center text-sm font-bold uppercase">
            <div className="border-r border-black px-2 py-2">Panggilan</div>
            <div className="border-r border-black px-2 py-2">Jenis</div>
            <div className="border-r border-black px-2 py-2">Nomor</div>
            <div className="px-2 py-2">Derajat</div>
            <div className="border-r border-t border-black px-2 py-2 font-normal">
              {radiogram.panggilan}
            </div>
            <div className="border-r border-t border-black px-2 py-2 font-normal">
              {radiogram.jenis}
            </div>
            <div className="border-r border-t border-black px-2 py-2 font-normal">
              {radiogram.nomor}
            </div>
            <div className="border-t border-black px-2 py-2 font-normal uppercase">
              {radiogram.derajat?.replace("_", " ")}
            </div>
          </div>

          <div className="border-b border-black p-3 uppercase">
            <MetaRow label="Dari" value={radiogram.dari} />
            <MetaRow label="Untuk" value={radiogram.untuk} />
            <div className="grid grid-cols-[90px_14px_1fr]">
              <span>Tembusan</span>
              <span>:</span>
              <ol className="space-y-1">
                {radiogram.tembusan.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    {index + 1}. {item}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="border-b border-black p-2 uppercase">
            <MetaRow
              label="Klasifikasi"
              value={klasifikasiSuratLabels[radiogram.klasifikasi]}
            />
            <MetaRow
              label="Nomor"
              value={radiogram.nomorRadiogram ?? radiogram.nomorSurat}
            />
          </div>

          <div className="min-h-[310px] border-b border-black p-3 text-justify uppercase">
            {radiogram.amanat ? (
              <p className="mb-4 leading-[inherit]">{radiogram.amanat}</p>
            ) : null}
            {radiogram.isiBerita.map((block) => (
              <p key={block.id} className="mb-3 grid grid-cols-[72px_1fr] gap-4">
                <span className="font-bold">{block.kode} TTK</span>
                <span>{formatRadiogramIsi(block.isi)}</span>
              </p>
            ))}
          </div>

          <div className="border-b border-black px-3 py-2 text-right">
            Tanggal pembuatan: {formatLongDate(radiogram.tanggalPembuatan)}
          </div>

          <div
            className={
              settings.showTrafficSection
                ? "grid grid-cols-[1.45fr_1fr]"
                : "grid"
            }
          >
            <div className="min-h-[145px] p-3">
              <div className="grid grid-cols-[120px_14px_1fr] gap-y-1">
                <span>Pengirim</span>
                <span>:</span>
                <span>{radiogram.pengirimAtasNama}</span>
                <span>Nama</span>
                <span>:</span>
                <span>{radiogram.namaPenandatangan}</span>
                <span>Jabatan</span>
                <span>:</span>
                <span>{radiogram.jabatanPengirim}</span>
                <span>NIP</span>
                <span>:</span>
                <span>{radiogram.nipPenandatangan}</span>
                <span>Tanda Tangan</span>
                <span>:</span>
                <div className="mt-1 flex items-center gap-3">
                  {settings.showLogo ? (
                    <Image
                      src="/logo-pbd.png"
                      alt="Logo tanda tangan"
                      width={56}
                      height={56}
                      className="h-14 w-14 border border-black object-contain p-1"
                    />
                  ) : null}
                  <div className="border border-black px-4 py-3 text-center text-[10px] leading-4">
                    <p>Ditandatangani secara elektronik oleh:</p>
                    <p>{radiogram.namaPenandatangan}</p>
                    <p>{radiogram.jabatanPengirim}</p>
                  </div>
                </div>
              </div>
            </div>

            {settings.showTrafficSection ? (
              <div className="grid grid-cols-[56px_1fr_68px_82px] border-l border-black text-center">
                <div className="border-r border-black p-2 font-bold">No. Kode</div>
                <div className="grid grid-rows-[32px_1fr] border-r border-black">
                  <div className="border-b border-black p-2 font-bold">
                    Waktu
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="border-r border-black p-2 font-bold">
                      Terima
                    </div>
                    <div className="p-2 font-bold">Kirim</div>
                  </div>
                </div>
                <div className="border-r border-black p-2 font-bold">
                  Lalu Lintas
                </div>
                <div className="p-2 font-bold">Paraf Operator</div>
              </div>
            ) : null}
          </div>
        </section>

        {(settings.showQrCode || settings.showTteNote) && (
          <footer className="mt-20 flex items-end gap-3 text-[10px] leading-4">
            {settings.showQrCode ? <QrPlaceholder label={radiogram.qrCodeLabel} /> : null}
            {settings.showTteNote ? <p>{radiogram.catatanTte}</p> : null}
          </footer>
        )}
      </article>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[90px_14px_1fr]">
      <span>{label}</span>
      <span>:</span>
      <span className="whitespace-pre-line">{value}</span>
    </div>
  );
}

function QrPlaceholder({ label = "QR TTE" }: { label?: string }) {
  return (
    <div className="grid h-14 w-14 shrink-0 grid-cols-5 grid-rows-5 gap-px border border-black bg-white p-1">
      {Array.from({ length: 25 }).map((_, index) => (
        <span
          key={index}
          className={
            index % 2 === 0 || index === 7 || index === 18
              ? "bg-black"
              : "bg-white"
          }
          title={index === 12 ? label : undefined}
        />
      ))}
    </div>
  );
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatRadiogramIsi(value: string) {
  const normalized = value.trim();
  if (/(TTK|HBS)$/i.test(normalized)) {
    return normalized;
  }
  return `${normalized} TTK`;
}
