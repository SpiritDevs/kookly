import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

const LEADS_QUERY_LIMIT = 400;
const PROFILE_LIMIT = 64;
const SHARE_LIMIT = 256;
const MEMBERSHIP_LIMIT = 64;

const leadStatusValidator = v.union(
  v.literal("new"),
  v.literal("qualified"),
  v.literal("working"),
  v.literal("won"),
  v.literal("lost"),
  v.literal("spam"),
);
const dataTableViewModeValidator = v.union(v.literal("list"), v.literal("kanban"));
const dataTableSortDirectionValidator = v.union(v.literal("asc"), v.literal("desc"));
const dataTableSortValidator = v.object({
  direction: dataTableSortDirectionValidator,
  field: v.string(),
});
const dataTableColumnFilterValidator = v.object({
  columnId: v.string(),
  value: v.string(),
});
const dataTableFilterStateValidator = v.object({
  columnFilters: v.array(dataTableColumnFilterValidator),
  searchText: v.string(),
});
const dataTableLayoutStateValidator = v.object({
  columnOrder: v.array(v.string()),
  groupBy: v.union(v.null(), v.string()),
  kanbanLaneField: v.union(v.null(), v.string()),
  pinnedLeftColumnIds: v.array(v.string()),
  pinnedRightColumnIds: v.array(v.string()),
  sort: v.union(v.null(), dataTableSortValidator),
  viewMode: dataTableViewModeValidator,
  visibleColumnIds: v.array(v.string()),
});
const dataTableProfileKindValidator = v.union(v.literal("layout"), v.literal("filter"));

type DataTableSort = {
  direction: "asc" | "desc";
  field: string;
};

type DataTableColumnFilter = {
  columnId: string;
  value: string;
};

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

  return await ctx.db
    .query("users")
    .withIndex("authUserId", (q) => q.eq("authUserId", authUser._id))
    .unique();
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

  return { membership, organization };
}

function sanitizeRequiredText(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function buildInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "LD";
  }
  if (parts.length === 1) {
    return (parts[0] ?? "LD").slice(0, 2).toUpperCase();
  }
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

function applyDirection(direction: "asc" | "desc", value: number) {
  return direction === "asc" ? value : -value;
}

function normalizeColumnFilters(
  columnFilters: ReadonlyArray<DataTableColumnFilter>,
) {
  return columnFilters
    .map((item) => ({
      columnId: item.columnId.trim(),
      value: item.value.trim(),
    }))
    .filter((item) => item.columnId.length > 0 && item.value.length > 0);
}

function leadMatchesSearch(lead: Doc<"leads">, searchText: string) {
  if (!searchText) {
    return true;
  }

  const haystack = [
    lead.fullName,
    lead.email,
    lead.companyName,
    lead.source,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchText);
}

function leadMatchesFilters(
  lead: Doc<"leads">,
  ownerName: string | null,
  columnFilters: ReadonlyArray<DataTableColumnFilter>,
) {
  return columnFilters.every((filter) => {
    switch (filter.columnId) {
      case "status":
        return lead.status === filter.value;
      case "source":
        return lead.source === filter.value;
      case "owner":
        return (lead.ownerUserId ?? "unassigned") === filter.value;
      case "company":
        return lead.companyName === filter.value;
      case "isSpam":
        return String(lead.isSpam) === filter.value;
      case "ownerName":
        return (ownerName ?? "Unassigned") === filter.value;
      default:
        return true;
    }
  });
}

function sortLeads(
  leads: Array<Doc<"leads">>,
  ownerNameById: Map<Id<"users">, string>,
  sort: DataTableSort | null,
) {
  const resolvedSort = sort ?? { direction: "desc" as const, field: "lastActivityAt" };

  return [...leads].sort((left, right) => {
    const leftOwnerName = left.ownerUserId ? ownerNameById.get(left.ownerUserId) ?? "" : "";
    const rightOwnerName = right.ownerUserId
      ? ownerNameById.get(right.ownerUserId) ?? ""
      : "";

    switch (resolvedSort.field) {
      case "fullName":
        return applyDirection(
          resolvedSort.direction,
          compareText(left.fullName, right.fullName),
        );
      case "email":
        return applyDirection(
          resolvedSort.direction,
          compareText(left.email, right.email),
        );
      case "companyName":
      case "company":
        return applyDirection(
          resolvedSort.direction,
          compareText(left.companyName, right.companyName),
        );
      case "status":
        return applyDirection(
          resolvedSort.direction,
          compareText(left.status, right.status),
        );
      case "source":
        return applyDirection(
          resolvedSort.direction,
          compareText(left.source, right.source),
        );
      case "owner":
      case "ownerName":
        return applyDirection(
          resolvedSort.direction,
          compareText(leftOwnerName, rightOwnerName),
        );
      case "score":
        return applyDirection(resolvedSort.direction, left.score - right.score);
      case "createdAt":
        return applyDirection(
          resolvedSort.direction,
          left.createdAt - right.createdAt,
        );
      case "lastActivityAt":
      default:
        return applyDirection(
          resolvedSort.direction,
          left.lastActivityAt - right.lastActivityAt,
        );
    }
  });
}

