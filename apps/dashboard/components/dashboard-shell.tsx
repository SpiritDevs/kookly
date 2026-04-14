import { DashboardAppChrome } from "@/components/dashboard-app-chrome";
import {
  DashboardMainSidebarMenu,
  DashboardSidebarStaticItem,
} from "@/components/dashboard-sidebar";
import { Icon } from "@/components/icons";
import { buttonClasses, cn } from "@/components/ui";
import { type DashboardNotification } from "@/lib/mock-data";
import type { DashboardLanguage } from "@convex/lib/dashboardLanguage";

type WorkspaceShell = {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  isCurrent: boolean;
};

type DashboardShellProps = {
  children: React.ReactNode;
  orgSlug: string;
  createWorkspaceHref: string;
  member: {
    name: string;
    firstName: string;
    role: string;
    initials: string;
    imageUrl: string | null;
    email: string;
    profileAccentColor: string | null;
    dashboardLanguage: DashboardLanguage;
    supportAIChatShown: boolean;
  };
  organization: {
    name: string;
    plan: string;
    seatLabel: string;
    timezone: string;
    logoUrl: string | null;
    brandColor: string | null;
  };
  workspaces: WorkspaceShell[];
  notifications: DashboardNotification[];
};

export function DashboardShell({
  children,
  orgSlug,
  createWorkspaceHref,
  member,
  organization,
  workspaces,
  notifications,
}: Readonly<DashboardShellProps>) {
  return (
    <DashboardAppChrome
      orgSlug={orgSlug}
      createWorkspaceHref={createWorkspaceHref}
      member={member}
      organization={organization}
      workspaces={workspaces}
      notifications={notifications}
    >
      {children}
    </DashboardAppChrome>
  );
}

export function DashboardShellFallback({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-dashboard-app-shell
      className="flex h-(--dashboard-app-height) min-h-(--dashboard-app-height) flex-col overflow-hidden bg-zinc-900 text-(--ink)"
    >
      <header className="relative flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900 px-4 sm:gap-3 sm:px-6">
        <div className="relative z-10 flex min-w-0 shrink-0 items-center gap-2 bg-zinc-900 sm:gap-3">
          <div
            className={cn(
              buttonClasses({ variant: "ghost", size: "sm" }),
              "shrink-0 border-zinc-700 px-3 text-zinc-300 lg:hidden",
            )}
          >
            <Icon name="menu" className="size-5" />
          </div>

          <div className="min-w-0 shrink-0 max-sm:max-w-[9rem] sm:max-w-xs">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Kookly
            </p>
            <div
              aria-hidden="true"
              className="mt-1 h-5 w-28 animate-pulse rounded-full bg-zinc-700/85 sm:h-6 sm:w-36"
            />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6">
          <button
            type="button"
            className="flex h-9 w-full max-w-[640px] min-w-0 items-center gap-2.5 rounded-lg border border-zinc-600/50 bg-zinc-800/55 px-3.5 py-1.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-4"
            aria-label="Search"
          >
            <Icon name="search" className="size-4 shrink-0 text-zinc-400" />
            <span className="min-w-0 flex-1 truncate py-0.5 text-sm leading-tight text-zinc-500">
              Search
            </span>
            <span
              className="pointer-events-none hidden shrink-0 items-center gap-1 sm:inline-flex"
              aria-hidden="true"
            >
              <kbd className="rounded-md border border-zinc-600/70 bg-zinc-900/60 px-1.5 py-0.5 font-sans text-[11px] font-medium leading-none text-zinc-400 shadow-sm">
                ⌘
              </kbd>
              <kbd className="rounded-md border border-zinc-600/70 bg-zinc-900/60 px-1.5 py-0.5 font-sans text-[11px] font-medium leading-none text-zinc-400 shadow-sm">
                K
              </kbd>
            </span>
          </button>
        </div>

        <div className="relative z-10 flex min-w-0 shrink-0 items-center gap-2">
          <div
            className={cn(
              buttonClasses({ variant: "ghost", size: "sm" }),
              "h-10 w-10 shrink-0 border-transparent bg-zinc-900/50 px-0! text-zinc-300",
            )}
          >
            <Icon name="bot" className="h-5 w-5" />
          </div>
          <div
            className={cn(
              buttonClasses({ variant: "ghost", size: "sm" }),
              "h-10 w-10 shrink-0 border-transparent bg-zinc-900/50 px-0! text-zinc-300",
            )}
          >
            <Icon name="notifications" className="h-5 w-5" />
          </div>
          <div
            className={cn(
              buttonClasses({ variant: "ghost", size: "sm" }),
              "inline-flex h-9 max-w-[min(100%,14rem)] shrink-0 items-center gap-2.5 border-transparent bg-transparent px-2.5 text-left text-zinc-300",
            )}
          >
            <div
              aria-hidden="true"
              className="size-8 shrink-0 animate-pulse rounded-2xl bg-zinc-700/85"
            />
            <div
              aria-hidden="true"
              className="hidden h-4 min-w-0 flex-1 animate-pulse rounded-full bg-zinc-700/85 sm:block"
            />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-lg bg-[var(--canvas)]">
        <div className="flex min-h-0 flex-1 flex-row">
          <aside className="hidden w-[var(--sidebar-w)] flex-shrink-0 border-r border-[var(--line)] bg-[var(--panel-strong)] lg:flex lg:flex-col">
            <DashboardMainSidebarMenu
              base=""
              navActive={(href) => href === ""}
              renderLabel={(label) => label}
              renderFlag={(flag) => flag}
              renderHeader={(header) => header}
            />
            <div className="border-t border-[var(--line)] p-3">
              <DashboardSidebarStaticItem
                item={{
                  label: "Settings",
                  href: "/settings",
                  icon: "settings",
                }}
                active={false}
                label="Settings"
              />
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
