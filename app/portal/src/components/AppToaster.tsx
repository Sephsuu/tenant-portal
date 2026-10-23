"use client";

import { useEffect } from "react";

export function AppToaster({
  message,
  variant = "success",
  onClose,
}: {
  message: string | null;
  variant?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start justify-between gap-3 rounded-lg border bg-white p-4 text-sm shadow-xl sm:inset-x-auto sm:right-6 sm:mx-0 dark:bg-zinc-900 ${variant === "error" ? "border-red-300 dark:border-red-800" : "border-emerald-300 dark:border-emerald-800"}`}
    >
      <p>{message}</p>
      <button
        type="button"
        aria-label="Dismiss message"
        onClick={onClose}
        className="rounded px-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-zinc-800"
      >
        ×
      </button>
    </div>
  );
}
