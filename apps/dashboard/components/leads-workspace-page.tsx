"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "gt-next";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import { Copy, LayoutGrid, List, Mail, MoreVertical, UserPlus } from "lucide-react";
import { api } from "@convex/_generated/api";
import { DataTable } from "@/components/data-table/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  DataTableColumn,
  DataTableFilterState,
  DataTableKanbanField,
  DataTableLayoutState,
} from "@/components/data-table/types";
import { WorkspaceErrorCard, WorkspaceLoadingCard } from "@/components/dashboard-workspace-ui";
import { buttonClasses, cn } from "@/components/ui";

const RESOURCE_KEY = "leads";

type LeadRow = {
  companyName: string;
  createdAt: number;
  email: string;
  fullName: string;
  id: string;
  isSpam: boolean;
  lastActivityAt: number;
  notes: string;
  ownerId: string | null;
  ownerName: string;
  score: number;
  source: string;
  status: "lost" | "new" | "qualified" | "spam" | "won" | "working";
};

const DEFAULT_FILTERS: DataTableFilterState = {
  columnFilters: [],
  searchText: "",
};

const DEFAULT_LAYOUT: DataTableLayoutState = {
  columnOrder: [
    "identity",
    "company",
    "status",
    "source",
    "owner",
    "score",
    "lastActivityAt",
    "createdAt",
    "notes",
    "actions",
  ],
  groupBy: null,
  kanbanLaneField: "status",
  pinnedLeftColumnIds: [],
  pinnedRightColumnIds: ["actions"],
  sort: {
    direction: "desc",
    field: "lastActivityAt",
  },
  viewMode: "list",
  visibleColumnIds: [
    "identity",
    "company",
    "status",
    "source",
    "owner",
    "score",
    "lastActivityAt",
    "createdAt",
    "notes",
    "actions",
  ],
};

