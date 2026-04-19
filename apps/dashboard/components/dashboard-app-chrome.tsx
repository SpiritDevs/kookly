"use client";

import { msg, useGT, useLocale, useMessages } from "gt-next";
import { useMutation } from "convex/react";
import { Command } from "cmdk";
import {
  Activity,
  Boxes,
  LayoutGrid,
  Menu,
  MessageSquare,
  SquarePen,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatePresence,
  type Variants,
  motion,
  useReducedMotion,
} from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import {
  normalizeDashboardLanguage,
  type DashboardLanguage,
} from "@convex/lib/dashboardLanguage";
import { DashboardAccountMenu } from "@/components/dashboard-account-menu";
import { DashboardDrawerHost } from "@/components/dashboard-drawer-host";
import { useDashboardDrawer } from "@/components/dashboard-drawer-provider";
import {
  DashboardMainSidebarMenu as SharedDashboardMainSidebarMenu,
  DashboardSidebarButtonItem,
  DashboardSidebarGroup,
  DashboardSidebarLinkItem,
  getSidebarItemClassName,
} from "@/components/dashboard-sidebar";
import { Icon } from "@/components/icons";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
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
import { dashboardNavItems, type DashboardNavItem } from "@/lib/mock-data";
import type { DashboardNotification } from "@/lib/mock-data";

type WorkspaceShell = {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  isCurrent: boolean;
};

type SuiteApp = {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  isCurrent: boolean;
};

const suiteApps: SuiteApp[] = [
  {
    name: "Pouchly",
    description: "Scheduling",
    href: "#",
    icon: LayoutGrid,
    isCurrent: false,
  },
  {
    name: "Kookly",
    description: "Support chat",
    href: "#",
    icon: MessageSquare,
    isCurrent: true,
  },
  {
    name: "Woomly",
    description: "Uptime service",
    href: "#",
    icon: Activity,
    isCurrent: false,
  },
  {
    name: "Platly",
    description: "User and billing admin",
    href: "#",
    icon: UserRoundCog,
    isCurrent: false,
  },
];

const MIN_SUPPORT_AI_CHAT_WIDTH = 350;
const DASHBOARD_APP_HEIGHT_VAR = "--dashboard-app-height";

function clampSupportAIChatWidth(nextWidth: number) {
  if (typeof window === "undefined") {
    return Math.max(nextWidth, MIN_SUPPORT_AI_CHAT_WIDTH);
  }

  const maxWidth = Math.max(
    MIN_SUPPORT_AI_CHAT_WIDTH,
    Math.floor(window.innerWidth * 0.6),
  );

  return Math.min(Math.max(nextWidth, MIN_SUPPORT_AI_CHAT_WIDTH), maxWidth);
}

function useSearchModifierKeyLabel() {
  const [label, setLabel] = useState("⌘");
  useEffect(() => {
    const isApple =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
    setLabel(isApple ? "⌘" : "Ctrl");
  }, []);
  return label;
}

function DashboardHeaderVerticalSwap({
  swapKey,
  direction,
  prefersReducedMotion,
  className,
  children,
}: Readonly<{
  swapKey: string;
  direction: 1 | -1;
  prefersReducedMotion: boolean;
  className?: string;
  children: React.ReactNode;
}>) {
  const variants: Variants = {
    enter: (d: number) =>
      prefersReducedMotion
        ? { opacity: 0 }
        : { opacity: 0, y: d === 1 ? 18 : -18 },
    center: { opacity: 1, y: 0 },
    exit: (d: number) =>
      prefersReducedMotion
        ? { opacity: 0 }
        : { opacity: 0, y: d === 1 ? -18 : 18 },
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <motion.div
          key={swapKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: prefersReducedMotion ? 0.12 : 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const languageOptions = [
  { code: "en", label: msg("English") },
  { code: "de", label: msg("German") },
  { code: "es", label: msg("Spanish") },
  { code: "fr", label: msg("French") },
  { code: "ja", label: msg("Japanese") },
  { code: "pt-BR", label: msg("Portuguese (Brazil)") },
] as const satisfies ReadonlyArray<{
  code: DashboardLanguage;
  label: ReturnType<typeof msg>;
}>;

function getLanguageOption(locale: string) {
  const normalizedLocale = locale.toLowerCase();
  return languageOptions.find((language) =>
    normalizedLocale.startsWith(language.code.toLowerCase()),
  );
}

function useScrollAffordances<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    function updateScrollAffordances() {
      const element = ref.current;
      if (!element) {
        return;
      }

      setCanScrollUp(element.scrollTop > 2);
      setCanScrollDown(
        element.scrollTop + element.clientHeight < element.scrollHeight - 2,
      );
    }

    updateScrollAffordances();
    const element = ref.current;
    if (!element) {
      return;
    }

    element.addEventListener("scroll", updateScrollAffordances, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollAffordances);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updateScrollAffordances();
          });
    resizeObserver?.observe(element);

    return () => {
      element.removeEventListener("scroll", updateScrollAffordances);
      window.removeEventListener("resize", updateScrollAffordances);
      resizeObserver?.disconnect();
    };
  }, []);

  return { ref, canScrollUp, canScrollDown };
}

type DashboardAppChromeProps = {
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

function DashboardLanguageMenuItem({
  label,
  active,
  onClick,
}: Readonly<{
  label: string;
  active: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      className={cn("w-full text-left", getSidebarItemClassName(false))}
      onClick={onClick}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <Icon
          name="languages"
          className="size-[18px] shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--panel-ink)]"
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate group-hover:text-[var(--panel-ink)]",
            active && "text-[var(--panel-ink)]",
          )}
        >
          {label}
        </span>
      </span>
      {active ? (
        <Icon
          name="check"
          className="size-4 shrink-0 text-[var(--panel-ink)]"
        />
      ) : null}
    </button>
  );
}

