"use client";

import { useActionState, useEffect, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { AppDialog } from "@/components/AppDialog";
import { AppSelect } from "@/components/AppSelect";
import type { Member, TenantRole } from "@/types";
import { updateMemberRole, type RoleActionState } from "./actions";

export function MemberDialog({
  member,
  mode,
  tenantSlug,
  onClose,
  onSuccess,
}: {
  member?: Member;
  mode?: "details" | "role";
  tenantSlug: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [role, setRole] = useState<TenantRole>(member?.role ?? "MEMBER");
  const [state, formAction, pending] = useActionState<RoleActionState, FormData>(
    updateMemberRole.bind(null, tenantSlug, member?.id ?? ""),
    { success: false },
  );

  useEffect(() => {
    if (state.success) onSuccess(state.message ?? "Member role updated.");
  }, [state.success, state.message, onSuccess]);

  return (
    <AppDialog
      open={Boolean(member)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        member
          ? mode === "details"
            ? member.name
            : `Update ${member.name}'s role`
          : "Member"
      }
      description={
        mode === "role"
          ? "Choose the member's new role, then save your change."
          : undefined
      }
      dismissible={!pending}
    >
      {member && mode === "details" && (
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="mt-1 break-all font-medium">{member.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Role</dt>
            <dd className="mt-1 font-medium">
              {member.role === "ADMIN" ? "Admin" : "Member"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Account status</dt>
            <dd className="mt-1 font-medium">
              {member.status === "ACTIVE" ? "Active" : "Inactive"}
            </dd>
          </div>
        </dl>
      )}
      {member && mode === "role" && (
        <form action={formAction} className="space-y-4">
          <AppSelect
            label="Role"
            name="role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as TenantRole)
            }
            disabled={pending}
            autoFocus
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </AppSelect>
          {!state.success && state.message && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.message}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <AppButton variant="secondary" disabled={pending} onClick={onClose}>
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              loading={pending}
              disabled={role === member.role}
            >
              Save role
            </AppButton>
          </div>
        </form>
      )}
    </AppDialog>
  );
}
