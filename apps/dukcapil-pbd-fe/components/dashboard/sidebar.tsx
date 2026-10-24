// components/dashboard/sidebar.tsx

"use client";

import Image from "next/image";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Building2,
  ChevronDown,
  Database,
  Home,
  IdCard,
  ListChecks,
  MapPinned,
  FileText,
  FolderArchive,
  Globe2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
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
import { canAccessInternalHref } from "@/lib/internal-access";

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
  globe: Globe2,
  listChecks: ListChecks,
  users: UsersRound,
  settings: Settings,
};

function canShowMenuItem(item: { roles?: string[] }, role: string) {
  return !item.roles || item.roles.includes(role);
}

function isMenuGroup(item: DashboardMenuItem): item is DashboardMenuGroup {
  return "children" in item;
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

function getSidebarBrand(pathname: string) {
  if (
    pathname.startsWith("/internal/pmk/bum-kampung") ||
    pathname.startsWith("/internal/sibumkam")
  ) {
    return {
      title: "BUM Kampung",
      subtitle: "Data Badan Usaha Kampung",
    };
  }

  if (
    pathname.startsWith("/internal/pmk/data-kampung") ||
    pathname.startsWith("/internal/sikampung")
  ) {
    return {
      title: "Data Kampung",
      subtitle: "Indeks Desa Membangun",
    };
  }

  if (
    pathname.startsWith("/internal/pmk/kelompok-binaan") ||
    pathname.startsWith("/internal/sitekad")
  ) {
    return {
      title: "Kelompok Binaan",
      subtitle: "Program TEKAD",
    };
  }

  if (pathname.startsWith("/internal/dukcapil")) {
    return {
      title: "Administrasi Kependudukan",
      subtitle: "Data Layanan Dukcapil",
    };
  }

  if (
    pathname.startsWith("/internal/pegawai") ||
    pathname.startsWith("/internal/arsip")
  ) {
    return {
      title: "Pegawai dan Arsip",
      subtitle: "Data Kepegawaian",
    };
  }

  if (
    pathname.startsWith("/internal/perjalanan-dinas") ||
    pathname.startsWith("/internal/pelaksanaan-kegiatan")
  ) {
    return {
      title: "Pelaksanaan Kegiatan",
      subtitle: "Dokumen dan Realisasi Kegiatan",
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
}: {
  collapsed: boolean;

  setCollapsed: (value: boolean) => void;

  onClose?: () => void;

  role: string;
}) {
  const pathname = usePathname();
  const menuItems = internalMenus;
  const brand = getSidebarBrand(pathname);
  const [menuGroupState, setMenuGroupState] = useState(() => ({
    pathname,
    title:
      menuItems.find(
        (menu) =>
          isMenuGroup(menu) &&
          (menu.children.some((child) => isActiveMenu(pathname, child.href)) ||
            Boolean(menu.href && isActiveMenu(pathname, menu.href))),
      )?.title ?? null,
  }));

  const visibleMenus = useMemo(
    () =>
      menuItems
        .map((menu) => {
          if (!canShowMenuItem(menu, role)) {
            return null;
          }

          if (!isMenuGroup(menu)) {
            return canAccessInternalHref(menu.href, role) ? menu : null;
          }

          const children = menu.children.filter(
            (child) =>
              canShowMenuItem(child, role) &&
              canAccessInternalHref(child.href, role),
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
    [menuItems, role],
  );

  const activeHref = useMemo(() => {
    const links = visibleMenus.flatMap((menu) =>
      isMenuGroup(menu) ? menu.children : [menu],
    );

    return (
      links
        .filter((link) => isActiveMenu(pathname, link.href))
        .sort((left, right) => right.href.length - left.href.length)[0]?.href ??
      null
    );
  }, [pathname, visibleMenus]);

  const activeGroupTitle = useMemo(
    () =>
      visibleMenus.find(
        (menu) =>
          isMenuGroup(menu) &&
          (menu.children.some((child) => child.href === activeHref) ||
            Boolean(menu.href && isActiveMenu(pathname, menu.href))),
      )?.title ?? null,
    [activeHref, visibleMenus, pathname],
  );

  const openMenuGroup =
    menuGroupState.pathname === pathname
      ? menuGroupState.title
      : activeGroupTitle;

  const toggleMenuGroup = (title: string) => {
    setMenuGroupState({
      pathname,
      title: openMenuGroup === title ? null : title,
    });
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
            aria-label="Ciutkan sidebar"
            title="Ciutkan sidebar"
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
            aria-label="Perluas sidebar"
            title="Perluas sidebar"
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

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav aria-label="Navigasi internal" className="space-y-3">
          {visibleMenus.map((menu) => {
            const Icon = dashboardMenuIconMap[menu.icon];

            if (isMenuGroup(menu)) {
              const groupActive = menu.title === activeGroupTitle;
              const groupOpen = collapsed || openMenuGroup === menu.title;

              return (
                <div key={menu.title} className="space-y-1">
                  {!collapsed && menu.href ? (
                    <div className="flex items-center rounded-md text-pbd-navy">
                      <Link
                        href={menu.href}
                        onClick={onClose}
                        className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {menu.title}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Buka submenu ${menu.title}`}
                        aria-expanded={groupOpen}
                        onClick={() => toggleMenuGroup(menu.title)}
                        className="p-2"
                      >
                        <ChevronDown
                          className={cn("h-4 w-4", !groupOpen && "-rotate-90")}
                        />
                      </button>
                    </div>
                  ) : !collapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleMenuGroup(menu.title)}
                      aria-expanded={groupOpen}
                      aria-controls={`sidebar-group-${menu.title.toLowerCase()}`}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-slate-100 hover:text-pbd-navy",
                        groupActive ? "text-pbd-navy" : "text-slate-400",
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
                    <div
                      id={`sidebar-group-${menu.title.toLowerCase()}`}
                      className="space-y-1"
                    >
                      {menu.children.map((child) => {
                        const ChildIcon = dashboardMenuIconMap[child.icon];
                        const active = child.href === activeHref;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => {
                              setMenuGroupState({
                                pathname,
                                title: menu.title,
                              });
                              onClose?.();
                            }}
                            aria-current={active ? "page" : undefined}
                            title={collapsed ? child.title : undefined}
                            className={cn(
                              "flex items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/30",
                              collapsed
                                ? "justify-center px-0 py-3"
                                : "gap-3 px-4 py-2.5",
                              active
                                ? "bg-pbd-navy font-semibold text-white shadow-sm"
                                : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-pbd-navy",
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

            const active = menu.href === activeHref;

            return (
              <div key={menu.href}>
                <Link
                  href={menu.href}
                  onClick={() => {
                    setMenuGroupState({ pathname, title: null });
                    onClose?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? menu.title : undefined}
                  className={cn(
                    "flex items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/30",
                    collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                    active
                      ? "bg-pbd-navy font-semibold text-white shadow-sm"
                      : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-pbd-navy",
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
          collapsed ? "w-[88px]" : "w-[288px]",
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
