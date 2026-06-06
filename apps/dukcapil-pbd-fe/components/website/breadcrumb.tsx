import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import { ContentContainer } from "@/components/website/content-container";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white">
      <ContentContainer className="py-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-pbd-blue"
            >
              <Home className="h-4 w-4" />
              Beranda
            </Link>
          </li>
          {items.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-slate-400" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="font-medium text-slate-600 hover:text-pbd-blue"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-pbd-navy">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </ContentContainer>
    </nav>
  );
}

