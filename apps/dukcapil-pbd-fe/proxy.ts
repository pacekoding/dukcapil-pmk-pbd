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

  const isPortal =
    pathname === "/portal";

  const isPortalTypo =
    pathname === "/protal";

  const isDashboard =
    pathname === "/dashboard";

  const isDashboardSubpath =
    pathname.startsWith(
      "/dashboard/"
    );

  const isSibum =
    pathname.startsWith(
      "/sibum"
    );

  const isSidoka =
    pathname.startsWith(
      "/sidoka"
    );

  const isSidak =
    pathname.startsWith(
      "/sidak"
    );

  const isSiber =
    pathname.startsWith(
      "/siber"
    );

  const isSisurat =
    pathname.startsWith(
      "/sisurat"
    );

  const isSimonev =
    pathname.startsWith(
      "/simonev"
    );

  const isSikampung =
    pathname.startsWith(
      "/sikampung"
    );

  const isSitekad =
    pathname.startsWith(
      "/sitekad"
    );

  const isAspirasiku =
    pathname.startsWith(
      "/aspirasiku"
    );

  const isArsipPegawai =
    pathname.startsWith(
      "/arsip-pegawai"
    );

  const isOptimaInfo =
    pathname.startsWith(
      "/optima-info"
    );

  const isSettings =
    pathname.startsWith(
      "/settings"
    );

  const isLoginPage =
    pathname === "/login";

  const isSuperAdmin =
    role?.toLowerCase().replace(/[^a-z0-9]/g, "") === "superadmin";

  const settingsRedirectPath =
    dashboardPathFromSettingsPath(pathname);

  if (
    isPortalTypo
  ) {
    return NextResponse.redirect(
      new URL(
        "/portal",
        request.url
      )
    );
  }

  /* =========================
     PROTECT DASHBOARD
  ========================= */

  if (
    (isPortal ||
      isDashboard ||
      isDashboardSubpath ||
      isSibum ||
      isSidoka ||
      isSidak ||
      isSiber ||
      isSisurat ||
      isSimonev ||
      isSikampung ||
      isSitekad ||
      isAspirasiku ||
      isArsipPegawai ||
      isOptimaInfo ||
      isSettings) &&
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
    (isDashboard ||
      isDashboardSubpath ||
      isSettings) &&
    !isSuperAdmin
  ) {
    return NextResponse.redirect(
      new URL(
        "/portal",
        request.url
      )
    );
  }

  if (
    settingsRedirectPath
  ) {
    return NextResponse.redirect(
      new URL(
        settingsRedirectPath,
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
        "/portal",
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
    "/portal",
    "/protal",
    "/dashboard",
    "/dashboard/:path*",
    "/sibum/:path*",
    "/sidoka/:path*",
    "/sidak/:path*",
    "/siber/:path*",
    "/sisurat",
    "/sisurat/:path*",
    "/simonev",
    "/simonev/:path*",
    "/sikampung/:path*",
    "/sitekad/:path*",
    "/aspirasiku/:path*",
    "/optima-info/:path*",
    "/arsip-pegawai",
    "/arsip-pegawai/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
  ],
};

function dashboardPathFromSettingsPath(pathname: string) {
  if (pathname === "/settings") {
    return "/dashboard";
  }
  if (pathname === "/settings/users" || pathname.startsWith("/settings/users/")) {
    return pathname.replace("/settings/users", "/dashboard/users");
  }
  if (
    pathname === "/settings/kab-kota" ||
    pathname.startsWith("/settings/kab-kota/")
  ) {
    return pathname.replace("/settings/kab-kota", "/dashboard/kab-kota");
  }
  if (pathname === "/settings/SDD" || pathname.startsWith("/settings/SDD/")) {
    return pathname.replace("/settings/SDD", "/dashboard/SDD");
  }
  if (
    pathname === "/settings/Subkegiatan" ||
    pathname.startsWith("/settings/Subkegiatan/")
  ) {
    return pathname.replace("/settings/Subkegiatan", "/dashboard/Subkegiatan");
  }
  return "";
}
