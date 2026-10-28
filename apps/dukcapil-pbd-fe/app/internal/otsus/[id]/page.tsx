import { notFound } from "next/navigation";
import { OtsusDetail } from "@/components/otsus/otsus-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!/^\d+$/.test(id) || Number(id) < 1) notFound(); return <OtsusDetail id={Number(id)} />; }
