import type { CSSProperties, HTMLAttributes } from "react";

type AppSkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "text" | "block" | "circle";
  animated?: boolean;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

const variants = {
  text: "h-4 w-full rounded",
  block: "h-24 w-full rounded-xl",
  circle: "size-10 rounded-full",
};

export function AppSkeleton({
  variant = "text",
  animated = true,
  width,
  height,
  className = "",
  style,
  ...props
}: AppSkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      style={{ width, height, ...style }}
      className={`max-w-full bg-zinc-200 dark:bg-zinc-800 ${animated ? "animate-pulse" : ""} ${variants[variant]} ${className}`}
    />
  );
}
