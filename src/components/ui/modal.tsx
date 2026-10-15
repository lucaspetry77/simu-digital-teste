"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideClose?: boolean;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const target =
        panel.current?.querySelector<HTMLElement>("[data-autofocus]") ??
        panel.current?.querySelector<HTMLElement>("button, [href], input, select, textarea");
      target?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-[rgb(10_10_14/0.42)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-elev shadow-lg sm:rounded-3xl",
              { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size],
            )}
          >
            {title || !hideClose ? (
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div>
                  {title ? (
                    <h2 id={titleId} className="text-lg font-semibold tracking-tight text-ink">
                      {title}
                    </h2>
                  ) : null}
                  {description ? <p className="mt-1 text-sm leading-relaxed text-ink-3">{description}</p> : null}
                </div>
                {!hideClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition hover:bg-hover hover:text-ink"
                  >
                    <X className="size-[18px]" />
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex flex-col-reverse gap-2 border-t border-line bg-sunken/50 px-6 py-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
