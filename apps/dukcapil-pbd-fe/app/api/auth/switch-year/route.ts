import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SERVER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const API_PREFIX = process.env.SERVER_API_PREFIX ?? "/api/v1";

type SwitchYearPayload = {
  tahunAnggaran: string;
};

type SwitchYearResponse = {
  data?: {
    token: string;
    user: {
      username: string;
      name: string;
      role: string;
    };
    tahunAnggaran: string;
  };
  message?: string;
};

const shouldUseSecureCookie = () =>
  process.env.AUTH_COOKIE_SECURE === "true" ||
  (process.env.NODE_ENV === "production" &&
    process.env.AUTH_COOKIE_SECURE !== "false");

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Session login tidak valid.",
        },
        {
          status: 401,
        },
      );
    }

    const body = (await request.json()) as SwitchYearPayload;
    const upstreamResponse = await fetch(
      `${API_BASE_URL}${API_PREFIX}/auth/switch-year`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const result = (await upstreamResponse.json().catch(() => null)) as
      | SwitchYearResponse
      | null;

    if (!upstreamResponse.ok || !result?.data?.token) {
      return NextResponse.json(
        {
          message: result?.message ?? "Tahun anggaran gagal diganti.",
        },
        {
          status: upstreamResponse.status || 500,
        },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.data.user,
      tahunAnggaran: result.data.tahunAnggaran,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: shouldUseSecureCookie(),
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24,
    };

    response.cookies.set("admin_token", result.data.token, cookieOptions);
    response.cookies.set(
      "tahun_anggaran",
      result.data.tahunAnggaran,
      cookieOptions,
    );
    response.cookies.set("admin_name", result.data.user.name, cookieOptions);
    response.cookies.set("admin_role", result.data.user.role, cookieOptions);

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Internal server error.",
      },
      {
        status: 500,
      },
    );
  }
}

