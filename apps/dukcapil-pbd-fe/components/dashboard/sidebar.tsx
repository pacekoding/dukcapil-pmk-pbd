// components/dashboard/sidebar.tsx

"use client";

import Image from "next/image";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Building2,
  CalendarClock,
  ClipboardCheck,
  ChevronDown,
  Database,
  Home,
  IdCard,
  KeyRound,
  ListChecks,
  MapPinned,
  MessageSquareText,
  MonitorPlay,
  FileText,
  FolderArchive,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ToggleLeft,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Sheet, SheetContent } from "@/components/ui/sheet";

import {
  internalMenus,
  type DashboardMenuGroup,
  type DashboardMenuIcon,
  type DashboardMenuItem,
} from "@/lib/navigation";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

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
  database: Database,
  map: MapPinned,
  idCard: IdCard,
  building2: Building2,
  fileText: FileText,
  folderArchive: FolderArchive,
  listChecks: ListChecks,
  clipboardCheck: ClipboardCheck,
  messageSquare: MessageSquareText,
  calendarClock: CalendarClock,
  monitorPlay: MonitorPlay,
  toggle: ToggleLeft,
  trophy: Trophy,
  users: UsersRound,
  keyRound: KeyRound,
  settings: Settings,
};

function canShowMenuItem(item: { roles?: string[] }, role: string) {
  return !item.roles || item.roles.includes(role);
}

function isMenuGroup(item: DashboardMenuItem): item is DashboardMenuGroup {
  return "children" in item;
}

function systemAccessForHref(href: string) {
  if (href.startsWith("/internal/sibumkam")) {
    return "sibum";
  }
  if (href.startsWith("/internal/sikampung")) {
    return "sikampung";
  }
  if (href.startsWith("/internal/sitekad")) {
    return "sitekad";
  }
  if (href.startsWith("/internal/dukcapil")) {
    return "siber";
  }
  if (
    href.startsWith("/internal/pegawai") ||
    href.startsWith("/internal/arsip")
  ) {
    return "arsip_pegawai";
  }
  return "";
}

function canAccessHref(href: string, role: string, systemAccess: string[]) {
  if (
    role === "superadmin" ||
    href === "/internal/dashboard"
  ) {
    return true;
  }

  const accessKey = systemAccessForHref(href);
  return !accessKey || systemAccess.includes(accessKey);
}

