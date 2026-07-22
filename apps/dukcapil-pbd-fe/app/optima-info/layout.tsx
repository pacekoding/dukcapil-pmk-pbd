import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function OptimaInfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="optimaInfo">{children}</DashboardShell>;
}