function buildDummyLeads(
  now: number,
  ownerUserIds: Array<Id<"users"> | null>,
  count: number,
) {
  const statuses = ["new", "qualified", "working", "won", "lost", "spam"] as const;
  const sources = ["Website", "Referral", "Partner", "Outbound", "Webinar"] as const;
  const people = [
    { companyName: "Northwind Health", fullName: "Avery Carter" },
    { companyName: "Summit Commerce", fullName: "Riley Bennett" },
    { companyName: "Harbor Legal", fullName: "Jordan Silva" },
    { companyName: "Pioneer Ops", fullName: "Morgan Lee" },
    { companyName: "Bluebird Labs", fullName: "Sasha Nguyen" },
    { companyName: "Orbit Finance", fullName: "Taylor Brooks" },
    { companyName: "Signal Works", fullName: "Quinn Patel" },
    { companyName: "Helio Retail", fullName: "Jamie Chen" },
  ];

  return Array.from({ length: count }, (_, index) => {
    const person = people[index % people.length] ?? {
      companyName: `Demo Company ${index + 1}`,
      fullName: `Demo Lead ${index + 1}`,
    };
    const emailSlug = person.fullName.toLowerCase().replace(/\s+/g, ".");
    const createdAt = now - index * 3 * 60 * 60 * 1000;
    const lastActivityAt = createdAt + ((index % 4) + 1) * 45 * 60 * 1000;

    return {
      companyName: person.companyName,
      createdAt,
      email: `${emailSlug}.${now + index}@example.com`,
      fullName: person.fullName,
      isSpam: statuses[index % statuses.length] === "spam",
      lastActivityAt,
      notes:
        index % 2 === 0
          ? "Requested a follow-up after seeing the pricing page."
          : "Came in through the demo funnel and needs qualification.",
      ownerUserId: ownerUserIds[index % ownerUserIds.length] ?? null,
      score: 48 + (index % 5) * 9,
      source: sources[index % sources.length] ?? "Website",
      status: statuses[index % statuses.length] ?? "new",
    };
  });
}

async function listOrganizationMembers(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
) {
  const memberships = await ctx.db
    .query("organizationMemberships")
    .withIndex("organizationId", (q) => q.eq("organizationId", organizationId))
    .take(MEMBERSHIP_LIMIT);

  const userDocs = await Promise.all(memberships.map((membership) => ctx.db.get(membership.userId)));
  const userMap = new Map(
    userDocs
      .filter((user): user is NonNullable<typeof userDocs[number]> => Boolean(user))
      .map((user) => [user._id, user]),
  );

  return memberships.map((membership) => {
    const user = userMap.get(membership.userId);
    const fullName = user?.fullName ?? user?.email ?? "Unknown teammate";

    return {
      membership,
      user: user ?? null,
      row: {
        id: membership.userId,
        email: user?.email ?? "",
        initials: buildInitials(fullName),
        name: fullName,
        role: membership.role,
      },
    };
  });
}

