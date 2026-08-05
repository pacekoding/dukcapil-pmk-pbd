import { ArsipPegawaiDetailClient } from "@/app/arsipku/data-pegawai/[id]/detail-client";

export default async function ArsipPegawaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ArsipPegawaiDetailClient id={id} />;
}
