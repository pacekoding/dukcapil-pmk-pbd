import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function SimonevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="simonev">{children}</DashboardShell>;
}
