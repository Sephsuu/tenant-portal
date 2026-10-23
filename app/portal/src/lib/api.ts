import "server-only";
import { redirect } from "next/navigation";
import type { CurrentUser } from "@/types";
import { getSessionToken } from "./session";

export type { CurrentUser, Tenant, TenantRole } from "@/types";

export const API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

/**
 * Calls the API as the signed-in user. Pass `tenantId` for tenant-scoped
 * endpoints: it's sent as `x-tenant-id`, which the API uses as the active tenant.
 */
export async function apiFetch(
  path: string,
  {
    token,
    tenantId,
    ...init
  }: RequestInit & { token: string; tenantId?: string },
) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (tenantId) {
    headers.set("x-tenant-id", tenantId);
  }
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    redirect("/login");
  }
  if (!response.ok) {
    throw new Error(`Failed to load the current user (${response.status})`);
  }
  return response.json();
}
