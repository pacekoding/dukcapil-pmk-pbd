"use client";

import { useEffect, useState } from "react";

import { ErrorState, LoadingState } from "@/components/dashboard/state";
import { Breadcrumb } from "@/components/website/breadcrumb";
import { getWebsiteInformasiDetail } from "@/lib/api/optima-info";
import type { OptimaInfoDetail } from "@/types/optima-info";

import { ArticleViewer } from "./article-viewer";

export function OptimaInfoPublicDetailPage({ slug }: { slug: string }) {
  const [article, setArticle] = useState<OptimaInfoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getWebsiteInformasiDetail(slug);
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
              : "Detail informasi gagal dimuat.",
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
  }, [slug]);

  if (loading) {
    return <LoadingState rows={4} message="Memuat detail informasi..." className="p-6" />;
  }

  if (error || !article) {
    return (
      <div className="bg-slate-50 p-6">
        <ErrorState message={error ?? "Informasi tidak tersedia."} />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Informasi", href: "/informasi" },
          { label: article.title || "Detail Informasi" },
        ]}
      />
      <ArticleViewer article={article} backHref="/informasi" backLabel="Kembali ke Daftar Informasi" />
    </>
  );
}
