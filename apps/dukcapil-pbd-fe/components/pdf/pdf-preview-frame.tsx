// components/pdf/pdf-preview-frame.tsx

"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PdfPreviewFrame({ children }: Props) {
  return (
    <div
      className="
        overflow-auto
        rounded-3xl
        border
        border-slate-200
        bg-slate-300
        p-10
      "
    >
      {/* PAPER */}

      <div
        className="
          mx-auto
          w-[210mm]
          min-h-[297mm]
          bg-white
          shadow-[0_10px_40px_rgba(0,0,0,0.12)]
        "
      >
        {children}
      </div>
    </div>
  );
}
