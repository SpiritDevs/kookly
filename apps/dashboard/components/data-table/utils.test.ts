import { describe, expect, test } from "bun:test";
import type { DataTableColumn, DataTableLayoutState } from "@/components/data-table/types";
import {
  buildGroupedRows,
  buildKanbanBuckets,
  normalizeFilterState,
  normalizeLayoutState,
  shouldHandlePrimaryRowAction,
} from "@/components/data-table/utils";

type Row = {
  id: string;
  owner: string;
  source: string;
  status: string;
};

const columns: DataTableColumn<Row>[] = [
  {
    columnDef: {
      cell: () => null,
      header: "Lead",
    },
    getValue: (row) => row.id,
    id: "identity",
    label: "Lead",
    pinning: "system-left",
  },
  {
    columnDef: {
      cell: () => null,
      header: "Status",
    },
    getGroupValue: (row) => row.status,
    getKanbanValue: (row) => row.status,
    getValue: (row) => row.status,
    id: "status",
    kanban: {
      label: "Status",
    },
    label: "Status",
    pinning: "user",
  },
  {
    columnDef: {
      cell: () => null,
      header: "Owner",
    },
    getGroupValue: (row) => row.owner,
    getKanbanValue: (row) => row.owner,
    getValue: (row) => row.owner,
    id: "owner",
    kanban: {
      label: "Owner",
    },
    label: "Owner",
    pinning: "user",
  },
  {
    columnDef: {
      cell: () => null,
      header: "Actions",
    },
    getValue: () => "actions",
    id: "actions",
    interactive: true,
    label: "Actions",
    pinning: "system-right",
  },
];

const defaultLayout: DataTableLayoutState = {
  columnOrder: ["identity", "status", "owner", "actions"],
  groupBy: "status",
  kanbanLaneField: "owner",
  pinnedLeftColumnIds: ["identity"],
  pinnedRightColumnIds: ["actions"],
  sort: {
    direction: "desc",
    field: "status",
  },
  viewMode: "kanban",
  visibleColumnIds: ["identity", "status", "owner", "actions"],
};

describe("data table utils", () => {
  test("normalizes filter state by trimming blank entries", () => {
    expect(
      normalizeFilterState({
        columnFilters: [
          { columnId: "status", value: "won" },
          { columnId: "   ", value: "ignored" },
          { columnId: "owner", value: "   " },
        ],
        searchText: "  acme  ",
      }),
    ).toEqual({
      columnFilters: [{ columnId: "status", value: "won" }],
      searchText: "acme",
    });
  });

  test("keeps system pinned columns visible when normalizing layout state", () => {
    expect(
      normalizeLayoutState(columns, {
        ...defaultLayout,
        pinnedLeftColumnIds: [],
        pinnedRightColumnIds: [],
        visibleColumnIds: ["status"],
      }),
    ).toEqual({
      ...defaultLayout,
      pinnedLeftColumnIds: ["identity"],
      pinnedRightColumnIds: ["actions"],
      visibleColumnIds: ["identity", "status", "actions"],
    });
  });

  test("builds grouped rows with header rows", () => {
    expect(
      buildGroupedRows(
        [
          { id: "1", owner: "Alex", source: "Web", status: "new" },
          { id: "2", owner: "Alex", source: "Referral", status: "new" },
          { id: "3", owner: "Priya", source: "Webinar", status: "won" },
        ],
        columns,
        "status",
      ),
    ).toEqual([
      { count: 2, kind: "group", label: "new", value: "new" },
      { kind: "row", row: { id: "1", owner: "Alex", source: "Web", status: "new" } },
      { kind: "row", row: { id: "2", owner: "Alex", source: "Referral", status: "new" } },
      { count: 1, kind: "group", label: "won", value: "won" },
      { kind: "row", row: { id: "3", owner: "Priya", source: "Webinar", status: "won" } },
    ]);
  });

  test("builds kanban buckets in the configured lane order", () => {
    expect(
      buildKanbanBuckets(
        [
          { id: "1", owner: "Alex", source: "Web", status: "new" },
          { id: "2", owner: "Priya", source: "Referral", status: "won" },
        ],
        {
          field: "status",
          getValue: (row) => row.status,
          label: "Status",
          lanes: [
            { label: "New", value: "new" },
            { label: "Won", value: "won" },
          ],
        },
      ),
    ).toEqual([
      {
        items: [{ id: "1", owner: "Alex", source: "Web", status: "new" }],
        label: "New",
        value: "new",
      },
      {
        items: [{ id: "2", owner: "Priya", source: "Referral", status: "won" }],
        label: "Won",
        value: "won",
      },
    ]);
  });

  test("suppresses the row action when the event path contains an interactive node", () => {
    expect(
      shouldHandlePrimaryRowAction([
        { dataset: {} },
        { dataset: { rowInteractive: "true" } },
      ]),
    ).toBe(false);
    expect(shouldHandlePrimaryRowAction([{ dataset: {} }])).toBe(true);
  });
});
