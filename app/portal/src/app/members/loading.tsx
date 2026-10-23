import { AppSkeleton } from "@/components/AppSkeleton";

export default function MembersLoading() {
  return (
    <main
      role="status"
      className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-8"
    >
      <span className="sr-only">Loading members…</span>
      <AppSkeleton width="12rem" height="2rem" />
      <AppSkeleton variant="block" height="4rem" />
      <AppSkeleton variant="block" height="14rem" />
    </main>
  );
}
