import { GenerateSuratPage } from "@/components/sisurat/generate-surat-page";

type EditSuratKeluarRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSuratKeluarRoute({
  params,
}: EditSuratKeluarRouteProps) {
  const { id } = await params;

  return <GenerateSuratPage editId={id} />;
}
