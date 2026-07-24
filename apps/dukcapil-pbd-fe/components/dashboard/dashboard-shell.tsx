"use client";

import { useState } from "react";

import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardTopbar from "@/components/dashboard/topbar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  theme?:
    | "default"
    | "maceku"
    | "sibum"
    | "sikampung"
    | "sitekad"
    | "aspirasiku"
    | "sidoka"
    | "sidak"
    | "simonev"
    | "optimaInfo"
    | "arsip"
    | "settings";
};

export function DashboardShell({
  children,
  theme = "default",
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn("min-h-screen bg-pbd-bg", `dashboard-theme-${theme}`)}>
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
