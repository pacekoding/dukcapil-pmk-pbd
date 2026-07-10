import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type PageHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  aside?: ReactNode;
};

export function PageHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  meta,
  aside,
}: PageHeroProps) {
  return (
    <section className="app-surface overflow-hidden rounded-lg p-5 lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-pbd-blue">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-pbd-navy sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
            {meta ? <div className="mt-3">{meta}</div> : null}
          </div>
        </div>

        {aside ? <div className="shrink-0 lg:pt-1">{aside}</div> : null}
      </div>
    </section>
  );
}