function formatRelativeDate(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function statusTone(status: LeadRow["status"]) {
  switch (status) {
    case "won":
      return "bg-[color-mix(in_srgb,var(--success,#0f9d58)_18%,white)] text-[var(--success,#0f9d58)]";
    case "lost":
    case "spam":
      return "bg-[color-mix(in_srgb,var(--danger,#a42b2b)_10%,white)] text-[var(--danger,#a42b2b)]";
    case "qualified":
      return "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--accent-strong)]";
    case "working":
      return "bg-[color-mix(in_srgb,oklch(0.75_0.14_78)_22%,white)] text-[color-mix(in_srgb,oklch(0.48_0.11_72)_90%,black)]";
    case "new":
    default:
      return "bg-[color-mix(in_srgb,var(--line)_65%,white)] text-[var(--panel-ink)]";
  }
}

function nextAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function waitForMenuItem(label: string, attempts = 8) {
  for (let index = 0; index < attempts; index += 1) {
    const menuItems = Array.from(
      document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    );
    const targetItem = menuItems.find((item) => item.textContent?.trim() === label);

    if (targetItem) {
      return targetItem;
    }

    await nextAnimationFrame();
  }

  return null;
}

function LeadActionsMenu({
  email,
}: Readonly<{
  email: string;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div
      className={cn(
        "flex justify-center transition-opacity duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-within:opacity-100",
        isOpen ? "opacity-100" : "opacity-0",
      )}
      data-row-interactive="true"
    >
      <DropdownMenu
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Open lead actions"
            className={buttonClasses({
              size: "sm",
              variant: "ghost",
              className: "min-h-9 min-w-9 rounded px-0",
            })}
            onPointerUp={(event) => {
              const trigger = event.currentTarget;
              requestAnimationFrame(() => {
                if (!isOpen) {
                  trigger.blur();
                }
              });
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[11rem]"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.blur();
          }}
        >
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              window.location.href = `mailto:${email}`;
            }}
          >
            <Mail className="h-4 w-4" />
            Email lead
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async (event) => {
              event.preventDefault();
              await navigator.clipboard.writeText(email);
            }}
          >
            <Copy className="h-4 w-4" />
            Copy email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function LeadsWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const locale = useLocale();
  const dataTableWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isPageActionsMenuOpen, setIsPageActionsMenuOpen] = useState(false);
  const [dataTableRenderKey, setDataTableRenderKey] = useState(0);
  const [tableDefaults, setTableDefaults] = useState<{
    filters: DataTableFilterState;
    layout: DataTableLayoutState;
  }>({
    filters: DEFAULT_FILTERS,
    layout: DEFAULT_LAYOUT,
  });
  const [tableState, setTableState] = useState<{
    filters: DataTableFilterState;
    layout: DataTableLayoutState;
  }>({
    filters: DEFAULT_FILTERS,
    layout: DEFAULT_LAYOUT,
  });
  const deferredSearchText = useDeferredValue(tableState.filters.searchText);

  const workspaceOptions = useQuery(api.leads.listWorkspaceOptions, {
    orgSlug,
    resourceKey: RESOURCE_KEY,
  });
  const leadsResult = useQuery(api.leads.list, {
    columnFilters: tableState.filters.columnFilters,
    groupBy: tableState.layout.groupBy,
    kanbanLaneField: tableState.layout.kanbanLaneField,
    orgSlug,
    searchText: deferredSearchText,
    sort: tableState.layout.sort,
  });
  const [cachedWorkspaceOptions, setCachedWorkspaceOptions] = useState<
    NonNullable<typeof workspaceOptions> | null
  >(null);
  const [cachedLeadsResult, setCachedLeadsResult] = useState<
    NonNullable<typeof leadsResult> | null
  >(null);
  const saveLayoutProfile = useMutation(api.leads.saveLayoutProfile);
  const saveFilterProfile = useMutation(api.leads.saveFilterProfile);
  const deleteProfile = useMutation(api.leads.deleteProfile);

  useEffect(() => {
    if (workspaceOptions) {
      setCachedWorkspaceOptions(workspaceOptions);
    }
  }, [workspaceOptions]);

  useEffect(() => {
    if (leadsResult) {
      setCachedLeadsResult(leadsResult);
    }
  }, [leadsResult]);

  const resolvedWorkspaceOptions = workspaceOptions ?? cachedWorkspaceOptions;
  const resolvedLeadsResult = leadsResult ?? cachedLeadsResult;
  const isTableLoading =
    workspaceOptions === undefined ||
    leadsResult === undefined;
  const identityColumnWidth = useMemo(() => {
    const rows = resolvedLeadsResult?.rows ?? [];
    const widestValueEstimate = rows.reduce((max, row) => {
      const fullNameWidth = row.fullName.length * 9.5;
      const emailWidth = row.email.length * 8.6;

      return Math.max(max, fullNameWidth, emailWidth);
    }, 260);

    return Math.min(640, Math.max(320, Math.ceil(widestValueEstimate + 48)));
  }, [resolvedLeadsResult?.rows]);

  const columns = useMemo(() => {
    const shareableUsers = resolvedWorkspaceOptions?.shareableUsers ?? [];
    const ownerOptions = [
      { label: "Unassigned", value: "unassigned" },
      ...shareableUsers.map((user) => ({
        label: user.name,
        value: user.id,
      })),
    ];
    const statusOptions = [
      { label: "New", value: "new" },
      { label: "Qualified", value: "qualified" },
      { label: "Working", value: "working" },
      { label: "Won", value: "won" },
      { label: "Lost", value: "lost" },
      { label: "Spam", value: "spam" },
    ];
    const sourceOptions = (resolvedWorkspaceOptions?.sources ?? []).map((source) => ({
      label: source,
      value: source,
    }));

    const result: DataTableColumn<LeadRow>[] = [
      {
        canHide: false,
        canReorder: false,
        columnDef: {
          cell: ({ row }) => (
            <div className="grid min-w-0 gap-1">
              <p className="whitespace-nowrap font-medium text-[var(--panel-ink)]">
                {row.original.fullName}
              </p>
              <p className="whitespace-nowrap text-sm text-[var(--ink-muted)]">
                {row.original.email}
              </p>
            </div>
          ),
          header: "Lead",
        },
        getGroupValue: (row) => row.fullName,
        getValue: (row) => row.fullName,
        id: "identity",
        label: "Lead",
        mobileLabel: "Lead",
        pinning: "user",
        searchable: true,
        sortKey: "fullName",
        width: identityColumnWidth,
      },
      {
        columnDef: {
          cell: ({ row }) => row.original.companyName,
          header: "Company",
        },
        filterOptions: [],
        getGroupValue: (row) => row.companyName,
        getValue: (row) => row.companyName,
        id: "company",
        kanban: {
          label: "Company",
        },
        label: "Company",
        pinning: "user",
        searchable: true,
        sortKey: "companyName",
        width: 220,
      },
      {
        align: "center",
        columnDef: {
          cell: ({ row }) => (
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                statusTone(row.original.status),
              )}
            >
              {row.original.status}
            </span>
          ),
          header: "Status",
        },
        filterOptions: statusOptions,
        getGroupValue: (row) => row.status,
        getKanbanValue: (row) => row.status,
        getValue: (row) => row.status,
        id: "status",
        kanban: {
          label: "Status",
        },
        label: "Status",
        pinning: "user",
        sortKey: "status",
        width: 150,
      },
      {
        align: "center",
        columnDef: {
          cell: ({ row }) => row.original.source,
          header: "Source",
        },
        filterOptions: sourceOptions,
        getGroupValue: (row) => row.source,
        getKanbanValue: (row) => row.source,
        getValue: (row) => row.source,
        id: "source",
        kanban: {
          label: "Source",
        },
        label: "Source",
        pinning: "user",
        sortKey: "source",
        width: 180,
      },
      {
        columnDef: {
          cell: ({ row }) => row.original.ownerName,
          header: "Owner",
        },
        filterOptions: ownerOptions,
        getGroupValue: (row) => row.ownerName,
        getKanbanValue: (row) => row.ownerId ?? "unassigned",
        getValue: (row) => row.ownerName,
        id: "owner",
        kanban: {
          label: "Owner",
        },
        label: "Owner",
        pinning: "user",
        sortKey: "ownerName",
        width: 180,
      },
      {
        align: "center",
        columnDef: {
          cell: ({ row }) => (
            <span className="font-[family-name:var(--font-dashboard-mono)] tabular-nums">
              {row.original.score}
            </span>
          ),
          header: "Score",
        },
        getGroupValue: (row) => String(row.score),
        getValue: (row) => row.score,
        id: "score",
        label: "Score",
        pinning: "user",
        sortKey: "score",
        width: 120,
      },
      {
        align: "center",
        columnDef: {
          cell: ({ row }) => formatRelativeDate(row.original.lastActivityAt, locale),
          header: "Last activity",
        },
        getGroupValue: (row) => formatRelativeDate(row.lastActivityAt, locale),
        getValue: (row) => formatRelativeDate(row.lastActivityAt, locale),
        id: "lastActivityAt",
        label: "Last activity",
        pinning: "user",
        sortKey: "lastActivityAt",
        width: 200,
      },
      {
        align: "center",
        columnDef: {
          cell: ({ row }) => formatRelativeDate(row.original.createdAt, locale),
          header: "Created",
        },
        getGroupValue: (row) => formatRelativeDate(row.createdAt, locale),
        getValue: (row) => formatRelativeDate(row.createdAt, locale),
        id: "createdAt",
        label: "Created",
        pinning: "user",
        sortKey: "createdAt",
        width: 200,
      },
      {
        columnDef: {
          cell: ({ row }) => (
            <p className="line-clamp-2 max-w-[22rem] text-sm text-[var(--ink-muted)]">
              {row.original.notes || "No notes yet."}
            </p>
          ),
          header: "Notes",
        },
        getGroupValue: (row) => row.notes || "No notes yet.",
        getValue: (row) => row.notes || "No notes yet.",
        id: "notes",
        label: "Notes",
        pinning: "none",
        width: 260,
      },
      {
        align: "center",
        canHide: false,
        canReorder: false,
        columnDef: {
          cell: ({ row }) => <LeadActionsMenu email={row.original.email} />,
          header: "Actions",
        },
        getValue: () => "Actions",
        headerLabel: "",
        id: "actions",
        interactive: true,
        label: "Actions",
        pinning: "system-right",
        width: 64,
      },
    ];

    result[1]!.filterOptions = [];
    return result;
  }, [
    identityColumnWidth,
    locale,
    resolvedWorkspaceOptions?.shareableUsers,
    resolvedWorkspaceOptions?.sources,
  ]);

  const kanbanFields = useMemo(() => {
    const sourceLanes = (resolvedWorkspaceOptions?.sources ?? []).map((source) => ({
      label: source,
      value: source,
    }));

    const fields: DataTableKanbanField<LeadRow>[] = [
      {
        field: "status",
        getValue: (row) => row.status,
        label: "Status",
        lanes: [
          { label: "New", value: "new" },
          { label: "Qualified", value: "qualified" },
          { label: "Working", value: "working" },
          { label: "Won", value: "won" },
          { label: "Lost", value: "lost" },
          { label: "Spam", value: "spam" },
        ],
      },
      {
        field: "owner",
        getValue: (row) => row.ownerId ?? "unassigned",
        label: "Owner",
        lanes: [
          { label: "Unassigned", value: "unassigned" },
          ...(resolvedWorkspaceOptions?.shareableUsers ?? []).map((user) => ({
            label: user.name,
            value: user.id,
          })),
        ],
      },
      {
        field: "source",
        getValue: (row) => row.source,
        label: "Source",
        lanes: sourceLanes,
      },
    ];

    return fields;
  }, [resolvedWorkspaceOptions?.shareableUsers, resolvedWorkspaceOptions?.sources]);

  if (workspaceOptions === null || leadsResult === null) {
    return <WorkspaceErrorCard message="This leads workspace could not be loaded." />;
  }

  if (!resolvedWorkspaceOptions || !resolvedLeadsResult) {
    return <WorkspaceLoadingCard label="Loading leads" />;
  }

  async function triggerHiddenMoreActionsItem(
    itemLabel: "Kanban view" | "List view" | "Reset table" | "Table layout editor",
  ) {
    const dataTableWrapper = dataTableWrapperRef.current;
    if (!dataTableWrapper) {
      return;
    }

    const moreActionsTrigger = dataTableWrapper.querySelector<HTMLButtonElement>(
      'button[aria-label="Open more actions"]',
    );
    if (!moreActionsTrigger) {
      return;
    }

    moreActionsTrigger.click();
    const targetItem =
      (itemLabel === "Table layout editor"
        ? await waitForMenuItem("Table layout editor") ?? await waitForMenuItem("Hide")
        : await waitForMenuItem(itemLabel));

    targetItem?.click();
  }

  function runMoreActionsItem(
    itemLabel: Parameters<typeof triggerHiddenMoreActionsItem>[0],
  ) {
    setIsPageActionsMenuOpen(false);

    if (itemLabel === "List view" || itemLabel === "Kanban view") {
      setTableDefaults({
        filters: tableState.filters,
        layout: {
          ...tableState.layout,
          viewMode: itemLabel === "List view" ? "list" : "kanban",
        },
      });
      setDataTableRenderKey((current) => current + 1);
      return;
    }

    if (itemLabel === "Reset table") {
      setTableDefaults({
        filters: DEFAULT_FILTERS,
        layout: DEFAULT_LAYOUT,
      });
      setTableState({
        filters: DEFAULT_FILTERS,
        layout: DEFAULT_LAYOUT,
      });
      setDataTableRenderKey((current) => current + 1);
      return;
    }

    window.setTimeout(() => {
      void triggerHiddenMoreActionsItem(itemLabel);
    }, 0);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DropdownMenu
          open={isPageActionsMenuOpen}
          onOpenChange={setIsPageActionsMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open page actions"
              className={buttonClasses({
                size: "sm",
                variant: "secondary",
                className:
                  "min-h-8 rounded border-[color-mix(in_srgb,var(--line)_80%,white)] px-3 text-[var(--panel-ink)]",
              })}
            >
              More actions
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem] p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                aria-pressed={tableState.layout.viewMode === "list"}
                className={cn(
                  "flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded px-0.5 text-center text-xs font-medium text-[var(--panel-ink)] transition hover:bg-slate-100",
                  tableState.layout.viewMode === "list" &&
                    "bg-slate-100 hover:bg-slate-200",
                )}
                onClick={() => runMoreActionsItem("List view")}
              >
                <List className="h-4 w-4 shrink-0" />
                <span>List view</span>
              </button>
              <button
                type="button"
                aria-pressed={tableState.layout.viewMode === "kanban"}
                className={cn(
                  "flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded px-0.5 text-center text-xs font-medium text-[var(--panel-ink)] transition hover:bg-slate-100",
                  tableState.layout.viewMode === "kanban" &&
                    "bg-slate-100 hover:bg-slate-200",
                )}
                onClick={() => runMoreActionsItem("Kanban view")}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span>Kanban view</span>
              </button>
            </div>
            <DropdownMenuItem
              className="mt-1"
              onSelect={() => runMoreActionsItem("Table layout editor")}
            >
              Table layout editor
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => runMoreActionsItem("Reset table")}>
              Reset table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className={buttonClasses({
            size: "sm",
            variant: "primary",
            className: "min-h-8 items-center gap-2 rounded px-3",
          })}
        >
          <UserPlus className="h-4 w-4" />
          Add lead
        </button>
      </div>

      <div
        ref={dataTableWrapperRef}
        className="[&>div>div:first-child]:hidden"
      >
        <DataTable
          key={dataTableRenderKey}
          columns={columns}
          defaultFilters={tableDefaults.filters}
          defaultLayout={tableDefaults.layout}
          emptyState={{
            description:
              "Try a different search, switch profiles, or reset the table to the system defaults.",
            title: "No leads match the current view.",
          }}
          filterProfiles={resolvedWorkspaceOptions.filterProfiles}
          hasMore={resolvedLeadsResult.hasMore}
          kanban={{ fields: kanbanFields }}
          layoutProfiles={resolvedWorkspaceOptions.layoutProfiles}
          onDeleteProfile={async ({ profileId, profileKind }) => {
            await deleteProfile({
              orgSlug,
              profileId,
              profileKind,
            });
          }}
          onSaveFilterProfile={async (input) => {
            const result = await saveFilterProfile({
              isOrgShared: input.isOrgShared,
              name: input.name,
              orgSlug,
              profileId: input.profileId as Id<"dataTableFilterProfiles"> | undefined,
              resourceKey: RESOURCE_KEY,
              sharedWithUserIds: input.sharedWithUserIds as Id<"users">[],
              state: input.state,
            });
            return String(result.profileId);
          }}
          onSaveLayoutProfile={async (input) => {
            const result = await saveLayoutProfile({
              isOrgShared: input.isOrgShared,
              name: input.name,
              orgSlug,
              profileId: input.profileId as Id<"dataTableLayoutProfiles"> | undefined,
              resourceKey: RESOURCE_KEY,
              sharedWithUserIds: input.sharedWithUserIds as Id<"users">[],
              state: input.state,
            });
            return String(result.profileId);
          }}
          onTableStateChange={setTableState}
          renderCardActions={(row) => <LeadActionsMenu email={row.email} />}
          resourceKey={RESOURCE_KEY}
          rows={resolvedLeadsResult.rows}
          searchPlaceholder="Search leads by name, email, company, or source"
          selection={{ enabled: true }}
          shareableUsers={resolvedWorkspaceOptions.shareableUsers}
          status={{
            isLoading: isTableLoading,
            pageSize: 50,
            totalCount: resolvedLeadsResult.totalCount,
          }}
        />
      </div>
    </div>
  );
}
