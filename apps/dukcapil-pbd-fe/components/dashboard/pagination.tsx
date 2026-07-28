"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/45 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-medium">
        Menampilkan {start}-{end} dari {total} data
      </p>
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-0 flex-1 sm:flex-none"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </Button>
        <span className="min-w-14 shrink-0 text-center font-medium text-slate-700 sm:min-w-20">
          {page}/{totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-0 flex-1 sm:flex-none"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
