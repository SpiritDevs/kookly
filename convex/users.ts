import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { ConvexError, v } from "convex/values";
import { ensureDashboardSeedData } from "./dashboardSeed";
import {
  DEFAULT_DASHBOARD_LANGUAGE,
  type DashboardLanguage,
} from "./lib/dashboardLanguage";

const DEFAULT_CALENDAR_PROVIDER = "google";
const DEFAULT_MEETING_PROVIDER = "google-meet";
const DEFAULT_SYNC_MODE = "conflicts";
const dashboardLanguageValidator = v.union(
  v.literal("en"),
  v.literal("de"),
  v.literal("es"),
  v.literal("fr"),
  v.literal("ja"),
  v.literal("pt-BR"),
);

function splitViewerName(fullName: string) {
  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return { firstName: null, lastName: null };
  }

  const [firstName = "", ...remainingParts] = trimmedName.split(/\s+/);

  return {
    firstName: firstName || null,
    lastName: remainingParts.length > 0 ? remainingParts.join(" ") : null,
  };
}

function buildInitials(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "SP";
  }

  if (parts.length === 1) {
    return (parts[0] ?? "SP").slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeRequiredText(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function validateDurationMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Meeting length must be greater than zero.");
  }

  return Math.round(value);
}

function getAvailabilityPresetRules(preset: string) {
  const dayWindow =
    preset === "extended"
      ? { startMinute: 8 * 60, endMinute: 18 * 60 }
      : preset === "compact"
        ? { startMinute: 10 * 60, endMinute: 16 * 60 }
        : { startMinute: 9 * 60, endMinute: 17 * 60 };

  return [1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    startMinute: dayWindow.startMinute,
    endMinute: dayWindow.endMinute,
  }));
}

function isUnauthenticatedError(error: unknown) {
  return error instanceof ConvexError && error.data === "Unauthenticated";
}

async function getViewer(ctx: QueryCtx | MutationCtx) {
  let authUser;
  try {
    authUser = await authComponent.getAuthUser(ctx);
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return null;
    }
    throw error;
  }

  if (!authUser) {
    return null;
  }

  const appUser = await ctx.db
    .query("users")
    .withIndex("authUserId", (q) => q.eq("authUserId", authUser._id))
    .unique();

  if (!appUser) {
    return {
      authUser,
      appUser: null,
    };
  }

  return {
    authUser,
    appUser,
  };
}

async function collectWorkspacesForUser(
  ctx: QueryCtx,
  userId: Id<"users">,
  currentOrgSlug: string,
) {
  const memberships = await ctx.db
    .query("organizationMemberships")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();

  const workspaceEntries = await Promise.all(
    memberships.map(async (m) => {
      const org = await ctx.db.get(m.organizationId);
      if (!org) {
        return null;
      }

      return {
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl ?? null,
        brandColor: org.brandColor ?? null,
        isCurrent: org.slug === currentOrgSlug,
      };
    }),
  );

  const workspaces: Array<{
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string | null;
    isCurrent: boolean;
  }> = [];
  for (const entry of workspaceEntries) {
    if (entry) {
      workspaces.push(entry);
    }
  }
  workspaces.sort((a, b) => a.name.localeCompare(b.name));
  return workspaces;
}

const MAX_PROFILE_BIO_LENGTH = 2000;

function validateProfileAccentColor(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const t = value.trim();
  if (!t) {
    return null;
  }
  if (
    /^#[0-9a-fA-F]{3}$/.test(t) ||
    /^#[0-9a-fA-F]{6}$/.test(t) ||
    /^#[0-9a-fA-F]{8}$/.test(t)
  ) {
    return t;
  }
  throw new Error("Profile color must be a valid hex value.");
}

function validateProfileImageUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const t = value.trim();
  return t || null;
}

async function getCurrentOrganizationForUser(
  ctx: QueryCtx | MutationCtx,
  appUser: Doc<"users">,
) {
  if (appUser.defaultOrganizationId) {
    const defaultOrganization = await ctx.db.get(appUser.defaultOrganizationId);
    if (defaultOrganization) {
      return defaultOrganization;
    }
  }

  return await ctx.db
    .query("organizations")
    .withIndex("createdByUserId", (q) => q.eq("createdByUserId", appUser._id))
    .first();
}

