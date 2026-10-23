import "server-only";
import { apiFetch } from "./api";
import { getSessionToken } from "./session";
import type { ApiResponse, MembersPage, MembersQuery } from "@/types";

export async function getMembers(
  tenantId: string,
  query: MembersQuery,
): Promise<MembersPage> {
  const token = await getSessionToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search.trim()) params.set("search", query.search.trim());
  if (query.role) params.set("role", query.role);
  let response: Response;
  try {
    response = await apiFetch(`/members?${params}`, {
      token,
      tenantId,
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not reach the API. Please try again.");
  }
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
