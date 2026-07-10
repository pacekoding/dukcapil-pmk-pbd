import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function SibumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="sibum">{children}</DashboardShell>;
}
