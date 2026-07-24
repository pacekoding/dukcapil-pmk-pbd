import { OptimaInfoPublicDetailPage } from "@/components/optima-info/optima-info-public-detail-page";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <OptimaInfoPublicDetailPage slug={slug} />;
}
