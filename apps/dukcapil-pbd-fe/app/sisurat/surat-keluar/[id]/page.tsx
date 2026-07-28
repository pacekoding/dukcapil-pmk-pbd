import { RadiogramPreviewPage } from "@/components/sisurat/radiogram-preview-page";

type SisuratSuratKeluarDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SisuratSuratKeluarDetailRoute({
  params,
}: SisuratSuratKeluarDetailRouteProps) {
  const { id } = await params;

  return <RadiogramPreviewPage suratId={id} />;
}
