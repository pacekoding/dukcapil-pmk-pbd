import { LaporanBudgetPage } from "@/components/pdf/laporan/laporan-budget-page";
import { LaporanContentPage } from "@/components/pdf/laporan/laporan-content-page";
import { LaporanCoverPage } from "@/components/pdf/laporan/laporan-cover-page";
import { LaporanResultPage } from "@/components/pdf/laporan/laporan-result-page";
import { LaporanSignaturePage } from "@/components/pdf/laporan/laporan-signature-page";
import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { PdfSettings } from "@/types/pdf";

type Props = {
  data: LaporanPelaksanaanDocument;
  settings: PdfSettings;
  generatedAt: string;
};

const TOTAL_PAGES = 5;

export function LaporanTemplate({ data, settings, generatedAt }: Props) {
  return (
    <>
      <LaporanCoverPage
        data={data}
        settings={settings}
        generatedAt={generatedAt}
        pageNumber={1}
        totalPages={TOTAL_PAGES}
      />
      <LaporanContentPage
        data={data}
        settings={settings}
        generatedAt={generatedAt}
        pageNumber={2}
        totalPages={TOTAL_PAGES}
      />
      <LaporanResultPage
        data={data}
        settings={settings}
        generatedAt={generatedAt}
        pageNumber={3}
        totalPages={TOTAL_PAGES}
      />
      <LaporanBudgetPage
        data={data}
        settings={settings}
        generatedAt={generatedAt}
        pageNumber={4}
        totalPages={TOTAL_PAGES}
      />
      <LaporanSignaturePage
        data={data}
        settings={settings}
        generatedAt={generatedAt}
        pageNumber={5}
        totalPages={TOTAL_PAGES}
      />
    </>
  );
}
