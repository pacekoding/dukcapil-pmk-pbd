import { OptimaInfoEditorPage } from "@/components/optima-info/optima-info-editor-page";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <OptimaInfoEditorPage articleId={Number(id)} />;
}
