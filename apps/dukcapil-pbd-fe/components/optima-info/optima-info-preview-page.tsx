"use client";

import { useEffect, useState } from "react";

import { ErrorState, LoadingState } from "@/components/dashboard/state";
import { getOptimaInfoPreview } from "@/lib/api/optima-info";
import type { OptimaInfoDetail } from "@/types/optima-info";

import { ArticleViewer } from "./article-viewer";

export function OptimaInfoPreviewPage({ articleId }: { articleId: number }) {
  const [article, setArticle] = useState<OptimaInfoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getOptimaInfoPreview(articleId);
        if (mounted) {
          setArticle(data);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Preview informasi gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [articleId]);

  if (loading) {
    return <LoadingState rows={4} message="Memuat preview informasi..." className="p-6" />;
  }
  if (error || !article) {
    return (
      <div className="p-6">
        <ErrorState message={error ?? "Preview informasi tidak tersedia."} />
      </div>
    );
  }
  return (
    <ArticleViewer
      article={article}
      mode="preview"
      backHref={`/optima-info/${articleId}/edit`}
      backLabel="Kembali ke Editor"
    />
  );
}
