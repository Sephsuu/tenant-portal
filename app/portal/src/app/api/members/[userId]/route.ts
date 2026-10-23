import { NextRequest } from "next/server";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { CurrentUser } from "@/types";

function failure(status: number, message: string, error: string) {
  return Response.json(
    { success: false, message, error, data: null },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const token = await getSessionToken();
  if (!token) {
    return failure(401, "Your session has expired. Please sign in again.", "UNAUTHORIZED");
  }

  const slug = request.nextUrl.searchParams.get("tenant");
  if (!slug) return failure(400, "Choose an organization.", "BAD_REQUEST");

  try {
    const userResponse = await apiFetch("/auth/me", { token, cache: "no-store" });
    if (userResponse.status === 401) {
      return failure(401, "Your session has expired. Please sign in again.", "UNAUTHORIZED");
    }
    if (!userResponse.ok) {
      return failure(502, "Could not check your organizations.", "BAD_GATEWAY");
    }

    const user = (await userResponse.json()) as CurrentUser;
    const tenant = user.tenants.find((item) => item.slug === slug);
    if (!tenant) {
      return failure(403, "You do not belong to this organization.", "FORBIDDEN");
    }

    const { userId } = await context.params;
    const body = await request.text();
    const response = await apiFetch(`/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body,
      token,
      tenantId: tenant.id,
      cache: "no-store",
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return failure(502, "Could not reach the API. Please try again.", "BAD_GATEWAY");
  }
}
