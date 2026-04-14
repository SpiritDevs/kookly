"use client";

import { useGT } from "gt-next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useIsMobileViewport } from "@/components/use-is-mobile-viewport";
import { buttonClasses, cn } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSlideOverSurface } from "@/components/ui/mobile-slide-over-surface";
import type { DashboardNotification } from "@/lib/mock-data";

export function NotificationsDropdown({
  notifications,
  supportAIChatShown,
  onToggleSupportAIChat,
  mobileOpen,
  onMobileOpenChange,
}: Readonly<{
  notifications: DashboardNotification[];
  supportAIChatShown: boolean;
  onToggleSupportAIChat: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}>) {
  const gt = useGT();
  const isMobileViewport = useIsMobileViewport();
  const [open, setOpen] = useState(false);
  const hasItems = notifications.length > 0;
  const isMobileOpen = mobileOpen ?? open;
  const setIsMobileOpen = onMobileOpenChange ?? setOpen;

  useEffect(() => {
    if (isMobileViewport) {
      return;
    }

    setOpen(false);
  }, [isMobileViewport]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={supportAIChatShown}
        aria-label={gt("Toggle assistant")}
        className={cn(
          buttonClasses({ variant: "ghost", size: "sm" }),
          "h-10 w-10 shrink-0 px-0! text-zinc-300",
          supportAIChatShown
            ? "translate-y-px border-zinc-700 bg-zinc-950 text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)]"
            : "border-transparent bg-zinc-900/50 hover:border-transparent hover:bg-zinc-800 hover:text-white",
        )}
        onClick={onToggleSupportAIChat}
      >
        <Icon name="bot" className="h-5 w-5" />
      </button>

      {isMobileViewport ? (
        <>
          <button
            type="button"
            className={cn(
              buttonClasses({ variant: "ghost", size: "sm" }),
              "relative h-10 w-10 shrink-0 px-0! text-zinc-300",
              isMobileOpen
                ? "translate-y-px border-zinc-700 bg-zinc-950 text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "border-transparent bg-zinc-900/50 hover:border-transparent hover:bg-zinc-800 hover:text-white",
            )}
            aria-label={gt("Notifications")}
            aria-expanded={isMobileOpen}
            aria-pressed={isMobileOpen}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <Icon name="notifications" className="h-5 w-5" />
            {hasItems ? (
              <span
                className="absolute right-1 top-1 size-2 rounded-full bg-[var(--accent)] ring-2 ring-[color-mix(in_srgb,white_92%,var(--canvas))]"
                aria-hidden
              />
            ) : null}
          </button>

          <MobileSlideOverSurface
            open={isMobileOpen}
            onOpenChange={setIsMobileOpen}
            title={gt("Notifications")}
            closeLabel={gt("Close notifications")}
          >
            {!hasItems ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_8%,white)] ring-1 ring-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                  <Icon
                    name="notifications"
                    className="size-6 text-[var(--ink-muted)] opacity-60"
                  />
                </div>
                <p className="mt-4 font-[family-name:var(--font-dashboard-display)] text-base font-medium tracking-tight text-[var(--panel-ink)]">
                  {gt("Nothing new yet")}
                </p>
                <p className="mt-1.5 max-w-[14rem] text-xs leading-relaxed text-[var(--ink-muted)]">
                  {gt(
                    "Booking alerts, routing updates, and teammate mentions will show up here.",
                  )}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) =>
                  n.href ? (
                    <Link
                      key={n.id}
                      href={n.href}
                      className="border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <NotificationRow n={n} />
                    </Link>
                  ) : (
                    <div
                      key={n.id}
                      className="border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-4"
                    >
                      <NotificationRow n={n} />
                    </div>
                  ),
                )}
              </div>
            )}
          </MobileSlideOverSurface>
        </>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            className={cn(
              buttonClasses({ variant: "ghost", size: "sm" }),
              "relative h-10 w-10 shrink-0 px-0! text-zinc-300",
              open
                ? "translate-y-px border-zinc-700 bg-zinc-950 text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "border-transparent bg-zinc-900/50 hover:border-transparent hover:bg-zinc-800 hover:text-white",
            )}
            aria-label={gt("Notifications")}
          >
            <Icon name="notifications" className="h-5 w-5" />
            {hasItems ? (
              <span
                className="absolute right-1 top-1 size-2 rounded-full bg-[var(--accent)] ring-2 ring-[color-mix(in_srgb,white_92%,var(--canvas))]"
                aria-hidden
              />
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[min(calc(100vw-2rem),20rem)]"
          >
            <DropdownMenuLabel>{gt("Notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!hasItems ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_8%,white)] ring-1 ring-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                  <Icon
                    name="notifications"
                    className="size-6 text-[var(--ink-muted)] opacity-60"
                  />
                </div>
                <p className="mt-4 font-[family-name:var(--font-dashboard-display)] text-base font-medium tracking-tight text-[var(--panel-ink)]">
                  {gt("Nothing new yet")}
                </p>
                <p className="mt-1.5 max-w-[14rem] text-xs leading-relaxed text-[var(--ink-muted)]">
                  {gt(
                    "Booking alerts, routing updates, and teammate mentions will show up here.",
                  )}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 py-0.5">
                {notifications.map((n) =>
                  n.href ? (
                    <DropdownMenuItem
                      key={n.id}
                      asChild
                      className="cursor-pointer flex-col items-stretch gap-1 p-0 focus:bg-transparent"
                    >
                      <Link
                        href={n.href}
                        className="rounded-lg px-2.5 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)] focus-visible:outline-none focus-visible:ring-0"
                      >
                        <NotificationRow n={n} />
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      key={n.id}
                      className="cursor-pointer flex-col items-stretch gap-1 px-2.5 py-2.5"
                    >
                      <NotificationRow n={n} />
                    </DropdownMenuItem>
                  ),
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function NotificationRow({ n }: Readonly<{ n: DashboardNotification }>) {
  return (
    <>
      <div className="flex w-full items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-[var(--panel-ink)]">
          {n.title}
        </span>
        {n.time ? (
          <time className="shrink-0 font-[family-name:var(--font-dashboard-mono)] text-[10px] tabular-nums uppercase tracking-wider text-[var(--ink-muted)]">
            {n.time}
          </time>
        ) : null}
      </div>
      {n.body ? (
        <p className="w-full text-left text-xs leading-relaxed text-[var(--ink-muted)]">
          {n.body}
        </p>
      ) : null}
    </>
  );
}
