"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type DashboardBreadcrumbItem = {
  label: string;
  href?: string;
};

export function DashboardBreadcrumb({
  items,
}: {
  items: DashboardBreadcrumbItem[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
      <Link href="/dashboard" className="font-medium text-slate-500 hover:text-pbd-navy">
        Dashboard
      </Link>
      {items.map((item) => (
        <span key={`${item.label}-${item.href ?? "current"}`} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-slate-300" />
          {item.href ? (
            <Link href={item.href} className="font-medium text-slate-500 hover:text-pbd-navy">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-pbd-navy">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
