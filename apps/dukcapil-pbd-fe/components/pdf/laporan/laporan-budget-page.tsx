import { PdfPage } from "@/components/pdf/pdf-page";
import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { PdfSettings } from "@/types/pdf";

import {
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

export function LaporanBudgetPage({
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
        <SectionTitle>E. REALISASI BIAYA</SectionTitle>
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
              <TableHeader>Uraian</TableHeader>
              <TableHeader>Volume</TableHeader>
              <TableHeader>Satuan</TableHeader>
              <TableHeader>Biaya</TableHeader>
              <TableHeader>Jumlah</TableHeader>
            </tr>
          </thead>
          <tbody>
            {data.realisasiBiaya.map((item) => (
              <tr key={item.no}>
                <TableCell align="center">{item.no}</TableCell>
                <TableCell>{item.uraian}</TableCell>
                <TableCell>{item.volume}</TableCell>
                <TableCell>{item.satuan}</TableCell>
                <TableCell>{item.biaya}</TableCell>
                <TableCell>{item.jumlah}</TableCell>
              </tr>
            ))}

            <tr>
              <td
                colSpan={5}
                style={{
                  border: "1px solid #000",
                  padding: 9,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                Total Realisasi
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: 9,
                  fontWeight: 700,
                }}
              >
                {data.totalRealisasi}
              </td>
            </tr>
          </tbody>
        </table>
      </PdfContent>
    </PdfPage>
  );
}
