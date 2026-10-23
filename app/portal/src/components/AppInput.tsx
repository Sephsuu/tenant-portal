"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export function AppInput({
  label,
  hint,
  error,
  containerClassName = "",
  className = "",
  id,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: AppInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionIds = [
    describedBy,
    hint && `${inputId}-hint`,
    error && `${inputId}-error`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`min-w-0 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={descriptionIds || undefined}
        className={`mt-1 block min-h-11 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-zinc-700"} ${className}`}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
