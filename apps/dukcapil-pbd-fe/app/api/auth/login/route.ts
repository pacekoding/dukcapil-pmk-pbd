// app/api/auth/login/route.ts

import { NextResponse } from "next/server";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      username,
      password,
      tahunAnggaran,
    } = body;

    /* =========================
       SIMPLE AUTH
    ========================= */

    if (
      username !== "admin" ||
      password !== "admin123"
    ) {
      return NextResponse.json(
        {
          message:
            "Username atau password salah",
        },
        {
          status: 401,
        }
      );
    }

    if (
      typeof tahunAnggaran !== "string" ||
      !/^\d{4}$/.test(tahunAnggaran)
    ) {
      return NextResponse.json(
        {
          message:
            "Tahun anggaran tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       RESPONSE
    ========================= */

    const response =
      NextResponse.json({
        success: true,

        message:
          "Login berhasil",
      });

    /* =========================
       SET COOKIE
    ========================= */

    response.cookies.set(
      "admin_token",
      "authenticated",
      {
        httpOnly: true,

        secure:
          process.env
            .NODE_ENV ===
          "production",

        sameSite:
          "lax",

        path: "/",

        maxAge:
          60 *
          60 *
          24,
      }
    );

    response.cookies.set(
      "tahun_anggaran",
      tahunAnggaran,
      {
        httpOnly: true,

        secure:
          process.env
            .NODE_ENV ===
          "production",

        sameSite:
          "lax",

        path: "/",

        maxAge:
          60 *
          60 *
          24,
      }
    );

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
