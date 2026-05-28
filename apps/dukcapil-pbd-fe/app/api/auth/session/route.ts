import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SERVER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const API_PREFIX = process.env.SERVER_API_PREFIX ?? "/api/v1";

type SessionResponse = {
  data?: {
    authenticated: boolean;
    user: {
      username: string;
      name: string;
      role: string;
    };
    tahunAnggaran: string;
  };
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      tahunAnggaran: "2026",
    });
  }

  const upstreamResponse = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const result = (await upstreamResponse.json().catch(() => null)) as
    | SessionResponse
    | null;

  if (!upstreamResponse.ok || !result?.data?.authenticated) {
    const response = NextResponse.json({
      authenticated: false,
      tahunAnggaran: "2026",
    });
    response.cookies.set("admin_token", "", {
      path: "/",
      expires: new Date(0),
    });
    return response;
  }

  return NextResponse.json(result.data);
}
