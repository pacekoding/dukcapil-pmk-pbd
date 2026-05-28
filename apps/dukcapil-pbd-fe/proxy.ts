// proxy.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

export default function proxy(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "admin_token"
    )?.value;

  const pathname =
    request.nextUrl.pathname;

  const isDashboard =
    pathname.startsWith(
      "/dashboard"
    );

  const isLoginPage =
    pathname === "/login";

  /* =========================
     PROTECT DASHBOARD
  ========================= */

  if (
    isDashboard &&
    !token
  ) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  /* =========================
     REDIRECT LOGIN
  ========================= */

  if (
    isLoginPage &&
    token
  ) {
    return NextResponse.redirect(
      new URL(
        "/dashboard",
        request.url
      )
    );
  }

  return NextResponse.next();
}

/* =========================
   MATCHER
========================= */

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};