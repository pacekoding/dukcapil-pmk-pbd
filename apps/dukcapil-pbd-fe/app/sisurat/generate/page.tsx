import { GenerateSuratPage } from "@/components/sisurat/generate-surat-page";

type GenerateSuratRouteProps = {
  searchParams: Promise<{
    edit?: string;
  }>;
};

export default async function GenerateSuratRoute({
  searchParams,
}: GenerateSuratRouteProps) {
  const params = await searchParams;
  return <GenerateSuratPage editId={params.edit} />;
}
