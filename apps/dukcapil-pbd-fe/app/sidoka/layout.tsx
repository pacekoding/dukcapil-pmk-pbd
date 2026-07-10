import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function SidokaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="sidoka">{children}</DashboardShell>;
}
