"use client";
import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TravelPerson } from "@/types/travel";

export function TravelInput({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-pbd-navy">
      {label}
      {required ? " *" : ""}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        disabled={disabled}
      />
    </label>
  );
}
export function TravelText({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-pbd-navy">
      {label}
      {required ? " *" : ""}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}
export function TravelSelect({
  label,
  value,
  onChange,
  items,
  required = false,
  disabled = false,
  placeholder = "Pilih",
  allowEmpty = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const id = useId();
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-pbd-navy">
        {label}
        {required ? " *" : ""}
      </label>
      <Select
        value={value || undefined}
        onValueChange={(value) => onChange(value === "__empty__" ? "" : value)}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="h-10 min-h-10 w-full min-w-0 overflow-hidden [&_[data-slot=select-value]]:block"
        >
          <SelectValue
            className="min-w-0 flex-1 truncate text-left"
            placeholder={placeholder}
          />
        </SelectTrigger>
        <SelectContent position="popper">
          {allowEmpty ? (
            <SelectItem value="__empty__">Semua / Tidak dipilih</SelectItem>
          ) : null}
          {items.map((item) => (
            <SelectItem value={item.value} key={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function EmployeeSelect({
  label,
  value,
  onChange,
  employees,
  existing = 0,
}: {
  label: string;
  value: number;
  onChange: (id: number) => void;
  employees: TravelPerson[];
  existing?: number;
}) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter(
    (p) =>
      (p.status === "Aktif" || p.id === existing) &&
      (p.id === value ||
        `${p.name} ${p.nip}`.toLowerCase().includes(search.toLowerCase())),
  );
  const person = employees.find((p) => p.id === value);
  return (
    <div className="space-y-3">
      <Input
        aria-label={`Cari ${label}`}
        placeholder="Cari nama atau NIP..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <TravelSelect
        label={label}
        value={value ? String(value) : ""}
        onChange={(id) => onChange(Number(id))}
        required
        items={filtered.map((p) => ({
          value: String(p.id),
          label: `${p.name} · ${p.nip}${p.status !== "Aktif" ? " (Nonaktif)" : ""}`,
        }))}
        placeholder={`Pilih ${label}`}
      />
      {person ? <PersonSummary person={person} /> : null}
    </div>
  );
}
export function PersonSummary({ person }: { person: TravelPerson }) {
  const missing = [
    !person.nip && "NIP",
    !person.rank && "Pangkat/Golongan",
    !person.position && "Jabatan",
  ].filter(Boolean);
  return (
    <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">
      <p className="font-semibold text-pbd-navy">{person.name}</p>
      <p>NIP: {person.nip || "Belum diisi"}</p>
      <p>
        {person.rank || "Pangkat belum diisi"} ·{" "}
        {person.position || "Jabatan belum diisi"}
      </p>
      <p>{[person.bidang, person.unit].filter(Boolean).join(" / ")}</p>
      {missing.length ? (
        <p className="mt-2 text-amber-700">
          Lengkapi {missing.join(", ")} pada master Pegawai sebelum finalisasi.
        </p>
      ) : null}
    </div>
  );
}
export function TravelLines({
  label,
  lines,
  onChange,
}: {
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={index} className="flex items-start gap-2">
          <label className="grid flex-1 gap-2 text-sm font-semibold text-pbd-navy">
            {label} {index + 1} *
            <Textarea
              required
              value={line}
              onChange={(e) =>
                onChange(
                  lines.map((old, i) => (i === index ? e.target.value : old)),
                )
              }
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={lines.length === 1}
            aria-label={`Hapus ${label} ${index + 1}`}
            onClick={() => onChange(lines.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...lines, ""])}
      >
        <Plus className="h-4 w-4" />
        Tambah Poin
      </Button>
    </div>
  );
}
