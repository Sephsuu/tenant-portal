"use client";

import { AppButton } from "@/components/AppButton";

export default function MembersError({ reset }: { reset: () => void }) {
  return (
    <main role="alert" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Could not open the members page</h1>
      <p className="mt-2 text-sm text-zinc-500">Please try again.</p>
      <AppButton onClick={reset} className="mt-4">
        Try again
      </AppButton>
    </main>
  );
}
