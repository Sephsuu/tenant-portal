"use client";

import { useState } from "react";
import type { MemberRoleFilter } from "@/types";

export function useSearchFilter() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("");

  return {
    search,
    roleFilter,
    setSearch,
    setRoleFilter,
  };
}
