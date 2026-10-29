import { Badge } from "@/components/ui/badge";
import type { DpaType, OtsusFundingSource, OtsusStatus } from "@/types/otsus";

export const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
export const persen = (value: number, maximumFractionDigits = 1) => `${value.toLocaleString("id-ID", { maximumFractionDigits })}%`;
export const numberText = (value: number) => new Intl.NumberFormat("id-ID").format(value);
export const statusLabel: Record<OtsusStatus, string> = { BELUM_MULAI: "Belum Mulai", BERJALAN: "Berjalan", SELESAI: "Selesai" };
export const dpaLabel: Record<DpaType, string> = { AWAL: "DPA Awal", PERGESERAN: "DPA Pergeseran", PERUBAHAN: "DPA Perubahan" };
export const otsusFundingSourceLabel: Record<OtsusFundingSource, string> = { SG_1_25: "SG 1,25%", BG_1: "BG 1%" };
export function OtsusStatusBadge({ status }: { status: OtsusStatus }) { const colors = status === "SELESAI" ? "bg-emerald-100 text-emerald-800" : status === "BERJALAN" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"; return <Badge variant="outline" className={colors}>{statusLabel[status]}</Badge>; }
export const fileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
export const dateID = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jayapura" }).format(new Date(value));
