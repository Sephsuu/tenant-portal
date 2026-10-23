"use client";

import { useEffect, useState } from "react";
import { AppBadge } from "@/components/AppBadge";
import { AppButton } from "@/components/AppButton";
import { AppSkeleton } from "@/components/AppSkeleton";
import { getMembers, type Member } from "@/lib/members";

export function MembersList({ tenantSlug }: { tenantSlug: string }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getMembers(tenantSlug, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setMembers(data);
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
  }, [tenantSlug, attempt]);

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
            setMembers(null);
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

  if (members === null) {
    return (
      <div role="status" className="mt-6 space-y-3">
        <span className="sr-only">Loading members…</span>
        <AppSkeleton variant="block" height="3rem" />
        <AppSkeleton variant="block" height="12rem" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium">No members yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          This organization has no members to show.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
          {members.map((member) => (
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
                  variant={member.status === "ACTIVE" ? "success" : "neutral"}
                >
                  {member.status === "ACTIVE" ? "Active" : "Inactive"}
                </AppBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
