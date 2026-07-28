"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = ComponentPropsWithoutRef<"section"> & {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  ...props
}: SectionCardProps) {
  const hasHeader = title || description || action;

  return (
    <section
      className={cn("app-surface overflow-hidden rounded-lg", className)}
      {...props}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/45 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            {title ? (
              <h2 className="font-bold text-pbd-navy">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          {action ? (
            <div className="w-full min-w-0 lg:w-auto lg:flex-1">{action}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
