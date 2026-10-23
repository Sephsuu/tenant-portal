import type { TenantRole } from "./api";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  status: "ACTIVE" | "INACTIVE";
};

export async function getMembers(
  tenantSlug: string,
  signal?: AbortSignal,
): Promise<Member[]> {
  const response = await fetch(
    `/api/members?tenant=${encodeURIComponent(tenantSlug)}`,
    { cache: "no-store", signal },
  );
  const result = (await response.json()) as {
    success: boolean;
    message: string;
    data: Member[] | null;
  };
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load members.");
  }
  if (!Array.isArray(result.data)) {
    throw new Error("The members response was incomplete.");
  }
  return result.data;
}
