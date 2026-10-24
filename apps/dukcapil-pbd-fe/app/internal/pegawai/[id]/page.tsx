import { redirect } from "next/navigation";

export default async function PegawaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/internal/pegawai/${id}/preview`);
}
