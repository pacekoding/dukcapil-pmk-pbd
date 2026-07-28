import { redirect } from "next/navigation";

type GenerateSuratRouteProps = {
  searchParams: Promise<{
    edit?: string;
  }>;
};

export default async function GenerateSuratRoute({
  searchParams,
}: GenerateSuratRouteProps) {
  const params = await searchParams;
  if (params.edit) {
    redirect(`/sisurat/surat-keluar/${params.edit}/edit`);
  }

  redirect("/sisurat/surat-keluar/create");
}
