import { redirect } from "next/navigation";

type SisuratPreviewRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SisuratPreviewRoute({
  params,
}: SisuratPreviewRouteProps) {
  const { id } = await params;
  redirect(`/sisurat/surat-keluar/${id}`);
}
