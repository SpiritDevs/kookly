import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type AvailabilityRuleInput = {
  weekday: number;
  startMinute: number;
  endMinute: number;
};

type SeedTeammateInput = {
  authUserId: string;
  email: string;
  fullName: string;
  role: "admin" | "member";
};

function buildSeedBookingsBase(now: number) {
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const base = startOfDay.getTime();

  return [
    {
      attendeeName: "Jordan Nguyen",
      attendeeEmail: "jordan@example.com",
      startsAt: base + (1 * 24 + 15) * 60 * 60 * 1000,
      endsAt: base + (1 * 24 + 15.5) * 60 * 60 * 1000,
      timezone: "America/Los_Angeles",
      status: "confirmed" as const,
      source: "Routing form",
      notes: "Qualified from enterprise pricing path.",
    },
    {
      attendeeName: "Maya Patel",
      attendeeEmail: "maya@example.com",
      startsAt: base + (2 * 24 + 16) * 60 * 60 * 1000,
      endsAt: base + (2 * 24 + 16.5) * 60 * 60 * 1000,
      timezone: "America/New_York",
      status: "pending" as const,
      source: "Direct booking page",
      notes: "Pending calendar confirmation from Google.",
    },
    {
      attendeeName: "Diego Lewis",
      attendeeEmail: "diego@example.com",
      startsAt: base + (3 * 24 + 9) * 60 * 60 * 1000,
      endsAt: base + (3 * 24 + 10) * 60 * 60 * 1000,
      timezone: "Europe/London",
      status: "confirmed" as const,
      source: "Round-robin demo",
      notes: "Assigned to primary owner while team seats are empty.",
    },
  ];
}

