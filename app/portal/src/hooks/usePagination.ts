"use client";

import { useState } from "react";

export const PAGE_SIZES = [10, 20, 30, 40, 50, 100] as const;

export function usePagination(initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return {
    page,
    pageSize,
    setPage,
    setPageSize: changePageSize,
    resetPage: () => setPage(1),
  };
}
