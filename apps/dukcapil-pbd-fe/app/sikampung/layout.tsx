import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function SikampungLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="sikampung">{children}</DashboardShell>;
}