function buildSeedLeads(now: number, ownerUserIds: Array<Id<"users"> | null>) {
  const sources = ["Website", "Referral", "Partner", "Outbound", "Webinar"];
  const statuses = ["new", "qualified", "working", "won", "lost", "spam"] as const;
  const companies = [
    "Northstar Health",
    "Acme Finance",
    "Bluebird Labs",
    "Summit Legal",
    "Harbor Retail",
    "Maple Ventures",
    "Granite Cloud",
    "Orbit AI",
    "Lighthouse HR",
    "Signal Works",
    "Pioneer Ops",
    "Helio Commerce",
  ];
  const firstNames = [
    "Avery",
    "Riley",
    "Sasha",
    "Parker",
    "Emerson",
    "Logan",
    "Taylor",
    "Jordan",
    "Morgan",
    "Casey",
    "Quinn",
    "Jamie",
  ];
  const lastNames = [
    "Nguyen",
    "Patel",
    "Lewis",
    "Singh",
    "Chen",
    "Martinez",
    "Wilson",
    "Brown",
    "Kim",
    "Garcia",
    "Johnson",
    "Lopez",
  ];

  return Array.from({ length: 72 }, (_, index) => {
    const firstName = firstNames[index % firstNames.length] ?? "Lead";
    const lastName =
      lastNames[(index * 3) % lastNames.length] ?? `Contact ${index + 1}`;
    const companyName = companies[index % companies.length] ?? `Company ${index + 1}`;
    const status = statuses[index % statuses.length] ?? "new";
    const ownerUserId = ownerUserIds[index % ownerUserIds.length] ?? null;
    const createdAt = now - (72 - index) * 6 * 60 * 60 * 1000;
    const lastActivityAt = createdAt + ((index % 5) + 1) * 60 * 60 * 1000;
    const score = 25 + ((index * 9) % 74);

    return {
      companyName,
      createdAt,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@example.com`,
      fullName: `${firstName} ${lastName}`,
      isSpam: status === "spam",
      lastActivityAt,
      notes:
        status === "won"
          ? "Converted after demo follow-up."
          : status === "lost"
            ? "Budget timing slipped to next quarter."
            : status === "spam"
              ? "Low-quality inbound captured by routing checks."
              : "Needs coordinated follow-up from the team.",
      ownerUserId,
      score,
      source: sources[index % sources.length] ?? "Website",
      status,
    };
  });
}

async function ensureSeedTeammate(
  ctx: MutationCtx,
  organization: Doc<"organizations">,
  input: SeedTeammateInput,
) {
  const now = Date.now();
  let user = await ctx.db
    .query("users")
    .withIndex("authUserId", (q) => q.eq("authUserId", input.authUserId))
    .unique();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      authUserId: input.authUserId,
      email: input.email,
      fullName: input.fullName,
      firstName: input.fullName.split(" ")[0] ?? input.fullName,
      lastName: input.fullName.split(" ").slice(1).join(" ") || undefined,
      imageUrl: null,
      status: "active",
      onboardingStatus: "completed",
      dashboardLanguage: "en",
      createdAt: now,
      updatedAt: now,
    });
    user = await ctx.db.get(userId);
  }

  if (!user) {
    throw new Error("Seed teammate could not be created.");
  }

  const membership = await ctx.db
    .query("organizationMemberships")
    .withIndex("organizationId_userId", (q) =>
      q.eq("organizationId", organization._id).eq("userId", user._id),
    )
    .unique();

  if (!membership) {
    await ctx.db.insert("organizationMemberships", {
      organizationId: organization._id,
      userId: user._id,
      role: input.role,
      dashboardLanguage: "en",
      createdAt: now,
      updatedAt: now,
    });
  }

  return user;
}

export async function ensureDashboardSeedData(
  ctx: MutationCtx,
  appUser: Doc<"users">,
  organization: Doc<"organizations">,
  defaultScheduleId: Id<"availabilitySchedules">,
  eventTypeId: Id<"eventTypes">,
  availabilityRules: AvailabilityRuleInput[],
) {
  const now = Date.now();
  const seededTeammates = await Promise.all([
    ensureSeedTeammate(ctx, organization, {
      authUserId: "seed-user-alex-morgan",
      email: "alex.morgan@example.com",
      fullName: "Alex Morgan",
      role: "admin",
    }),
    ensureSeedTeammate(ctx, organization, {
      authUserId: "seed-user-priya-shah",
      email: "priya.shah@example.com",
      fullName: "Priya Shah",
      role: "member",
    }),
  ]);

  const existingRoutingRule = await ctx.db
    .query("routingRules")
    .withIndex("organizationId_priority", (q) => q.eq("organizationId", organization._id))
    .first();

  if (!existingRoutingRule) {
    await ctx.db.insert("routingRules", {
      organizationId: organization._id,
      label: "Enterprise accounts",
      field: "company_size",
      value: "200+",
      destinationKind: "eventType",
      destinationId: String(eventTypeId),
      destinationLabel: "Priority demo",
      priority: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingInvite = await ctx.db
    .query("teamInvites")
    .withIndex("organizationId_email", (q) =>
      q.eq("organizationId", organization._id).eq("email", "ops@example.com"),
    )
    .unique();

  if (!existingInvite) {
    await ctx.db.insert("teamInvites", {
      organizationId: organization._id,
      email: "ops@example.com",
      fullName: "Taylor Operations",
      role: "admin",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingOverride = await ctx.db
    .query("availabilityOverrides")
    .withIndex("availabilityScheduleId_date", (q) =>
      q.eq("availabilityScheduleId", defaultScheduleId).eq("date", "2026-03-24"),
    )
    .unique();

  if (!existingOverride) {
    await ctx.db.insert("availabilityOverrides", {
      availabilityScheduleId: defaultScheduleId,
      date: "2026-03-24",
      startMinute: 13 * 60,
      endMinute: 17 * 60,
      isUnavailable: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingBookings = await ctx.db
    .query("bookings")
    .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
    .take(1);

  if (existingBookings.length === 0) {
    for (const booking of buildSeedBookingsBase(now)) {
      const bookingId = await ctx.db.insert("bookings", {
        organizationId: organization._id,
        eventTypeId,
        assigneeUserId: appUser._id,
        attendeeName: booking.attendeeName,
        attendeeEmail: booking.attendeeEmail,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        timezone: booking.timezone,
        status: booking.status,
        source: booking.source,
        notes: booking.notes,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("bookingAuditEvents", {
        bookingId,
        organizationId: organization._id,
        message: `Booking created via ${booking.source.toLowerCase()}.`,
        createdAt: now,
      });
    }
  }

  const existingLeads = await ctx.db
    .query("leads")
    .withIndex("by_organizationId", (q) => q.eq("organizationId", organization._id))
    .take(1);

  if (existingLeads.length === 0) {
    const ownerUserIds: Array<Id<"users"> | null> = [
      appUser._id,
      seededTeammates[0]?._id ?? null,
      seededTeammates[1]?._id ?? null,
      null,
    ];

    for (const lead of buildSeedLeads(now, ownerUserIds)) {
      await ctx.db.insert("leads", {
        organizationId: organization._id,
        fullName: lead.fullName,
        email: lead.email,
        companyName: lead.companyName,
        status: lead.status,
        source: lead.source,
        ownerUserId: lead.ownerUserId,
        score: lead.score,
        notes: lead.notes,
        isSpam: lead.isSpam,
        createdAt: lead.createdAt,
        lastActivityAt: lead.lastActivityAt,
        updatedAt: now,
      });
    }
  }

  if ((organization.locale ?? null) === null || organization.bookingIntervalMinutes === undefined) {
    await ctx.db.patch(organization._id, {
      locale: organization.locale ?? "en",
      brandColor: organization.brandColor ?? "#5b5bd6",
      bookingNoticeHours: organization.bookingNoticeHours ?? 12,
      bookingBufferMinutes: organization.bookingBufferMinutes ?? 15,
      bookingIntervalMinutes: organization.bookingIntervalMinutes ?? 30,
      bookingHorizonDays: organization.bookingHorizonDays ?? 45,
      updatedAt: now,
    });
  }

  if (availabilityRules.length === 0) {
    for (const rule of [
      { weekday: 1, startMinute: 9 * 60, endMinute: 17 * 60 },
      { weekday: 2, startMinute: 9 * 60, endMinute: 17 * 60 },
      { weekday: 3, startMinute: 9 * 60, endMinute: 17 * 60 },
      { weekday: 4, startMinute: 9 * 60, endMinute: 17 * 60 },
      { weekday: 5, startMinute: 9 * 60, endMinute: 17 * 60 },
    ]) {
      await ctx.db.insert("availabilityRules", {
        availabilityScheduleId: defaultScheduleId,
        weekday: rule.weekday,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
