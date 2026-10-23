"use client";

import { useEffect, useState } from "react";
import { AppBadge } from "@/components/AppBadge";
import { AppButton } from "@/components/AppButton";
import { AppSkeleton } from "@/components/AppSkeleton";
import { getMembers } from "@/lib/members";
import type { MembersPage } from "@/types";

export function MembersList({ tenantSlug }: { tenantSlug: string }) {
  const [result, setResult] = useState<MembersPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getMembers(tenantSlug, page, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
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
  }, [tenantSlug, page, attempt]);

  function changePage(nextPage: number) {
    setResult(null);
    setError(null);
    setPage(nextPage);
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mt-6 rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-900"
      >
        <p className="font-medium">Could not load members</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
        <AppButton
          onClick={() => {
            setResult(null);
            setError(null);
            setAttempt((value) => value + 1);
          }}
          className="mt-4"
        >
          Try again
        </AppButton>
      </div>
    );
  }

  if (result === null) {
    return (
      <div role="status" className="mt-6 space-y-3">
        <span className="sr-only">Loading members…</span>
        <AppSkeleton variant="block" height="3rem" />
        <AppSkeleton variant="block" height="12rem" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-zinc-500">
        {result.total} members · {result.pageSize} per page
      </p>
      {result.members.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium">
            {result.total === 0 ? "No members yet" : "No members on this page"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {result.total === 0
              ? "This organization has no members to show."
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(result.totalPages > 1 || result.page > 1) && (
        <nav
          aria-label="Member pages"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <span className="text-zinc-500">
            Page {result.page} of {result.totalPages} · {result.total} members
          </span>
          <div className="flex gap-2">
            <AppButton
              variant="secondary"
              size="sm"
              disabled={result.page <= 1}
              onClick={() => changePage(result.page - 1)}
            >
              Previous
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              disabled={result.page >= result.totalPages}
              onClick={() => changePage(result.page + 1)}
            >
              Next
            </AppButton>
          </div>
        </nav>
      )}
    </div>
  );
}
