"use client";

import { useGT } from "gt-next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { MobileSlideOverSurface } from "@/components/ui/mobile-slide-over-surface";
import { buttonClasses, cn } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobileViewport } from "@/components/use-is-mobile-viewport";
import { WorkspaceAvatar } from "@/components/workspace-avatar";

type WorkspaceRow = {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  isCurrent: boolean;
};

type DashboardAccountMenuProps = {
  orgSlug: string;
  member: {
    name: string;
    role: string;
    initials: string;
    imageUrl: string | null;
    email: string;
    profileAccentColor: string | null;
  };
  organization: {
    name: string;
    logoUrl: string | null;
    brandColor: string | null;
    timezone: string;
  };
  workspaces: WorkspaceRow[];
  createWorkspaceHref: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

function TriggerAvatar({
  orgLogoUrl,
  memberImageUrl,
  memberName,
  memberProfileAccentColor,
}: Readonly<{
  orgLogoUrl: string | null;
  memberImageUrl: string | null;
  memberName: string;
  memberProfileAccentColor: string | null;
}>) {
  if (orgLogoUrl) {
    return <TriggerAvatarImage src={orgLogoUrl} />;
  }

  if (memberImageUrl) {
    return (
      <TriggerAvatarImage
        src={memberImageUrl}
        boxShadowColor={memberProfileAccentColor}
      />
    );
  }

  return (
    <WorkspaceAvatar
      name={memberName}
      logoUrl={null}
      brandColor={memberProfileAccentColor}
      className="size-8 rounded-2xl"
    />
  );
}

function TriggerAvatarImage({
  src,
  boxShadowColor,
}: Readonly<{
  src: string;
  boxShadowColor?: string | null;
}>) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHydrated(false);
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (imageRef.current?.complete) {
      setLoaded(true);
    }
  }, [src, hydrated]);

  const showSkeleton = !hydrated || !loaded;

  return (
    // Keep the root element as the image itself so the server and client DOM stay identical.
    // The skeleton stays visible through the first client render so hydration sees the same classes as the server HTML.
    // eslint-disable-next-line @next/next/no-img-element -- Convex / UploadThing URLs; domains vary by env
    <img
      ref={imageRef}
      src={src}
      alt=""
      suppressHydrationWarning
      className={cn(
        "size-8 shrink-0 rounded-2xl object-cover ring-1 ring-white/10 transition-[background-color,box-shadow] duration-200",
        showSkeleton ? "animate-pulse bg-zinc-700/85" : "bg-transparent",
      )}
      style={{
        boxShadow: `0 0 0 2px ${boxShadowColor ?? "transparent"}`,
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  );
}

function MemberAvatar({
  memberImageUrl,
  memberName,
  memberProfileAccentColor,
}: Readonly<{
  memberImageUrl: string | null;
  memberName: string;
  memberProfileAccentColor: string | null;
}>) {
  if (memberImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- OAuth / Convex profile URLs; domains vary by env
      <img
        src={memberImageUrl}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover ring-1 ring-white/10"
        style={{
          boxShadow: `0 0 0 2px ${memberProfileAccentColor ?? "transparent"}`,
        }}
      />
    );
  }

  return (
    <WorkspaceAvatar
      name={memberName}
      logoUrl={null}
      brandColor={memberProfileAccentColor}
      className="size-10 rounded-full"
    />
  );
}

