import { describe, expect, test } from "bun:test";
import {
  buildRoutingPreview,
  filterBookingsByStatus,
  formatMinutesOfDay,
  summarizeWeeklyRules,
} from "./dashboard-format";
import { getPostAuthRedirectPathFromViewer } from "./auth-redirect-path";
import { toSlug } from "./onboarding-draft";

describe("dashboard formatting helpers", () => {
  test("formats minutes of day into 12-hour time", () => {
    expect(formatMinutesOfDay(9 * 60)).toBe("9:00 AM");
    expect(formatMinutesOfDay(14 * 60 + 15)).toBe("2:15 PM");
  });

  test("summarizes weekly rules in calendar order", () => {
    expect(
      summarizeWeeklyRules([
        { weekday: 3, startMinute: 13 * 60, endMinute: 17 * 60 },
        { weekday: 1, startMinute: 9 * 60, endMinute: 12 * 60 },
      ]),
    ).toEqual(["Monday · 9:00 AM–12:00 PM", "Wednesday · 1:00 PM–5:00 PM"]);
  });

  test("filters bookings by status", () => {
    const bookings = [
      { id: "1", status: "confirmed" },
      { id: "2", status: "pending" },
    ];

    expect(filterBookingsByStatus(bookings, "all")).toHaveLength(2);
    expect(filterBookingsByStatus(bookings, "confirmed")).toEqual([{ id: "1", status: "confirmed" }]);
  });

  test("builds deterministic routing previews", () => {
    const rules = [
      {
        field: "company_size",
        value: "200+",
        destinationLabel: "Priority demo",
        priority: 1,
        isActive: true,
      },
      {
        field: "company_size",
        value: "50+",
        destinationLabel: "SMB demo",
        priority: 2,
        isActive: true,
      },
    ];

    expect(buildRoutingPreview(rules, { company_size: "200+" })).toBe("Priority demo");
    expect(buildRoutingPreview(rules, { company_size: "10+" })).toBe("Fallback owner review");
  });
});

describe("dashboard routing helpers", () => {
  test("normalizes onboarding slugs", () => {
    expect(toSlug("Northstar Revenue!!")).toBe("northstar-revenue");
  });

  test("redirects completed users into their org workspace", () => {
    expect(
      getPostAuthRedirectPathFromViewer({
        dashboardLanguage: "de",
        onboardingStatus: "completed",
        defaultOrganizationSlug: "northstar",
      }),
    ).toBe("/northstar");
  });

  test("redirects incomplete users into onboarding", () => {
    expect(
      getPostAuthRedirectPathFromViewer({
        dashboardLanguage: "ja",
        onboardingStatus: "integrations",
        defaultOrganizationSlug: null,
      }),
    ).toBe("/onboarding");
  });
});
