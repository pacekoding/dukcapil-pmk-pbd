import { PdfPage } from "@/components/pdf/pdf-page";
import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { PdfSettings } from "@/types/pdf";

import {
  BulletList,
  Paragraph,
  PdfContent,
  SectionTitle,
  SignatureBlock,
} from "./laporan-pdf-utils";

type Props = {
  data: LaporanPelaksanaanDocument;
  settings: PdfSettings;
  generatedAt: string;
  pageNumber: number;
  totalPages: number;
};

export function LaporanSignaturePage({
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
        <SectionTitle>Lampiran</SectionTitle>
        <BulletList items={data.lampiran} />

        <SectionTitle>F. PENUTUP</SectionTitle>
        <Paragraph>
          Demikian laporan pelaksanaan kegiatan ini disusun sebagai bentuk
          pertanggungjawaban pelaksanaan kegiatan dan sebagai bahan evaluasi
          untuk pelaksanaan kegiatan selanjutnya.
        </Paragraph>

        <SignatureBlock
          date={data.tanggalLaporan}
          jabatan={data.jabatanPenandatangan}
          pejabat={data.pejabat}
          nip={data.nip}
        />
      </PdfContent>
    </PdfPage>
  );
}
