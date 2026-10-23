"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { ApiResponse, CurrentUser, Member } from "@/types";

export type RoleActionState = { success: boolean; message?: string };

export async function updateMemberRole(
  tenantSlug: string,
  userId: string,
  _previousState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const role = formData.get("role");
  if (role !== "ADMIN" && role !== "MEMBER") {
    return { success: false, message: "Choose Admin or Member." };
  }

  const token = await getSessionToken();
  if (!token) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again.",
    };
  }

  let userResponse: Response;
  try {
    userResponse = await apiFetch("/auth/me", { token, cache: "no-store" });
  } catch {
    return { success: false, message: "Could not reach the API. Please try again." };
  }
  if (userResponse.status === 401) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again.",
    };
  }
  if (!userResponse.ok) {
    return { success: false, message: "Could not check your organizations." };
  }

  const user = (await userResponse.json().catch(() => null)) as CurrentUser | null;
  if (!user || !Array.isArray(user.tenants)) {
    return { success: false, message: "Could not check your organizations." };
  }
  const tenant = user.tenants.find((item) => item.slug === tenantSlug);
  if (!tenant) {
    return { success: false, message: "You do not belong to this organization." };
  }

  let response: Response;
  try {
    response = await apiFetch(`/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
      token,
      tenantId: tenant.id,
      cache: "no-store",
    });
  } catch {
    return { success: false, message: "Could not reach the API. Please try again." };
  }

  const result = (await response
    .json()
    .catch(() => null)) as ApiResponse<Member> | null;
  if (!response.ok || !result?.success || !result.data) {
    return {
      success: false,
      message: result?.message || `Could not update role (HTTP ${response.status}).`,
    };
  }

  revalidatePath("/members");
  return { success: true, message: `${result.data.name}'s role was updated.` };
}
