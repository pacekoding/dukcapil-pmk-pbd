"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RadiogramBlock } from "@/types/surat";

const defaultCodes = ["AAA", "BBB", "CCC", "DDD", "EEE"];

type RadiogramContentBlocksProps = {
  value: RadiogramBlock[];
  onChange: (value: RadiogramBlock[]) => void;
};

export function RadiogramContentBlocks({
  value,
  onChange,
}: RadiogramContentBlocksProps) {
  const addBlock = () => {
    const nextCode = defaultCodes[value.length] ?? `BLOK-${value.length + 1}`;
    onChange([
      ...value,
      {
        id: `blk-${Date.now()}`,
        kode: nextCode,
        isi: "",
      },
    ]);
  };

  const updateBlock = (
    id: string,
    field: keyof RadiogramBlock,
    nextValue: string,
  ) => {
    onChange(
      value.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: nextValue.toUpperCase(),
            }
          : item,
      ),
    );
  };

  const removeBlock = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.length) {
      return;
    }

    const nextValue = [...value];
    const [item] = nextValue.splice(index, 1);
    nextValue.splice(targetIndex, 0, item);
    onChange(nextValue);
  };

  return (
    <div className="space-y-4">
      {value.map((block, index) => (
        <div
          key={block.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="grid gap-3 lg:grid-cols-[110px_1fr_auto] lg:items-start">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Kode
              </label>
              <Input
                value={block.kode}
                onChange={(event) =>
                  updateBlock(block.id, "kode", event.target.value)
                }
                className="mt-2 font-bold tracking-wide"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Isi Berita
              </label>
              <Textarea
                value={block.isi}
                onChange={(event) =>
                  updateBlock(block.id, "isi", event.target.value)
                }
                className="mt-2 min-h-28 rounded-lg bg-white uppercase leading-6"
                placeholder={`${block.kode} TTK ISI BERITA TTK`}
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Preview: {block.kode || "AAA"} TTK {block.isi || "..."} TTK
              </p>
            </div>
            <div className="flex gap-2 lg:pt-7">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                title="Naikkan urutan"
                disabled={index === 0}
                onClick={() => moveBlock(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                title="Turunkan urutan"
                disabled={index === value.length - 1}
                onClick={() => moveBlock(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="destructive"
                title="Hapus blok"
                disabled={value.length === 1}
                onClick={() => removeBlock(block.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addBlock}>
        <Plus className="h-4 w-4" />
        Tambah Blok
      </Button>
    </div>
  );
}