async function listAccessibleProfiles(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  resourceKey: string,
  viewerUserId: Id<"users">,
) {
  const [layoutProfiles, filterProfiles, shares] = await Promise.all([
    ctx.db
      .query("dataTableLayoutProfiles")
      .withIndex("by_organizationId_and_resourceKey", (q) =>
        q.eq("organizationId", organizationId).eq("resourceKey", resourceKey),
      )
      .take(PROFILE_LIMIT),
    ctx.db
      .query("dataTableFilterProfiles")
      .withIndex("by_organizationId_and_resourceKey", (q) =>
        q.eq("organizationId", organizationId).eq("resourceKey", resourceKey),
      )
      .take(PROFILE_LIMIT),
    ctx.db
      .query("dataTableProfileShares")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", organizationId))
      .take(SHARE_LIMIT),
  ]);

  const sharedLayoutIds = new Set(
    shares
      .filter(
        (share) =>
          share.profileKind === "layout" &&
          share.sharedWithUserId === viewerUserId &&
          share.layoutProfileId !== null,
      )
      .map((share) => share.layoutProfileId as Id<"dataTableLayoutProfiles">),
  );
  const sharedFilterIds = new Set(
    shares
      .filter(
        (share) =>
          share.profileKind === "filter" &&
          share.sharedWithUserId === viewerUserId &&
          share.filterProfileId !== null,
      )
      .map((share) => share.filterProfileId as Id<"dataTableFilterProfiles">),
  );

  return {
    filterProfiles: filterProfiles
      .filter(
        (profile) =>
          profile.ownerUserId === viewerUserId ||
          profile.isOrgShared ||
          sharedFilterIds.has(profile._id),
      )
      .map((profile) => ({
        id: profile._id,
        isEditable: profile.ownerUserId === viewerUserId,
        isOrgShared: profile.isOrgShared,
        name: profile.name,
        ownerUserId: profile.ownerUserId,
        state: profile.state,
      })),
    layoutProfiles: layoutProfiles
      .filter(
        (profile) =>
          profile.ownerUserId === viewerUserId ||
          profile.isOrgShared ||
          sharedLayoutIds.has(profile._id),
      )
      .map((profile) => ({
        id: profile._id,
        isEditable: profile.ownerUserId === viewerUserId,
        isOrgShared: profile.isOrgShared,
        name: profile.name,
        ownerUserId: profile.ownerUserId,
        state: profile.state,
      })),
  };
}

async function ensureShareTargetsBelongToOrganization(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  sharedWithUserIds: ReadonlyArray<Id<"users">>,
) {
  if (sharedWithUserIds.length === 0) {
    return;
  }

  const memberships = await ctx.db
    .query("organizationMemberships")
    .withIndex("organizationId", (q) => q.eq("organizationId", organizationId))
    .take(MEMBERSHIP_LIMIT);
  const validUserIds = new Set(memberships.map((membership) => membership.userId));

  for (const userId of sharedWithUserIds) {
    if (!validUserIds.has(userId)) {
      throw new Error("Share recipients must belong to the organization.");
    }
  }
}

async function replaceProfileShares(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  profileKind: "layout" | "filter",
  profileId: Id<"dataTableLayoutProfiles"> | Id<"dataTableFilterProfiles">,
  sharedWithUserIds: ReadonlyArray<Id<"users">>,
) {
  const existingShares =
    profileKind === "layout"
      ? await ctx.db
          .query("dataTableProfileShares")
          .withIndex("by_layoutProfileId", (q) =>
            q.eq("layoutProfileId", profileId as Id<"dataTableLayoutProfiles">),
          )
          .take(SHARE_LIMIT)
      : await ctx.db
          .query("dataTableProfileShares")
          .withIndex("by_filterProfileId", (q) =>
            q.eq("filterProfileId", profileId as Id<"dataTableFilterProfiles">),
          )
          .take(SHARE_LIMIT);

  for (const share of existingShares) {
    await ctx.db.delete(share._id);
  }

  const now = Date.now();
  for (const sharedWithUserId of sharedWithUserIds) {
    await ctx.db.insert("dataTableProfileShares", {
      organizationId,
      profileKind,
      layoutProfileId:
        profileKind === "layout"
          ? (profileId as Id<"dataTableLayoutProfiles">)
          : null,
      filterProfileId:
        profileKind === "filter"
          ? (profileId as Id<"dataTableFilterProfiles">)
          : null,
      sharedWithUserId,
      createdAt: now,
    });
  }
}

export const listWorkspaceOptions = query({
  args: {
    orgSlug: v.string(),
    resourceKey: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) {
      return null;
    }

    const { membership, organization } = await getAuthorizedOrganization(
      ctx,
      args.orgSlug,
      viewer._id,
    );

    const [members, accessibleProfiles, leads] = await Promise.all([
      listOrganizationMembers(ctx, organization._id),
      listAccessibleProfiles(ctx, organization._id, args.resourceKey, viewer._id),
      ctx.db
        .query("leads")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", organization._id))
        .take(LEADS_QUERY_LIMIT),
    ]);

    const sources = [...new Set(leads.map((lead) => lead.source))].sort(compareText);

    return {
      filterProfiles: accessibleProfiles.filterProfiles,
      layoutProfiles: accessibleProfiles.layoutProfiles,
      shareableUsers: members.map((member) => member.row),
      sources,
      viewer: {
        id: viewer._id,
        role: membership.role,
      },
    };
  },
});

