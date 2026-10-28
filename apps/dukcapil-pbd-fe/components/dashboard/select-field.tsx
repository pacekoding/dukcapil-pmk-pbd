"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectField({
  label,
  value,
  onChange,
  items,
  required = false,
  disabled = false,
  placeholder = "Pilih",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-pbd-navy">
        {label}{required ? " *" : ""}
      </label>
      <Select value={value || undefined} onValueChange={onChange} required={required} disabled={disabled}>
        <SelectTrigger id={id} className="h-10 min-h-10 w-full min-w-0 overflow-hidden">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          {items.map((item) => <SelectItem value={item.value} key={item.value}>{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
