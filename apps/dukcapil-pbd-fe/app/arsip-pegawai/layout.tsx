import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function ArsipPegawaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="arsip">{children}</DashboardShell>;
}
