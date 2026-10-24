import type { LucideIcon } from "lucide-react";

type IconCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

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
