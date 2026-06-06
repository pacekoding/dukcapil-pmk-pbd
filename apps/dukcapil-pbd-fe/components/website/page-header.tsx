import type { LucideIcon } from "lucide-react";

import { ContentContainer } from "@/components/website/content-container";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <ContentContainer className="py-12 sm:py-16">
        <div className="flex max-w-4xl flex-col gap-5 sm:flex-row sm:items-start">
          {Icon ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
              <Icon className="h-6 w-6" />
            </div>
          ) : null}
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-pbd-blue">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-pbd-navy sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {description}
            </p>
          </div>
        </div>
      </ContentContainer>
    </section>
  );
}

