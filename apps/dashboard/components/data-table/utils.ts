"use client";

import type {
  DataTableColumn,
  DataTableFilterState,
  DataTableKanbanField,
  DataTableLayoutState,
  FlattenedListRow,
  KanbanLaneBucket,
} from "@/components/data-table/types";

export function normalizeFilterState(
  filters: DataTableFilterState,
): DataTableFilterState {
  return {
    columnFilters: filters.columnFilters
      .map((filter) => ({
        columnId: filter.columnId.trim(),
        value: filter.value.trim(),
      }))
      .filter((filter) => filter.columnId.length > 0 && filter.value.length > 0),
    searchText: filters.searchText.trim(),
  };
}

export function normalizeLayoutState<TData extends { id: string }>(
  columns: DataTableColumn<TData>[],
  layout: DataTableLayoutState,
): DataTableLayoutState {
  const columnIds = columns.map((column) => column.id);
  const systemLeftIds = columns
    .filter((column) => column.pinning === "system-left")
    .map((column) => column.id);
  const systemRightIds = columns
    .filter((column) => column.pinning === "system-right")
    .map((column) => column.id);
  const visibleColumnIds = new Set(
    layout.visibleColumnIds.filter((columnId) => columnIds.includes(columnId)),
  );

  for (const column of columns) {
    if (column.pinning === "system-left" || column.pinning === "system-right") {
      visibleColumnIds.add(column.id);
    }
  }

  const orderedColumnIds = [
    ...layout.columnOrder.filter((columnId) => columnIds.includes(columnId)),
    ...columnIds.filter((columnId) => !layout.columnOrder.includes(columnId)),
  ];

  const pinnedLeftSet = new Set(systemLeftIds);
  for (const columnId of layout.pinnedLeftColumnIds) {
    const column = columns.find((candidate) => candidate.id === columnId);
    if (column?.pinning === "user") {
      pinnedLeftSet.add(columnId);
    }
  }

  const pinnedRightSet = new Set(systemRightIds);
  for (const columnId of layout.pinnedRightColumnIds) {
    const column = columns.find((candidate) => candidate.id === columnId);
    if (column?.pinning === "user") {
      pinnedRightSet.add(columnId);
    }
  }

  const groupableIds = new Set(
    columns.filter((column) => column.getGroupValue).map((column) => column.id),
  );
  const kanbanFieldIds = new Set(
    columns.filter((column) => column.kanban).map((column) => column.id),
  );

  return {
    columnOrder: orderedColumnIds,
    groupBy: layout.groupBy && groupableIds.has(layout.groupBy) ? layout.groupBy : null,
    kanbanLaneField:
      layout.kanbanLaneField && kanbanFieldIds.has(layout.kanbanLaneField)
        ? layout.kanbanLaneField
        : null,
    pinnedLeftColumnIds: orderedColumnIds.filter((columnId) => pinnedLeftSet.has(columnId)),
    pinnedRightColumnIds: orderedColumnIds.filter((columnId) => pinnedRightSet.has(columnId)),
    sort: layout.sort,
    viewMode: layout.viewMode,
    visibleColumnIds: orderedColumnIds.filter((columnId) => visibleColumnIds.has(columnId)),
  };
}

export function buildGroupedRows<TData extends { id: string }>(
  rows: TData[],
  columns: DataTableColumn<TData>[],
  groupBy: string | null,
): Array<FlattenedListRow<TData>> {
  if (!groupBy) {
    return rows.map((row) => ({ kind: "row", row }));
  }

  const groupColumn = columns.find((column) => column.id === groupBy);
  if (!groupColumn?.getGroupValue) {
    return rows.map((row) => ({ kind: "row", row }));
  }

  const flattened: Array<FlattenedListRow<TData>> = [];
  let activeValue: string | null = null;
  let activeCount = 0;
  let activeGroupIndex = -1;

  for (const row of rows) {
    const nextValue = groupColumn.getGroupValue(row) ?? "Ungrouped";
    if (nextValue !== activeValue) {
      activeValue = nextValue;
      activeCount = 0;
      activeGroupIndex = flattened.push({
        count: 0,
        kind: "group",
        label: nextValue,
        value: nextValue,
      }) - 1;
    }

    activeCount += 1;
    const activeGroup = flattened[activeGroupIndex];
    if (activeGroup?.kind === "group") {
      activeGroup.count = activeCount;
    }
    flattened.push({ kind: "row", row });
  }

  return flattened;
}

export function buildKanbanBuckets<TData extends { id: string }>(
  rows: TData[],
  field: DataTableKanbanField<TData> | null,
): Array<KanbanLaneBucket<TData>> {
  if (!field) {
    return [
      {
        items: rows,
        label: "All",
        value: "__all__",
      },
    ];
  }

  const buckets = new Map<string, KanbanLaneBucket<TData>>();
  for (const lane of field.lanes) {
    buckets.set(lane.value, {
      items: [],
      label: lane.label,
      value: lane.value,
    });
  }

  for (const row of rows) {
    const rawValue = field.getValue(row) ?? "unassigned";
    const bucket =
      buckets.get(rawValue) ??
      (() => {
        const createdBucket = {
          items: [] as TData[],
          label: rawValue,
          value: rawValue,
        };
        buckets.set(rawValue, createdBucket);
        return createdBucket;
      })();

    bucket.items.push(row);
  }

  return [...buckets.values()];
}

export function shouldHandlePrimaryRowAction(
  path: ReadonlyArray<{ dataset?: Record<string, string | undefined> }>,
) {
  return !path.some((item) => item.dataset?.rowInteractive === "true");
}
