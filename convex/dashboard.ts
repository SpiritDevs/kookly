import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { authComponent } from "./auth";

const routingDestinationKind = v.union(v.literal("eventType"), v.literal("team"));

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

function isUnauthenticatedError(error: unknown) {
  return error instanceof ConvexError && error.data === "Unauthenticated";
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SP";
  if (parts.length === 1) return (parts[0] ?? "SP").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

async function getViewer(ctx: QueryCtx | MutationCtx) {
  let authUser;
  try {
    authUser = await authComponent.getAuthUser(ctx);
  } catch (error) {
    if (isUnauthenticatedError(error)) return null;
    throw error;
  }

  if (!authUser) return null;

  const appUser = await ctx.db
    .query("users")
    .withIndex("authUserId", (q) => q.eq("authUserId", authUser._id))
    .unique();

  if (!appUser) return null;
  return appUser;
}

async function getAuthorizedOrganization(
  ctx: QueryCtx | MutationCtx,
  orgSlug: string,
  userId: Id<"users">,
) {
  const organization = await ctx.db
    .query("organizations")
    .withIndex("slug", (q) => q.eq("slug", orgSlug))
    .unique();

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const membership = await ctx.db
    .query("organizationMemberships")
    .withIndex("organizationId_userId", (q) =>
      q.eq("organizationId", organization._id).eq("userId", userId),
    )
    .unique();

  if (!membership) {
    throw new Error("Unauthorized");
  }

  return { organization, membership };
}

async function buildUniqueEventTypeSlug(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  name: string,
) {
  const base = normalizeSlug(name) || "event-type";
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await ctx.db
      .query("eventTypes")
      .withIndex("organizationId_slug", (q) =>
        q.eq("organizationId", organizationId).eq("slug", slug),
      )
      .unique();

    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function computeAnalytics(bookings: Array<Doc<"bookings">>) {
  const confirmed = bookings.filter((booking) => booking.status === "confirmed").length;
  const pending = bookings.filter((booking) => booking.status === "pending").length;
  const cancelled = bookings.filter((booking) => booking.status === "cancelled").length;
  const rescheduled = bookings.filter((booking) => booking.status === "rescheduled").length;
  const conversion = bookings.length === 0 ? 0 : Math.round((confirmed / bookings.length) * 100);

  return {
    totals: {
      total: bookings.length,
      confirmed,
      pending,
      cancelled,
      rescheduled,
      conversion,
    },
  };
}

export const workspaceSnapshot = query({
  args: {
    orgSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;

    const { organization, membership } = await getAuthorizedOrganization(
      ctx,
      args.orgSlug,
      viewer._id,
    );

    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
      .take(32);
    const teamInvites = await ctx.db
      .query("teamInvites")
      .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
      .take(32);
    const eventTypes = await ctx.db
      .query("eventTypes")
      .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
      .take(32);
    const schedule = await ctx.db
      .query("availabilitySchedules")
      .withIndex("organizationId_isDefault", (q) =>
        q.eq("organizationId", organization._id).eq("isDefault", true),
      )
      .unique();
    const rules = schedule
      ? await ctx.db
          .query("availabilityRules")
          .withIndex("availabilityScheduleId", (q) => q.eq("availabilityScheduleId", schedule._id))
          .take(16)
      : [];
    const overrides = schedule
      ? await ctx.db
          .query("availabilityOverrides")
          .withIndex("availabilityScheduleId", (q) => q.eq("availabilityScheduleId", schedule._id))
          .take(16)
      : [];
    const routingRules = await ctx.db
      .query("routingRules")
      .withIndex("organizationId_priority", (q) => q.eq("organizationId", organization._id))
      .take(24);
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("organizationId", (q) => q.eq("organizationId", organization._id))
      .take(50);
    const analytics = computeAnalytics(bookings);

    const memberIds = memberships.map((item) => item.userId);
    const userDocs = await Promise.all(memberIds.map((userId) => ctx.db.get(userId)));
    const userMap = new Map(
      userDocs.filter(Boolean).map((user) => [user!._id, user!]),
    );

    const bookingAuditEvents = await Promise.all(
      bookings.map(async (booking) => ({
        bookingId: booking._id,
        events: await ctx.db
          .query("bookingAuditEvents")
          .withIndex("bookingId", (q) => q.eq("bookingId", booking._id))
          .take(10),
      })),
    );

    const bookingAuditMap = new Map(bookingAuditEvents.map((entry) => [entry.bookingId, entry.events]));

    return {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        timezone: organization.timezone ?? "UTC",
        locale: organization.locale ?? "en",
        brandColor: organization.brandColor ?? "#5b5bd6",
        bookingNoticeHours: organization.bookingNoticeHours ?? 12,
        bookingBufferMinutes: organization.bookingBufferMinutes ?? 15,
        bookingIntervalMinutes: organization.bookingIntervalMinutes ?? 30,
        bookingHorizonDays: organization.bookingHorizonDays ?? 45,
      },
      viewer: {
        id: viewer._id,
        name: viewer.fullName,
        firstName: viewer.firstName ?? viewer.fullName.split(" ")[0] ?? "there",
        role: membership.role,
        initials: buildInitials(viewer.fullName),
      },
      eventTypes: eventTypes.map((eventType) => ({
        id: eventType._id,
        name: eventType.name,
        slug: eventType.slug,
        hostMode: eventType.hostMode,
        durationMinutes: eventType.durationMinutes,
        timezone: eventType.timezone,
        bookingQuestion: eventType.bookingQuestion ?? "What should we prepare before the call?",
        minNoticeMinutes:
          eventType.minNoticeMinutes ?? (organization.bookingNoticeHours ?? 12) * 60,
        bufferBeforeMinutes: eventType.bufferBeforeMinutes ?? 15,
        bufferAfterMinutes: eventType.bufferAfterMinutes ?? 15,
        slotIntervalMinutes: eventType.slotIntervalMinutes ?? 30,
        bookingHorizonDays: eventType.bookingHorizonDays ?? 45,
        isActive: eventType.isActive,
      })),
      availability: {
        scheduleId: schedule?._id ?? null,
        scheduleName: schedule?.name ?? "Default weekly availability",
        timezone: schedule?.timezone ?? organization.timezone ?? "UTC",
        rules: rules.map((rule) => ({
          id: rule._id,
          weekday: rule.weekday,
          startMinute: rule.startMinute,
          endMinute: rule.endMinute,
        })),
        overrides: overrides.map((override) => ({
          id: override._id,
          date: override.date,
          startMinute: override.startMinute,
          endMinute: override.endMinute,
          isUnavailable: override.isUnavailable,
        })),
      },
      teammates: memberships.map((item) => {
        const memberUser = userMap.get(item.userId);
        const memberName = memberUser?.fullName ?? "Workspace member";
        return {
          id: item._id,
          userId: item.userId,
          name: memberName,
          email: memberUser?.email ?? "",
          role: item.role,
          initials: buildInitials(memberName),
          status: memberUser?.status ?? "active",
        };
      }),
      invites: teamInvites.map((invite) => ({
        id: invite._id,
        email: invite.email,
        fullName: invite.fullName,
        role: invite.role,
        status: invite.status,
      })),
      routing: routingRules.map((rule) => ({
        id: rule._id,
        label: rule.label,
        field: rule.field,
        value: rule.value,
        destinationKind: rule.destinationKind,
        destinationId: rule.destinationId,
        destinationLabel: rule.destinationLabel,
        priority: rule.priority,
        isActive: rule.isActive,
      })),
      bookings: bookings
        .sort((left, right) => left.startsAt - right.startsAt)
        .map((booking) => {
          const eventType = booking.eventTypeId
            ? eventTypes.find((candidate) => candidate._id === booking.eventTypeId)
            : null;
          const assignee = booking.assigneeUserId ? userMap.get(booking.assigneeUserId) : null;
          return {
            id: booking._id,
            attendeeName: booking.attendeeName,
            attendeeEmail: booking.attendeeEmail,
            startsAt: booking.startsAt,
            endsAt: booking.endsAt,
            timezone: booking.timezone,
            status: booking.status,
            source: booking.source,
            notes: booking.notes ?? "",
            eventTypeName: eventType?.name ?? "General booking",
            assigneeName: assignee?.fullName ?? "Unassigned",
            auditTrail: (bookingAuditMap.get(booking._id) ?? []).map((event) => ({
              id: event._id,
              message: event.message,
              createdAt: event.createdAt,
            })),
          };
        }),
      analytics: {
        ...analytics,
        eventTypeBreakdown: eventTypes.map((eventType) => ({
          id: eventType._id,
          name: eventType.name,
          total: bookings.filter((booking) => booking.eventTypeId === eventType._id).length,
        })),
        assignmentDistribution: memberships.map((item) => {
          const memberUser = userMap.get(item.userId);
          return {
            memberName: memberUser?.fullName ?? "Workspace member",
            bookings: bookings.filter((booking) => booking.assigneeUserId === item.userId).length,
          };
        }),
      },
      notifications: [
        {
          id: "dashboard-ready",
          title: "Workspace is live",
          body: `${organization.name} is ready for event types, routing, and bookings.`,
          time: "Now",
        },
      ],
      metadata: {
        roleLabel: titleCase(membership.role),
      },
    };
  },
});

export const createEventType = mutation({
  args: {
    orgSlug: v.string(),
    name: v.string(),
    durationMinutes: v.number(),
    hostMode: v.union(v.literal("single-host"), v.literal("round-robin")),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const schedule = await ctx.db
      .query("availabilitySchedules")
      .withIndex("organizationId_isDefault", (q) =>
        q.eq("organizationId", organization._id).eq("isDefault", true),
      )
      .unique();
    if (!schedule) throw new Error("Default availability schedule is missing.");

    const name = sanitizeRequiredText(args.name, "Event type name");
    const timezone = sanitizeRequiredText(args.timezone, "Time zone");
    const slug = await buildUniqueEventTypeSlug(ctx, organization._id, name);
    const now = Date.now();

    await ctx.db.insert("eventTypes", {
      organizationId: organization._id,
      availabilityScheduleId: schedule._id,
      createdByUserId: viewer._id,
      hostMode: args.hostMode,
      name,
      slug,
      durationMinutes: Math.max(15, Math.round(args.durationMinutes)),
      timezone,
      isActive: true,
      bookingQuestion: "What should we prepare before the call?",
      minNoticeMinutes: (organization.bookingNoticeHours ?? 12) * 60,
      bufferBeforeMinutes: organization.bookingBufferMinutes ?? 15,
      bufferAfterMinutes: organization.bookingBufferMinutes ?? 15,
      slotIntervalMinutes: organization.bookingIntervalMinutes ?? 30,
      bookingHorizonDays: organization.bookingHorizonDays ?? 45,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const duplicateEventType = mutation({
  args: {
    orgSlug: v.string(),
    eventTypeId: v.id("eventTypes"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const eventType = await ctx.db.get(args.eventTypeId);
    if (!eventType || eventType.organizationId !== organization._id) {
      throw new Error("Event type not found.");
    }
    const now = Date.now();
    const slug = await buildUniqueEventTypeSlug(ctx, organization._id, `${eventType.name} copy`);
    await ctx.db.insert("eventTypes", {
      organizationId: eventType.organizationId,
      availabilityScheduleId: eventType.availabilityScheduleId,
      createdByUserId: viewer._id,
      hostMode: eventType.hostMode,
      durationMinutes: eventType.durationMinutes,
      timezone: eventType.timezone,
      isActive: eventType.isActive,
      bookingQuestion: eventType.bookingQuestion,
      minNoticeMinutes: eventType.minNoticeMinutes,
      bufferBeforeMinutes: eventType.bufferBeforeMinutes,
      bufferAfterMinutes: eventType.bufferAfterMinutes,
      slotIntervalMinutes: eventType.slotIntervalMinutes,
      bookingHorizonDays: eventType.bookingHorizonDays,
      slug,
      name: `${eventType.name} copy`,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true };
  },
});

export const toggleEventTypeActive = mutation({
  args: {
    orgSlug: v.string(),
    eventTypeId: v.id("eventTypes"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const eventType = await ctx.db.get(args.eventTypeId);
    if (!eventType || eventType.organizationId !== organization._id) {
      throw new Error("Event type not found.");
    }
    await ctx.db.patch(eventType._id, {
      isActive: !eventType.isActive,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const saveAvailability = mutation({
  args: {
    orgSlug: v.string(),
    timezone: v.string(),
    weekdays: v.array(
      v.object({
        weekday: v.number(),
        startMinute: v.number(),
        endMinute: v.number(),
      }),
    ),
    overrideDate: v.optional(v.union(v.null(), v.string())),
    overrideStartMinute: v.optional(v.union(v.null(), v.number())),
    overrideEndMinute: v.optional(v.union(v.null(), v.number())),
    overrideUnavailable: v.optional(v.union(v.null(), v.boolean())),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const schedule = await ctx.db
      .query("availabilitySchedules")
      .withIndex("organizationId_isDefault", (q) =>
        q.eq("organizationId", organization._id).eq("isDefault", true),
      )
      .unique();
    if (!schedule) throw new Error("Default availability schedule is missing.");

    const existingRules = await ctx.db
      .query("availabilityRules")
      .withIndex("availabilityScheduleId", (q) => q.eq("availabilityScheduleId", schedule._id))
      .take(24);
    for (const rule of existingRules) {
      await ctx.db.delete(rule._id);
    }

    const now = Date.now();
    for (const weekday of args.weekdays) {
      await ctx.db.insert("availabilityRules", {
        availabilityScheduleId: schedule._id,
        weekday: weekday.weekday,
        startMinute: weekday.startMinute,
        endMinute: weekday.endMinute,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(schedule._id, {
      timezone: args.timezone,
      updatedAt: now,
    });
    await ctx.db.patch(organization._id, {
      timezone: args.timezone,
      updatedAt: now,
    });

    if (args.overrideDate) {
      await ctx.db.insert("availabilityOverrides", {
        availabilityScheduleId: schedule._id,
        date: args.overrideDate,
        startMinute: args.overrideStartMinute ?? 9 * 60,
        endMinute: args.overrideEndMinute ?? 17 * 60,
        isUnavailable: args.overrideUnavailable ?? false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true };
  },
});

export const inviteTeammate = mutation({
  args: {
    orgSlug: v.string(),
    email: v.string(),
    fullName: v.string(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const email = sanitizeRequiredText(args.email, "Email").toLowerCase();
    const existingInvite = await ctx.db
      .query("teamInvites")
      .withIndex("organizationId_email", (q) =>
        q.eq("organizationId", organization._id).eq("email", email),
      )
      .unique();

    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, {
        fullName: sanitizeRequiredText(args.fullName, "Full name"),
        role: args.role,
        updatedAt: Date.now(),
      });
      return { ok: true };
    }

    const now = Date.now();
    await ctx.db.insert("teamInvites", {
      organizationId: organization._id,
      email,
      fullName: sanitizeRequiredText(args.fullName, "Full name"),
      role: args.role,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true };
  },
});

export const updateMembershipRole = mutation({
  args: {
    orgSlug: v.string(),
    membershipId: v.id("organizationMemberships"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.organizationId !== organization._id) {
      throw new Error("Membership not found.");
    }
    await ctx.db.patch(membership._id, {
      role: args.role,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const saveRoutingRule = mutation({
  args: {
    orgSlug: v.string(),
    label: v.string(),
    field: v.string(),
    value: v.string(),
    destinationKind: routingDestinationKind,
    destinationId: v.string(),
    destinationLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const existingRules = await ctx.db
      .query("routingRules")
      .withIndex("organizationId_priority", (q) => q.eq("organizationId", organization._id))
      .take(24);
    const nextPriority =
      existingRules.reduce((max, rule) => Math.max(max, rule.priority), 0) + 1;
    const now = Date.now();
    await ctx.db.insert("routingRules", {
      organizationId: organization._id,
      label: sanitizeRequiredText(args.label, "Rule label"),
      field: sanitizeRequiredText(args.field, "Field"),
      value: sanitizeRequiredText(args.value, "Value"),
      destinationKind: args.destinationKind,
      destinationId: sanitizeRequiredText(args.destinationId, "Destination"),
      destinationLabel: sanitizeRequiredText(args.destinationLabel, "Destination label"),
      priority: nextPriority,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true };
  },
});

export const updateBookingStatus = mutation({
  args: {
    orgSlug: v.string(),
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("pending"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
    ),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.organizationId !== organization._id) {
      throw new Error("Booking not found.");
    }
    const now = Date.now();
    await ctx.db.patch(booking._id, {
      status: args.status,
      updatedAt: now,
    });
    await ctx.db.insert("bookingAuditEvents", {
      bookingId: booking._id,
      organizationId: organization._id,
      message: `Status updated to ${args.status}.`,
      createdAt: now,
    });
    return { ok: true };
  },
});

export const updateOrganizationSettings = mutation({
  args: {
    orgSlug: v.string(),
    name: v.string(),
    slug: v.string(),
    locale: v.string(),
    timezone: v.string(),
    brandColor: v.string(),
    bookingNoticeHours: v.number(),
    bookingBufferMinutes: v.number(),
    bookingIntervalMinutes: v.number(),
    bookingHorizonDays: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Unauthorized");
    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const nextSlug = normalizeSlug(args.slug);
    if (!nextSlug) throw new Error("Booking slug is required.");
    const existing = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", nextSlug))
      .unique();
    if (existing && existing._id !== organization._id) {
      throw new Error("That booking slug is already in use.");
    }
    await ctx.db.patch(organization._id, {
      name: sanitizeRequiredText(args.name, "Organization name"),
      slug: nextSlug,
      locale: sanitizeRequiredText(args.locale, "Locale"),
      timezone: sanitizeRequiredText(args.timezone, "Time zone"),
      brandColor: sanitizeRequiredText(args.brandColor, "Brand color"),
      bookingNoticeHours: Math.max(1, Math.round(args.bookingNoticeHours)),
      bookingBufferMinutes: Math.max(0, Math.round(args.bookingBufferMinutes)),
      bookingIntervalMinutes: Math.max(5, Math.round(args.bookingIntervalMinutes)),
      bookingHorizonDays: Math.max(1, Math.round(args.bookingHorizonDays)),
      updatedAt: Date.now(),
    });
    return { ok: true, slug: nextSlug };
  },
});
