// components/pdf/pdf-toolbar.tsx

"use client";

import { Download, Printer, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PdfSettings } from "@/types/pdf";

/* =========================
   TYPES
========================= */

type Props = {
  zoom: number;

  onZoomChange: (value: number) => void;

  settings: PdfSettings;

  setSettings: (value: PdfSettings) => void;

  onPrint: () => void;

  onDownload: () => void;
};

/* =========================
   COMPONENT
========================= */

export function PdfToolbar({
  zoom,
  onZoomChange,
  settings,
  setSettings,
  onPrint,
  onDownload,
}: Props) {
  return (
    <div
      className="
        sticky top-4 z-20
        rounded-3xl border
        border-slate-200
        bg-white/95
        p-4 sm:p-5
        shadow-sm
        backdrop-blur
      "
    >
      <div
        className="
          grid gap-5
          2xl:grid-cols-[1fr_auto]
          2xl:items-end
        "
      >
        {/* LEFT */}

        <div
          className="
            grid gap-4
            md:grid-cols-[auto_minmax(190px,1fr)_120px_120px_120px]
            xl:grid-cols-[auto_300px_150px_160px_160px]
            xl:items-end
          "
        >
          {/* ZOOM */}

          <div className="flex items-end gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onZoomChange(Math.max(zoom - 10, 50))}
              aria-label="Perkecil preview"
              className="h-11 w-11 rounded-2xl border-slate-200"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <div
              className="
                flex h-11
                min-w-[92px]
                items-center
                justify-center
                rounded-2xl border
                border-slate-200
                bg-slate-50
                px-3
                text-base
                font-semibold
                text-slate-700
              "
            >
              {zoom}%
            </div>

            <Button
              size="icon"
              variant="outline"
              onClick={() => onZoomChange(Math.min(zoom + 10, 200))}
              aria-label="Perbesar preview"
              className="h-11 w-11 rounded-2xl border-slate-200"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* FONT */}

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600">Font</Label>

            <Select
              value={settings.fontFamily}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  fontFamily: value,
                })
              }
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50 px-4">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>

                <SelectItem value="Arial">Arial</SelectItem>

                <SelectItem value="Inter">Inter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* FONT SIZE */}

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600">
              Ukuran Font
            </Label>

            <Input
              type="number"
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              value={settings.fontSize}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  fontSize: Number(e.target.value),
                })
              }
            />
          </div>

          {/* LINE HEIGHT */}

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600">
              Jarak Baris
            </Label>

            <Input
              type="number"
              step="0.1"
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              value={settings.lineHeight}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  lineHeight: Number(e.target.value),
                })
              }
            />
          </div>

          {/* PADDING */}

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600">
              Margin Isi
            </Label>

            <Input
              type="number"
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              value={settings.pagePadding}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  pagePadding: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        {/* RIGHT */}

        <div className="flex flex-col gap-3 sm:flex-row 2xl:justify-end">
          <Button
            variant="outline"
            onClick={onPrint}
            className="h-11 rounded-2xl border-slate-200 px-5"
          >
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>

          <Button
            onClick={onDownload}
            className="h-11 rounded-2xl bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
