import { MacekuPkkDetailClient } from "@/app/maceku-pkk/[id]/detail-client";

export default async function MacekuPkkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MacekuPkkDetailClient id={id} />;
}
