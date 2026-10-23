"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AppDropdownItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  title?: string;
};

export function AppDropdown({
  label = "Actions",
  ariaLabel,
  items,
  disabled = false,
}: {
  label?: string;
  ariaLabel?: string;
  items: AppDropdownItem[];
  disabled?: boolean;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();

    function close(event: MouseEvent) {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !menu.current?.contains(event.target as Node)
      ) {
        setPosition(null);
      }
    }
    function closeOnFocus(event: FocusEvent) {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !menu.current?.contains(event.target as Node)
      ) {
        setPosition(null);
      }
    }
    function closeOnScroll() {
      setPosition(null);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("focusin", closeOnFocus);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("focusin", closeOnFocus);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [position]);

  function toggle() {
    if (position) {
      setPosition(null);
      return;
    }
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const height = Math.min(items.length * 40 + 8, window.innerHeight - 16);
    setPosition({
      top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - height - 8)),
      left: Math.max(8, Math.min(rect.right - 192, window.innerWidth - 200)),
    });
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={position !== null}
        aria-haspopup="menu"
        aria-controls={position ? menuId : undefined}
        disabled={disabled}
        onClick={toggle}
        className={`inline-flex min-h-9 items-center justify-center focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${label ? "rounded-md border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800" : "w-9 text-xl"}`}
      >
        {label && <span className="mr-1">{label}</span>}
        <span aria-hidden="true">⋯</span>
      </button>
      {position && createPortal(
        <div
          ref={menu}
          id={menuId}
          role="menu"
          aria-label={ariaLabel ?? label}
          style={{ top: position.top, left: position.left }}
          className="fixed z-50 max-h-[calc(100vh-1rem)] w-48 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setPosition(null);
              trigger.current?.focus();
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
              const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
              const direction = event.key === "ArrowDown" ? 1 : -1;
              buttons[(index + direction + buttons.length) % buttons.length]?.focus();
            }
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              title={item.title}
              onClick={() => {
                setPosition(null);
                trigger.current?.focus();
                item.onSelect();
              }}
              className="block min-h-9 w-full rounded px-3 text-left text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800"
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
