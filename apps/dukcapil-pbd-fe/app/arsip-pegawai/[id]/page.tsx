import { pegawaiArchives } from "@/app/arsip-pegawai/_data/pegawai-archive";
import { ArsipPegawaiDetailClient } from "@/app/arsip-pegawai/[id]/detail-client";

export function generateStaticParams() {
  return pegawaiArchives.map((pegawai) => ({
    id: pegawai.id,
  }));
}

export default async function ArsipPegawaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ArsipPegawaiDetailClient id={id} />;
}
