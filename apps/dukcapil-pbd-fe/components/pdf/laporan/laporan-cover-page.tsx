import { GovernmentHeader } from "@/components/pdf/government-header";
import { PdfPage } from "@/components/pdf/pdf-page";
import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { PdfSettings } from "@/types/pdf";

import { InfoRow, PdfContent } from "./laporan-pdf-utils";

type Props = {
  data: LaporanPelaksanaanDocument;
  settings: PdfSettings;
  generatedAt: string;
  pageNumber: number;
  totalPages: number;
};

export function LaporanCoverPage({
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
        <GovernmentHeader
          province="PROVINSI PAPUA BARAT DAYA"
          agency="DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL DAN PEMBERDAYAAN MASYARAKAT DAN KAMPUNG"
          address="Jl. Basuki Rahmat KM 12, Kota Sorong, Papua Barat Daya"
        />

        <div style={{ textAlign: "center", marginTop: 42 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 700,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Laporan Pelaksanaan Kegiatan
          </h1>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            Tahun Anggaran {data.tahun}
          </h2>
        </div>

        <div
          style={{
            marginTop: 68,
            display: "flex",
            flexDirection: "column",
            gap: 15,
          }}
        >
          <InfoRow label="Nomor Dokumen" value={data.nomorDokumen} />
          <InfoRow label="Pemerintah Daerah" value={data.kementerian} />
          <InfoRow label="Dinas" value={data.dinas} />
          <InfoRow label="Unit Kerja" value={data.unitKerja} />
          {data.jenisKegiatan ? (
            <InfoRow label="Jenis Kegiatan" value={data.jenisKegiatan} />
          ) : null}
          {data.bidang ? <InfoRow label="Bidang" value={data.bidang} /> : null}
          {data.status ? (
            <InfoRow label="Status Kegiatan" value={data.status} />
          ) : null}
          <InfoRow label="Nama Kegiatan" value={data.namaKegiatan} />
          <InfoRow label="Tanggal Laporan" value={data.tanggalLaporan} />
          {data.dibuatOleh ? (
            <InfoRow label="Dibuat Oleh" value={data.dibuatOleh} />
          ) : null}
        </div>
      </PdfContent>
    </PdfPage>
  );
}
