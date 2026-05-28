// app/dashboard/dokumen/[id]/cetak/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import { ChevronRight, FileText, Printer } from "lucide-react";

/* =========================
   COMPONENTS
========================= */

import { PdfToolbar } from "@/components/pdf/pdf-toolbar";

import { PdfPreviewFrame } from "@/components/pdf/pdf-preview-frame";

import { PdfPage } from "@/components/pdf/pdf-page";

import { GovernmentHeader } from "@/components/pdf/government-header";

import { LaporanTemplate } from "@/components/pdf/laporan-template";

/* =========================
   SERVICES
========================= */

import { printPdf } from "@/lib/pdf/pdf-print-service";

import { formatPdfDate } from "@/lib/pdf/pdf-date";

import { getDokumenPreviewData } from "@/lib/api/dokumen";

/* =========================
   TYPES
========================= */

import type { DokumenPreviewData } from "@/types/dokumen";

import { PdfSettings } from "@/types/pdf";

/* =========================
   UI
========================= */

import { Button } from "@/components/ui/button";

/* =========================
   PAGE
========================= */

export default function CetakDokumenPage() {
  const params = useParams<{ id: string }>();

  const documentId = Number(params.id);

  const [previewData, setPreviewData] = useState<DokumenPreviewData | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadPreview = async () => {
      try {
        const data = await getDokumenPreviewData(documentId);

        if (mounted) {
          setPreviewData(data);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Data preview dokumen gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      mounted = false;
    };
  }, [documentId]);

  const isLaporan = previewData?.document.jenisDokumen === "Laporan";

  const previewTitle = isLaporan
    ? "Preview Laporan Pelaksanaan"
    : "Preview TOR";

  const previewDescription = isLaporan
    ? "Preview dan cetak laporan pelaksanaan kegiatan"
    : "Preview dan cetak dokumen TOR";

  const printTitle = isLaporan
    ? "Laporan Pelaksanaan Kegiatan Dukcapil PMK"
    : "TOR Dukcapil PMK";

  /* =========================
     ZOOM
  ========================= */

  const [zoom, setZoom] = useState(100);

  /* =========================
     PDF SETTINGS
  ========================= */

  const [settings, setSettings] = useState<PdfSettings>({
    fontSize: 15,

    lineHeight: 1.7,

    fontFamily: "Times New Roman",

    textColor: "#000000",

    borderColor: "#000000",

    borderWidth: 1,

    pagePadding: 60,

    paperBg: "#FFFFFF",
  });

  /* =========================
     GENERATED DATE
  ========================= */

  const generatedAt = useMemo(() => {
    return formatPdfDate(new Date());
  }, []);

  /* =========================
     PRINT
  ========================= */

  const handlePrint = () => {
    printPdf("pdf-preview", {
      documentTitle: printTitle,

      pageSize: "A4",

      margin: "10mm",
    });
  };

  if (loading || !previewData) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-[1800px] space-y-6 p-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
            {error ? (
              <p className="mt-4 text-sm font-medium text-red-700">{error}</p>
            ) : null}
          </section>
        </div>
      </main>
    );
  }

  const { laporanPelaksanaanData, torData } = previewData;

  return (
    <main
      className="
        min-h-screen
        bg-slate-100
      "
    >
      <div
        className="
          mx-auto
          max-w-[1800px]
          space-y-6
          p-6
        "
      >
        {/* =========================
            HEADER
        ========================= */}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-sm"
          >
            <Link
              href="/dashboard/dokumen"
              className="font-medium text-slate-500 transition hover:text-pbd-blue"
            >
              Dokumen
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-semibold text-slate-900">Preview</span>
          </nav>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600">
                  <FileText className="h-3.5 w-3.5" />
                  {previewData.document.jenisDokumen}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  ID #{previewData.document.id}
                </span>
              </div>

              <h1 className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-900">
                {previewTitle}
              </h1>

              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                {previewDescription} untuk {previewData.document.namaKegiatan}
              </p>
            </div>

            <Button
              onClick={handlePrint}
              className="h-11 w-full rounded-lg bg-pbd-navy px-6 text-white hover:bg-pbd-navy/90 sm:w-fit"
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak Dokumen
            </Button>
          </div>
        </section>

        {/* =========================
            TOOLBAR
        ========================= */}

        <PdfToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          settings={settings}
          setSettings={setSettings}
          onPrint={handlePrint}
          onDownload={handlePrint}
        />

        {/* =========================
            PDF PREVIEW
        ========================= */}

        <PdfPreviewFrame>
          <div
            style={{
              transform: `scale(${zoom / 100})`,

              transformOrigin: "top center",

              transition: "all 0.2s ease",
            }}
          >
            {/* =========================
                PDF ROOT
            ========================= */}

            <div id="pdf-preview">
              {isLaporan ? (
                <LaporanTemplate
                  data={laporanPelaksanaanData}
                  settings={settings}
                  generatedAt={generatedAt}
                />
              ) : (
                <>
                  {/* =====================================================
                      PAGE 1
                  ===================================================== */}

              <PdfPage
                pageNumber={1}
                totalPages={3}
                documentTitle={torData.judul}
                generatedAt={generatedAt}
              >
                <div
                  style={{
                    padding: settings.pagePadding,
                    fontSize: settings.fontSize,
                    lineHeight: String(settings.lineHeight),
                    fontFamily: settings.fontFamily,
                    color: settings.textColor,
                  }}
                >
                  {/* HEADER */}

                  <GovernmentHeader
                    province="PROVINSI PAPUA BARAT DAYA"
                    agency="DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL DAN PEMBERDAYAAN MASYARAKAT DAN KAMPUNG"
                    address="Jl. Basuki Rahmat KM 12, Kota Sorong, Papua Barat Daya"
                  />

                  {/* TITLE */}

                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 40,
                    }}
                  >
                    <h1
                      style={{
                        fontSize: 30,
                        fontWeight: 700,
                        marginBottom: 12,
                      }}
                    >
                      TERM OF REFERENCE (TOR)
                    </h1>

                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                      }}
                    >
                      Tahun Anggaran {torData.tahun}
                    </h2>
                  </div>

                  {/* INFORMASI */}

                  <div
                    style={{
                      marginTop: 70,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <InfoRow
                      label="Pemerintah Daerah"
                      value={torData.kementerian}
                    />

                    <InfoRow label="Dinas" value={torData.dinas} />

                    <InfoRow label="Unit Kerja" value={torData.unitKerja} />

                    {torData.jenisKegiatan ? (
                      <InfoRow
                        label="Jenis Kegiatan"
                        value={torData.jenisKegiatan}
                      />
                    ) : null}

                    {torData.bidang ? (
                      <InfoRow label="Bidang" value={torData.bidang} />
                    ) : null}

                    {torData.status ? (
                      <InfoRow label="Status Kegiatan" value={torData.status} />
                    ) : null}

                    <InfoRow label="Judul Kegiatan" value={torData.judul} />

                    <InfoRow label="IKU" value={torData.iku} />

                    <InfoRow label="Target IKU" value={torData.targetIku} />

                    <InfoRow label="IKK" value={torData.ikk} />

                    <InfoRow label="Target IKK" value={torData.targetIkk} />

                    {torData.tanggalDokumen ? (
                      <InfoRow
                        label="Tanggal Dokumen"
                        value={torData.tanggalDokumen}
                      />
                    ) : null}

                    {torData.dibuatOleh ? (
                      <InfoRow label="Dibuat Oleh" value={torData.dibuatOleh} />
                    ) : null}
                  </div>
                </div>
              </PdfPage>

              {/* =====================================================
                  PAGE 2
              ===================================================== */}

              <PdfPage
                pageNumber={2}
                totalPages={3}
                documentTitle={torData.judul}
                generatedAt={generatedAt}
              >
                <div
                  style={{
                    padding: settings.pagePadding,
                    fontSize: settings.fontSize,
                    lineHeight: String(settings.lineHeight),
                    fontFamily: settings.fontFamily,
                    color: settings.textColor,
                  }}
                >
                  <SectionTitle>A. LATAR BELAKANG</SectionTitle>

                  <p
                    style={{
                      textAlign: "justify",
                    }}
                  >
                    {torData.latarBelakang}
                  </p>

                  <SectionTitle>B. TUJUAN KEGIATAN</SectionTitle>

                  <BulletList items={torData.tujuan} />

                  <SectionTitle>C. SASARAN KEGIATAN</SectionTitle>

                  <BulletList items={torData.sasaran} />

                  <SectionTitle>D. OUTPUT KEGIATAN</SectionTitle>

                  <BulletList items={torData.outputs} />

                  {torData.detailKegiatan?.length ? (
                    <>
                      <SectionTitle>DETAIL BERDASARKAN JENIS KEGIATAN</SectionTitle>

                      <BulletList items={torData.detailKegiatan} />
                    </>
                  ) : null}

                  <SectionTitle>E. WAKTU DAN TEMPAT</SectionTitle>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <InfoRow label="Tanggal" value={torData.tanggal} />

                    <InfoRow label="Waktu" value={torData.waktu} />

                    <InfoRow label="Tempat" value={torData.lokasi} />

                    <InfoRow
                      label="Peserta"
                      value={`${torData.peserta} Peserta`}
                    />
                  </div>
                </div>
              </PdfPage>

              {/* =====================================================
                  PAGE 3
              ===================================================== */}

              <PdfPage
                pageNumber={3}
                totalPages={3}
                documentTitle={torData.judul}
                generatedAt={generatedAt}
              >
                <div
                  style={{
                    padding: settings.pagePadding,
                    fontSize: settings.fontSize,
                    lineHeight: String(settings.lineHeight),
                    fontFamily: settings.fontFamily,
                    color: settings.textColor,
                  }}
                >
                  <SectionTitle>F. RUNDOWN KEGIATAN</SectionTitle>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 20,
                    }}
                  >
                    <thead>
                      <tr>
                        <TableHeader>Waktu</TableHeader>

                        <TableHeader>Kegiatan</TableHeader>

                        <TableHeader>Keterangan</TableHeader>
                      </tr>
                    </thead>

                    <tbody>
                      {torData.rundown.map((item) => (
                        <tr key={item.waktu}>
                          <TableCell>{item.waktu}</TableCell>

                          <TableCell>{item.kegiatan}</TableCell>

                          <TableCell>{item.keterangan}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <SectionTitle>G. RINCIAN BIAYA</SectionTitle>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 20,
                    }}
                  >
                    <thead>
                      <tr>
                        <TableHeader>No</TableHeader>

                        <TableHeader>Uraian</TableHeader>

                        <TableHeader>Volume</TableHeader>

                        <TableHeader>Harga</TableHeader>

                        <TableHeader>Jumlah</TableHeader>
                      </tr>
                    </thead>

                    <tbody>
                      {torData.biaya.map((item) => (
                        <tr key={item.no}>
                          <TableCell>{item.no}</TableCell>

                          <TableCell>{item.uraian}</TableCell>

                          <TableCell>{item.volume}</TableCell>

                          <TableCell>{item.harga}</TableCell>

                          <TableCell>{item.jumlah}</TableCell>
                        </tr>
                      ))}

                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            border: "1px solid #000",
                            padding: 10,
                            textAlign: "right",
                            fontWeight: 700,
                          }}
                        >
                          Total
                        </td>

                        <td
                          style={{
                            border: "1px solid #000",
                            padding: 10,
                            fontWeight: 700,
                          }}
                        >
                          {torData.totalBiaya}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <SectionTitle>H. PENUTUP</SectionTitle>

                  <p
                    style={{
                      textAlign: "justify",
                    }}
                  >
                    Demikian TOR ini disusun sebagai pedoman pelaksanaan
                    kegiatan.
                  </p>

                  {/* SIGNATURE */}

                  <div
                    style={{
                      marginTop: 120,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: 300,
                        textAlign: "center",
                      }}
                    >
                      <p>
                        Papua Barat Daya,{" "}
                        {torData.tanggalDokumen ?? torData.tanggal}
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                        }}
                      >
                        Penanggung Jawab Kegiatan
                      </p>

                      <div
                        style={{
                          height: 100,
                        }}
                      />

                      <p
                        style={{
                          fontWeight: 700,
                          textDecoration: "underline",
                        }}
                      >
                        {torData.pejabat}
                      </p>

                      <p>{torData.nip}</p>
                    </div>
                  </div>
                </div>
                  </PdfPage>
                </>
              )}
            </div>
          </div>
        </PdfPreviewFrame>
      </div>
    </main>
  );
}

/* =====================================================
   HELPERS
===================================================== */

type InfoRowProps = {
  label: string;

  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns: "240px 14px 1fr",

        alignItems: "start",

        columnGap: 8,
      }}
    >
      <div
        style={{
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      <div>:</div>

      <div>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        marginTop: 40,
        marginBottom: 18,
        fontSize: 20,
        fontWeight: 700,
      }}
    >
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        paddingLeft: 24,
        margin: 0,
      }}
    >
      {items.map((item) => (
        <li
          key={item}
          style={{
            marginBottom: 10,
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        border: "1px solid #000",
        padding: 10,
        background: "#f1f5f9",
        textAlign: "left",
        fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        border: "1px solid #000",
        padding: 10,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}
