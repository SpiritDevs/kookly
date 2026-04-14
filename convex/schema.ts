import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const dashboardLanguage = v.union(
  v.literal("en"),
  v.literal("de"),
  v.literal("es"),
  v.literal("fr"),
  v.literal("ja"),
  v.literal("pt-BR"),
);

const organizationRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

const onboardingStatus = v.union(
  v.literal("organization"),
  v.literal("scheduling"),
  v.literal("integrations"),
  v.literal("completed"),
);

const eventTypeHostMode = v.union(v.literal("single-host"), v.literal("round-robin"));

const userStatus = v.union(
  v.literal("active"),
  v.literal("invited"),
  v.literal("disabled"),
);

const bookingStatus = v.union(
  v.literal("confirmed"),
  v.literal("pending"),
  v.literal("cancelled"),
  v.literal("rescheduled"),
);

const teamInviteStatus = v.union(v.literal("pending"), v.literal("accepted"));
const leadStatus = v.union(
  v.literal("new"),
  v.literal("qualified"),
  v.literal("working"),
  v.literal("won"),
  v.literal("lost"),
  v.literal("spam"),
);
const dataTableViewMode = v.union(v.literal("list"), v.literal("kanban"));
const dataTableSortDirection = v.union(v.literal("asc"), v.literal("desc"));
const dataTableSort = v.object({
  direction: dataTableSortDirection,
  field: v.string(),
});
const dataTableColumnFilter = v.object({
  columnId: v.string(),
  value: v.string(),
});
const dataTableFilterState = v.object({
  columnFilters: v.array(dataTableColumnFilter),
  searchText: v.string(),
});
const dataTableLayoutState = v.object({
  columnOrder: v.array(v.string()),
  groupBy: v.union(v.null(), v.string()),
  kanbanLaneField: v.union(v.null(), v.string()),
  pinnedLeftColumnIds: v.array(v.string()),
  pinnedRightColumnIds: v.array(v.string()),
  sort: v.union(v.null(), dataTableSort),
  viewMode: dataTableViewMode,
  visibleColumnIds: v.array(v.string()),
});
const dataTableProfileKind = v.union(v.literal("layout"), v.literal("filter"));

