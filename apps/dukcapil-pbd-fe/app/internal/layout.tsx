import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
