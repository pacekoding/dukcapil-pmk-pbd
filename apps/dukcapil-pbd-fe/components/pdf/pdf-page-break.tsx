// components/pdf/pdf-page-break.tsx

export function PdfPageBreak() {
  return (
    <div
      style={{
        pageBreakAfter: "always",

        breakAfter: "page",
      }}
    />
  );
}
