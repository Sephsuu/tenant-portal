"use client";

import { AppButton } from "./AppButton";

export function AppPagination({
  page,
  totalPages,
  total,
  onPageChange,
  label = "Pages",
  itemName = "items",
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
  itemName?: string;
  disabled?: boolean;
}) {
  if (totalPages <= 1 && page <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <span className="text-zinc-500">
        Page {page} of {totalPages} · {total} {itemName}
      </span>
      <div className="flex gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </AppButton>
      </div>
    </nav>
  );
}