export default defineSchema({
  users: defineTable({
    authUserId: v.string(),
    email: v.string(),
    fullName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.union(v.null(), v.string())),
    status: userStatus,
    onboardingStatus,
    dashboardLanguage: v.optional(dashboardLanguage),
    defaultOrganizationId: v.optional(v.id("organizations")),
    onboardingOrganizationName: v.optional(v.string()),
    onboardingOrganizationSlug: v.optional(v.string()),
    onboardingTimezone: v.optional(v.string()),
    onboardingEventTypeName: v.optional(v.string()),
    onboardingEventDurationMinutes: v.optional(v.number()),
    onboardingAvailabilityPreset: v.optional(v.string()),
    onboardingCalendarProvider: v.optional(v.string()),
    onboardingMeetingProvider: v.optional(v.string()),
    onboardingSyncMode: v.optional(v.string()),
    lastLoginAt: v.optional(v.number()),
    bio: v.optional(v.string()),
    profileAccentColor: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("authUserId", ["authUserId"])
    .index("email", ["email"])
    .index("defaultOrganizationId", ["defaultOrganizationId"]),
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.union(v.null(), v.string())),
    logoStorageKey: v.optional(v.union(v.null(), v.string())),
    timezone: v.optional(v.union(v.null(), v.string())),
    locale: v.optional(v.union(v.null(), v.string())),
    brandColor: v.optional(v.union(v.null(), v.string())),
    bookingNoticeHours: v.optional(v.number()),
    bookingBufferMinutes: v.optional(v.number()),
    bookingIntervalMinutes: v.optional(v.number()),
    bookingHorizonDays: v.optional(v.number()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("createdByUserId", ["createdByUserId"]),
  // Org memberships also carry user-specific settings scoped to a single organization.
  organizationMemberships: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: organizationRole,
    dashboardLanguage: v.optional(dashboardLanguage),
    supportAIChatShown: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("userId", ["userId"])
    .index("organizationId_userId", ["organizationId", "userId"]),
  availabilitySchedules: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    timezone: v.string(),
    isDefault: v.boolean(),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("organizationId_isDefault", ["organizationId", "isDefault"]),
  availabilityRules: defineTable({
    availabilityScheduleId: v.id("availabilitySchedules"),
    weekday: v.number(),
    startMinute: v.number(),
    endMinute: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("availabilityScheduleId", ["availabilityScheduleId"])
    .index("availabilityScheduleId_weekday", ["availabilityScheduleId", "weekday"]),
  availabilityOverrides: defineTable({
    availabilityScheduleId: v.id("availabilitySchedules"),
    date: v.string(),
    startMinute: v.number(),
    endMinute: v.number(),
    isUnavailable: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("availabilityScheduleId", ["availabilityScheduleId"])
    .index("availabilityScheduleId_date", ["availabilityScheduleId", "date"]),
  eventTypes: defineTable({
    organizationId: v.id("organizations"),
    availabilityScheduleId: v.id("availabilitySchedules"),
    createdByUserId: v.id("users"),
    hostMode: eventTypeHostMode,
    name: v.string(),
    slug: v.string(),
    durationMinutes: v.number(),
    timezone: v.string(),
    isActive: v.boolean(),
    bookingQuestion: v.optional(v.string()),
    minNoticeMinutes: v.optional(v.number()),
    bufferBeforeMinutes: v.optional(v.number()),
    bufferAfterMinutes: v.optional(v.number()),
    slotIntervalMinutes: v.optional(v.number()),
    bookingHorizonDays: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("organizationId_slug", ["organizationId", "slug"]),
  teamInvites: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    fullName: v.string(),
    role: organizationRole,
    status: teamInviteStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("organizationId_email", ["organizationId", "email"]),
  routingRules: defineTable({
    organizationId: v.id("organizations"),
    label: v.string(),
    field: v.string(),
    value: v.string(),
    destinationKind: v.union(v.literal("eventType"), v.literal("team")),
    destinationId: v.string(),
    destinationLabel: v.string(),
    priority: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("organizationId_priority", ["organizationId", "priority"]),
  bookings: defineTable({
    organizationId: v.id("organizations"),
    eventTypeId: v.optional(v.union(v.null(), v.id("eventTypes"))),
    assigneeUserId: v.optional(v.union(v.null(), v.id("users"))),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    timezone: v.string(),
    status: bookingStatus,
    source: v.string(),
    notes: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("organizationId_status", ["organizationId", "status"]),
  bookingAuditEvents: defineTable({
    bookingId: v.id("bookings"),
    organizationId: v.id("organizations"),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("bookingId", ["bookingId"])
    .index("organizationId", ["organizationId"]),
  leads: defineTable({
    organizationId: v.id("organizations"),
    fullName: v.string(),
    email: v.string(),
    companyName: v.string(),
    status: leadStatus,
    source: v.string(),
    ownerUserId: v.union(v.null(), v.id("users")),
    score: v.number(),
    notes: v.optional(v.union(v.null(), v.string())),
    isSpam: v.boolean(),
    createdAt: v.number(),
    lastActivityAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_and_status", ["organizationId", "status"])
    .index("by_organizationId_and_ownerUserId", ["organizationId", "ownerUserId"])
    .index("by_organizationId_and_source", ["organizationId", "source"])
    .index("by_organizationId_and_lastActivityAt", ["organizationId", "lastActivityAt"])
    .index("by_organizationId_and_createdAt", ["organizationId", "createdAt"]),
  dataTableLayoutProfiles: defineTable({
    organizationId: v.id("organizations"),
    resourceKey: v.string(),
    name: v.string(),
    ownerUserId: v.id("users"),
    isOrgShared: v.boolean(),
    state: dataTableLayoutState,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_resourceKey", ["organizationId", "resourceKey"])
    .index("by_ownerUserId", ["ownerUserId"]),
  dataTableFilterProfiles: defineTable({
    organizationId: v.id("organizations"),
    resourceKey: v.string(),
    name: v.string(),
    ownerUserId: v.id("users"),
    isOrgShared: v.boolean(),
    state: dataTableFilterState,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_resourceKey", ["organizationId", "resourceKey"])
    .index("by_ownerUserId", ["ownerUserId"]),
  dataTableProfileShares: defineTable({
    organizationId: v.id("organizations"),
    profileKind: dataTableProfileKind,
    layoutProfileId: v.union(v.null(), v.id("dataTableLayoutProfiles")),
    filterProfileId: v.union(v.null(), v.id("dataTableFilterProfiles")),
    sharedWithUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_profileKind_and_sharedWithUserId", ["profileKind", "sharedWithUserId"])
    .index("by_layoutProfileId", ["layoutProfileId"])
    .index("by_filterProfileId", ["filterProfileId"]),
});
