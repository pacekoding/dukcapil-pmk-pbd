"use client";

import { useEffect, type ReactNode } from "react";

import {
  AppBreadcrumb,
  type AppBreadcrumbItem,
} from "@/components/dashboard/app-breadcrumb";
import { cn } from "@/lib/utils";

export function CrudPage({
  breadcrumbs,
  title,
  description,
  actions,
  children,
  width = "max-w-6xl",
}: {
  breadcrumbs: AppBreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  width?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-none";
}) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Portal Dukcapil PMK`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <main className={cn("mx-auto w-full space-y-6", width)}>
      <AppBreadcrumb items={breadcrumbs} />
      <header className="app-surface flex flex-col gap-4 rounded-lg p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-pbd-navy sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

export function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-pbd-navy">
            {item.value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
