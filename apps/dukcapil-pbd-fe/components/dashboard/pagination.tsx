"use client";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { page:number; pageSize:number; total:number; onPageChange:(page:number)=>void; onPageSizeChange?:(size:number)=>void; pageSizeOptions?:readonly number[]; itemLabel?:string };
function pageItems(page:number,total:number):(number|"ellipsis")[]{if(total<=7)return Array.from({length:total},(_,i)=>i+1);const pages=[...new Set([1,total,page-1,page,page+1])].filter(v=>v>0&&v<=total).sort((a,b)=>a-b);const result:(number|"ellipsis")[]=[];pages.forEach((v,i)=>{if(i&&v-pages[i-1]>1)result.push("ellipsis");result.push(v)});return result}

export function Pagination({page,pageSize,total,onPageChange,onPageSizeChange,pageSizeOptions=[10,25,50,100],itemLabel="data"}:Props){
 const totalPages=Math.max(1,Math.ceil(total/pageSize)),current=Math.min(Math.max(page,1),totalPages),start=total===0?0:(current-1)*pageSize+1,end=Math.min(total,current*pageSize);
 return <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/45 px-4 py-4 text-sm text-slate-600 xl:flex-row xl:items-center xl:justify-between">
  <p className="font-medium">Menampilkan {start}–{end} dari {total} {itemLabel}</p><div className="flex flex-col gap-3 sm:flex-row sm:items-center">
  {onPageSizeChange?<div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={v=>onPageSizeChange(Number(v))}><SelectTrigger aria-label="Jumlah data per halaman" className="h-9 w-[72px] bg-white"><SelectValue/></SelectTrigger><SelectContent>{pageSizeOptions.map(v=><SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent></Select><span className="whitespace-nowrap font-medium">per halaman</span></div>:null}
  <nav aria-label="Navigasi halaman" className="flex items-center gap-1"><Button type="button" variant="outline" size="icon-sm" aria-label="Halaman sebelumnya" disabled={current<=1} onClick={()=>onPageChange(current-1)}><ChevronLeft className="h-4 w-4"/></Button>
  {pageItems(current,totalPages).map((item,i)=>item==="ellipsis"?<span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-slate-400"><MoreHorizontal className="h-4 w-4"/></span>:<Button key={item} type="button" size="icon-sm" variant={item===current?"default":"ghost"} aria-current={item===current?"page":undefined} aria-label={`Halaman ${item}`} onClick={()=>onPageChange(item)}>{item}</Button>)}
  <Button type="button" variant="outline" size="icon-sm" aria-label="Halaman berikutnya" disabled={current>=totalPages} onClick={()=>onPageChange(current+1)}><ChevronRight className="h-4 w-4"/></Button></nav></div></div>
}
