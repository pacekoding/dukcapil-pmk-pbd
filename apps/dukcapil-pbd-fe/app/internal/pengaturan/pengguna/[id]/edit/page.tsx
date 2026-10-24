import { notFound } from "next/navigation";import { UserRecordPage } from "@/components/master/user-record-page";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^\d+$/.test(id)||Number(id)<1)notFound();return <UserRecordPage mode="edit" id={Number(id)}/>}
