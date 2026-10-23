"use client";

import { useEffect, useState } from "react";
import { AppBadge } from "@/components/AppBadge";
import { AppButton } from "@/components/AppButton";
import { AppDialog } from "@/components/AppDialog";
import { AppDropdown } from "@/components/AppDropdown";
import { AppInput } from "@/components/AppInput";
import { AppPagination } from "@/components/AppPagination";
import { AppSelect } from "@/components/AppSelect";
import { AppSkeleton } from "@/components/AppSkeleton";
import { AppToaster } from "@/components/AppToaster";
import { PAGE_SIZES, usePagination } from "@/hooks/usePagination";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { getMembers, updateMemberRole } from "@/lib/members";
import type { MemberRoleFilter, MembersPage, TenantRole } from "@/types";

export function MembersList({
  tenantSlug,
  currentUserId,
  canEditRoles,
}: {
  tenantSlug: string;
  currentUserId: string;
  canEditRoles: boolean;
}) {
  const [result, setResult] = useState<MembersPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { page, pageSize, setPage, setPageSize, resetPage } = usePagination();
  const { search, roleFilter, setSearch, setRoleFilter } = useSearchFilter();
  const [attempt, setAttempt] = useState(0);
  const [panel, setPanel] = useState<{
    id: string;
    mode: "details" | "role";
  } | null>(null);
  const [role, setRole] = useState<TenantRole>("MEMBER");
  const [saving, setSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMembers(
      tenantSlug,
      { page, pageSize, search, role: roleFilter },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult(data);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load members.",
          );
        }
      });
    return () => controller.abort();
  }, [tenantSlug, page, pageSize, search, roleFilter, attempt]);

  function startNewQuery() {
    setResult(null);
    setError(null);
    setPanel(null);
  }

  function changePage(nextPage: number) {
    startNewQuery();
    setPage(nextPage);
  }

  function changePageSize(nextSize: number) {
    startNewQuery();
    setPageSize(nextSize);
  }

  function changeSearch(nextSearch: string) {
    startNewQuery();
    resetPage();
    setSearch(nextSearch);
  }

  function changeRoleFilter(nextRole: MemberRoleFilter) {
    startNewQuery();
    resetPage();
    setRoleFilter(nextRole);
  }

  async function saveRole(userId: string) {
    if (saving) return;
    setSaving(true);
    setRoleError(null);
    try {
      const member = await updateMemberRole(tenantSlug, userId, role);
      setResult(
        (current) =>
          current && {
            ...current,
            members: current.members.map((item) =>
              item.id === member.id ? member : item,
            ),
          },
      );
      setAttempt((value) => value + 1);
      setPanel(null);
      setToast({
        message: `${member.name}'s role was updated.`,
        variant: "success",
      });
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Could not update role.";
      setRoleError(message);
      setToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
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
        value={roleFilter}
        onChange={(event) =>
          changeRoleFilter(event.target.value as MemberRoleFilter)
        }
      >
        <option value="">All roles</option>
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
      </AppSelect>
      <AppSelect
        label="Page size"
        value={pageSize}
        onChange={(event) => changePageSize(Number(event.target.value))}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </AppSelect>
    </div>
  );

  if (error) {
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
              startNewQuery();
              setAttempt((value) => value + 1);
            }}
            className="mt-4"
          >
            Try again
          </AppButton>
        </div>
      </div>
    );
  }

  if (result === null) {
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
              ? search.trim() || roleFilter
                ? "No matching members"
                : "No members yet"
              : "No members on this page"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {result.total === 0
              ? search.trim() || roleFilter
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
                      disabled={saving}
                      items={[
                        {
                          label: "View Details",
                          onSelect: () => {
                            setRoleError(null);
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
                            setRole(member.role);
                            setRoleError(null);
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
      <AppDialog
        open={Boolean(selectedMember)}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        title={
          selectedMember
            ? panel?.mode === "details"
              ? selectedMember.name
              : `Update ${selectedMember.name}'s role`
            : "Member"
        }
        description={
          panel?.mode === "role"
            ? "Choose the member's new role, then save your change."
            : undefined
        }
        dismissible={!saving}
      >
        {selectedMember && panel?.mode === "details" && (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="mt-1 break-all font-medium">
                {selectedMember.email}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Role</dt>
              <dd className="mt-1 font-medium">
                {selectedMember.role === "ADMIN" ? "Admin" : "Member"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Account status</dt>
              <dd className="mt-1 font-medium">
                {selectedMember.status === "ACTIVE" ? "Active" : "Inactive"}
              </dd>
            </div>
          </dl>
        )}
        {selectedMember && panel?.mode === "role" && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveRole(selectedMember.id);
            }}
          >
            <AppSelect
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value as TenantRole)}
              disabled={saving}
              autoFocus
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </AppSelect>
            {roleError && (
              <p
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {roleError}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <AppButton
                variant="secondary"
                disabled={saving}
                onClick={() => setPanel(null)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                loading={saving}
                disabled={role === selectedMember.role}
              >
                Save role
              </AppButton>
            </div>
          </form>
        )}
      </AppDialog>
      <AppPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        onPageChange={changePage}
        label="Member pages"
        itemName="members"
        disabled={saving}
      />
      <AppToaster
        message={toast?.message ?? null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
