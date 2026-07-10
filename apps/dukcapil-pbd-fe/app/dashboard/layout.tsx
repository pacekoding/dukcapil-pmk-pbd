import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="settings">{children}</DashboardShell>;
}
