import type { Metadata } from "next";

import { OptimaInfoPreviewPage } from "@/components/optima-info/optima-info-preview-page";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <OptimaInfoPreviewPage articleId={Number(id)} />;
}
