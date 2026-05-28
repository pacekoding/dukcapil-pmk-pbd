// components/dashboard/sidebar.tsx

"use client";

import Image from "next/image";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  CalendarDays,
  FileText,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Sheet, SheetContent } from "@/components/ui/sheet";

import {
  dashboardMenus,
  type DashboardMenuIcon,
} from "@/lib/dummy/navigation-data";

import { cn } from "@/lib/utils";

/* =========================
   TYPES
========================= */

type SidebarProps = {
  mobileOpen: boolean;

  setMobileOpen: (value: boolean) => void;

  collapsed: boolean;

  setCollapsed: (value: boolean) => void;
};

const dashboardMenuIconMap: Record<DashboardMenuIcon, LucideIcon> = {
  home: Home,
  calendar: CalendarDays,
  fileText: FileText,
};

/* =========================
   CONTENT
========================= */

function SidebarContent({
  collapsed,

  setCollapsed,

  onClose,
}: {
  collapsed: boolean;

  setCollapsed: (value: boolean) => void;

  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className="
        flex h-full flex-col
        bg-gradient-to-b
        from-[#072B61]
        to-[#041C42]
        text-white
      "
    >
      {/* HEADER */}

      <div
        className={cn(
          `
            flex items-center
            border-b border-white/10
            px-5 py-6
          `,
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed ? (
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <Image
                src="/logo-pbd.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>

            <div>
              <h2
                className="
                  text-sm font-semibold
                  leading-7
                "
              >
                Dinas Kependudukan dan Pencatatan Sipil
              </h2>
            </div>
          </div>
        ) : (
          <div className="relative h-12 w-12">
            <Image
              src="/logo-pbd.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        )}

        {!collapsed && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCollapsed(true)}
            className="
              text-white
              hover:bg-white/10
              hover:text-white
            "
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* COLLAPSED BUTTON */}

      {collapsed && (
        <div className="flex justify-center py-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCollapsed(false)}
            className="
              text-white
              hover:bg-white/10
              hover:text-white
            "
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* MENU */}

      <div className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {dashboardMenus.map((menu) => {
            const Icon = dashboardMenuIconMap[menu.icon];

            const active =
              menu.href === "/dashboard"
                ? pathname === menu.href
                : pathname === menu.href ||
                  pathname.startsWith(`${menu.href}/`);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={onClose}
                className={cn(
                  `
                      flex items-center
                      rounded-2xl
                      transition-all
                    `,
                  collapsed
                    ? `
                        justify-center
                        px-0 py-4
                      `
                    : `
                        gap-4 px-5
                        py-4
                      `,
                  active
                    ? `
                        bg-gradient-to-r
                        from-blue-600
                        to-blue-500
                        text-white
                      `
                    : `
                        text-white/80
                        hover:bg-white/10
                      `,
                )}
              >
                <Icon className={cn(collapsed ? "h-6 w-6" : "h-5 w-5")} />

                {!collapsed && (
                  <span className="text-sm font-medium">{menu.title}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* =========================
   MAIN
========================= */

export default function DashboardSidebar({
  mobileOpen,

  setMobileOpen,

  collapsed,

  setCollapsed,
}: SidebarProps) {
  return (
    <>
      {/* MOBILE */}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="
            w-[320px]
            border-none p-0
          "
        >
          <SidebarContent
            collapsed={false}
            setCollapsed={() => {}}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* DESKTOP */}

      <aside
        className={cn(
          `
            fixed left-0 top-0
            z-40 hidden
            h-screen
            transition-all
            duration-300
            lg:block
          `,
          collapsed ? "w-[96px]" : "w-[320px]",
        )}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}
