import { notFound, redirect } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) <= 0) notFound();
  redirect(`/internal/pelaksanaan-kegiatan/${id}/preview`);
}
