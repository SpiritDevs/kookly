"use client";

import { type ReactNode, useEffect, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/icons";
import { cn } from "@/components/ui";

type MobileSlideOverSurfaceProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
  contentClassName?: string;
}>;

export function MobileSlideOverSurface({
  open,
  onOpenChange,
  title,
  description,
  children,
  closeLabel = "Close panel",
  className,
  contentClassName,
}: MobileSlideOverSurfaceProps) {
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
  }, [onOpenChange, open]);

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <>
          <motion.button
            key="mobile-slide-over-backdrop"
            type="button"
            aria-label={closeLabel}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            className="fixed inset-x-0 bottom-0 top-[52px] z-[84] bg-[color-mix(in_srgb,var(--panel-ink)_35%,transparent)] backdrop-blur-[2px] sm:hidden"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            key="mobile-slide-over-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={
              prefersReducedMotion ? { opacity: 1 } : { x: "100%", opacity: 1 }
            }
            animate={{ x: 0, opacity: 1 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { x: "100%", opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "fixed inset-x-0 bottom-0 top-[52px] z-[85] flex flex-col overflow-hidden bg-[color-mix(in_srgb,var(--panel)_94%,white)] shadow-[-12px_0_28px_color-mix(in_srgb,var(--panel-ink)_10%,transparent)] sm:hidden",
              className,
            )}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--line)_72%,white)] bg-[color-mix(in_srgb,var(--panel)_90%,white)] px-5 py-4">
              <div className="min-w-0 space-y-1">
                <h2
                  id={titleId}
                  className="truncate text-lg font-semibold tracking-[-0.02em] text-[var(--panel-ink)]"
                >
                  {title}
                </h2>
                {description ? (
                  <p
                    id={descriptionId}
                    className="text-sm leading-6 text-[var(--ink-muted)]"
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--line)_78%,white)] bg-white/75 text-[var(--ink-muted)] transition hover:border-[var(--accent)] hover:bg-white hover:text-[var(--panel-ink)]"
                onClick={() => onOpenChange(false)}
              >
                <Icon name="close" className="size-4" />
                <span className="sr-only">{closeLabel}</span>
              </button>
            </div>

            <div
              className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}
            >
              {children}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
