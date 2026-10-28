import { notFound } from "next/navigation";
import { OtsusForm } from "@/components/otsus/otsus-form";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!/^\d+$/.test(id) || Number(id) < 1) notFound(); return <OtsusForm mode="edit" id={Number(id)} />; }
