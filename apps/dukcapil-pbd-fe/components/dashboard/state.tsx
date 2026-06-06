"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center",
        className,
      )}
    >
      <Icon className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-3 font-medium text-slate-700">{title}</p>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function LoadingState({
  rows = 4,
  message,
  className,
}: {
  rows?: number;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {message ? (
        <p className="text-sm font-medium text-slate-500">{message}</p>
      ) : null}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-slate-100" />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700",
        className,
      )}
    >
      {message}
    </div>
  );
}
