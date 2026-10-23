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

  const role =
    request.cookies.get(
      "admin_role"
    )?.value;

  const pathname =
    request.nextUrl.pathname;

  const isInternal =
    pathname === "/internal" ||
    pathname.startsWith(
      "/internal/"
    );

  const isInternalSettings =
    pathname === "/internal/pengaturan" ||
    pathname.startsWith(
      "/internal/pengaturan/"
    );

  const isLoginPage =
    pathname === "/login";

  const isSuperAdmin =
    role?.toLowerCase().replace(/[^a-z0-9]/g, "") === "superadmin";

  /* =========================
     PROTECT INTERNAL AREA
  ========================= */

  if (
    isInternal &&
    !token
  ) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  if (
    isInternalSettings &&
    !isSuperAdmin
  ) {
    return NextResponse.redirect(
      new URL(
        "/internal/dashboard",
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
        "/internal/dashboard",
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
    "/internal",
    "/internal/:path*",
    "/login",
  ],
};
