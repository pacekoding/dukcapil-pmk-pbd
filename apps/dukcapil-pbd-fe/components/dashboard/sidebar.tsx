// components/dashboard/sidebar.tsx

"use client";

import Image from "next/image";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Home,
  KeyRound,
  ListChecks,
  MapPinned,
  ClipboardList,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Sheet, SheetContent } from "@/components/ui/sheet";

import { dashboardMenus, type DashboardMenuIcon } from "@/lib/navigation";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  map: MapPinned,
  fileText: FileText,
  listChecks: ListChecks,
  clipboardList: ClipboardList,
  users: UsersRound,
  keyRound: KeyRound,
};

/* =========================
   CONTENT
========================= */

function SidebarContent({
  collapsed,

  setCollapsed,

  onClose,
  role,
}: {
  collapsed: boolean;

  setCollapsed: (value: boolean) => void;

  onClose?: () => void;

  role: string;
}) {
  const pathname = usePathname();
  const visibleMenus = dashboardMenus.filter(
    (menu) => !menu.roles || menu.roles.includes(role),
  );

  return (
    <div
      className="
        flex h-full flex-col
        border-r border-slate-200
        bg-white
        text-slate-900
      "
    >
      {/* HEADER */}

      <div
        className={cn(
          `
            flex items-center
            border-b border-slate-200
            px-4 py-4 sm:px-5
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
                  text-sm font-bold
                  leading-5 text-pbd-navy
                "
              >
                Dinas Dukcapil & PMK
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Papua Barat Daya
              </p>
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
              text-slate-500
              hover:bg-slate-100
              hover:text-pbd-navy
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
              text-slate-500
              hover:bg-slate-100
              hover:text-pbd-navy
            "
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* MENU */}

      <div className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {visibleMenus.map((menu) => {
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
                      rounded-md
                      transition-all
                    `,
                  collapsed
                    ? `
                        justify-center
                        px-0 py-3
                      `
                    : `
                        gap-4 px-5
                        py-3
                      `,
                  active
                    ? `
                        bg-pbd-navy
                        text-white
                      `
                    : `
                        text-slate-600
                        hover:bg-slate-100
                        hover:text-pbd-navy
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
  const [role, setRole] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const result = await response.json();

        if (mounted) {
          setRole(result.user?.role ?? "");
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {/* MOBILE */}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="
            w-[min(320px,calc(100vw-2rem))]
            border-none p-0
          "
        >
          <SidebarContent
            collapsed={false}
            setCollapsed={() => {}}
            onClose={() => setMobileOpen(false)}
            role={role}
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
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          role={role}
        />
      </aside>
    </>
  );
}
