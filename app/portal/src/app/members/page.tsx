import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "../actions";
import { TenantSwitcher } from "../dashboard/tenant-switcher";
import { getCurrentUser } from "@/lib/api";
import { MembersList } from "./members-list";
import MembersLoading from "./loading";

export const metadata: Metadata = { title: "Members · Tenant Portal" };

export default function MembersPage({ searchParams }: PageProps<"/members">) {
  return (
    <Suspense fallback={<MembersLoading />}>
      <MembersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MembersContent({
  searchParams,
}: Pick<PageProps<"/members">, "searchParams">) {
  const [user, { tenant: slug }] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);
  const tenant = slug
    ? user.tenants.find((item) => item.slug === slug)
    : user.tenants[0];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              Tenant Portal
            </Link>
            {tenant && (
              <TenantSwitcher
                tenants={user.tenants}
                activeSlug={tenant.slug}
                path="/members"
              />
            )}
          </div>
          <form action={logout}>
            <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Link
          href={`/dashboard${tenant ? `?tenant=${encodeURIComponent(tenant.slug)}` : ""}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {tenant ? `${tenant.name} members` : "Members"}
        </h1>
        {tenant ? (
          <MembersList
            key={tenant.slug}
            tenantSlug={tenant.slug}
            currentUserId={user.id}
            canEditRoles={tenant.role === "ADMIN"}
          />
        ) : (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            {slug
              ? "You cannot access this organization."
              : "You do not belong to an organization yet."}
          </p>
        )}
      </main>
    </div>
  );
}
