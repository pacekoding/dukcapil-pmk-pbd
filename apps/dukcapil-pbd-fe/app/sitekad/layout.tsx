import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function SitekadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell theme="sitekad">{children}</DashboardShell>;
}
