import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function SiberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="sidak">{children}</DashboardShell>;
}
