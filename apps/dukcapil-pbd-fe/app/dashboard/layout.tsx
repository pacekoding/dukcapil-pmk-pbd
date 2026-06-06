// app/dashboard/layout.tsx

"use client";

import { useState } from "react";

import DashboardSidebar from "@/components/dashboard/sidebar";

import DashboardTopbar from "@/components/dashboard/topbar";

import { cn } from "@/lib/utils";

/* =========================
   LAYOUT
========================= */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* =========================
     STATE
  ========================= */

  const [mobileOpen, setMobileOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="
        min-h-screen
        bg-slate-50
      "
    >
      {/* =========================
          SIDEBAR
      ========================= */}

      <DashboardSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* =========================
          MAIN WRAPPER
      ========================= */}

      <div
        className={cn(
          `
            min-h-screen
            transition-all
            duration-300
          `,
          collapsed ? "lg:pl-[96px]" : "lg:pl-[320px]",
        )}
      >
        {/* =========================
            TOPBAR
        ========================= */}

        <DashboardTopbar setMobileOpen={setMobileOpen} />

        {/* =========================
            CONTENT
        ========================= */}

        <main
          className="
            px-4 py-4 sm:px-5 sm:py-5
            lg:px-6 lg:py-6
          "
        >
          {/* CONTAINER */}

          <div
            className="
              mx-auto
              w-full
              max-w-[1440px]
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