async function ensureOrganizationMembership(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
  dashboardLanguage: DashboardLanguage,
) {
  const membership = await ctx.db
    .query("organizationMemberships")
    .withIndex("organizationId_userId", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .unique();

  if (membership) {
    if (
      membership.role !== "owner" ||
      membership.dashboardLanguage !== dashboardLanguage
    ) {
      await ctx.db.patch(membership._id, {
        role: "owner",
        dashboardLanguage,
        updatedAt: Date.now(),
      });
    }
    return membership;
  }

  const now = Date.now();
  await ctx.db.insert("organizationMemberships", {
    organizationId,
    userId,
    role: "owner",
    dashboardLanguage,
    supportAIChatShown: false,
    createdAt: now,
    updatedAt: now,
  });

  return null;
}

async function ensureOwnedOrganizationForViewer(
  ctx: MutationCtx,
  appUser: Doc<"users">,
  organizationId: Id<"organizations">,
) {
  const organization = await ctx.db.get(organizationId);

  if (!organization) {
    throw new Error("We couldn't find your organization. Try the previous step again.");
  }

  if (organization.createdByUserId !== appUser._id) {
    throw new Error("Only the organization owner can update this workspace.");
  }

  return organization;
}

async function ensureOrganizationFromDraft(
  ctx: MutationCtx,
  appUser: Doc<"users">,
) {
  return await ensureOrganizationFromValues(ctx, appUser, {
    organizationName: appUser.onboardingOrganizationName ?? "",
    organizationSlug: appUser.onboardingOrganizationSlug ?? "",
    organizationTimezone: appUser.onboardingTimezone ?? "",
  });
}

async function ensureOrganizationFromValues(
  ctx: MutationCtx,
  appUser: Doc<"users">,
  values: {
    organizationName: string;
    organizationSlug: string;
    organizationTimezone: string;
    logoUrl?: string;
    logoStorageKey?: string;
  },
) {
  const organizationName = sanitizeRequiredText(
    values.organizationName,
    "Organization name",
  );
  const organizationSlug = normalizeSlug(
    sanitizeRequiredText(values.organizationSlug, "Booking slug"),
  );
  const organizationTimezone = sanitizeRequiredText(
    values.organizationTimezone,
    "Primary time zone",
  );

  let currentOrganization = await getCurrentOrganizationForUser(ctx, appUser);

  const existingOrganization = await ctx.db
    .query("organizations")
    .withIndex("slug", (q) => q.eq("slug", organizationSlug))
    .unique();

  if (
    existingOrganization &&
    existingOrganization._id !== currentOrganization?._id &&
    existingOrganization.createdByUserId !== appUser._id
  ) {
    throw new Error("That booking slug is already in use.");
  }

  const now = Date.now();

  if (currentOrganization) {
    await ensureOwnedOrganizationForViewer(ctx, appUser, currentOrganization._id);

    await ctx.db.patch(currentOrganization._id, {
      name: organizationName,
      slug: organizationSlug,
      timezone: organizationTimezone,
      ...(values.logoUrl
        ? {
            logoUrl: values.logoUrl,
            logoStorageKey: values.logoStorageKey ?? null,
          }
        : {}),
      updatedAt: now,
    });
    currentOrganization = await ctx.db.get(currentOrganization._id);
  } else if (existingOrganization && existingOrganization.createdByUserId === appUser._id) {
    await ctx.db.patch(existingOrganization._id, {
      name: organizationName,
      slug: organizationSlug,
      timezone: organizationTimezone,
      ...(values.logoUrl
        ? {
            logoUrl: values.logoUrl,
            logoStorageKey: values.logoStorageKey ?? null,
          }
        : {}),
      updatedAt: now,
    });
    currentOrganization = await ctx.db.get(existingOrganization._id);
  } else {
    const organizationId = await ctx.db.insert("organizations", {
      name: organizationName,
      slug: organizationSlug,
      logoUrl: values.logoUrl ?? null,
      logoStorageKey: values.logoStorageKey ?? null,
      timezone: organizationTimezone,
      createdByUserId: appUser._id,
      createdAt: now,
      updatedAt: now,
    });
    currentOrganization = await ctx.db.get(organizationId);
  }

  if (!currentOrganization) {
    throw new Error("We couldn't create the organization. Try again.");
  }

  await ensureOrganizationMembership(
    ctx,
    currentOrganization._id,
    appUser._id,
    appUser.dashboardLanguage ?? DEFAULT_DASHBOARD_LANGUAGE,
  );

  return {
    organization: currentOrganization,
    organizationSlug,
    organizationTimezone,
  };
}

async function ensureDefaultAvailabilitySchedule(
  ctx: MutationCtx,
  appUser: Doc<"users">,
  organizationId: Id<"organizations">,
  timezone: string,
  availabilityPreset: string,
) {
  const existingDefaultSchedule = await ctx.db
    .query("availabilitySchedules")
    .withIndex("organizationId_isDefault", (q) =>
      q.eq("organizationId", organizationId).eq("isDefault", true),
    )
    .unique();

  if (existingDefaultSchedule) {
    return existingDefaultSchedule;
  }

  const now = Date.now();
  const scheduleId = await ctx.db.insert("availabilitySchedules", {
    organizationId,
    name: "Default weekly availability",
    timezone,
    isDefault: true,
    createdByUserId: appUser._id,
    createdAt: now,
    updatedAt: now,
  });

  const rules = getAvailabilityPresetRules(availabilityPreset);
  for (const rule of rules) {
    await ctx.db.insert("availabilityRules", {
      availabilityScheduleId: scheduleId,
      weekday: rule.weekday,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
      createdAt: now,
      updatedAt: now,
    });
  }

  const schedule = await ctx.db.get(scheduleId);
  if (!schedule) {
    throw new Error("We couldn't create the default availability schedule.");
  }

  return schedule;
}

async function buildUniqueEventTypeSlug(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  rawName: string,
) {
  const baseSlug = normalizeSlug(rawName) || "intro-call";
  let nextSlug = baseSlug;
  let suffix = 2;

  while (true) {
    const existingEventType = await ctx.db
      .query("eventTypes")
      .withIndex("organizationId_slug", (q) =>
        q.eq("organizationId", organizationId).eq("slug", nextSlug),
      )
      .unique();

    if (!existingEventType) {
      return nextSlug;
    }

    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function ensureSeededEventType(
  ctx: MutationCtx,
  appUser: Doc<"users">,
  organizationId: Id<"organizations">,
  availabilityScheduleId: Id<"availabilitySchedules">,
  name: string,
  durationMinutes: number,
  timezone: string,
) {
  const existingEventType = await ctx.db
    .query("eventTypes")
    .withIndex("organizationId", (q) => q.eq("organizationId", organizationId))
    .first();

  if (existingEventType) {
    return existingEventType;
  }

  const now = Date.now();
  const slug = await buildUniqueEventTypeSlug(ctx, organizationId, name);
  const eventTypeId = await ctx.db.insert("eventTypes", {
    organizationId,
    availabilityScheduleId,
    createdByUserId: appUser._id,
    hostMode: "single-host",
    name,
    slug,
    durationMinutes,
    timezone,
    isActive: true,
    bookingQuestion: "What should we prepare before the call?",
    minNoticeMinutes: 12 * 60,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
    slotIntervalMinutes: 30,
    bookingHorizonDays: 45,
    createdAt: now,
    updatedAt: now,
  });

  const eventType = await ctx.db.get(eventTypeId);
  if (!eventType) {
    throw new Error("We couldn't create the first event type.");
  }

  return eventType;
}

function buildOrganizationNameFromSlug(slug: string) {
  return titleCase(slug);
}

export const viewerRoutingState = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);

    if (!viewer) {
      return null;
    }

    const { authUser, appUser } = viewer;

    if (!appUser) {
      const derivedName = splitViewerName(authUser.name);

      return {
        authUserId: authUser._id,
        email: authUser.email,
        fullName: authUser.name,
        firstName: derivedName.firstName,
        lastName: derivedName.lastName,
        dashboardLanguage: DEFAULT_DASHBOARD_LANGUAGE,
        onboardingStatus: "organization" as const,
        defaultOrganizationSlug: null,
      };
    }

    const derivedName = splitViewerName(appUser.fullName);

    const fallbackMembership = await ctx.db
      .query("organizationMemberships")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .first();

    const defaultOrganizationId =
      appUser.defaultOrganizationId ?? fallbackMembership?.organizationId ?? null;
    const defaultMembership = defaultOrganizationId
      ? await ctx.db
          .query("organizationMemberships")
          .withIndex("organizationId_userId", (q) =>
            q.eq("organizationId", defaultOrganizationId).eq("userId", appUser._id),
          )
          .unique()
      : null;

    const defaultOrganization = defaultOrganizationId
      ? await ctx.db.get(defaultOrganizationId)
      : null;

    return {
      appUserId: appUser._id,
      authUserId: appUser.authUserId,
      email: appUser.email,
      fullName: appUser.fullName,
      firstName: appUser.firstName ?? derivedName.firstName,
      lastName: appUser.lastName ?? derivedName.lastName,
      dashboardLanguage: appUser.dashboardLanguage ?? DEFAULT_DASHBOARD_LANGUAGE,
      onboardingStatus: appUser.onboardingStatus,
      defaultOrganizationSlug: defaultOrganization?.slug ?? null,
    };
  },
});

