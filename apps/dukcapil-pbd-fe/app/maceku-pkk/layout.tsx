import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function MacekuPkkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="maceku">{children}</DashboardShell>;
}
