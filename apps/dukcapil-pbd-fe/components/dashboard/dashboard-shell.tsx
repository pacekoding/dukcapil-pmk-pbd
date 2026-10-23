"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardTopbar from "@/components/dashboard/topbar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  theme?:
    | "default"
    | "sibum"
    | "sikampung"
    | "sitekad"
    | "arsip"
    | "settings";
};

export function DashboardShell({
  children,
  theme,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const resolvedTheme = theme ?? getInternalTheme(pathname);

  return (
    <div
      className={cn(
        "min-h-screen bg-pbd-bg",
        `dashboard-theme-${resolvedTheme}`,
      )}
    >
      <DashboardSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[88px]" : "lg:pl-[288px]",
        )}
      >
        <DashboardTopbar setMobileOpen={setMobileOpen} />

        <main className="px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function getInternalTheme(pathname: string): NonNullable<DashboardShellProps["theme"]> {
  if (pathname.startsWith("/internal/sibumkam")) {
    return "sibum";
  }
  if (pathname.startsWith("/internal/sikampung")) {
    return "sikampung";
  }
  if (pathname.startsWith("/internal/sitekad")) {
    return "sitekad";
  }
  if (
    pathname.startsWith("/internal/pegawai") ||
    pathname.startsWith("/internal/arsip")
  ) {
    return "arsip";
  }
  if (
    pathname.startsWith("/internal/dashboard") ||
    pathname.startsWith("/internal/pengaturan")
  ) {
    return "settings";
  }
  return "default";
}