export const list = query({
  args: {
    columnFilters: v.array(dataTableColumnFilterValidator),
    groupBy: v.union(v.null(), v.string()),
    kanbanLaneField: v.union(v.null(), v.string()),
    orgSlug: v.string(),
    searchText: v.string(),
    sort: v.union(v.null(), dataTableSortValidator),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) {
      return null;
    }

    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const [members, leads] = await Promise.all([
      listOrganizationMembers(ctx, organization._id),
      ctx.db
        .query("leads")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", organization._id))
        .take(LEADS_QUERY_LIMIT),
    ]);

    const ownerNameById = new Map(
      members
        .filter((member): member is (typeof members)[number] & { user: NonNullable<(typeof members)[number]["user"]> } =>
          Boolean(member.user),
        )
        .map((member) => [member.user._id, member.row.name]),
    );

    const normalizedSearchText = normalizeSearchText(args.searchText);
    const normalizedFilters = normalizeColumnFilters(args.columnFilters);
    const sortedLeads = sortLeads(leads, ownerNameById, args.sort);
    const visibleLeads = sortedLeads.filter((lead) =>
      leadMatchesSearch(lead, normalizedSearchText) &&
      leadMatchesFilters(
        lead,
        lead.ownerUserId ? ownerNameById.get(lead.ownerUserId) ?? null : null,
        normalizedFilters,
      ),
    );

    return {
      hasMore: false,
      rows: visibleLeads.map((lead) => {
        const ownerName = lead.ownerUserId
          ? ownerNameById.get(lead.ownerUserId) ?? "Unknown owner"
          : "Unassigned";

        return {
          companyName: lead.companyName,
          createdAt: lead.createdAt,
          email: lead.email,
          fullName: lead.fullName,
          id: lead._id,
          isSpam: lead.isSpam,
          lastActivityAt: lead.lastActivityAt,
          notes: lead.notes ?? "",
          ownerId: lead.ownerUserId,
          ownerName,
          score: lead.score,
          source: lead.source,
          status: lead.status,
        };
      }),
      totalCount: visibleLeads.length,
    };
  },
});

export const saveLayoutProfile = mutation({
  args: {
    isOrgShared: v.boolean(),
    name: v.string(),
    orgSlug: v.string(),
    profileId: v.optional(v.id("dataTableLayoutProfiles")),
    resourceKey: v.string(),
    sharedWithUserIds: v.array(v.id("users")),
    state: dataTableLayoutStateValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) {
      throw new Error("Unauthorized");
    }

    const { membership, organization } = await getAuthorizedOrganization(
      ctx,
      args.orgSlug,
      viewer._id,
    );

    if (args.isOrgShared && membership.role === "member") {
      throw new Error("Only admins and owners can share profiles with the organization.");
    }

    await ensureShareTargetsBelongToOrganization(
      ctx,
      organization._id,
      args.sharedWithUserIds,
    );

    const now = Date.now();
    const name = sanitizeRequiredText(args.name, "Profile name");

    if (args.profileId) {
      const existing = await ctx.db.get(args.profileId);
      if (!existing || existing.organizationId !== organization._id) {
        throw new Error("Layout profile not found.");
      }
      if (existing.ownerUserId !== viewer._id) {
        throw new Error("You can only update your own layout profiles.");
      }

      await ctx.db.patch(existing._id, {
        isOrgShared: args.isOrgShared,
        name,
        state: args.state,
        updatedAt: now,
      });
      await replaceProfileShares(
        ctx,
        organization._id,
        "layout",
        existing._id,
        args.sharedWithUserIds,
      );
      return { profileId: existing._id };
    }

    const profileId = await ctx.db.insert("dataTableLayoutProfiles", {
      organizationId: organization._id,
      resourceKey: sanitizeRequiredText(args.resourceKey, "Resource key"),
      name,
      ownerUserId: viewer._id,
      isOrgShared: args.isOrgShared,
      state: args.state,
      createdAt: now,
      updatedAt: now,
    });
    await replaceProfileShares(
      ctx,
      organization._id,
      "layout",
      profileId,
      args.sharedWithUserIds,
    );

    return { profileId };
  },
});

