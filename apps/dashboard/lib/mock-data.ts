import { msg } from "gt-next";
import {
  dashboardLanguages,
  isDashboardLanguage,
} from "@convex/lib/dashboardLanguage";

export type DashboardFrame = ReturnType<typeof getDashboardFrame>;

export type MetricCardData = {
  label: string;
  value: string;
  delta: string;
  description: string;
  icon: "spark" | "users" | "revenue" | "calendar";
};

export type BookingEventTypeId = "demo" | "consult" | "support" | "internal";

export const BOOKING_EVENT_TYPE_ORDER = [
  "demo",
  "consult",
  "support",
  "internal",
] as const satisfies readonly BookingEventTypeId[];

export const BOOKING_EVENT_TYPE_LABELS: Record<BookingEventTypeId, string> = {
  demo: msg("Demo"),
  consult: msg("Consultation"),
  support: msg("Support"),
  internal: msg("Internal"),
};

export type MomentumDayPoint = {
  date: string;
  byType: Record<BookingEventTypeId, number>;
};

/** 14 calendar days of mock volume (fixed window for stable static / SSR output). */
function buildMomentumSeriesLast14Days(): MomentumDayPoint[] {
  const year = 2025;
  const monthIndex = 2; // March
  const endDay = 19;
  const series: MomentumDayPoint[] = [];

  for (let offset = 13; offset >= 0; offset--) {
    const day = endDay - offset;
    const d = new Date(Date.UTC(year, monthIndex, day, 12));
    const dow = d.getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 0.52 : 1;
    const i = 13 - offset;
    const demo = Math.max(2, Math.round((8 + (i % 5) + (i >> 2)) * weekend));
    const consult = Math.max(2, Math.round((6 + (i % 4)) * weekend));
    const support = Math.max(1, Math.round((4 + (i % 3)) * weekend));
    const internal = Math.max(1, Math.round((3 + (i % 2)) * weekend));
    series.push({
      date: d.toISOString().slice(0, 10),
      byType: { demo, consult, support, internal },
    });
  }

  return series;
}

export type UpcomingBooking = {
  initials: string;
  name: string;
  event: string;
  time: string;
  day: string;
};

export type DashboardNotification = {
  id: string;
  title: string;
  body?: string;
  time?: string;
  /** Optional deep link (e.g. booking detail). */
  href?: string;
};

export function getDashboardNotifications(orgSlug: string): DashboardNotification[] {
  void orgSlug; // reserved for org-scoped feed when wired to API
  return [];
}

export type DashboardNavItem = {
  label: string;
  href: string;
  icon:
    | "overview"
    | "calendar"
    | "calendarClock"
    | "team"
    | "routing"
    | "workflows"
    | "bookings"
    | "analytics"
    | "developerHub"
    | "settings"
    | "users"
    | "building2"
    | "notifications"
    | "clock"
    | "contactRound"
    | "messageSquare"
    | "ticket"
    | "bookOpenText";
  flag?: string;
  subItems?: Array<{
    label: string;
    href: string;
  }>;
};

export type DashboardNavGroup = {
  header?: string;
  items: DashboardNavItem[];
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    items: [
      { label: msg("Overview"), href: "", icon: "overview" },
      {
        label: msg("Leads"),
        href: "/leads",
        icon: "users",
        subItems: [
          { label: msg("Unassigned"), href: "/leads/unassigned" },
          { label: msg("Spam"), href: "/leads/spam" },
        ],
      },
      {
        label: msg("Conversations"),
        href: "/conversations",
        icon: "messageSquare",
        subItems: [
          { label: msg("Mentions"), href: "/conversations/mentions" },
          {
            label: msg("Created By You"),
            href: "/conversations/created-by-you",
          },
          {
            label: msg("All Conversations"),
            href: "/conversations/all-conversations",
          },
          { label: msg("Unassigned"), href: "/conversations/unassigned" },
          { label: msg("Spam"), href: "/conversations/spam" },
        ],
      },
      {
        label: msg("Tickets"),
        href: "/tickets",
        icon: "ticket",
        subItems: [
          { label: msg("Triage"), href: "/tickets/triage" },
          { label: msg("Issues"), href: "/tickets/issues" },
          { label: msg("Backlog"), href: "/tickets/backlog" },
        ],
      },
      {
        label: msg("Knowledge Base"),
        href: "/knowledge-base",
        icon: "bookOpenText",
      },
      {
        label: msg("Contacts"),
        href: "/contacts",
        icon: "contactRound",
        subItems: [
          { label: msg("Users"), href: "/contacts/users" },
          { label: msg("Company"), href: "/contacts/company" },
        ],
      },
      {
        label: msg("Routing"),
        href: "/routing",
        icon: "routing",
        flag: msg("Soon"),
      },
      {
        label: msg("Workflows"),
        href: "/workflows",
        icon: "workflows",
        flag: msg("Pending"),
      },
      { label: msg("Analytics"), href: "/analytics", icon: "analytics" },
      {
        label: msg("Developer Hub"),
        href: "/developer-hub",
        icon: "developerHub",
      },
    ],
  },
  {
    header: msg("Apps"),
    items: [],
  },
];

