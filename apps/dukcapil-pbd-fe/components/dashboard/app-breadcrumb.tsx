import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

export type AppBreadcrumbItem = {
  label: string;
  href?: string;
};

export function AppBreadcrumb({
  items,
  className,
}: {
  items: AppBreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-slate-500">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : null}
              {item.href && !current ? (
                <Link
                  href={item.href}
                  className="inline-flex min-w-0 items-center gap-1.5 rounded-sm font-medium hover:text-pbd-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/40"
                >
                  {index === 0 ? <Home aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : null}
                  <span className="max-w-56 truncate sm:max-w-none">{item.label}</span>
                </Link>
              ) : (
                <span
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "max-w-64 truncate",
                    current && "font-semibold text-pbd-navy",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