export const saveFilterProfile = mutation({
  args: {
    isOrgShared: v.boolean(),
    name: v.string(),
    orgSlug: v.string(),
    profileId: v.optional(v.id("dataTableFilterProfiles")),
    resourceKey: v.string(),
    sharedWithUserIds: v.array(v.id("users")),
    state: dataTableFilterStateValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) {
      throw new Error("Unauthorized");
    }

    const { membership, organization } = await getAuthorizedOrganization(
      ctx,
      args.orgSlug,
      viewer._id,
    );

    if (args.isOrgShared && membership.role === "member") {
      throw new Error("Only admins and owners can share profiles with the organization.");
    }

    await ensureShareTargetsBelongToOrganization(
      ctx,
      organization._id,
      args.sharedWithUserIds,
    );

    const now = Date.now();
    const name = sanitizeRequiredText(args.name, "Profile name");

    if (args.profileId) {
      const existing = await ctx.db.get(args.profileId);
      if (!existing || existing.organizationId !== organization._id) {
        throw new Error("Filter profile not found.");
      }
      if (existing.ownerUserId !== viewer._id) {
        throw new Error("You can only update your own filter profiles.");
      }

      await ctx.db.patch(existing._id, {
        isOrgShared: args.isOrgShared,
        name,
        state: args.state,
        updatedAt: now,
      });
      await replaceProfileShares(
        ctx,
        organization._id,
        "filter",
        existing._id,
        args.sharedWithUserIds,
      );
      return { profileId: existing._id };
    }

    const profileId = await ctx.db.insert("dataTableFilterProfiles", {
      organizationId: organization._id,
      resourceKey: sanitizeRequiredText(args.resourceKey, "Resource key"),
      name,
      ownerUserId: viewer._id,
      isOrgShared: args.isOrgShared,
      state: args.state,
      createdAt: now,
      updatedAt: now,
    });
    await replaceProfileShares(
      ctx,
      organization._id,
      "filter",
      profileId,
      args.sharedWithUserIds,
    );

    return { profileId };
  },
});

export const deleteProfile = mutation({
  args: {
    orgSlug: v.string(),
    profileId: v.string(),
    profileKind: dataTableProfileKindValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) {
      throw new Error("Unauthorized");
    }

    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);

    if (args.profileKind === "layout") {
      const profile = await ctx.db.get(args.profileId as Id<"dataTableLayoutProfiles">);
      if (!profile || profile.organizationId !== organization._id) {
        throw new Error("Layout profile not found.");
      }
      if (profile.ownerUserId !== viewer._id) {
        throw new Error("You can only delete your own layout profiles.");
      }

      const shares = await ctx.db
        .query("dataTableProfileShares")
        .withIndex("by_layoutProfileId", (q) =>
          q.eq("layoutProfileId", profile._id),
        )
        .take(SHARE_LIMIT);
      for (const share of shares) {
        await ctx.db.delete(share._id);
      }
      await ctx.db.delete(profile._id);
      return { ok: true };
    }

    const profile = await ctx.db.get(args.profileId as Id<"dataTableFilterProfiles">);
    if (!profile || profile.organizationId !== organization._id) {
      throw new Error("Filter profile not found.");
    }
    if (profile.ownerUserId !== viewer._id) {
      throw new Error("You can only delete your own filter profiles.");
    }

    const shares = await ctx.db
      .query("dataTableProfileShares")
      .withIndex("by_filterProfileId", (q) =>
        q.eq("filterProfileId", profile._id),
      )
      .take(SHARE_LIMIT);
    for (const share of shares) {
      await ctx.db.delete(share._id);
    }
    await ctx.db.delete(profile._id);
    return { ok: true };
  },
});

export const seedDummyLeads = mutation({
  args: {
    count: v.optional(v.number()),
    orgSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) {
      throw new Error("Unauthorized");
    }

    const { organization } = await getAuthorizedOrganization(ctx, args.orgSlug, viewer._id);
    const members = await listOrganizationMembers(ctx, organization._id);
    const ownerUserIds: Array<Id<"users"> | null> = [
      viewer._id,
      ...members.map((member) => member.user?._id ?? null),
      null,
    ];

    const now = Date.now();
    const count = Math.max(1, Math.min(Math.round(args.count ?? 6), 24));
    const dummyLeads = buildDummyLeads(now, ownerUserIds, count);

    for (const lead of dummyLeads) {
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

    return {
      inserted: count,
      organizationSlug: organization.slug,
    };
  },
});
