import type { ApiResponse, MembersPage } from "@/types";

export async function getMembers(
  tenantSlug: string,
  page: number,
  signal?: AbortSignal,
): Promise<MembersPage> {
  const response = await fetch(
    `/api/members?tenant=${encodeURIComponent(tenantSlug)}&page=${page}`,
    { cache: "no-store", signal },
  );
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
