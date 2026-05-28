import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const tahunAnggaran = cookieStore.get("tahun_anggaran")?.value ?? "2026";

  return NextResponse.json({
    authenticated: token === "authenticated",
    tahunAnggaran,
  });
}