function DashboardSuiteSwitcher({
  mobileNavOpen,
  onToggleMobileMenu,
  overlayActive,
  onCloseOverlay,
  prefersReducedMotion,
}: Readonly<{
  mobileNavOpen: boolean;
  onToggleMobileMenu: () => void;
  overlayActive: boolean;
  onCloseOverlay: () => void;
  prefersReducedMotion: boolean;
}>) {
  const gt = useGT();
  const previousOverlayActiveRef = useRef(overlayActive);
  const previousMobileNavOpenRef = useRef(mobileNavOpen);
  const mobileSwapKey = overlayActive
    ? "drawer-close"
    : mobileNavOpen
      ? "menu-close"
      : "menu-open";
  const desktopSwapKey = overlayActive ? "drawer-close" : "app-switcher";
  const mobileDirection: 1 | -1 =
    overlayActive !== previousOverlayActiveRef.current
      ? overlayActive
        ? 1
        : -1
      : mobileNavOpen !== previousMobileNavOpenRef.current
        ? mobileNavOpen
          ? 1
          : -1
        : 1;
  const desktopDirection: 1 | -1 =
    overlayActive !== previousOverlayActiveRef.current
      ? overlayActive
        ? 1
        : -1
      : 1;

  useEffect(() => {
    previousOverlayActiveRef.current = overlayActive;
    previousMobileNavOpenRef.current = mobileNavOpen;
  }, [mobileNavOpen, overlayActive]);

  return (
    <>
      <DashboardHeaderVerticalSwap
        swapKey={mobileSwapKey}
        direction={mobileDirection}
        prefersReducedMotion={prefersReducedMotion}
        className="shrink-0 lg:hidden"
      >
        <button
          type="button"
          className={cn(
            buttonClasses({ variant: "ghost", size: "sm" }),
            "border-zinc-700 px-3 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white",
          )}
          aria-label={
            overlayActive
              ? gt("Close drawer")
              : mobileNavOpen
                ? gt("Close menu")
                : gt("Open menu")
          }
          aria-expanded={!overlayActive ? mobileNavOpen : undefined}
          aria-controls={!overlayActive ? "dashboard-sidebar" : undefined}
          onClick={overlayActive ? onCloseOverlay : onToggleMobileMenu}
        >
          <Icon
            name={overlayActive || mobileNavOpen ? "close" : "menu"}
            className="size-5"
          />
        </button>
      </DashboardHeaderVerticalSwap>

      <DashboardHeaderVerticalSwap
        swapKey={desktopSwapKey}
        direction={desktopDirection}
        prefersReducedMotion={prefersReducedMotion}
        className="hidden shrink-0 lg:block"
      >
        {overlayActive ? (
          <button
            type="button"
            className={cn(
              buttonClasses({ variant: "ghost", size: "sm" }),
              "inline-flex h-10 items-center border-zinc-700 px-3 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white",
            )}
            aria-label={gt("Close drawer")}
            onClick={onCloseOverlay}
          >
            <Icon name="close" className="size-[18px] shrink-0" />
          </button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  buttonClasses({ variant: "ghost", size: "sm" }),
                  "inline-flex h-10 items-center border-zinc-700 px-3 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white",
                )}
                aria-label={gt("Open app switcher")}
              >
                <Boxes className="size-[18px] shrink-0" strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[min(calc(100vw-2rem),22rem)] p-1.5"
            >
              <DropdownMenuLabel className="px-3 pt-2">Apps</DropdownMenuLabel>
              <div className="px-3 pb-2 text-xs text-[var(--ink-muted)]">
                Switch between products in the suite.
              </div>
              <DropdownMenuSeparator />
              {suiteApps.map((app) => {
                const AppIcon = app.icon;

                return (
                  <DropdownMenuItem
                    key={app.name}
                    asChild
                    className={cn(
                      "cursor-pointer rounded-xl px-2.5 py-2.5",
                      app.isCurrent &&
                        "bg-[color-mix(in_srgb,var(--accent)_8%,white)]",
                    )}
                  >
                    <Link
                      href={app.href}
                      aria-current={app.isCurrent ? "page" : undefined}
                      onClick={(event) => {
                        if (app.href === "#") {
                          event.preventDefault();
                        }
                      }}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white/80 text-[var(--panel-ink)]">
                        <AppIcon className="size-[18px]" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--panel-ink)]">
                          {app.name}
                        </span>
                        <span className="block truncate text-xs text-[var(--ink-muted)]">
                          {app.description}
                        </span>
                      </span>
                      {app.isCurrent ? (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent)] text-black shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,white)]">
                          <Icon name="check" className="size-[14px]" />
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </DashboardHeaderVerticalSwap>
    </>
  );
}

const sidebarPanelVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction === 1 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 1 | -1) => ({
    x: direction === 1 ? "-100%" : "100%",
    opacity: 0,
  }),
};

type SidebarPanelTransition = {
  duration: number;
  ease: "linear" | [number, number, number, number];
};

function DashboardMainSidebarMenu({
  base,
  navActive,
}: Readonly<{
  base: string;
  navActive: (href: string) => boolean;
}>) {
  const m = useMessages();

  return (
    <SharedDashboardMainSidebarMenu
      base={base}
      navActive={navActive}
      renderLabel={m}
      renderFlag={m}
      renderHeader={m}
    />
  );
}

