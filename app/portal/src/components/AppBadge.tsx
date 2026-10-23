import type { HTMLAttributes } from "react";

type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "warning" | "danger";
  size?: "sm" | "md";
};

const variants = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function AppBadge({
  variant = "neutral",
  size = "sm",
  className = "",
  children,
  ...props
}: AppBadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex max-w-full items-center rounded-full font-medium break-words ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
