import { RadiogramPreviewPage } from "@/components/sisurat/radiogram-preview-page";

type SisuratPreviewRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SisuratPreviewRoute({
  params,
}: SisuratPreviewRouteProps) {
  const { id } = await params;
  return <RadiogramPreviewPage suratId={id} />;
}
