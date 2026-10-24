"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { CrudPage, DetailGrid } from "@/components/dashboard/crud-page";
import { ErrorState, LoadingState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAdminUser, getAdminUsers, updateAdminUser } from "@/lib/api/admin-users";
import { confirmDiscard, useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { formatAdminRole, roleOptions, type AdminRole, type AdminUser } from "@/types/admin-user";

type UserForm={username:string;name:string;role:AdminRole;password:string;isActive:boolean};
const base="/internal/pengaturan/pengguna", empty:UserForm={username:"",name:"",role:"admin_sekretariat",password:"",isActive:true};
export function UserRecordPage({mode,id}:{mode:"add"|"edit"|"preview";id?:number}){
 const router=useRouter(); const [record,setRecord]=useState<AdminUser|null>(null),[form,setForm]=useState(empty),[initial,setInitial]=useState(JSON.stringify(empty));
 const [loading,setLoading]=useState(mode!=="add"),[saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null); const dirty=mode!=="preview"&&JSON.stringify(form)!==initial; useUnsavedChanges(dirty);
 useEffect(()=>{if(mode==="add")return;let active=true;getAdminUsers().then(items=>{if(!active)return;const found=items.find(v=>v.id===id)??null;setRecord(found);if(!found){setError("Pengguna tidak ditemukan.");return;}const value={username:found.username,name:found.name,role:found.role,password:"",isActive:found.isActive};setForm(value);setInitial(JSON.stringify(value));}).catch(()=>setError("Data pengguna gagal dimuat.")).finally(()=>active&&setLoading(false));return()=>{active=false};},[id,mode]);
 async function submit(e:FormEvent){e.preventDefault();if(!form.name.trim()||!form.username.trim())return setError("Nama dan username wajib diisi.");if(mode==="add"&&form.password.length<8)return setError("Password awal minimal 8 karakter.");setSaving(true);setError(null);try{const saved=mode==="edit"&&id?await updateAdminUser(id,{username:form.username.trim(),name:form.name.trim(),role:form.role,isActive:form.isActive}):await createAdminUser({username:form.username.trim(),name:form.name.trim(),role:form.role,password:form.password,isActive:form.isActive});setInitial(JSON.stringify(form));router.replace(`${base}/${saved.id}/preview`);}catch(cause){setError(cause instanceof Error?cause.message:"Pengguna gagal disimpan.");}finally{setSaving(false)}}
 const title=mode==="add"?"Tambah Pengguna":mode==="edit"?"Edit Pengguna":record?.name??"Detail Pengguna";
 return <CrudPage title={title} description={mode==="preview"?"Detail akun dan hak akses pengguna.":"Atur identitas, role, dan status pengguna."} breadcrumbs={[{label:"Internal",href:"/internal/dashboard"},{label:"Pengaturan"},{label:"Pengguna",href:base},{label:mode==="add"?"Tambah":mode==="edit"?"Edit":"Preview"}]} actions={mode==="preview"&&record?<Button asChild><Link href={`${base}/${record.id}/edit`}><Pencil className="h-4 w-4"/>Edit</Link></Button>:undefined}>
 {loading?<LoadingState message="Memuat pengguna..."/>:error&&!record&&mode!=="add"?<ErrorState message={error}/>:mode==="preview"&&record?<Card><CardContent><DetailGrid items={[{label:"Nama",value:record.name},{label:"Username",value:record.username},{label:"Role",value:formatAdminRole(record.role)},{label:"Status",value:<Badge>{record.isActive?"Aktif":"Nonaktif"}</Badge>},{label:"Dibuat",value:new Date(record.createdAt).toLocaleString("id-ID")},{label:"Diperbarui",value:new Date(record.updatedAt).toLocaleString("id-ID")} ]}/></CardContent></Card>:
 <Card><CardContent><form onSubmit={submit} className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Nama"><Input required value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></Field><Field label="Username"><Input required value={form.username} onChange={e=>setForm(v=>({...v,username:e.target.value}))}/></Field>{mode==="add"?<Field label="Password Awal"><Input required minLength={8} type="password" value={form.password} onChange={e=>setForm(v=>({...v,password:e.target.value}))}/></Field>:null}<Field label="Role"><select value={form.role} onChange={e=>setForm(v=>({...v,role:e.target.value as AdminRole}))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{roleOptions.map(role=><option key={role} value={role}>{formatAdminRole(role)}</option>)}</select></Field><label className="flex items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={form.isActive} onChange={e=>setForm(v=>({...v,isActive:e.target.checked}))}/><span className="text-sm font-bold">Pengguna aktif</span></label></div>{error?<ErrorState message={error}/>:null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={()=>confirmDiscard(dirty)&&router.push(base)}><ArrowLeft className="h-4 w-4"/>Batal</Button><Button disabled={saving}>{saving?"Menyimpan...":"Simpan"}</Button></div></form></CardContent></Card>}</CrudPage>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="grid gap-2"><span className="text-sm font-bold text-pbd-navy">{label}</span>{children}</label>}