function DashboardSettingsSidebarMenu({
  base,
  activeLanguage,
  personalItems,
  accountItems,
  teamItem,
  organisationItem,
  onChangeLocale,
  onBack,
  transition,
  prefersReducedMotion,
}: Readonly<{
  base: string;
  activeLanguage: DashboardLanguage;
  personalItems: Array<DashboardNavItem & { active: boolean }>;
  accountItems: Array<DashboardNavItem & { active: boolean }>;
  teamItem: DashboardNavItem;
  organisationItem: DashboardNavItem;
  onChangeLocale: (nextLocale: DashboardLanguage) => void;
  onBack: () => void;
  transition: SidebarPanelTransition;
  prefersReducedMotion: boolean;
}>) {
  const gt = useGT();
  const m = useMessages();
  const settingsNavScroll = useScrollAffordances<HTMLElement>();
  const currentLanguage = getLanguageOption(activeLanguage);
  const currentLanguageLabel = currentLanguage
    ? m(currentLanguage.label)
    : activeLanguage;
  const [settingsMenuPanel, setSettingsMenuPanel] = useState<
    "settingsMenu" | "languageMenu"
  >("settingsMenu");
  const [settingsMenuDirection, setSettingsMenuDirection] = useState<1 | -1>(1);

  function renderSettingsMenuHeader() {
    if (settingsMenuPanel === "languageMenu") {
      return {
        title: gt("Change Language"),
        onBackClick: () => {
          setSettingsMenuDirection(-1);
          setSettingsMenuPanel("settingsMenu");
        },
      };
    }

    return {
      title: gt("Settings"),
      onBackClick: onBack,
    };
  }

  const settingsMenuHeader = renderSettingsMenuHeader();

  return (
    <>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 pb-0 pt-3.5">
        <button
          type="button"
          className="group inline-flex items-center -m-2 justify-self-start gap-0.5 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-white/70 hover:text-[var(--panel-ink)]"
          onClick={settingsMenuHeader.onBackClick}
        >
          <Icon
            name="chevronLeft"
            className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 motion-reduce:transform-none"
          />
          <span>{gt("Back")}</span>
        </button>
        <p className="col-start-2 text-center text-[13px] font-semibold text-[var(--panel-ink)]">
          {settingsMenuHeader.title}
        </p>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-3 top-0 z-10 h-px bg-[var(--line)] transition-opacity duration-200",
            settingsNavScroll.canScrollUp ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence
            initial={false}
            mode="sync"
            custom={settingsMenuDirection}
          >
            {settingsMenuPanel === "settingsMenu" ? (
              <motion.nav
                key="settings-menu"
                ref={settingsNavScroll.ref}
                custom={settingsMenuDirection}
                initial={prefersReducedMotion ? { opacity: 0 } : "enter"}
                animate="center"
                exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                variants={sidebarPanelVariants}
                transition={transition}
                className="absolute inset-0 flex min-h-0 flex-col gap-3 overflow-y-auto px-3 pb-4 pt-3"
              >
                <DashboardSidebarGroup header={gt("Personal Settings")}>
                  {personalItems.map((item) => (
                    <DashboardSidebarLinkItem
                      key={item.href}
                      item={item}
                      href={`${base}${item.href}`}
                      active={item.active}
                      label={m(item.label)}
                      flag={item.flag ? m(item.flag) : undefined}
                    />
                  ))}
                </DashboardSidebarGroup>

                <DashboardSidebarGroup header={gt("Account")}>
                  {accountItems.map((item) => (
                    <DashboardSidebarLinkItem
                      key={item.href}
                      item={item}
                      href={`${base}${item.href}`}
                      active={item.active}
                      label={m(item.label)}
                      flag={item.flag ? m(item.flag) : undefined}
                    />
                  ))}
                </DashboardSidebarGroup>

                <DashboardSidebarGroup header={gt("Teams")}>
                  <DashboardSidebarButtonItem
                    item={teamItem}
                    active={false}
                    onClick={() => void 0}
                    label={m(teamItem.label)}
                    flag={teamItem.flag ? m(teamItem.flag) : undefined}
                  />
                </DashboardSidebarGroup>

                <DashboardSidebarGroup header={gt("Organisation")}>
                  <DashboardSidebarButtonItem
                    item={organisationItem}
                    active={false}
                    onClick={() => void 0}
                    label={m(organisationItem.label)}
                    flag={
                      organisationItem.flag
                        ? m(organisationItem.flag)
                        : undefined
                    }
                  />
                </DashboardSidebarGroup>

                <DashboardSidebarGroup header={gt("Your System")}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left",
                      getSidebarItemClassName(false),
                    )}
                    onClick={() => {
                      setSettingsMenuDirection(1);
                      setSettingsMenuPanel("languageMenu");
                    }}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <Icon
                        name="languages"
                        className="size-[18px] shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--panel-ink)]"
                      />
                      <span className="min-w-0 flex-1 truncate group-hover:text-[var(--panel-ink)]">
                        {gt("Change Language")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-0 text-[var(--ink-subtle)] transition-colors group-hover:text-[var(--panel-ink)]">
                      <span className="text-[12px] font-medium text-[var(--ink-muted)]">
                        {currentLanguageLabel}
                      </span>
                      <Icon
                        name="chevronRight"
                        className="size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transform-none"
                      />
                    </span>
                  </button>
                </DashboardSidebarGroup>
              </motion.nav>
            ) : (
              <motion.nav
                key="language-menu"
                ref={settingsNavScroll.ref}
                custom={settingsMenuDirection}
                initial={prefersReducedMotion ? { opacity: 0 } : "enter"}
                animate="center"
                exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                variants={sidebarPanelVariants}
                transition={transition}
                className="absolute inset-0 flex min-h-0 flex-col gap-1 overflow-y-auto px-3 pb-4 pt-3"
              >
                {languageOptions.map((language) => (
                  <DashboardLanguageMenuItem
                    key={language.code}
                    label={m(language.label)}
                    active={activeLanguage === language.code}
                    onClick={() => {
                      if (language.code === activeLanguage) {
                        return;
                      }

                      setSettingsMenuDirection(-1);
                      setSettingsMenuPanel("settingsMenu");
                      onChangeLocale(language.code);
                    }}
                  />
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-3 bottom-0 z-10 flex h-10 items-end justify-center bg-gradient-to-t from-[var(--panel-strong)] via-[color-mix(in_srgb,var(--panel-strong)_88%,transparent)] to-transparent pb-1 transition-opacity duration-200",
            settingsNavScroll.canScrollDown ? "opacity-100" : "opacity-0",
          )}
        >
          <Icon
            name="chevronDown"
            className="size-4 text-[color-mix(in_srgb,var(--ink-subtle)_88%,white)]"
          />
        </div>
      </div>
    </>
  );
}

export function DashboardAppChrome({
  children,
  orgSlug,
  createWorkspaceHref,
  member,
  organization,
  workspaces,
  notifications,
}: Readonly<DashboardAppChromeProps>) {
  const gt = useGT();
  const {
    activeDrawer,
    activeDrawerHeaderLabel,
    activeDrawerTitle,
    closeDrawer,
    isOpen: drawerIsOpen,
  } = useDashboardDrawer();
  const previousHeaderOverlayActiveRef = useRef(activeDrawer !== null);
  const locale = useLocale();
  const m = useMessages();
  const router = useRouter();
  const pathname = usePathname() ?? `/${orgSlug}`;
  const base = `/${orgSlug}`;
  const resolvedLocale =
    normalizeDashboardLanguage(locale) ?? member.dashboardLanguage;
  const [selectedLanguage, setSelectedLanguage] = useState(
    member.dashboardLanguage,
  );
  const activeLanguage =
    normalizeDashboardLanguage(selectedLanguage) ?? member.dashboardLanguage;
  const settingsItem: DashboardNavItem = {
    label: gt("Settings"),
    href: "/profile",
    icon: "settings",
  };
  const personalSettingsNavItems: Array<
    DashboardNavItem & { active: boolean }
  > = [
    {
      label: gt("Profile"),
      href: "/profile",
      icon: "users",
      active: pathname === `${base}/profile`,
    },
    {
      label: gt("Calendars"),
      href: "/settings/calendars",
      icon: "calendar",
      active: navActive("/settings/calendars"),
    },
    {
      label: gt("Security"),
      href: "/settings/security",
      icon: "settings",
      active: navActive("/settings/security"),
    },
    {
      label: gt("Notifications"),
      href: "/settings/notifications",
      icon: "notifications",
      active: navActive("/settings/notifications"),
    },
    {
      label: gt("Out of Office"),
      href: "/settings/out-of-office",
      icon: "clock",
      active: navActive("/settings/out-of-office"),
    },
  ];
  const accountSettingsNavItems: Array<DashboardNavItem & { active: boolean }> =
    [
      {
        label: gt("General"),
        href: "/settings/account/general",
        icon: "settings",
        active: navActive("/settings/account/general"),
      },
      {
        label: gt("Email Setup"),
        href: "/settings/account/email-setup",
        icon: "notifications",
        active: navActive("/settings/account/email-setup"),
      },
      {
        label: gt("Security"),
        href: "/settings/account/security",
        icon: "settings",
        active: navActive("/settings/account/security"),
      },
      {
        label: gt("Billing"),
        href: "/settings/account/billing",
        icon: "analytics",
        active: navActive("/settings/account/billing"),
      },
    ];
  const createTeamItem: DashboardNavItem = {
    label: gt("Create Team"),
    href: "",
    icon: "team",
  };
  const createOrganisationItem: DashboardNavItem = {
    label: gt("Create Org"),
    href: "",
    icon: "building2",
  };
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const [mobileSupportAIChatOpen, setMobileSupportAIChatOpen] = useState(false);
  const [conversationsRailHidden, setConversationsRailHidden] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<"main" | "settings">(
    pathname === `${base}/profile` || pathname.startsWith(`${base}/settings/`)
      ? "settings"
      : "main",
  );
  const [sidebarDirection, setSidebarDirection] = useState<1 | -1>(1);
  const [supportAIChatShown, setSupportAIChatShown] = useState(
    member.supportAIChatShown,
  );
  const [supportAIChatWidth, setSupportAIChatWidth] = useState(
    MIN_SUPPORT_AI_CHAT_WIDTH,
  );
  const [isResizingSupportAIChat, setIsResizingSupportAIChat] = useState(false);
  const commandBarRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const supportAIChatPanelRef = useRef<HTMLDivElement>(null);
  const searchModKey = useSearchModifierKeyLabel();
  const isMobileViewport = useIsMobileViewport();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const persistSupportAIChatShown = useMutation(
    api.users.setSupportAIChatShown,
  );
  const persistDashboardLanguage = useMutation(api.users.setDashboardLanguage);

  useEffect(() => {
    setMobileNavOpen(false);
    setCommandOpen(false);
    setCommandSearch("");
    setMobileNotificationsOpen(false);
    setMobileAccountMenuOpen(false);
    setMobileSupportAIChatOpen(false);
  }, [pathname]);

  useEffect(() => {
    setSelectedLanguage(resolvedLocale);
  }, [resolvedLocale]);

  useEffect(() => {
    if (
      pathname === `${base}/profile` ||
      pathname.startsWith(`${base}/settings/`)
    ) {
      setSidebarDirection(1);
      setSidebarPanel("settings");
      return;
    }

    setSidebarDirection(-1);
    setSidebarPanel("main");
  }, [base, pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!(mobileSupportAIChatOpen && isMobileViewport)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileViewport, mobileSupportAIChatOpen]);

  useEffect(() => {
    if (isMobileViewport) {
      return;
    }

    setMobileNotificationsOpen(false);
    setMobileAccountMenuOpen(false);
    setMobileSupportAIChatOpen(false);
  }, [isMobileViewport]);

  useEffect(() => {
    function handleConversationsRailHidden(event: Event) {
      const detail = (event as CustomEvent<{ hidden?: boolean }>).detail;
      setConversationsRailHidden(detail?.hidden ?? false);
    }

    window.addEventListener(
      "kookly:conversations-rail-hidden",
      handleConversationsRailHidden as EventListener,
    );

    return () => {
      window.removeEventListener(
        "kookly:conversations-rail-hidden",
        handleConversationsRailHidden as EventListener,
      );
    };
  }, []);

  function closeMobileTopLevelOverlays() {
    setCommandOpen(false);
    setMobileNavOpen(false);
    setMobileNotificationsOpen(false);
    setMobileAccountMenuOpen(false);
    setMobileSupportAIChatOpen(false);
  }

  function toggleMobileMenu() {
    if (mobileNavOpen) {
      setMobileNavOpen(false);
      return;
    }

    closeMobileTopLevelOverlays();
    setMobileNavOpen(true);
  }

  function openMobileSearch() {
    closeMobileTopLevelOverlays();
    setCommandOpen(true);
  }

  function toggleMobileNotifications(nextOpen: boolean) {
    if (!nextOpen) {
      setMobileNotificationsOpen(false);
      return;
    }

    closeMobileTopLevelOverlays();
    setMobileNotificationsOpen(true);
  }

  function toggleMobileAccountMenu(nextOpen: boolean) {
    if (!nextOpen) {
      setMobileAccountMenuOpen(false);
      return;
    }

    closeMobileTopLevelOverlays();
    setMobileAccountMenuOpen(true);
  }

  function toggleMobileSupportAIChat() {
    if (mobileSupportAIChatOpen) {
      setMobileSupportAIChatOpen(false);
      return;
    }

    closeMobileTopLevelOverlays();
    setMobileSupportAIChatOpen(true);
  }

  function handleCompactSearchDismiss() {
    if (commandSearch.length > 0) {
      setCommandSearch("");
      commandInputRef.current?.focus();
      return;
    }

    setCommandOpen(false);
  }

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlDataset = html.dataset.dashboardAppShell;
    const previousBodyDataset = body.dataset.dashboardAppShell;
    const previousViewportHeight = html.style.getPropertyValue(
      DASHBOARD_APP_HEIGHT_VAR,
    );

    function applyViewportHeight() {
      const nextHeight = Math.round(
        window.visualViewport?.height ?? window.innerHeight,
      );
      html.style.setProperty(DASHBOARD_APP_HEIGHT_VAR, `${nextHeight}px`);
    }

    html.dataset.dashboardAppShell = "true";
    body.dataset.dashboardAppShell = "true";
    applyViewportHeight();

    const viewport = window.visualViewport;
    window.addEventListener("resize", applyViewportHeight);
    viewport?.addEventListener("resize", applyViewportHeight);
    viewport?.addEventListener("scroll", applyViewportHeight);

    return () => {
      window.removeEventListener("resize", applyViewportHeight);
      viewport?.removeEventListener("resize", applyViewportHeight);
      viewport?.removeEventListener("scroll", applyViewportHeight);

      if (previousHtmlDataset === undefined) {
        delete html.dataset.dashboardAppShell;
      } else {
        html.dataset.dashboardAppShell = previousHtmlDataset;
      }

      if (previousBodyDataset === undefined) {
        delete body.dataset.dashboardAppShell;
      } else {
        body.dataset.dashboardAppShell = previousBodyDataset;
      }

      if (previousViewportHeight) {
        html.style.setProperty(
          DASHBOARD_APP_HEIGHT_VAR,
          previousViewportHeight,
        );
      } else {
        html.style.removeProperty(DASHBOARD_APP_HEIGHT_VAR);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((open) => !open);
      } else if (e.key === "Escape") {
        setCommandOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!commandOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      commandInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [commandOpen]);

  useEffect(() => {
    if (!commandOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (commandBarRef.current?.contains(event.target as Node)) {
        return;
      }

      setCommandOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [commandOpen]);

  useEffect(() => {
    function onResize() {
      setSupportAIChatWidth((currentWidth) =>
        clampSupportAIChatWidth(currentWidth),
      );
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isResizingSupportAIChat) {
      return;
    }

    function stopResizing() {
      setIsResizingSupportAIChat(false);
    }

    function onPointerMove(event: PointerEvent) {
      const panelRect = supportAIChatPanelRef.current?.getBoundingClientRect();
      if (!panelRect) {
        return;
      }

      setSupportAIChatWidth(
        clampSupportAIChatWidth(panelRect.right - event.clientX),
      );
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [isResizingSupportAIChat]);

  function navActive(href: string) {
    if (href === "") {
      return pathname === base || pathname === `${base}/`;
    }
    return (
      pathname === `${base}${href}` || pathname.startsWith(`${base}${href}/`)
    );
  }

  function changeLocale(nextLocale: DashboardLanguage) {
    const previousLanguage =
      normalizeDashboardLanguage(selectedLanguage) ?? resolvedLocale;
    setSelectedLanguage(nextLocale);

    void persistDashboardLanguage({ dashboardLanguage: nextLocale }).catch(
      (error) => {
        setSelectedLanguage(previousLanguage);
        console.error("Failed to update dashboard language", error);
      },
    );
  }

  function toggleSupportAIChat() {
    const nextValue = !supportAIChatShown;
    setIsResizingSupportAIChat(false);
    setSupportAIChatShown(nextValue);
    void persistSupportAIChatShown({
      orgSlug,
      supportAIChatShown: nextValue,
    }).catch((error) => {
      console.error("Failed to update support AI chat visibility", error);
    });
  }

  function startSupportAIChatResize(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    setIsResizingSupportAIChat(true);
  }

  function runCommand(href: string) {
    setCommandOpen(false);
    setCommandSearch("");
    router.push(href);
  }

  const sidebarPanelTransition: SidebarPanelTransition = prefersReducedMotion
    ? { duration: 0.12, ease: "linear" as const }
    : {
        duration: 0.48,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      };
  const supportAIChatOpen = isMobileViewport
    ? mobileSupportAIChatOpen
    : supportAIChatShown;
  const isConversationsPage =
    pathname === `${base}/conversations` ||
    pathname.startsWith(`${base}/conversations/`);
  const headerOverlayActive = drawerIsOpen && activeDrawer !== null;
  const headerOverlayTitle = headerOverlayActive ? activeDrawerTitle : null;
  const headerTitleDirection: 1 | -1 =
    headerOverlayActive && !previousHeaderOverlayActiveRef.current
      ? 1
      : !headerOverlayActive && previousHeaderOverlayActiveRef.current
        ? -1
        : 1;

  useEffect(() => {
    previousHeaderOverlayActiveRef.current = headerOverlayActive;
  }, [headerOverlayActive]);

  const SidebarNav = (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <AnimatePresence initial={false} mode="sync" custom={sidebarDirection}>
        {sidebarPanel === "main" ? (
          <motion.div
            key="sidebar-main"
            custom={sidebarDirection}
            initial={prefersReducedMotion ? { opacity: 0 } : "enter"}
            animate="center"
            exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
            variants={sidebarPanelVariants}
            transition={sidebarPanelTransition}
            className="absolute inset-0 flex min-h-0 flex-col bg-[var(--panel-strong)]"
          >
            <DashboardMainSidebarMenu base={base} navActive={navActive} />
          </motion.div>
        ) : (
          <motion.div
            key="sidebar-settings"
            custom={sidebarDirection}
            initial={prefersReducedMotion ? { opacity: 0 } : "enter"}
            animate="center"
            exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
            variants={sidebarPanelVariants}
            transition={sidebarPanelTransition}
            className="absolute inset-0 flex min-h-0 flex-col bg-[var(--panel-strong)]"
          >
            <DashboardSettingsSidebarMenu
              base={base}
              activeLanguage={activeLanguage}
              personalItems={personalSettingsNavItems}
              accountItems={accountSettingsNavItems}
              teamItem={createTeamItem}
              organisationItem={createOrganisationItem}
              onChangeLocale={changeLocale}
              onBack={() => {
                setSidebarDirection(-1);
                setSidebarPanel("main");
              }}
              transition={sidebarPanelTransition}
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div
      data-dashboard-app-shell
      className="flex h-[var(--dashboard-app-height)] min-h-[var(--dashboard-app-height)] flex-col overflow-hidden bg-zinc-900 text-[var(--ink)]"
    >
      <header className="relative flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900 px-4 sm:gap-3 sm:px-6">
        <div
          className={cn(
            "relative z-10 flex min-w-0 shrink-0 items-center gap-2 bg-zinc-900 sm:gap-3",
            commandOpen && "max-lg:hidden",
          )}
        >
          <DashboardSuiteSwitcher
            mobileNavOpen={mobileNavOpen}
            overlayActive={headerOverlayActive}
            onCloseOverlay={closeDrawer}
            prefersReducedMotion={prefersReducedMotion}
            onToggleMobileMenu={
              isMobileViewport
                ? toggleMobileMenu
                : () => setMobileNavOpen((open) => !open)
            }
          />

          <DashboardHeaderVerticalSwap
            swapKey={
              headerOverlayActive && activeDrawer
                ? `drawer-${activeDrawer.id}`
                : "workspace"
            }
            direction={headerTitleDirection}
            prefersReducedMotion={prefersReducedMotion}
            className="min-w-0 shrink-0 max-sm:max-w-[9rem] sm:max-w-xs"
          >
            {headerOverlayTitle ? (
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {activeDrawerHeaderLabel ?? gt("Active panel")}
                </p>
                <div className="truncate font-[family-name:var(--font-dashboard-display)] text-lg font-semibold leading-tight text-zinc-100 sm:text-xl">
                  {headerOverlayTitle}
                </div>
              </div>
            ) : (
              <Link href={base} className="block min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Kookly
                </p>
                <p className="truncate font-(family-name:--font-dashboard-display) text-lg font-semibold leading-tight text-zinc-100 sm:text-xl">
                  {organization.name}
                </p>
              </Link>
            )}
          </DashboardHeaderVerticalSwap>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center px-4 sm:px-6",
            commandOpen && "z-[80]",
          )}
        >
          <div
            ref={commandBarRef}
            className={cn(
              "pointer-events-auto relative w-full max-w-[640px] min-w-0",
              !commandOpen && "hidden lg:block",
              commandOpen && "z-81",
            )}
          >
            {commandOpen ? (
              <Command
                label={gt("Workspace command menu")}
                loop
                className="relative z-81"
              >
                <div className="flex h-9 items-center gap-2.5 rounded-lg border border-zinc-500/70 bg-zinc-800/78 px-3.5 py-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:px-4">
                  <Icon
                    name="search"
                    className="size-4 shrink-0 text-zinc-100/90"
                  />
                  <Command.Input
                    ref={commandInputRef}
                    value={commandSearch}
                    onValueChange={setCommandSearch}
                    placeholder={gt("Search pages, workspaces, and actions")}
                    className="min-w-0 flex-1 bg-transparent py-0.5 text-sm leading-tight text-zinc-100 outline-none placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    className={cn(
                      buttonClasses({ variant: "ghost", size: "sm" }),
                      "h-8 w-8 shrink-0 border-transparent px-0! text-zinc-300 hover:border-transparent hover:bg-zinc-700/70 hover:text-white lg:hidden",
                    )}
                    onClick={handleCompactSearchDismiss}
                    aria-label={
                      commandSearch.length > 0
                        ? gt("Clear search")
                        : gt("Close search")
                    }
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                  <kbd className="hidden rounded-md border border-zinc-600/70 bg-zinc-900/60 px-1.5 py-0.5 font-sans text-[11px] font-medium leading-none text-zinc-400 shadow-sm lg:inline-flex">
                    ESC
                  </kbd>
                </div>
                <Command.List className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[82] max-h-[min(55vh,24rem)] overflow-y-auto rounded-lg border border-zinc-700/70 bg-zinc-800/96 p-2 shadow-[0_28px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                  <Command.Empty className="px-3 py-6 text-center text-sm text-zinc-400">
                    {gt("No matching commands.")}
                  </Command.Empty>
                  <Command.Group
                    heading={gt("Navigate")}
                    className="text-zinc-400 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em]"
                  >
                    {dashboardNavItems.map((item) => {
                      const href = `${base}${item.href}`;
                      return (
                        <Command.Item
                          key={href}
                          value={m(item.label)}
                          keywords={[item.href, gt("page"), orgSlug]}
                          onSelect={() => runCommand(href)}
                          className="group flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 outline-none select-none data-[selected=true]:bg-zinc-700/70 data-[selected=true]:text-white"
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-3">
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 text-zinc-400 group-data-[selected=true]:text-white"
                            />
                            <span className="truncate">{m(item.label)}</span>
                          </span>
                          <span className="text-xs text-zinc-500 group-data-[selected=true]:text-zinc-300">
                            {item.href || "/"}
                          </span>
                        </Command.Item>
                      );
                    })}
                    <Command.Item
                      value={gt("Settings")}
                      keywords={[
                        gt("workspace"),
                        gt("preferences"),
                        gt("configuration"),
                      ]}
                      onSelect={() => runCommand(`${base}/profile`)}
                      className="group flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 outline-none select-none data-[selected=true]:bg-zinc-700/70 data-[selected=true]:text-white"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <Icon
                          name="settings"
                          className="size-4 shrink-0 text-zinc-400 group-data-[selected=true]:text-white"
                        />
                        <span className="truncate">{gt("Settings")}</span>
                      </span>
                      <span className="text-xs text-zinc-500 group-data-[selected=true]:text-zinc-300">
                        /profile
                      </span>
                    </Command.Item>
                  </Command.Group>
                  <Command.Separator className="my-2 h-px bg-zinc-700/70" />
                  <Command.Group
                    heading={gt("Workspaces")}
                    className="text-zinc-400 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em]"
                  >
                    {workspaces.map((workspace) => (
                      <Command.Item
                        key={workspace.slug}
                        value={workspace.name}
                        keywords={[
                          workspace.slug,
                          gt("workspace"),
                          workspace.isCurrent ? gt("current") : "",
                        ]}
                        onSelect={() => runCommand(`/${workspace.slug}`)}
                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 outline-none select-none data-[selected=true]:bg-zinc-700/70 data-[selected=true]:text-white"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                workspace.brandColor ??
                                "rgb(113 113 122 / 0.9)",
                            }}
                          />
                          <span className="truncate">{workspace.name}</span>
                        </span>
                        <span className="text-xs text-zinc-500 group-data-[selected=true]:text-zinc-300">
                          {workspace.isCurrent ? gt("Current") : workspace.slug}
                        </span>
                      </Command.Item>
                    ))}
                    <Command.Item
                      value={gt("Create workspace")}
                      keywords={[gt("new"), gt("organization"), gt("company")]}
                      onSelect={() => runCommand(createWorkspaceHref)}
                      className="group flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 outline-none select-none data-[selected=true]:bg-zinc-700/70 data-[selected=true]:text-white"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <Icon
                          name="spark"
                          className="size-4 shrink-0 text-zinc-400 group-data-[selected=true]:text-white"
                        />
                        <span className="truncate">
                          {gt("Create workspace")}
                        </span>
                      </span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            ) : (
              <button
                type="button"
                className="flex h-9 w-full min-w-0 items-center gap-2.5 rounded-lg border border-zinc-600/50 bg-zinc-800/55 px-3.5 py-1.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-zinc-500/70 hover:bg-zinc-800/70 hover:ring-1 hover:ring-zinc-500/25 sm:px-4"
                onClick={
                  isMobileViewport
                    ? openMobileSearch
                    : () => setCommandOpen(true)
                }
                aria-label={gt("Search")}
              >
                <Icon
                  name="search"
                  className="size-4 shrink-0 text-zinc-100/90"
                />
                <span className="min-w-0 flex-1 truncate py-0.5 text-sm leading-tight text-zinc-500">
                  {gt("Search")}
                </span>
                <span
                  className="pointer-events-none hidden shrink-0 items-center gap-1 sm:inline-flex"
                  aria-hidden
                >
                  <kbd className="rounded-md border border-zinc-600/70 bg-zinc-900/60 px-1.5 py-0.5 font-sans text-[11px] font-medium leading-none text-zinc-400 shadow-sm">
                    {searchModKey}
                  </kbd>
                  <kbd className="rounded-md border border-zinc-600/70 bg-zinc-900/60 px-1.5 py-0.5 font-sans text-[11px] font-medium leading-none text-zinc-400 shadow-sm">
                    K
                  </kbd>
                </span>
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "relative z-10 flex min-w-0 shrink-0 items-center justify-end bg-zinc-900",
            commandOpen && "max-lg:hidden",
          )}
        >
          <div className="flex items-center gap-2 [&_button]:text-zinc-300 [&_button]:hover:bg-zinc-800 [&_button]:hover:text-white">
            <button
              type="button"
              className={cn(
                buttonClasses({ variant: "ghost", size: "sm" }),
                "h-10 w-10 shrink-0 border-transparent px-0! text-zinc-300 hover:border-transparent hover:bg-zinc-800 hover:text-white lg:hidden",
              )}
              onClick={
                isMobileViewport ? openMobileSearch : () => setCommandOpen(true)
              }
              aria-label={gt("Search")}
            >
              <Icon name="search" className="h-5 w-5" />
            </button>
            <NotificationsDropdown
              notifications={notifications}
              supportAIChatShown={
                isMobileViewport ? mobileSupportAIChatOpen : supportAIChatShown
              }
              onToggleSupportAIChat={
                isMobileViewport
                  ? toggleMobileSupportAIChat
                  : toggleSupportAIChat
              }
              mobileOpen={mobileNotificationsOpen}
              onMobileOpenChange={toggleMobileNotifications}
            />
          </div>
          <DashboardAccountMenu
            orgSlug={orgSlug}
            createWorkspaceHref={createWorkspaceHref}
            member={member}
            organization={organization}
            workspaces={workspaces}
            mobileOpen={mobileAccountMenuOpen}
            onMobileOpenChange={toggleMobileAccountMenu}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-lg">
        {mobileNavOpen ? (
          <button
            type="button"
            aria-label={gt("Close menu")}
            className="fixed inset-x-0 bottom-0 top-[52px] z-40 bg-[color-mix(in_srgb,var(--panel-ink)_35%,transparent)] backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <div className="flex min-h-0 flex-1 flex-row">
          <div className="relative flex min-h-0 min-w-0 flex-1">
            <aside
              className={cn(
                "fixed bottom-0 left-0 top-[52px] z-50 flex w-full min-h-0 flex-col overflow-hidden border-r border-[var(--line)] bg-[var(--panel-strong)] transition-transform duration-200 ease-out sm:w-[var(--sidebar-w)] lg:static lg:inset-auto lg:z-auto lg:h-full lg:translate-x-0 lg:flex-shrink-0",
                isConversationsPage &&
                  conversationsRailHidden &&
                  "lg:rounded-tr-lg",
                mobileNavOpen
                  ? "translate-x-0"
                  : "-translate-x-full lg:translate-x-0",
              )}
            >
              {SidebarNav}
              <AnimatePresence initial={false} mode="wait">
                {sidebarPanel === "main" ? (
                  <motion.div
                    key="sidebar-settings-trigger"
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { y: 18, opacity: 0 }
                    }
                    animate={{ y: 0, opacity: 1 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { y: 18, opacity: 0 }
                    }
                    transition={sidebarPanelTransition}
                    className="border-t border-[var(--line)] p-3"
                  >
                    <DashboardSidebarButtonItem
                      item={settingsItem}
                      active={false}
                      label={m(settingsItem.label)}
                      onClick={() => {
                        setSidebarDirection(1);
                        setSidebarPanel("settings");
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </aside>

            <main
              className={cn(
                "relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-tr-lg bg-[var(--canvas)]",
                isConversationsPage && "bg-black",
              )}
            >
              <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto">
                {children}
              </div>
            </main>
            <DashboardDrawerHost />
          </div>

          {mobileSupportAIChatOpen && isMobileViewport ? (
            <button
              type="button"
              aria-label={gt("Close support AI chat")}
              className="fixed inset-x-0 bottom-0 top-[52px] z-[60] bg-[color-mix(in_srgb,var(--panel-ink)_35%,transparent)] backdrop-blur-[2px] sm:hidden"
              onClick={toggleMobileSupportAIChat}
            />
          ) : null}

          <AnimatePresence initial={false}>
            {supportAIChatOpen ? (
              <motion.div
                key="support-ai-chat"
                ref={supportAIChatPanelRef}
                initial={
                  isMobileViewport
                    ? prefersReducedMotion
                      ? { opacity: 0 }
                      : { x: "100%", opacity: 1 }
                    : prefersReducedMotion
                      ? { width: supportAIChatWidth, opacity: 0 }
                      : { width: 0, opacity: 0 }
                }
                animate={
                  isMobileViewport
                    ? { x: 0, opacity: 1 }
                    : prefersReducedMotion
                      ? { width: supportAIChatWidth, opacity: 1 }
                      : { width: supportAIChatWidth, opacity: 1 }
                }
                exit={
                  isMobileViewport
                    ? prefersReducedMotion
                      ? { opacity: 0 }
                      : { x: "100%", opacity: 1 }
                    : prefersReducedMotion
                      ? { width: supportAIChatWidth, opacity: 0 }
                      : { width: 0, opacity: 0 }
                }
                transition={{
                  duration: isResizingSupportAIChat
                    ? 0
                    : prefersReducedMotion
                      ? 0.14
                      : 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "z-[70] flex min-h-0 flex-col overflow-hidden",
                  isMobileViewport
                    ? "fixed inset-x-0 bottom-0 top-[52px] h-auto w-full sm:hidden"
                    : "relative ml-1 h-full shrink-0 self-stretch rounded-tl-lg",
                )}
              >
                {isMobileViewport ? null : (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-[-0.625rem] top-0 z-[71] w-3 cursor-ew-resize touch-none"
                    onPointerDown={startSupportAIChatResize}
                  />
                )}
                <motion.aside
                  initial={
                    isMobileViewport
                      ? { opacity: 1 }
                      : prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, x: 24 }
                  }
                  animate={
                    isMobileViewport
                      ? { opacity: 1 }
                      : prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 1, x: 0 }
                  }
                  exit={
                    isMobileViewport
                      ? { opacity: 1 }
                      : prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, x: 24 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(
                    "relative z-[70] flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[color-mix(in_srgb,var(--panel)_92%,white)] px-5 pb-5 pt-16",
                    isMobileViewport
                      ? "h-full border-l-0 shadow-none"
                      : "border-l border-[var(--line)] shadow-[-12px_0_28px_color-mix(in_srgb,var(--panel-ink)_10%,transparent)]",
                  )}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-[72] flex items-start justify-between">
                    <AssistantEdgeActionButton
                      label={gt("Menu")}
                      icon={Menu}
                      className="rounded-br-2xl"
                      invertedCorners={["bottom-left", "top-right"]}
                    />
                    <AssistantEdgeActionButton
                      label={gt("New chat")}
                      icon={SquarePen}
                    />
                  </div>
                  <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white/75 p-4 shadow-[inset_0_1px_0_color-mix(in_srgb,white_88%,transparent)]">
                    <p className="text-sm font-medium text-[var(--panel-ink)]">
                      {gt("Assistant ready for this workspace")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                      {gt(
                        "This panel is now driven by your org-specific membership setting, so each teammate can decide whether support chat stays visible in this company workspace.",
                      )}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_72%,white)] p-4">
                      <p className="text-sm font-medium text-[var(--panel-ink)]">
                        {gt("Next up")}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                        {gt(
                          "Hook the assistant into real support threads, suggested actions, and booking context for the current organization.",
                        )}
                      </p>
                    </div>
                  </div>
                </motion.aside>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AssistantEdgeActionButton({
  label,
  icon: IconComponent,
  className,
  invertedCorners = [],
}: Readonly<{
  label: string;
  icon: LucideIcon;
  className?: string;
  invertedCorners?: Array<"bottom-left" | "top-right">;
}>) {
  return (
    <div className="pointer-events-auto group relative">
      <button
        type="button"
        title={label}
        aria-label={label}
        className={cn(
          "relative inline-flex h-14 w-14 items-center justify-center overflow-hidden border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_96%,white)] text-[var(--panel-ink)] shadow-[0_10px_24px_-18px_color-mix(in_srgb,var(--panel-ink)_24%,transparent)] transition duration-200 ease-out hover:bg-white",
          className,
        )}
      >
        {invertedCorners.includes("top-right") ? (
          <span className="pointer-events-none absolute right-0 top-0 h-6 w-6 rounded-bl-2xl bg-[color-mix(in_srgb,var(--panel)_92%,white)] shadow-[-1px_1px_0_0_var(--line)]" />
        ) : null}
        {invertedCorners.includes("bottom-left") ? (
          <span className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 rounded-tr-2xl bg-[color-mix(in_srgb,var(--panel)_92%,white)] shadow-[1px_-1px_0_0_var(--line)]" />
        ) : null}
        <IconComponent className="size-5" />
      </button>
      <div className="pointer-events-none absolute left-1/2 top-full z-[73] mt-2 -translate-x-1/2 rounded-md bg-[var(--panel-ink)] px-2 py-1 text-xs font-medium text-white opacity-0 shadow-[0_10px_20px_-12px_color-mix(in_srgb,var(--panel-ink)_48%,transparent)] transition duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </div>
    </div>
  );
}