export function DashboardAccountMenu({
  orgSlug,
  member,
  organization,
  workspaces,
  createWorkspaceHref,
  mobileOpen,
  onMobileOpenChange,
}: Readonly<DashboardAccountMenuProps>) {
  const gt = useGT();
  const router = useRouter();
  const liveShellData = useQuery(api.users.orgShellData, { orgSlug });
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isMobileViewport = useIsMobileViewport();
  const resolvedMember = liveShellData?.member ?? member;
  const resolvedOrganization = liveShellData?.organization ?? organization;
  const resolvedWorkspaces = liveShellData?.workspaces ?? workspaces;
  const isMobileOpen = mobileOpen ?? open;
  const setIsMobileOpen = onMobileOpenChange ?? setOpen;

  useEffect(() => {
    if (isMobileViewport) {
      return;
    }

    setOpen(false);
  }, [isMobileViewport]);

  const signOut = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  };

  const triggerButton = (
    <button
      type="button"
      className={cn(
        buttonClasses({ variant: "ghost", size: "sm" }),
        "inline-flex h-9 max-w-[min(100%,14rem)] shrink-0 items-center gap-2.5 border-transparent bg-transparent px-2.5 text-left text-zinc-300 hover:border-transparent hover:bg-zinc-800 hover:text-white",
      )}
      aria-label={gt("Account and workspaces")}
      aria-expanded={isMobileViewport ? isMobileOpen : open}
      onClick={
        isMobileViewport
          ? () => setIsMobileOpen(!isMobileOpen)
          : undefined
      }
    >
      <TriggerAvatar
        orgLogoUrl={resolvedOrganization.logoUrl}
        memberImageUrl={resolvedMember.imageUrl}
        memberName={resolvedMember.name}
        memberProfileAccentColor={resolvedMember.profileAccentColor}
      />
      <span className="hidden min-w-0 flex-1 truncate text-sm font-semibold tracking-tight sm:block">
        {resolvedOrganization.name}
      </span>
    </button>
  );

  if (isMobileViewport) {
    return (
      <>
        {triggerButton}
        <MobileSlideOverSurface
          open={isMobileOpen}
          onOpenChange={setIsMobileOpen}
          title={gt("Account and workspaces")}
          closeLabel={gt("Close account panel")}
        >
          <div className="flex min-h-full flex-col">
            <div className="border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-4">
              <div className="flex items-center gap-3">
                <MemberAvatar
                  memberImageUrl={resolvedMember.imageUrl}
                  memberName={resolvedMember.name}
                  memberProfileAccentColor={resolvedMember.profileAccentColor}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--panel-ink)]">
                    {resolvedMember.name}
                  </p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">
                    {resolvedMember.email}
                  </p>
                  <p className="truncate text-[10px] text-[var(--ink-muted)]">
                    {resolvedMember.role} · {resolvedOrganization.timezone}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <Link
                href={`/${orgSlug}/profile`}
                className="border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-3 text-sm font-medium text-[var(--panel-ink)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]"
                onClick={() => setIsMobileOpen(false)}
              >
                {gt("Profile")}
              </Link>
              <Link
                href={`/${orgSlug}/tickets`}
                className="border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-3 text-sm font-medium text-[var(--panel-ink)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]"
                onClick={() => setIsMobileOpen(false)}
              >
                {gt("New ticket")}
              </Link>
              <Link
                href={`/${orgSlug}/conversations`}
                className="border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-3 text-sm font-medium text-[var(--panel-ink)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]"
                onClick={() => setIsMobileOpen(false)}
              >
                {gt("New conversation")}
              </Link>
            </div>

            <div className="px-5 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {gt("Workspaces")}
            </div>
            <div className="flex flex-col">
              {resolvedWorkspaces.map((w) => (
                <Link
                  key={w.slug}
                  href={`/${w.slug}`}
                  className={cn(
                    "flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-3 text-sm text-[var(--panel-ink)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]",
                    w.isCurrent && "bg-[color-mix(in_srgb,var(--accent)_8%,white)]",
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <WorkspaceAvatar
                    name={w.name}
                    logoUrl={w.logoUrl}
                    brandColor={w.brandColor}
                    className="size-8"
                  />
                  <span className="min-w-0 flex-1 truncate">{w.name}</span>
                  {w.isCurrent ? (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
                      {gt("Current")}
                    </span>
                  ) : null}
                </Link>
              ))}

              <Link
                href={createWorkspaceHref}
                className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-3 text-sm font-medium text-[var(--panel-ink)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]"
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="flex size-8 items-center justify-center rounded-lg border border-dashed border-[var(--line)] text-sm font-semibold text-[var(--ink-muted)]">
                  +
                </span>
                {gt("Create workspace")}
              </Link>
            </div>

            <div className="mt-auto border-t border-[color-mix(in_srgb,var(--line)_72%,white)] px-5 py-4">
              <button
                type="button"
                className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                disabled={isPending}
                onClick={() => {
                  setIsMobileOpen(false);
                  signOut();
                }}
              >
                {gt("Log out")}
              </button>
            </div>
          </div>
        </MobileSlideOverSurface>
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(calc(100vw-2rem),20rem)]"
      >
        <div className="px-2.5 pb-2 pt-1.5">
          <div className="flex items-center gap-3">
            <MemberAvatar
              memberImageUrl={resolvedMember.imageUrl}
              memberName={resolvedMember.name}
              memberProfileAccentColor={resolvedMember.profileAccentColor}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--panel-ink)]">
                {resolvedMember.name}
              </p>
              <p className="truncate text-xs text-[var(--ink-muted)]">
                {resolvedMember.email}
              </p>
              <p className="truncate text-[10px] text-[var(--ink-muted)]">
                {resolvedMember.role} · {resolvedOrganization.timezone}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/${orgSlug}/profile`} onClick={() => setOpen(false)}>
            {gt("Profile")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={`/${orgSlug}/tickets`}
            onClick={() => setOpen(false)}
          >
            {gt("New ticket")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={`/${orgSlug}/conversations`}
            onClick={() => setOpen(false)}
          >
            {gt("New conversation")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {gt("Workspaces")}
        </div>
        <div className="flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto pb-1">
          {resolvedWorkspaces.map((w) => (
            <DropdownMenuItem
              key={w.slug}
              asChild
              className={cn(
                "cursor-pointer",
                w.isCurrent && "bg-[color-mix(in_srgb,var(--accent)_8%,white)]",
              )}
            >
              <Link
                href={`/${w.slug}`}
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <WorkspaceAvatar
                  name={w.name}
                  logoUrl={w.logoUrl}
                  brandColor={w.brandColor}
                  className="size-7"
                />
                <span className="min-w-0 flex-1 truncate">{w.name}</span>
                {w.isCurrent ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
                    {gt("Current")}
                  </span>
                ) : null}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={createWorkspaceHref}
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <span className="flex size-7 items-center justify-center rounded-lg border border-dashed border-[var(--line)] text-sm font-semibold text-[var(--ink-muted)]">
              +
            </span>
            {gt("Create workspace")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            signOut();
          }}
        >
          {gt("Log out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
