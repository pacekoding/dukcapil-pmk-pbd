// components/pdf/pdf-page.tsx

import { ReactNode } from "react";

/* =========================
   TYPES
========================= */

type Props = {
  children: ReactNode;

  pageNumber: number;

  totalPages: number;

  documentTitle?: string;

  generatedAt?: string;

  className?: string;
};

/* =========================
   COMPONENT
========================= */

export function PdfPage({
  children,

  pageNumber,

  totalPages,

  documentTitle = "Dokumen",

  generatedAt,

  className = "",
}: Props) {
  return (
    <section
      className={`
        relative
        mx-auto
        mb-10
        flex
        min-h-[297mm]
        w-[210mm]
        flex-col
        overflow-hidden
        bg-white
        shadow-[0_10px_30px_rgba(0,0,0,0.08)]
        print:mb-0
        print:shadow-none
        ${className}
      `}
      style={{
        pageBreakAfter: "always",

        breakAfter: "page",
      }}
    >
      {/* =========================
          CONTENT
      ========================= */}

      <div className="flex-1">{children}</div>

      {/* =========================
          FOOTER
      ========================= */}

      <footer
        className="
          mt-auto
          border-t
          border-slate-300
          px-10
          py-4
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            text-[11px]
            text-slate-500
          "
        >
          {/* LEFT */}

          <div>{documentTitle}</div>

          {/* CENTER */}

          <div>
            Page {pageNumber} of {totalPages}
          </div>

          {/* RIGHT */}

          <div>Generated: {generatedAt}</div>
        </div>
      </footer>
    </section>
  );
}
