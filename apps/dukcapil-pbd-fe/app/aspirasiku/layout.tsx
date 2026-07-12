import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AspirasikuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="aspirasiku">{children}</DashboardShell>;
}
