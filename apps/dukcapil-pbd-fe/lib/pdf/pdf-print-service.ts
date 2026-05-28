// lib/pdf/pdf-print-service.ts

type PrintPdfOptions = {
  documentTitle?: string;

  pageSize?: "A4" | "Letter";

  margin?: string;
};

export function printPdf(
  elementId: string,

  options?: PrintPdfOptions,
) {
  /* =========================
     ELEMENT
  ========================= */

  const content =
    document.getElementById(
      elementId,
    );

  if (!content) {
    console.error(
      `Element with id "${elementId}" not found`,
    );

    return;
  }

  /* =========================
     OPTIONS
  ========================= */

  const {
    documentTitle =
      "Document Preview",

    pageSize = "A4",

    margin = "12mm",
  } = options || {};

  /* =========================
     CREATE IFRAME
  ========================= */

  const iframe =
    document.createElement(
      "iframe",
    );

  iframe.style.position =
    "fixed";

  iframe.style.right = "0";

  iframe.style.bottom = "0";

  iframe.style.width = "0";

  iframe.style.height = "0";

  iframe.style.border = "0";

  iframe.style.opacity = "0";

  document.body.appendChild(
    iframe,
  );

  /* =========================
     WINDOW
  ========================= */

  const iframeWindow =
    iframe.contentWindow;

  const iframeDocument =
    iframeWindow?.document;

  if (
    !iframeWindow ||
    !iframeDocument
  ) {
    console.error(
      "Unable to access iframe document",
    );

    return;
  }

  /* =========================
     CLONE CONTENT
  ========================= */

  const clonedContent =
    content.cloneNode(
      true,
    ) as HTMLElement;

  /* =========================
     WRITE HTML
  ========================= */

  iframeDocument.open();

  iframeDocument.write(`
    <!DOCTYPE html>

    <html lang="id">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${documentTitle}</title>

        <style>
          * {
            box-sizing: border-box;

            -webkit-print-color-adjust: exact !important;

            print-color-adjust: exact !important;
          }

          html,
          body {
            margin: 0;
            padding: 0;

            background: #ffffff;
          }

          body {
            font-family:
              "Times New Roman",
              serif;

            font-size: 15px;

            line-height: 1.7;

            color: #000000;
          }

          @page {
            size: ${pageSize};

            margin: ${margin};
          }

          #print-root {
            width: 210mm;

            min-height: 297mm;

            margin: 0 auto;

            background: white;
          }

          /* =========================
             TYPOGRAPHY
          ========================= */

          h1 {
            margin: 0;

            font-size: 28px;

            font-weight: 700;

            text-align: center;

            text-transform: uppercase;
          }

          h2 {
            margin-top: 14px;

            margin-bottom: 70px;

            font-size: 22px;

            font-weight: 700;

            text-align: center;
          }

          h3 {
            margin-top: 42px;

            margin-bottom: 16px;

            font-size: 18px;

            font-weight: 700;

            text-transform: uppercase;
          }

          p {
            margin: 0 0 14px;
          }

          ul {
            margin: 0;

            padding-left: 26px;
          }

          li {
            margin-bottom: 8px;
          }

          /* =========================
             INFO ROW
          ========================= */

          .info-row {
            display: flex;

            align-items: flex-start;

            gap: 16px;

            margin-bottom: 10px;
          }

          .info-label {
            width: 290px;

            flex-shrink: 0;
          }

          .info-separator {
            width: 10px;

            flex-shrink: 0;
          }

          .info-value {
            flex: 1;
          }

          /* =========================
             TABLE
          ========================= */

          table {
            width: 100%;

            border-collapse: collapse;

            margin-top: 20px;
          }

          th,
          td {
            border: 1px solid #000000;

            padding: 10px;

            vertical-align: top;

            text-align: left;
          }

          th {
            background: #f1f5f9;

            font-weight: 700;
          }

          tr,
          td,
          th {
            page-break-inside: avoid;
          }

          /* =========================
             SIGNATURE
          ========================= */

          .signature-section {
            margin-top: 120px;

            display: flex;

            justify-content: flex-end;
          }

          .signature-box {
            width: 300px;

            text-align: center;
          }

          .signature-space {
            height: 90px;
          }

          /* =========================
             HELPERS
          ========================= */

          .break-inside-avoid {
            break-inside: avoid;
          }

          .text-center {
            text-align: center;
          }

          .font-bold {
            font-weight: 700;
          }

          .underline {
            text-decoration: underline;
          }
        </style>
      </head>

      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);

  iframeDocument.close();

  /* =========================
     APPEND CONTENT
  ========================= */

  const printRoot =
    iframeDocument.getElementById(
      "print-root",
    );

  if (printRoot) {
    printRoot.appendChild(
      clonedContent,
    );
  }

  /* =========================
     WAIT LOAD
  ========================= */

  iframe.onload = () => {
    iframeWindow.focus();

    setTimeout(() => {
      iframeWindow.print();

      /* =========================
         CLEANUP
      ========================= */

      setTimeout(() => {
        document.body.removeChild(
          iframe,
        );
      }, 1000);
    }, 500);
  };
}