"use client";

import { Download, FileText, Printer, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PdfPreviewSettings } from "@/types/surat";

type PdfPreviewToolbarProps = {
  settings: PdfPreviewSettings;
  onChange: (settings: PdfPreviewSettings) => void;
  onPrint: () => void;
  onDownload: () => void;
  onSaveTemplate: () => void;
  editHref: string;
};

const paperSizes: PdfPreviewSettings["paperSize"][] = [
  "A4",
  "F4",
  "Legal",
  "Letter",
];

const fontFamilies: PdfPreviewSettings["fontFamily"][] = [
  "Arial",
  "Times New Roman",
  "Calibri",
  "Inter",
  "Roboto Mono",
];

export function PdfPreviewToolbar({
  settings,
  onChange,
  onPrint,
  onDownload,
  onSaveTemplate,
  editHref,
}: PdfPreviewToolbarProps) {
  const update = <K extends keyof PdfPreviewSettings>(
    key: K,
    value: PdfPreviewSettings[K],
  ) => onChange({ ...settings, [key]: value });

  return (
    <aside className="print:hidden lg:sticky lg:top-6">
      <div className="app-surface rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-pbd-navy">Pengaturan Preview</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Sesuaikan tampilan halaman sebelum dicetak.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <ToolbarSelect
            label="Ukuran kertas"
            value={settings.paperSize}
            options={paperSizes}
            onChange={(value) =>
              update("paperSize", value as PdfPreviewSettings["paperSize"])
            }
          />
          <ToolbarSelect
            label="Orientasi"
            value={settings.orientation}
            options={["portrait", "landscape"]}
            optionLabels={{ portrait: "Portrait", landscape: "Landscape" }}
            onChange={(value) =>
              update(
                "orientation",
                value as PdfPreviewSettings["orientation"],
              )
            }
          />
          <ToolbarSelect
            label="Jenis font"
            value={settings.fontFamily}
            options={fontFamilies}
            onChange={(value) =>
              update("fontFamily", value as PdfPreviewSettings["fontFamily"])
            }
          />
          <ToolbarSelect
            label="Ukuran font isi"
            value={String(settings.bodyFontSize)}
            options={["10", "11", "12", "13", "14"]}
            onChange={(value) => update("bodyFontSize", Number(value))}
          />
          <ToolbarSelect
            label="Ukuran font kop"
            value={String(settings.headerFontSize)}
            options={["12", "14", "16", "18"]}
            onChange={(value) => update("headerFontSize", Number(value))}
          />
          <ToolbarSelect
            label="Margin"
            value={settings.margin}
            options={["normal", "sempit", "lebar", "custom"]}
            optionLabels={{
              normal: "Normal",
              sempit: "Sempit",
              lebar: "Lebar",
              custom: "Custom",
            }}
            onChange={(value) =>
              update("margin", value as PdfPreviewSettings["margin"])
            }
          />
          <ToolbarSelect
            label="Line spacing"
            value={String(settings.lineSpacing)}
            options={["1", "1.15", "1.5"]}
            onChange={(value) => update("lineSpacing", Number(value))}
          />

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-pbd-navy">
              Tampilkan Elemen
            </p>
            <ToolbarSwitch
              label="Garis kop"
              checked={settings.showHeaderLine}
              onCheckedChange={(checked) => update("showHeaderLine", checked)}
            />
            <ToolbarSwitch
              label="Area lalu lintas/paraf operator"
              checked={settings.showTrafficSection}
              onCheckedChange={(checked) =>
                update("showTrafficSection", checked)
              }
            />
          </div>

          <div className="grid gap-2">
            <Button type="button" onClick={onDownload}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button type="button" variant="outline" onClick={onPrint}>
              <Printer className="h-4 w-4" />
              Cetak
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={editHref}>
                <RotateCcw className="h-4 w-4" />
                Kembali Edit
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={onSaveTemplate}>
              <Save className="h-4 w-4" />
              Simpan Template
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ToolbarSelect({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-pbd-navy">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {optionLabels?.[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function ToolbarSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