export const dashboardNavItems = dashboardNavGroups.flatMap((group) => group.items);

export const loginTrustPoints = [
  {
    title: msg("Routing without guesswork"),
    description: msg(
      "Centralize ownership, qualification, and assignment before leads disappear into inboxes.",
    ),
  },
  {
    title: msg("Calendar-aware by default"),
    description: msg(
      "The dashboard is being designed around live availability and conflict checks from day one.",
    ),
  },
];

export const registrationHighlights = [
  {
    title: msg("Operational first"),
    description: msg(
      "Each setup choice is written to support teams, event types, availability, and future routing logic.",
    ),
  },
  {
    title: msg("Warm, not sterile"),
    description: msg(
      "The dashboard aesthetic leans editorial and human so the product feels trusted instead of template-shaped.",
    ),
  },
];

export const onboardingTimezones = [
  "Australia/Sydney",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Asia/Singapore",
];

export const dashboardLocales = dashboardLanguages;

export function isSupportedLocale(locale: string) {
  return isDashboardLanguage(locale);
}

export function getLocaleDirection(locale: string) {
  return locale === "ar" ? "rtl" : "ltr";
}

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDashboardFrame(orgSlug: string) {
  return {
    organization: {
      name: titleCaseSlug(orgSlug),
      plan: msg("Growth"),
      seatLabel: msg("12 active seats"),
      timezone: "Australia/Sydney",
    },
    member: {
      name: "Alex Mercer",
      firstName: "Alex",
      role: msg("Owner"),
      initials: "AM",
    },
  };
}

export function getDashboardOverview(orgSlug: string) {
  const frame = getDashboardFrame(orgSlug);

  return {
    ...frame,
    metrics: [
      {
        label: msg("Confirmed bookings"),
        value: "284",
        delta: "+18%",
        description: msg(
          "Thirty-day volume is climbing while first-response time stays inside the target window.",
        ),
        icon: "spark",
      },
      {
        label: msg("Active hosts"),
        value: "12",
        delta: "+3",
        description: msg(
          "Three more teammates have active schedules synced and ready for round-robin setup.",
        ),
        icon: "users",
      },
      {
        label: msg("Pipeline revenue"),
        value: "$148k",
        delta: "+9%",
        description: msg(
          "High-intent meeting volume is translating into more qualified follow-up opportunities.",
        ),
        icon: "revenue",
      },
      {
        label: msg("Lead response window"),
        value: "1.8h",
        delta: "-12%",
        description: msg(
          "Routing improvements are reducing time-to-book for new inbound leads.",
        ),
        icon: "calendar",
      },
    ] satisfies MetricCardData[],
    momentumSeries: buildMomentumSeriesLast14Days(),
    upcomingBookings: [
      {
        initials: "JN",
        name: "Jordan Nguyen",
        event: msg("Enterprise qualification call"),
        time: msg("Today, 2:30 PM"),
        day: msg("Today"),
      },
      {
        initials: "MP",
        name: "Maya Patel",
        event: msg("Routing review with RevOps"),
        time: msg("Today, 4:00 PM"),
        day: msg("Today"),
      },
      {
        initials: "DL",
        name: "Diego Lewis",
        event: msg("Implementation handoff"),
        time: msg("Tomorrow, 9:00 AM"),
        day: msg("Tomorrow"),
      },
      {
        initials: "SK",
        name: "Sana Khan",
        event: msg("Growth planning sync"),
        time: msg("Tomorrow, 1:15 PM"),
        day: msg("Tomorrow"),
      },
    ] satisfies UpcomingBooking[],
  };
}
