"use client";

import { type ReactNode, useEffect, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/components/ui";

type BottomDrawerSurfaceProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  closeLabel?: string;
  hideHeader?: boolean;
}>;

export function BottomDrawerSurface({
  open,
  onOpenChange,
  onExitComplete,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  closeLabel = "Close panel",
  hideHeader = false,
}: BottomDrawerSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const portalContent = (
    <AnimatePresence initial={false} onExitComplete={onExitComplete}>
      {open ? (
        <div className="absolute inset-0 z-[60]">
          <motion.button
            key="drawer-backdrop"
            type="button"
            aria-label={closeLabel}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--panel-ink)_38%,transparent)] backdrop-blur-[3px]"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: "100%" }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 top-0 flex flex-col overflow-hidden rounded-t-lg border border-[color-mix(in_srgb,var(--line)_72%,white)] bg-[color-mix(in_srgb,var(--panel)_94%,white)] shadow-[0_-28px_80px_rgba(15,23,42,0.24)]",
              className,
            )}
          >
            {hideHeader ? (
              <>
                {title ? (
                  <h2 id={titleId} className="sr-only">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={descriptionId} className="sr-only">
                    {description}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="flex shrink-0 flex-col gap-3 border-b border-[color-mix(in_srgb,var(--line)_72%,white)] bg-[color-mix(in_srgb,var(--panel)_90%,white)] px-5 pb-4 pt-3 sm:px-6">
                <div className="mx-auto h-1.5 w-14 rounded-full bg-[color-mix(in_srgb,var(--line)_88%,white)]" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    {title ? (
                      <h2
                        id={titleId}
                        className="truncate text-lg font-semibold tracking-[-0.02em] text-[var(--panel-ink)] sm:text-[1.375rem]"
                      >
                        {title}
                      </h2>
                    ) : null}
                    {description ? (
                      <p
                        id={descriptionId}
                        className="max-w-2xl text-sm leading-6 text-[var(--ink-muted)]"
                      >
                        {description}
                      </p>
                    ) : null}
                  </div>

                </div>
              </div>
            )}

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto",
                contentClassName,
              )}
            >
              {children}
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-[color-mix(in_srgb,var(--line)_72%,white)] bg-[color-mix(in_srgb,var(--panel)_90%,white)] px-5 py-4 sm:px-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  return portalContent;
}
