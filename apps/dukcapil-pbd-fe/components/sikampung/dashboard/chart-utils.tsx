import type { ReactNode } from "react";

export function formatIdm(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(4);
}

export function formatIdmLabel(value: unknown) {
  return typeof value === "number" ? formatIdm(value) : "";
}

export function getNumberDomain(
  values: Array<number | null | undefined>,
  padding: number,
) {
  const validValues = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  if (validValues.length === 0) {
    return [0, 1] as const;
  }

  const minValue = Math.min(...validValues);
  const maxValue = Math.max(...validValues);

  return [
    Math.max(0, Math.floor((minValue - padding) * 100) / 100),
    Math.min(1, Math.ceil((maxValue + padding) * 100) / 100),
  ] as const;
}

export function ChartPanel({
  title,
  subtitle,
  ariaLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className="flex min-h-[320px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="min-w-0">
        <h3 className="text-sm font-bold leading-5 text-pbd-navy">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="mt-4 min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function ChartEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[248px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold leading-6 text-slate-500">
      {children}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-[248px] animate-pulse rounded-md border border-slate-100 bg-slate-50">
      <div className="flex h-full items-end gap-3 p-5">
        <div className="h-24 flex-1 rounded bg-slate-200" />
        <div className="h-36 flex-1 rounded bg-slate-200" />
        <div className="h-28 flex-1 rounded bg-slate-200" />
      </div>
    </div>
  );
}
