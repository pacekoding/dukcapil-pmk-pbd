import { PegawaiDetailClient } from "@/app/internal/pegawai/[id]/detail-client";

export default async function PegawaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PegawaiDetailClient id={id} />;
}