function isActiveMenu(pathname: string, href: string) {
  const normalizedHref = href.split("#")[0];

  if (normalizedHref === "/internal/dashboard") {
    return pathname === "/internal/dashboard";
  }

  return (
    pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`)
  );
}

function getSidebarMenus() {
  return internalMenus;
}

function getSidebarBrand(pathname: string) {
  if (pathname.startsWith("/internal/sibumkam")) {
    return {
      title: "SIBUM Kampung",
      subtitle: "Data BUMKam",
    };
  }

  if (pathname.startsWith("/internal/sikampung")) {
    return {
      title: "SIKAMPUNG",
      subtitle: "Data Kampung IDM",
    };
  }

  if (pathname.startsWith("/internal/sitekad")) {
    return {
      title: "SITEKAD",
      subtitle: "Program TEKAD",
    };
  }

  if (pathname.startsWith("/internal/dukcapil")) {
    return {
      title: "SIRBE",
      subtitle: "Dashboard Data Dukcapil",
    };
  }

  if (
    pathname.startsWith("/internal/pegawai") ||
    pathname.startsWith("/internal/arsip")
  ) {
    return {
      title: "ARSIPKU",
      subtitle: "Dokumen Kepegawaian",
    };
  }

  if (pathname === "/internal/dashboard") {
    return {
      title: "Dashboard Internal",
      subtitle: "Data Agregat Prioritas",
    };
  }

  if (pathname.startsWith("/internal/pengaturan")) {
    return {
      title: "Pengaturan",
      subtitle: "Super Admin",
    };
  }

  return {
    title: "Dashboard Internal",
    subtitle: "Dukcapil & PMK PBD",
  };
}

/* =========================
   CONTENT
========================= */

function SidebarContent({
  collapsed,

  setCollapsed,

  onClose,
  role,
  systemAccess,
}: {
  collapsed: boolean;

  setCollapsed: (value: boolean) => void;

  onClose?: () => void;

  role: string;
  systemAccess: string[];
}) {
  const pathname = usePathname();
  const menuItems = getSidebarMenus();
  const brand = getSidebarBrand(pathname);
  const [openMenuGroups, setOpenMenuGroups] = useState<Record<string, boolean>>(
    {},
  );

  const visibleMenus = useMemo(
    () =>
      menuItems
        .map((menu) => {
          if (!canShowMenuItem(menu, role)) {
            return null;
          }

          if (!isMenuGroup(menu)) {
            return canAccessHref(menu.href, role, systemAccess) ? menu : null;
          }

          const children = menu.children.filter(
            (child) =>
              canShowMenuItem(child, role) &&
              canAccessHref(child.href, role, systemAccess),
          );

          if (children.length === 0) {
            return null;
          }

          return {
            ...menu,
            children,
          };
        })
        .filter((menu): menu is DashboardMenuItem => Boolean(menu)),
    [menuItems, role, systemAccess],
  );

  const toggleMenuGroup = (title: string, defaultOpen: boolean) => {
    setOpenMenuGroups((current) => ({
      ...current,
      [title]: !(current[title] ?? defaultOpen),
    }));
  };

  return (
    <div
      className="
        flex h-full flex-col
        border-r border-slate-200
        bg-white
        text-slate-900
        shadow-[1px_0_0_rgba(15,35,80,0.03)]
      "
    >
      {/* HEADER */}

      <div
        className={cn(
          `
            flex items-center
            border-b border-slate-200
            px-4 py-4
          `,
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed ? (
          <div className="flex items-start gap-4">
            <Link
              href="/internal/dashboard"
              onClick={onClose}
              aria-label="Kembali ke Dashboard"
              title="Kembali ke Dashboard"
              className="relative h-12 w-12 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/30"
            >
              <Image
                src="/logo-pbd.png"
                alt="Logo Papua Barat Daya"
                fill
                className="object-contain"
              />
            </Link>

            <div>
              <h2
                className="
                  text-sm font-bold
                  leading-5 text-pbd-navy
                "
              >
                {brand.title}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {brand.subtitle}
              </p>
            </div>
          </div>
        ) : (
          <Link
            href="/internal/dashboard"
            onClick={onClose}
            aria-label="Kembali ke Dashboard"
            title="Kembali ke Dashboard"
            className="relative h-12 w-12 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/30"
          >
            <Image
              src="/logo-pbd.png"
              alt="Logo Papua Barat Daya"
              fill
              className="object-contain"
            />
          </Link>
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
        <nav className="space-y-3">
          {visibleMenus.map((menu) => {
            const Icon = dashboardMenuIconMap[menu.icon];

            if (isMenuGroup(menu)) {
              const groupActive = menu.children.some((child) =>
                isActiveMenu(pathname, child.href),
              );
              const groupOpen = collapsed
                ? true
                : (openMenuGroups[menu.title] ?? groupActive);

              return (
                <div key={menu.title} className="space-y-1">
                  {!collapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleMenuGroup(menu.title, groupActive)}
                      aria-expanded={groupOpen}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-slate-100",
                        groupActive ? "text-pbd-blue" : "text-slate-400",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="min-w-0 flex-1 truncate">
                        {menu.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          groupOpen ? "rotate-0" : "-rotate-90",
                        )}
                      />
                    </button>
                  ) : (
                    <div
                      className={cn(
                        "mx-auto my-2 h-px w-8",
                        groupActive ? "bg-pbd-blue" : "bg-slate-200",
                      )}
                    />
                  )}

                  {groupOpen && (
                    <div className="space-y-1">
                      {menu.children.map((child) => {
                        const ChildIcon = dashboardMenuIconMap[child.icon];
                        const active = isActiveMenu(pathname, child.href);

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center rounded-md transition-all",
                              collapsed
                                ? "justify-center px-0 py-3"
                                : "gap-3 px-4 py-2.5",
                              active
                                ? "bg-pbd-navy text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-100 hover:text-pbd-navy",
                            )}
                          >
                            <ChildIcon
                              className={cn(collapsed ? "h-6 w-6" : "h-5 w-5")}
                            />

                            {!collapsed && (
                              <span className="text-sm font-medium">
                                {child.title}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActiveMenu(pathname, menu.href);

            return (
              <div key={menu.href}>
                <Link
                  href={menu.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-md transition-all",
                    collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                    active
                      ? "bg-pbd-navy text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-pbd-navy",
                  )}
                >
                  <Icon className={cn(collapsed ? "h-6 w-6" : "h-5 w-5")} />

                  {!collapsed && (
                    <span className="text-sm font-medium">{menu.title}</span>
                  )}
                </Link>
              </div>
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
  const [systemAccess, setSystemAccess] = useState<string[]>([]);

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
          setSystemAccess(result.user?.systemAccess ?? []);
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
            systemAccess={systemAccess}
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
          collapsed ? "w-[88px]" : "w-[288px]",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          role={role}
          systemAccess={systemAccess}
        />
      </aside>
    </>
  );
}
