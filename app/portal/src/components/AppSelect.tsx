"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export function AppSelect({
  label,
  hint,
  error,
  containerClassName = "",
  className = "",
  id,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  children,
  ...props
}: AppSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionIds = [
    describedBy,
    hint && `${selectId}-hint`,
    error && `${selectId}-error`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`min-w-0 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          id={selectId}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={descriptionIds || undefined}
          className={`app-select block min-h-11 w-full min-w-0 appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 shadow-sm transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-300 hover:border-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-zinc-700 dark:hover:border-zinc-600"} ${className}`}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {hint && (
        <p id={`${selectId}-hint`} className="mt-1 text-xs text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
