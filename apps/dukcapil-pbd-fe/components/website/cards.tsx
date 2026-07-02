import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarDays, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  label?: string;
  className?: string;
};

export function QuickAccessCard({
  title,
  description,
  icon: Icon,
  href,
  label = "Buka",
  className,
}: IconCardProps) {
  const content = (
    <div
      className={cn(
        "group h-full rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,35,80,0.06)] transition hover:-translate-y-0.5 hover:border-pbd-blue/40 hover:shadow-[0_18px_40px_rgba(15,35,80,0.1)]",
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-bold text-pbd-navy">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pbd-blue">
        {label}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function ServiceCard({
  title,
  description,
  icon: Icon,
}: IconCardProps) {
  return (
    <article className="h-full rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,35,80,0.06)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-pbd-navy text-white shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-pbd-navy">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}

export function DataStatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,35,80,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-pbd-navy">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function NewsCard({
  title,
  excerpt,
  date,
  href,
}: {
  title: string;
  excerpt: string;
  date: string;
  href: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,35,80,0.06)]">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <CalendarDays className="h-4 w-4" />
        {date}
      </p>
      <h3 className="mt-4 text-lg font-bold leading-7 text-pbd-navy">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{excerpt}</p>
      <Button asChild variant="link" className="mt-3 h-auto p-0 text-pbd-blue">
        <Link href={href}>
          Baca selengkapnya
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}

export function AnnouncementCard({
  title,
  description,
  date,
}: {
  title: string;
  description: string;
  date: string;
}) {
  return (
    <article className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
        {date}
      </p>
      <h3 className="mt-3 font-bold text-pbd-navy">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </article>
  );
}

export function DocumentCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <article className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,35,80,0.06)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-pbd-navy">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-pbd-navy">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {href ? (
          <Button asChild variant="link" className="mt-2 h-auto p-0 text-pbd-blue">
            <Link href={href}>Unduh dokumen</Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function ContactCard({
  title,
  content,
  icon: Icon,
}: {
  title: string;
  content: string;
  icon: LucideIcon;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,35,80,0.06)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-bold text-pbd-navy">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{content}</p>
    </div>
  );
}
