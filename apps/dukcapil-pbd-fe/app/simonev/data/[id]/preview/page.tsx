import { MonitoringPreviewPage } from "@/components/simonev/monitoring-preview-page";

type SimonevMonitoringPreviewRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SimonevMonitoringPreviewRoute({
  params,
}: SimonevMonitoringPreviewRouteProps) {
  const { id } = await params;
  return <MonitoringPreviewPage recordId={id} />;
}
