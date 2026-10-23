import type {
  ApiResponse,
  Member,
  MembersPage,
  MembersQuery,
  TenantRole,
} from "@/types";

export async function getMembers(
  tenantSlug: string,
  query: MembersQuery,
  signal?: AbortSignal,
): Promise<MembersPage> {
  const params = new URLSearchParams({
    tenant: tenantSlug,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search.trim()) params.set("search", query.search.trim());
  if (query.role) params.set("role", query.role);
  const response = await fetch(`/api/members?${params}`, {
    cache: "no-store",
    signal,
  });
  const result = (await response
    .json()
    .catch(() => null)) as ApiResponse<MembersPage> | null;
  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `Could not load members (HTTP ${response.status}).`,
    );
  }
  if (!result.data || !Array.isArray(result.data.members)) {
    throw new Error(
      "The members API returned an outdated response. Restart the API and try again.",
    );
  }
  return result.data;
}

export async function updateMemberRole(
  tenantSlug: string,
  userId: string,
  role: TenantRole,
): Promise<Member> {
  const response = await fetch(
    `/api/members/${encodeURIComponent(userId)}?tenant=${encodeURIComponent(tenantSlug)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  const result = (await response
    .json()
    .catch(() => null)) as ApiResponse<Member> | null;
  if (!response.ok || !result?.success || !result.data) {
    throw new Error(
      result?.message || `Could not update role (HTTP ${response.status}).`,
    );
  }
  return result.data;
}
