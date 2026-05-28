import { PdfPage } from "@/components/pdf/pdf-page";
import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { PdfSettings } from "@/types/pdf";

import {
  BulletList,
  InfoRow,
  Paragraph,
  PdfContent,
  SectionTitle,
} from "./laporan-pdf-utils";

type Props = {
  data: LaporanPelaksanaanDocument;
  settings: PdfSettings;
  generatedAt: string;
  pageNumber: number;
  totalPages: number;
};

export function LaporanContentPage({
  data,
  settings,
  generatedAt,
  pageNumber,
  totalPages,
}: Props) {
  return (
    <PdfPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      documentTitle="Laporan Pelaksanaan Kegiatan"
      generatedAt={generatedAt}
    >
      <PdfContent settings={settings}>
        <SectionTitle>A. PENDAHULUAN</SectionTitle>
        <Paragraph>{data.latarBelakang}</Paragraph>

        <SectionTitle>Dasar Pelaksanaan</SectionTitle>
        <BulletList items={data.dasarPelaksanaan} />

        <SectionTitle>Maksud dan Tujuan</SectionTitle>
        <BulletList items={data.maksudTujuan} />

        <SectionTitle>B. PELAKSANAAN KEGIATAN</SectionTitle>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <InfoRow label="Tanggal" value={data.tanggal} />
          <InfoRow label="Waktu" value={data.waktu} />
          <InfoRow label="Tempat" value={data.lokasi} />
          <InfoRow label="Jumlah Peserta" value={`${data.peserta} Peserta`} />
          <InfoRow label="Pelaksana" value={data.pelaksana} />
          <InfoRow label="Metode" value={data.metode} />
        </div>

        <SectionTitle>Narasumber</SectionTitle>
        <BulletList items={data.narasumber} />

        <SectionTitle>Uraian Pelaksanaan</SectionTitle>
        <BulletList items={data.uraianPelaksanaan} />

        {data.detailKegiatan?.length ? (
          <>
            <SectionTitle>Detail Berdasarkan Jenis Kegiatan</SectionTitle>
            <BulletList items={data.detailKegiatan} />
          </>
        ) : null}
      </PdfContent>
    </PdfPage>
  );
}