export const viewerDashboardLanguage = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      return null;
    }

    return viewer.appUser.dashboardLanguage ?? DEFAULT_DASHBOARD_LANGUAGE;
  },
});

export const currentOnboardingOrganization = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      return null;
    }

    const organization = await getCurrentOrganizationForUser(ctx, viewer.appUser);

    if (!organization) {
      return null;
    }

    return {
      organizationId: organization._id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      timezone: organization.timezone ?? null,
      logoUrl: organization.logoUrl ?? null,
      logoStorageKey: organization.logoStorageKey ?? null,
    };
  },
});

export const organizationSlugAvailability = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const normalizedSlug = normalizeSlug(args.slug);

    if (!normalizedSlug) {
      return { status: "taken" as const };
    }

    const currentOrganization = await getCurrentOrganizationForUser(ctx, viewer.appUser);
    const existingOrganization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", normalizedSlug))
      .unique();

    if (!existingOrganization) {
      return { status: "available" as const };
    }

    if (currentOrganization && existingOrganization._id === currentOrganization._id) {
      return { status: "reserved-by-current-org" as const };
    }

    return { status: "taken" as const };
  },
});

export const onboardingDraft = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      return null;
    }

    const user = viewer.appUser;
    const organization = await getCurrentOrganizationForUser(ctx, user);

    return {
      onboardingStatus: user.onboardingStatus,
      organizationId: organization?._id ?? null,
      organizationName: organization?.name ?? user.onboardingOrganizationName ?? null,
      organizationSlug: organization?.slug ?? user.onboardingOrganizationSlug ?? null,
      timezone: organization?.timezone ?? user.onboardingTimezone ?? null,
      logoUrl: organization?.logoUrl ?? null,
      logoStorageKey: organization?.logoStorageKey ?? null,
      eventTypeName: user.onboardingEventTypeName ?? null,
      eventDurationMinutes: user.onboardingEventDurationMinutes ?? null,
      availabilityPreset: user.onboardingAvailabilityPreset ?? null,
      calendarProvider: user.onboardingCalendarProvider ?? DEFAULT_CALENDAR_PROVIDER,
      meetingProvider: user.onboardingMeetingProvider ?? DEFAULT_MEETING_PROVIDER,
      syncMode: user.onboardingSyncMode ?? DEFAULT_SYNC_MODE,
    };
  },
});

