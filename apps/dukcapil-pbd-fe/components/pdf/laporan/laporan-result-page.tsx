import { PdfPage } from "@/components/pdf/pdf-page";
import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { PdfSettings } from "@/types/pdf";

import {
  BulletList,
  PdfContent,
  SectionTitle,
  TableCell,
  TableHeader,
} from "./laporan-pdf-utils";

type Props = {
  data: LaporanPelaksanaanDocument;
  settings: PdfSettings;
  generatedAt: string;
  pageNumber: number;
  totalPages: number;
};

export function LaporanResultPage({
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
        <SectionTitle>C. HASIL PELAKSANAAN</SectionTitle>
        <BulletList items={data.hasilPelaksanaan} />

        <SectionTitle>Capaian Output</SectionTitle>
        <BulletList items={data.capaianOutput} />

        <SectionTitle>Kendala</SectionTitle>
        <BulletList items={data.kendala} />

        <SectionTitle>Tindak Lanjut</SectionTitle>
        <BulletList items={data.tindakLanjut} />

        <SectionTitle>D. PESERTA KEGIATAN</SectionTitle>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 18,
          }}
        >
          <thead>
            <tr>
              <TableHeader>No</TableHeader>
              <TableHeader>Peserta</TableHeader>
              <TableHeader>Unsur</TableHeader>
              <TableHeader>Jumlah</TableHeader>
            </tr>
          </thead>
          <tbody>
            {data.pesertaDetail.map((item) => (
              <tr key={item.no}>
                <TableCell align="center">{item.no}</TableCell>
                <TableCell>{item.nama}</TableCell>
                <TableCell>{item.unsur}</TableCell>
                <TableCell align="center">{item.jumlah}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>

        <SectionTitle>Dokumentasi Kegiatan</SectionTitle>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 18,
          }}
        >
          <thead>
            <tr>
              <TableHeader>No</TableHeader>
              <TableHeader>Kegiatan</TableHeader>
              <TableHeader>Keterangan</TableHeader>
            </tr>
          </thead>
          <tbody>
            {data.dokumentasi.map((item) => (
              <tr key={item.no}>
                <TableCell align="center">{item.no}</TableCell>
                <TableCell>{item.kegiatan}</TableCell>
                <TableCell>{item.keterangan}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </PdfContent>
    </PdfPage>
  );
}
