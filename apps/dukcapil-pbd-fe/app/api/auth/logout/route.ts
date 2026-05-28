// app/api/auth/logout/route.ts

import { NextResponse } from "next/server";

export async function POST() {
  const response =
    NextResponse.json({
      success: true,

      message:
        "Logout berhasil",
    });

  /* =========================
     DELETE COOKIE
  ========================= */

  response.cookies.set(
    "admin_token",
    "",
    {
      path: "/",

      expires: new Date(0),
    }
  );

  response.cookies.set(
    "tahun_anggaran",
    "",
    {
      path: "/",

      expires: new Date(0),
    }
  );

  return response;
}
