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
        <label htmlFor={selectId} className="block text-sm font-medium">
          {label}
        </label>
      )}
      <select
        {...props}
        id={selectId}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={descriptionIds || undefined}
        className={`mt-1 block min-h-11 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-zinc-700"} ${className}`}
      >
        {children}
      </select>
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
