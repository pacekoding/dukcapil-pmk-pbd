"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardTopbar from "@/components/dashboard/topbar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  theme?:
    | "default"
    | "sibum"
    | "dataKampung"
    | "kelompokBinaan"
    | "arsip"
    | "settings";
};

const sidebarStorageKey = "internal-sidebar-collapsed";
const sidebarChangeEvent = "internal-sidebar-change";

function subscribeToSidebarPreference(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(sidebarChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(sidebarChangeEvent, callback);
  };
}

function getSidebarPreference() {
  return window.localStorage.getItem(sidebarStorageKey) === "true";
}

export function DashboardShell({
  children,
  theme,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    () => false,
  );
  const pathname = usePathname();
  const resolvedTheme = theme ?? getInternalTheme(pathname);

  const updateCollapsed = (value: boolean) => {
    window.localStorage.setItem(sidebarStorageKey, String(value));
    window.dispatchEvent(new Event(sidebarChangeEvent));
  };

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
        setCollapsed={updateCollapsed}
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
  if (pathname.startsWith("/internal/pmk/bum-kampung")) {
    return "sibum";
  }
  if (pathname.startsWith("/internal/pmk/data-kampung")) {
    return "dataKampung";
  }
  if (pathname.startsWith("/internal/pmk/kelompok-binaan")) {
    return "kelompokBinaan";
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
