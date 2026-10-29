"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "slate" | "indigo";
  loading?: boolean;
  className?: string;
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
  indigo: "bg-indigo-50 text-indigo-700",
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "blue",
  loading = false,
  className,
}: StatCardProps) {
  return (
    <div className={cn("app-surface self-start rounded-lg p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-7 w-28 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <p className="mt-3 text-3xl font-bold leading-none tracking-tight tabular-nums text-pbd-navy">
              {value}
            </p>
          )}
          {description ? (
            <div className="mt-2 text-sm leading-5 text-slate-500">
              {description}
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-current/10",
              toneClasses[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
