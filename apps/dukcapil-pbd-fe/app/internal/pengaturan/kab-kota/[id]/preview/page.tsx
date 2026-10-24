import { notFound } from "next/navigation";
import { KabKotaRecordPage } from "@/components/master/kab-kota-record-page";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^\d+$/.test(id)||Number(id)<1)notFound();return <KabKotaRecordPage mode="preview" id={Number(id)}/>;}