export const saveOrganizationDraft = mutation({
  args: {
    organizationName: v.string(),
    organizationSlug: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const organizationName = sanitizeRequiredText(args.organizationName, "Organization name");
    const organizationSlug = normalizeSlug(
      sanitizeRequiredText(args.organizationSlug, "Booking slug"),
    );
    const timezone = sanitizeRequiredText(args.timezone, "Primary time zone");

    if (!organizationSlug) {
      throw new Error("Booking slug is required.");
    }

    const existingOrganization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", organizationSlug))
      .unique();
    const currentOrganization = await getCurrentOrganizationForUser(ctx, viewer.appUser);

    if (
      existingOrganization &&
      existingOrganization._id !== currentOrganization?._id &&
      existingOrganization.createdByUserId !== viewer.appUser._id
    ) {
      throw new Error("That booking slug is already in use.");
    }

    const now = Date.now();
    let organizationId = currentOrganization?._id ?? null;

    if (organizationId) {
      await ensureOwnedOrganizationForViewer(ctx, viewer.appUser, organizationId);
      await ctx.db.patch(organizationId, {
        name: organizationName,
        slug: organizationSlug,
        timezone,
        updatedAt: now,
      });
    } else if (existingOrganization && existingOrganization.createdByUserId === viewer.appUser._id) {
      organizationId = existingOrganization._id;
      await ctx.db.patch(organizationId, {
        name: organizationName,
        slug: organizationSlug,
        timezone,
        updatedAt: now,
      });
    } else {
      organizationId = await ctx.db.insert("organizations", {
        name: organizationName,
        slug: organizationSlug,
        logoUrl: null,
        logoStorageKey: null,
        timezone,
        createdByUserId: viewer.appUser._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ensureOrganizationMembership(
      ctx,
      organizationId,
      viewer.appUser._id,
      viewer.appUser.dashboardLanguage ?? DEFAULT_DASHBOARD_LANGUAGE,
    );

    await ctx.db.patch(viewer.appUser._id, {
      onboardingStatus: "scheduling",
      defaultOrganizationId: organizationId,
      onboardingOrganizationName: organizationName,
      onboardingOrganizationSlug: organizationSlug,
      onboardingTimezone: timezone,
      updatedAt: now,
    });

    return {
      ok: true,
      organizationId,
      organizationSlug,
    };
  },
});

export const saveSchedulingDraft = mutation({
  args: {
    eventTypeName: v.string(),
    eventDurationMinutes: v.number(),
    availabilityPreset: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const currentOrganization = await getCurrentOrganizationForUser(ctx, viewer.appUser);

    if (!currentOrganization) {
      throw new Error("Complete the organization step before saving scheduling defaults.");
    }

    await ensureOwnedOrganizationForViewer(ctx, viewer.appUser, currentOrganization._id);

    const eventTypeName = sanitizeRequiredText(args.eventTypeName, "Event type name");
    const timezone = sanitizeRequiredText(args.timezone, "Scheduling time zone");
    const durationMinutes = validateDurationMinutes(args.eventDurationMinutes);
    const availabilityPreset = sanitizeRequiredText(
      args.availabilityPreset,
      "Availability template",
    );

    const now = Date.now();

    await ctx.db.patch(currentOrganization._id, {
      timezone,
      updatedAt: now,
    });

    await ctx.db.patch(viewer.appUser._id, {
      onboardingStatus: "integrations",
      onboardingEventTypeName: eventTypeName,
      onboardingEventDurationMinutes: durationMinutes,
      onboardingAvailabilityPreset: availabilityPreset,
      onboardingTimezone: timezone,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const saveIntegrationsDraft = mutation({
  args: {
    calendarProvider: v.string(),
    meetingProvider: v.string(),
    syncMode: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const { organization, organizationSlug, organizationTimezone } =
      await ensureOrganizationFromDraft(ctx, viewer.appUser);

    const eventTypeName = sanitizeRequiredText(
      viewer.appUser.onboardingEventTypeName ?? "",
      "Event type name",
    );
    const durationMinutes = validateDurationMinutes(
      viewer.appUser.onboardingEventDurationMinutes ?? 0,
    );
    const availabilityPreset = sanitizeRequiredText(
      viewer.appUser.onboardingAvailabilityPreset ?? "",
      "Availability template",
    );

    const calendarProvider = sanitizeRequiredText(
      args.calendarProvider,
      "Calendar provider",
    );
    const meetingProvider = sanitizeRequiredText(
      args.meetingProvider,
      "Video conferencing",
    );
    const syncMode = sanitizeRequiredText(args.syncMode, "Calendar sync behavior");

    const defaultSchedule = await ensureDefaultAvailabilitySchedule(
      ctx,
      viewer.appUser,
      organization._id,
      organizationTimezone,
      availabilityPreset,
    );

    await ensureSeededEventType(
      ctx,
      viewer.appUser,
      organization._id,
      defaultSchedule._id,
      eventTypeName,
      durationMinutes,
      organizationTimezone,
    );

    const seededEventType = await ctx.db
      .query("eventTypes")
      .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
      .first();

    const availabilityRules = await ctx.db
      .query("availabilityRules")
      .withIndex("availabilityScheduleId", (q) =>
        q.eq("availabilityScheduleId", defaultSchedule._id),
      )
      .take(14);

    if (seededEventType) {
      await ensureDashboardSeedData(
        ctx,
        viewer.appUser,
        organization,
        defaultSchedule._id,
        seededEventType._id,
        availabilityRules,
      );
    }

    await ctx.db.patch(viewer.appUser._id, {
      defaultOrganizationId: organization._id,
      onboardingStatus: "completed",
      onboardingCalendarProvider: calendarProvider,
      onboardingMeetingProvider: meetingProvider,
      onboardingSyncMode: syncMode,
      updatedAt: Date.now(),
    });

    return {
      ok: true,
      organizationSlug,
    };
  },
});

export const completeOnboarding = mutation({
  args: {
    organizationName: v.string(),
    organizationSlug: v.string(),
    timezone: v.string(),
    eventTypeName: v.string(),
    eventDurationMinutes: v.number(),
    availabilityPreset: v.string(),
    calendarProvider: v.string(),
    meetingProvider: v.string(),
    syncMode: v.string(),
    logoUrl: v.optional(v.string()),
    logoStorageKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    if (
      (args.logoUrl && !args.logoStorageKey) ||
      (!args.logoUrl && args.logoStorageKey)
    ) {
      throw new Error("Logo upload metadata was incomplete.");
    }

    const eventTypeName = sanitizeRequiredText(
      args.eventTypeName,
      "Event type name",
    );
    const organizationTimezone = sanitizeRequiredText(
      args.timezone,
      "Scheduling time zone",
    );
    const durationMinutes = validateDurationMinutes(args.eventDurationMinutes);
    const availabilityPreset = sanitizeRequiredText(
      args.availabilityPreset,
      "Availability template",
    );
    const calendarProvider = sanitizeRequiredText(
      args.calendarProvider,
      "Calendar provider",
    );
    const meetingProvider = sanitizeRequiredText(
      args.meetingProvider,
      "Video conferencing",
    );
    const syncMode = sanitizeRequiredText(
      args.syncMode,
      "Calendar sync behavior",
    );

    const { organization, organizationSlug } = await ensureOrganizationFromValues(
      ctx,
      viewer.appUser,
      {
        organizationName: args.organizationName,
        organizationSlug: args.organizationSlug,
        organizationTimezone,
        logoUrl: args.logoUrl,
        logoStorageKey: args.logoStorageKey,
      },
    );

    const defaultSchedule = await ensureDefaultAvailabilitySchedule(
      ctx,
      viewer.appUser,
      organization._id,
      organizationTimezone,
      availabilityPreset,
    );

    await ensureSeededEventType(
      ctx,
      viewer.appUser,
      organization._id,
      defaultSchedule._id,
      eventTypeName,
      durationMinutes,
      organizationTimezone,
    );

    const seededEventType = await ctx.db
      .query("eventTypes")
      .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
      .first();

    const availabilityRules = await ctx.db
      .query("availabilityRules")
      .withIndex("availabilityScheduleId", (q) =>
        q.eq("availabilityScheduleId", defaultSchedule._id),
      )
      .take(14);

    if (seededEventType) {
      await ensureDashboardSeedData(
        ctx,
        viewer.appUser,
        organization,
        defaultSchedule._id,
        seededEventType._id,
        availabilityRules,
      );
    }

    await ctx.db.patch(viewer.appUser._id, {
      defaultOrganizationId: organization._id,
      onboardingStatus: "completed",
      onboardingOrganizationName: sanitizeRequiredText(
        args.organizationName,
        "Organization name",
      ),
      onboardingOrganizationSlug: normalizeSlug(
        sanitizeRequiredText(args.organizationSlug, "Booking slug"),
      ),
      onboardingTimezone: organizationTimezone,
      onboardingEventTypeName: eventTypeName,
      onboardingEventDurationMinutes: durationMinutes,
      onboardingAvailabilityPreset: availabilityPreset,
      onboardingCalendarProvider: calendarProvider,
      onboardingMeetingProvider: meetingProvider,
      onboardingSyncMode: syncMode,
      updatedAt: Date.now(),
    });

    return {
      ok: true,
      organizationSlug,
    };
  },
});

export const viewerProfile = query({
  args: {
    orgSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      return null;
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      return null;
    }

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("organizationId_userId", (q) =>
        q.eq("organizationId", organization._id).eq("userId", viewer.appUser._id),
      )
      .unique();

    if (!membership) {
      return null;
    }

    const u = viewer.appUser;
    const fullName = u.fullName || buildOrganizationNameFromSlug(args.orgSlug);
    const derived = splitViewerName(fullName);
    const workspaces = await collectWorkspacesForUser(ctx, u._id, args.orgSlug);

    return {
      user: {
        email: u.email,
        fullName,
        firstName: u.firstName ?? derived.firstName ?? "",
        lastName: u.lastName ?? derived.lastName ?? "",
        imageUrl: u.imageUrl ?? null,
        bio: u.bio ?? "",
        profileAccentColor: u.profileAccentColor ?? null,
      },
      membership: {
        role: membership.role,
        roleLabel: membership.role === "owner" ? "Owner" : titleCase(membership.role),
        dashboardLanguage:
          u.dashboardLanguage ?? DEFAULT_DASHBOARD_LANGUAGE,
        supportAIChatShown: membership.supportAIChatShown ?? false,
      },
      workspaces,
    };
  },
});

export const updateViewerProfile = mutation({
  args: {
    orgSlug: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    bio: v.optional(v.string()),
    profileAccentColor: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      throw new Error("Organization not found.");
    }

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("organizationId_userId", (q) =>
        q.eq("organizationId", organization._id).eq("userId", viewer.appUser._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Unauthorized");
    }

    const first = args.firstName.trim();
    const last = args.lastName.trim();
    const fullName = [first, last].filter(Boolean).join(" ");
    if (!fullName) {
      throw new Error("First and last name are required.");
    }

    const now = Date.now();
    const patch: Partial<Doc<"users">> = {
      firstName: first || undefined,
      lastName: last || undefined,
      fullName,
      updatedAt: now,
    };

    if (args.bio !== undefined) {
      const trimmed = args.bio.trim();
      if (trimmed.length > MAX_PROFILE_BIO_LENGTH) {
        throw new Error(`Bio must be at most ${MAX_PROFILE_BIO_LENGTH} characters.`);
      }
      patch.bio = trimmed;
    }

    if (args.profileAccentColor !== undefined) {
      patch.profileAccentColor = validateProfileAccentColor(args.profileAccentColor);
    }

    await ctx.db.patch(viewer.appUser._id, patch);

    return { ok: true };
  },
});

export const updateViewerAppearance = mutation({
  args: {
    orgSlug: v.string(),
    profileAccentColor: v.optional(v.union(v.null(), v.string())),
    imageUrl: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      throw new Error("Organization not found.");
    }

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("organizationId_userId", (q) =>
        q.eq("organizationId", organization._id).eq("userId", viewer.appUser._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Unauthorized");
    }

    const patch: Partial<Doc<"users">> = {
      updatedAt: Date.now(),
    };

    if (args.profileAccentColor !== undefined) {
      patch.profileAccentColor = validateProfileAccentColor(args.profileAccentColor);
    }

    if (args.imageUrl !== undefined) {
      patch.imageUrl = validateProfileImageUrl(args.imageUrl);
    }

    await ctx.db.patch(viewer.appUser._id, patch);

    return { ok: true };
  },
});

export const orgShellData = query({
  args: {
    orgSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      return null;
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      return null;
    }

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("organizationId_userId", (q) =>
        q.eq("organizationId", organization._id).eq("userId", viewer.appUser._id),
      )
      .unique();

    if (!membership) {
      return null;
    }

    const fullName = viewer.appUser.fullName || buildOrganizationNameFromSlug(args.orgSlug);

    const workspaces = await collectWorkspacesForUser(
      ctx,
      viewer.appUser._id,
      args.orgSlug,
    );

    return {
      organization: {
        name: organization.name,
        slug: organization.slug,
        plan: "Starter",
        seatLabel: "Workspace provisioned",
        timezone: organization.timezone ?? "UTC",
        logoUrl: organization.logoUrl ?? null,
        brandColor: organization.brandColor ?? null,
      },
      member: {
        name: fullName,
        firstName:
          viewer.appUser.firstName ?? splitViewerName(fullName).firstName ?? "there",
        role: membership.role === "owner" ? "Owner" : titleCase(membership.role),
        initials: buildInitials(fullName),
        imageUrl: viewer.appUser.imageUrl ?? null,
        email: viewer.appUser.email,
        profileAccentColor: viewer.appUser.profileAccentColor ?? null,
        dashboardLanguage:
          viewer.appUser.dashboardLanguage ?? DEFAULT_DASHBOARD_LANGUAGE,
        supportAIChatShown: membership.supportAIChatShown ?? false,
      },
      workspaces,
      notifications: [] as Array<{
        id: string;
        title: string;
        body?: string;
        time?: string;
        href?: string;
      }>,
    };
  },
});

export const setSupportAIChatShown = mutation({
  args: {
    orgSlug: v.string(),
    supportAIChatShown: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      throw new Error("Organization not found.");
    }

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("organizationId_userId", (q) =>
        q.eq("organizationId", organization._id).eq("userId", viewer.appUser._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(membership._id, {
      supportAIChatShown: args.supportAIChatShown,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const setDashboardLanguage = mutation({
  args: {
    dashboardLanguage: dashboardLanguageValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    await ctx.db.patch(viewer.appUser._id, {
      dashboardLanguage: args.dashboardLanguage,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const listEventTypesForOrganization = query({
  args: {
    orgSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      return null;
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      return null;
    }

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("organizationId_userId", (q) =>
        q.eq("organizationId", organization._id).eq("userId", viewer.appUser._id),
      )
      .unique();

    if (!membership) {
      return null;
    }

    const eventTypes = await ctx.db
      .query("eventTypes")
      .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
      .take(25);

    return {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        timezone: organization.timezone ?? "UTC",
      },
      eventTypes: eventTypes.map((eventType) => ({
        id: eventType._id,
        name: eventType.name,
        slug: eventType.slug,
        durationMinutes: eventType.durationMinutes,
        timezone: eventType.timezone,
        hostMode: eventType.hostMode,
        isActive: eventType.isActive,
      })),
    };
  },
});

export const saveOrganizationLogo = mutation({
  args: {
    organizationId: v.id("organizations"),
    logoUrl: v.string(),
    logoStorageKey: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.appUser) {
      throw new Error("Unauthorized");
    }

    await ensureOwnedOrganizationForViewer(ctx, viewer.appUser, args.organizationId);

    await ctx.db.patch(args.organizationId, {
      logoUrl: args.logoUrl,
      logoStorageKey: args.logoStorageKey,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});
