"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AppButton } from "./AppButton";

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  dismissible = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  dismissible?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onOpenChange(false);
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            )}
          </div>
          <AppButton
            variant="ghost"
            size="sm"
            aria-label="Close dialog"
            disabled={!dismissible}
            onClick={() => onOpenChange(false)}
            className="shrink-0"
          >
            Close
          </AppButton>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
