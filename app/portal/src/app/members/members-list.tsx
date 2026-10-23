"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppBadge } from "@/components/AppBadge";
import { AppButton } from "@/components/AppButton";
import { AppDropdown } from "@/components/AppDropdown";
import { AppInput } from "@/components/AppInput";
import { AppPagination } from "@/components/AppPagination";
import { AppSelect } from "@/components/AppSelect";
import { AppSkeleton } from "@/components/AppSkeleton";
import { AppToaster } from "@/components/AppToaster";
import type { MemberRoleFilter, MembersPage, MembersQuery } from "@/types";
import { MemberDialog } from "./member-dialog";

export function MembersList({
  tenantSlug,
  currentUserId,
  canEditRoles,
  query,
  result,
  error,
}: {
  tenantSlug: string;
  currentUserId: string;
  canEditRoles: boolean;
  query: MembersQuery;
  result: MembersPage | null;
  error: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [searchState, setSearchState] = useState({
    draft: query.search,
    urlSearch: query.search,
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [panel, setPanel] = useState<{
    id: string;
    mode: "details" | "role";
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  if (searchState.urlSearch !== query.search) {
    setSearchState({
      urlSearch: query.search,
      draft:
        searchState.draft === searchState.urlSearch ||
        searchState.draft === query.search
          ? query.search
          : searchState.draft,
    });
  }
  const search = searchState.draft;
  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  function navigate(next: Partial<MembersQuery>, replace = false) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setPanel(null);
    const selected = { ...query, search, ...next };
    const params = new URLSearchParams({
      tenant: tenantSlug,
      page: String(selected.page),
      pageSize: String(selected.pageSize),
    });
    if (selected.search.trim()) params.set("search", selected.search.trim());
    if (selected.role) params.set("role", selected.role);
    startTransition(() => {
      if (replace) router.replace(`/members?${params}`);
      else router.push(`/members?${params}`);
    });
  }

  function changeSearch(nextSearch: string) {
    setSearchState((current) => ({ ...current, draft: nextSearch }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => navigate({ search: nextSearch, page: 1 }, true),
      300,
    );
  }

  const controls = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_9rem]">
      <AppInput
        type="search"
        label="Search name or email"
        placeholder="Search name or email"
        value={search}
        maxLength={100}
        onChange={(event) => changeSearch(event.target.value)}
      />
      <AppSelect
        label="Role"
        value={query.role}
        onChange={(event) =>
          navigate({ role: event.target.value as MemberRoleFilter, page: 1 })
        }
      >
        <option value="">All roles</option>
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
      </AppSelect>
      <AppSelect
        label="Page size"
        value={query.pageSize}
        onChange={(event) => navigate({ pageSize: Number(event.target.value), page: 1 })}
      >
        {[10, 20, 30, 40, 50, 100].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </AppSelect>
    </div>
  );

  if (error && !pending) {
    return (
      <div className="mt-6 space-y-4">
        {controls}
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-900"
        >
          <p className="font-medium">Could not load members</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {error}
          </p>
          <AppButton
            onClick={() => {
              startTransition(() => router.refresh());
            }}
            loading={pending}
            className="mt-4"
          >
            Try again
          </AppButton>
        </div>
      </div>
    );
  }

  if (result === null || pending) {
    return (
      <div className="mt-6 space-y-4">
        {controls}
        <div role="status" className="space-y-3">
          <span className="sr-only">Loading members…</span>
          <AppSkeleton variant="block" height="3rem" />
          <AppSkeleton variant="block" height="12rem" />
        </div>
      </div>
    );
  }

  const selectedMember = panel
    ? result.members.find((member) => member.id === panel.id)
    : undefined;

  return (
    <div className="mt-6 space-y-4">
      {controls}
      <p className="text-sm text-zinc-500">
        {result.total} members · {result.pageSize} per page
      </p>
      {result.members.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium">
            {result.total === 0
              ? search.trim() || query.role
                ? "No matching members"
                : "No members yet"
              : "No members on this page"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {result.total === 0
              ? search.trim() || query.role
                ? "Try another search or role."
                : "This organization has no members to show."
              : "Go to an earlier page to see members."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[600px] text-left text-sm">
            <caption className="sr-only">Members of this organization</caption>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Email
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Role
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Account status
                </th>
                <th
                  scope="col"
                  className="w-14 px-2 py-3 text-center font-medium"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {result.members.map((member) => (
                <tr key={member.id}>
                  <td className="px-5 py-4 font-medium">{member.name}</td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                    {member.email}
                  </td>
                  <td className="px-5 py-4">
                    {member.role === "ADMIN" ? "Admin" : "Member"}
                  </td>
                  <td className="px-5 py-4">
                    <AppBadge
                      variant={
                        member.status === "ACTIVE" ? "success" : "neutral"
                      }
                    >
                      {member.status === "ACTIVE" ? "Active" : "Inactive"}
                    </AppBadge>
                  </td>
                  <td className="w-14 px-2 py-4 text-center align-top">
                    <AppDropdown
                      label=""
                      ariaLabel={`Actions for ${member.name}`}
                      disabled={pending}
                      items={[
                        {
                          label: "View Details",
                          onSelect: () => {
                            setPanel({ id: member.id, mode: "details" });
                          },
                        },
                        {
                          label: "Update Role",
                          disabled:
                            !canEditRoles || member.id === currentUserId,
                          title: !canEditRoles
                            ? "Only organization admins can update roles."
                            : member.id === currentUserId
                              ? "You cannot change your own role."
                              : undefined,
                          onSelect: () => {
                            setPanel({ id: member.id, mode: "role" });
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <MemberDialog
        key={`${panel?.id ?? "closed"}-${panel?.mode ?? "none"}`}
        member={selectedMember}
        mode={panel?.mode}
        tenantSlug={tenantSlug}
        onClose={() => setPanel(null)}
        onSuccess={(message) => {
          setPanel(null);
          setToast({ message, variant: "success" });
          startTransition(() => router.refresh());
        }}
      />
      <AppPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        onPageChange={(page) => navigate({ page })}
        label="Member pages"
        itemName="members"
        disabled={pending}
      />
      <AppToaster
        message={toast?.message ?? null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
