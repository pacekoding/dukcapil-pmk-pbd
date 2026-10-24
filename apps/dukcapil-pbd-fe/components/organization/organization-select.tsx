"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationItem } from "@/types/organization";

type Props = {
  label: string;
  value: number | null;
  items: OrganizationItem[];
  onChange: (value: number | null) => void;
  disabled?: boolean;
  required?: boolean;
  emptyLabel?: string;
};

export function OrganizationSelect({
  label,
  value,
  items,
  onChange,
  disabled,
  required,
  emptyLabel = "Tanpa seksi (langsung di bawah bidang)",
}: Props) {
  const id = `organization-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-bold text-pbd-navy">
        {label}
        {required ? " *" : ""}
      </label>
      <Select
        value={value === null ? "none" : String(value)}
        onValueChange={(next) =>
          onChange(next === "none" ? null : Number(next))
        }
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue placeholder={`Pilih ${label}`} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="none" disabled={required}>
            {required ? `Pilih ${label}` : emptyLabel}
          </SelectItem>
          {items.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
              {item.name}
              {!item.isActive ? " (Nonaktif)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
