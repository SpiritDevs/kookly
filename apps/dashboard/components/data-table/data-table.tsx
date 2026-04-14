"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ChevronDown,
  ChevronUp,
  ListFilterPlus,
  MoveDown,
  MoveUp,
} from "lucide-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/animate-ui/components/radix/radio-group";
import { buttonClasses, cn } from "@/components/ui";
import { useIsMobileViewport } from "@/components/use-is-mobile-viewport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  DataTableColumn,
  DataTableProps,
  DataTableSort,
} from "@/components/data-table/types";
import {
  buildGroupedRows,
  buildKanbanBuckets,
  normalizeFilterState,
  normalizeLayoutState,
} from "@/components/data-table/utils";

function StickyHeaderLabel({
  align = "left",
  label,
  onSortToggle,
  sortKey,
  sort,
}: Readonly<{
  align?: "center" | "left" | "right";
  label: string;
  onSortToggle?: (field: string) => void;
  sortKey?: string;
  sort: DataTableSort;
}>) {
  const isActive = sort?.field === sortKey;
  const content = (
    <>
      <span>{label}</span>
      {isActive ? (
        sort?.direction === "asc" ? (
          <MoveUp className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
        ) : (
          <MoveDown className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
        )
      ) : null}
    </>
  );

  if (!sortKey || !onSortToggle) {
    return (
      <span
        className={cn(
          "inline-flex items-center",
          align === "center" && "justify-center text-center",
          align === "left" && "text-left",
          align === "right" && "justify-end text-right",
        )}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Toggle sort for ${label}`}
      className={cn(
        "inline-flex cursor-pointer items-center",
        align === "center" && "justify-center text-center",
        align === "left" && "text-left",
        align === "right" && "justify-end text-right",
      )}
      onClick={() => onSortToggle(sortKey)}
    >
      {content}
    </button>
  );
}

const ROW_SELECTION_COLUMN_ID = "__select";

function blurAfterPointerInteraction(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  requestAnimationFrame(() => {
    target.blur();
  });
}

function SelectionCheckbox({
  ariaLabel,
  checked,
  indeterminate = false,
  onChange,
}: Readonly<{
  ariaLabel: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <Checkbox
      aria-label={ariaLabel}
      checked={indeterminate && !checked ? "indeterminate" : checked}
      className="cursor-pointer"
      onPointerUp={(event) => {
        blurAfterPointerInteraction(event.currentTarget);
      }}
      size="sm"
      variant="accent"
      onCheckedChange={(nextChecked) => onChange(nextChecked === true)}
    />
  );
}

export function DataTable<TData extends { id: string }>({
  columns,
  defaultFilters,
  defaultLayout,
  emptyState,
  kanban,
  onTableStateChange,
  renderCardActions,
  rows,
  selection,
  status,
}: DataTableProps<TData>) {
  const isMobileViewport = useIsMobileViewport();
  const [filterState, setFilterState] = useState(() =>
    normalizeFilterState(defaultFilters),
  );
  const [layoutState, setLayoutState] = useState(() =>
    normalizeLayoutState(columns, defaultLayout),
  );
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sortMenuScrollRef = useRef<HTMLDivElement | null>(null);
  const [showSortScrollTop, setShowSortScrollTop] = useState(false);
  const [showSortScrollBottom, setShowSortScrollBottom] = useState(false);
  const selectionEnabled = selection?.enabled ?? false;

  const normalizedLayoutState = useMemo(
    () => normalizeLayoutState(columns, layoutState),
    [columns, layoutState],
  );
  const normalizedFilterState = useMemo(
    () => normalizeFilterState(filterState),
    [filterState],
  );

  useEffect(() => {
    onTableStateChange?.({
      filters: normalizedFilterState,
      layout: normalizedLayoutState,
    });
  }, [normalizedFilterState, normalizedLayoutState, onTableStateChange]);

  useEffect(() => {
    const rowIds = new Set(rows.map((row) => row.id));

    setRowSelection((current) => {
      let didChange = false;
      const nextSelection: Record<string, boolean> = {};

      for (const [rowId, isSelected] of Object.entries(current)) {
        if (!isSelected) {
          continue;
        }

        if (!rowIds.has(rowId)) {
          didChange = true;
          continue;
        }

        nextSelection[rowId] = true;
      }

      return didChange ? nextSelection : current;
    });
  }, [rows]);

  function syncSortMenuScrollIndicators() {
    const element = sortMenuScrollRef.current;
    if (!element) {
      setShowSortScrollTop(false);
      setShowSortScrollBottom(false);
      return;
    }

    const epsilon = 1;
    setShowSortScrollTop(element.scrollTop > epsilon);
    setShowSortScrollBottom(
      element.scrollTop + element.clientHeight < element.scrollHeight - epsilon,
    );
  }

  useEffect(() => {
    if (!isSortMenuOpen) {
      setShowSortScrollTop(false);
      setShowSortScrollBottom(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      syncSortMenuScrollIndicators();
    });

    return () => cancelAnimationFrame(frame);
  }, [columns, isSortMenuOpen, normalizedLayoutState.columnOrder]);

  const columnById = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );
  const orderedColumns = useMemo(
    () =>
      normalizedLayoutState.columnOrder
        .map((columnId) => columnById.get(columnId))
        .filter((column): column is DataTableColumn<TData> => Boolean(column)),
    [columnById, normalizedLayoutState.columnOrder],
  );
  const visibleColumnIds = useMemo(
    () => new Set(normalizedLayoutState.visibleColumnIds),
    [normalizedLayoutState.visibleColumnIds],
  );
  const visibleColumns = useMemo(
    () => orderedColumns.filter((column) => visibleColumnIds.has(column.id)),
    [orderedColumns, visibleColumnIds],
  );
  const selectionColumn = useMemo<DataTableColumn<TData> | null>(() => {
    if (!selectionEnabled) {
      return null;
    }

    return {
      align: "center",
      canHide: false,
      canReorder: false,
      columnDef: {
        cell: ({ row }) => (
          <div
            className={cn(
              "flex h-full items-center justify-center transition-opacity duration-150",
              row.getIsSelected()
                ? "opacity-100"
                : "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100",
            )}
            data-row-interactive="true"
          >
            <SelectionCheckbox
              ariaLabel={`Select ${row.original.id}`}
              checked={row.getIsSelected()}
              onChange={(checked) => row.toggleSelected(checked)}
            />
          </div>
        ),
        header: ({ table: selectionTable }) => (
          <div className="flex justify-center">
            <SelectionCheckbox
              ariaLabel="Select all rows"
              checked={selectionTable.getIsAllRowsSelected()}
              indeterminate={
                selectionTable.getIsSomeRowsSelected() &&
                !selectionTable.getIsAllRowsSelected()
              }
              onChange={(checked) => selectionTable.toggleAllRowsSelected(checked)}
            />
          </div>
        ),
      } as DataTableColumn<TData>["columnDef"],
      getValue: () => "",
      id: ROW_SELECTION_COLUMN_ID,
      interactive: true,
      label: "Select",
      pinning: "system-left",
      width: 44,
    };
  }, [selectionEnabled]);
  const renderColumns = useMemo(
    () => (selectionColumn ? [selectionColumn, ...orderedColumns] : orderedColumns),
    [orderedColumns, selectionColumn],
  );
  const renderColumnById = useMemo(
    () => new Map(renderColumns.map((column) => [column.id, column])),
    [renderColumns],
  );
  const effectiveColumnOrder = useMemo(
    () =>
      selectionColumn
        ? [ROW_SELECTION_COLUMN_ID, ...normalizedLayoutState.columnOrder]
        : normalizedLayoutState.columnOrder,
    [normalizedLayoutState.columnOrder, selectionColumn],
  );
  const effectivePinnedLeftColumnIds = useMemo(
    () =>
      selectionColumn
        ? [
            ROW_SELECTION_COLUMN_ID,
            ...normalizedLayoutState.pinnedLeftColumnIds.filter(
              (columnId) => columnId !== ROW_SELECTION_COLUMN_ID,
            ),
          ]
        : normalizedLayoutState.pinnedLeftColumnIds,
    [normalizedLayoutState.pinnedLeftColumnIds, selectionColumn],
  );

  const table = useReactTable({
    columns: renderColumns.map((column) => ({
      ...column.columnDef,
      id: column.id,
      size: column.width ?? 180,
    })),
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualSorting: true,
    enableRowSelection: selectionEnabled,
    onRowSelectionChange: setRowSelection,
    state: {
      columnOrder: effectiveColumnOrder,
      columnPinning: {
        left: effectivePinnedLeftColumnIds,
        right: normalizedLayoutState.pinnedRightColumnIds,
      },
      columnVisibility: Object.fromEntries(
        renderColumns.map((column) => [
          column.id,
          column.id === ROW_SELECTION_COLUMN_ID || visibleColumnIds.has(column.id),
        ]),
      ),
      rowSelection,
    },
  });

  const visibleLeafColumns = table.getVisibleLeafColumns();
  const leftOffsets = new Map<string, number>();
  const rightOffsets = new Map<string, number>();
  let leftCursor = 0;
  for (const column of visibleLeafColumns) {
    if (effectivePinnedLeftColumnIds.includes(column.id)) {
      leftOffsets.set(column.id, leftCursor);
      leftCursor += column.getSize();
    }
  }
  let rightCursor = 0;
  for (const column of [...visibleLeafColumns].reverse()) {
    if (normalizedLayoutState.pinnedRightColumnIds.includes(column.id)) {
      rightOffsets.set(column.id, rightCursor);
      rightCursor += column.getSize();
    }
  }

  const groupedRows = useMemo(
    () => buildGroupedRows(rows, columns, normalizedLayoutState.groupBy),
    [columns, normalizedLayoutState.groupBy, rows],
  );
  const virtualizer = useVirtualizer({
    count: groupedRows.length,
    estimateSize: (index: number) => (groupedRows[index]?.kind === "group" ? 42 : 60),
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const rowModelById = useMemo(
    () => new Map(table.getRowModel().rows.map((row) => [row.id, row])),
    [table],
  );

  const activeKanbanField = useMemo(
    () =>
      kanban.fields.find(
        (field) => field.field === normalizedLayoutState.kanbanLaneField,
      ) ?? kanban.fields[0] ?? null,
    [kanban.fields, normalizedLayoutState.kanbanLaneField],
  );
  const kanbanBuckets = useMemo(
    () => buildKanbanBuckets(rows, activeKanbanField),
    [activeKanbanField, rows],
  );

  const sortableColumns = orderedColumns.filter((column) => column.sortKey);
  const totalTableWidth = visibleLeafColumns.reduce(
    (sum, column) => sum + column.getSize(),
    0,
  );
  const statusRecordCount = status?.totalCount ?? rows.length;
  const isTableLoading = status?.isLoading ?? false;
  const statusPageSize = Math.max(status?.pageSize ?? 50, 1);
  const tableStatusLabel = isTableLoading
    ? "Loading…"
    : `${statusRecordCount} ${statusRecordCount === 1 ? "record" : "records"}`;
  const rowPositionByGroupedIndex = useMemo(() => {
    let rowPosition = -1;

    return groupedRows.map((item) => {
      if (item.kind === "row") {
        rowPosition += 1;
      }

      return rowPosition;
    });
  }, [groupedRows]);
  const tablePageLabel = useMemo(() => {
    let maxVisibleRowPosition = 0;

    for (const virtualItem of virtualItems) {
      const item = groupedRows[virtualItem.index];
      if (!item || item.kind !== "row") {
        continue;
      }

      maxVisibleRowPosition = Math.max(
        maxVisibleRowPosition,
        rowPositionByGroupedIndex[virtualItem.index] ?? 0,
      );
    }

    return `Page ${Math.floor(maxVisibleRowPosition / statusPageSize) + 1}`;
  }, [groupedRows, rowPositionByGroupedIndex, statusPageSize, virtualItems]);
  const SortTriggerIcon =
    normalizedLayoutState.sort?.direction === "asc"
      ? ArrowUpNarrowWide
      : ArrowDownNarrowWide;
  const defaultSort = useMemo(
    () => normalizeLayoutState(columns, defaultLayout).sort,
    [columns, defaultLayout],
  );

  function toggleSortFromHeader(field: string) {
    setLayoutState((current) => {
      const currentSort = current.sort;

      if (!currentSort || currentSort.field !== field) {
        return {
          ...current,
          sort: {
            direction: "asc",
            field,
          },
        };
      }

      if (currentSort.direction === "asc") {
        return {
          ...current,
          sort: {
            direction: "desc",
            field,
          },
        };
      }

      return {
        ...current,
        sort: defaultSort,
      };
    });
  }

  function setSortField(field: string) {
    setLayoutState((current) => ({
      ...current,
      sort: {
        direction: current.sort?.direction ?? "desc",
        field,
      },
    }));
  }

  function updateSortDirection(direction: "asc" | "desc") {
    setLayoutState((current) => ({
      ...current,
      sort: {
        direction,
        field: current.sort?.field ?? sortableColumns[0]?.sortKey ?? "",
      },
    }));
  }

  function setColumnVisibility(columnId: string, isVisible: boolean) {
    setLayoutState((current) => {
      const nextVisible = new Set(current.visibleColumnIds);
      if (isVisible) {
        nextVisible.add(columnId);
      } else {
        nextVisible.delete(columnId);
      }

      return normalizeLayoutState(columns, {
        ...current,
        visibleColumnIds: [...nextVisible],
      });
    });
  }

  function moveColumn(columnId: string, direction: "up" | "down") {
    setLayoutState((current) => {
      const currentIndex = current.columnOrder.indexOf(columnId);
      if (currentIndex === -1) {
        return current;
      }

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= current.columnOrder.length) {
        return current;
      }

      const nextOrder = [...current.columnOrder];
      const [removed] = nextOrder.splice(currentIndex, 1);
      nextOrder.splice(targetIndex, 0, removed ?? columnId);

      return normalizeLayoutState(columns, {
        ...current,
        columnOrder: nextOrder,
      });
    });
  }

  function setColumnPinning(columnId: string, nextPinning: "left" | "none" | "right") {
    setLayoutState((current) => {
      const nextLeft = current.pinnedLeftColumnIds.filter((id) => id !== columnId);
      const nextRight = current.pinnedRightColumnIds.filter((id) => id !== columnId);

      if (nextPinning === "left") {
        nextLeft.push(columnId);
      }
      if (nextPinning === "right") {
        nextRight.push(columnId);
      }

      return normalizeLayoutState(columns, {
        ...current,
        pinnedLeftColumnIds: nextLeft,
        pinnedRightColumnIds: nextRight,
      });
    });
  }

  function resetToDefault() {
    setRowSelection({});
    setFilterState(normalizeFilterState(defaultFilters));
    setLayoutState(normalizeLayoutState(columns, defaultLayout));
  }

  function getCellStyle(columnId: string): CSSProperties {
    if (leftOffsets.has(columnId)) {
      return {
        left: leftOffsets.get(columnId),
        position: "sticky",
        width: table.getColumn(columnId)?.getSize(),
        zIndex: 8,
      };
    }

    if (rightOffsets.has(columnId)) {
      return {
        position: "sticky",
        right: rightOffsets.get(columnId),
        width: table.getColumn(columnId)?.getSize(),
        zIndex: 8,
      };
    }

    return {
      width: table.getColumn(columnId)?.getSize(),
    };
  }

  function renderListRows() {
    const topSpacer = virtualItems[0]?.start ?? 0;
    const bottomSpacer =
      virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0);

    return (
      <div className="overflow-hidden rounded border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_92%,white)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,white)] px-4 py-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded px-3 py-1 text-sm font-medium text-[var(--panel-ink)] transition hover:bg-[color-mix(in_srgb,var(--accent-soft)_60%,white)]"
            >
              All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Open filter options"
              className={buttonClasses({
                size: "sm",
                variant: "ghost",
                className:
                  "min-h-8 min-w-8 rounded border-transparent px-0 text-[var(--panel-ink)] hover:border-transparent hover:bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] hover:text-[var(--panel-ink)]",
              })}
            >
              <ListFilterPlus className="h-4 w-4" />
            </button>

            <DropdownMenu open={isSortMenuOpen} onOpenChange={setIsSortMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open sort options"
                  className={buttonClasses({
                    size: "sm",
                    variant: "secondary",
                    className:
                      "min-h-8 min-w-8 rounded border-[color-mix(in_srgb,var(--line)_80%,white)] px-0",
                  })}
                >
                  <SortTriggerIcon className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="grid h-[24rem] min-w-[15rem] grid-rows-[minmax(0,1fr)_auto] overflow-hidden p-0"
              >
                <div className="relative min-h-0 h-full">
                  {showSortScrollTop ? (
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center bg-gradient-to-b from-[color-mix(in_srgb,white_96%,var(--panel))] via-[color-mix(in_srgb,white_96%,var(--panel))] to-transparent pt-1">
                      <ChevronUp className="h-4 w-4 text-[var(--ink-muted)]" />
                    </div>
                  ) : null}
                  <div
                    ref={sortMenuScrollRef}
                    className="h-full min-h-0 overflow-y-auto p-1"
                    onScroll={syncSortMenuScrollIndicators}
                  >
                    <RadioGroup
                      className="gap-1"
                      value={normalizedLayoutState.sort?.field ?? sortableColumns[0]?.sortKey ?? ""}
                      onValueChange={setSortField}
                    >
                      {sortableColumns.map((column) => {
                        const columnSortKey = column.sortKey ?? column.id;
                        const isActive = normalizedLayoutState.sort?.field === columnSortKey;

                        return (
                          <label
                            key={column.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded px-2.5 py-2 text-sm text-[var(--panel-ink)] transition hover:bg-slate-100",
                              isActive &&
                                "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                            )}
                            onClick={() => setSortField(columnSortKey)}
                          >
                            <RadioGroupItem
                              aria-label={`Sort by ${column.label}`}
                              className="size-4 border-[var(--panel-ink)] data-[state=checked]:border-[var(--panel-ink)]"
                              value={columnSortKey}
                            />
                            <span>{column.label}</span>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </div>
                  {showSortScrollBottom ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-[color-mix(in_srgb,white_96%,var(--panel))] via-[color-mix(in_srgb,white_96%,var(--panel))] to-transparent pb-1">
                      <ChevronDown className="h-4 w-4 text-[var(--ink-muted)]" />
                    </div>
                  ) : null}
                </div>
                <div className="border-t border-[var(--line)] bg-[color-mix(in_srgb,white_96%,var(--panel))] p-1">
                  <RadioGroup
                    className="gap-1"
                    value={normalizedLayoutState.sort?.direction ?? "desc"}
                    onValueChange={(value) =>
                      updateSortDirection(value === "asc" ? "asc" : "desc")
                    }
                  >
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded px-2.5 py-2 text-sm text-[var(--panel-ink)] transition hover:bg-slate-100",
                        normalizedLayoutState.sort?.direction === "asc" &&
                          "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                      )}
                      onClick={() => updateSortDirection("asc")}
                    >
                      <RadioGroupItem
                        aria-label="Sort ascending"
                        className="size-4 border-[var(--panel-ink)] data-[state=checked]:border-[var(--panel-ink)]"
                        value="asc"
                      />
                      <span>Ascending</span>
                    </label>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded px-2.5 py-2 text-sm text-[var(--panel-ink)] transition hover:bg-slate-100",
                        normalizedLayoutState.sort?.direction !== "asc" &&
                          "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                      )}
                      onClick={() => updateSortDirection("desc")}
                    >
                      <RadioGroupItem
                        aria-label="Sort descending"
                        className="size-4 border-[var(--panel-ink)] data-[state=checked]:border-[var(--panel-ink)]"
                        value="desc"
                      />
                      <span>Descending</span>
                    </label>
                  </RadioGroup>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {groupedRows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--panel-ink)]">{emptyState.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
              {emptyState.description}
            </p>
          </div>
        ) : (
          <div ref={scrollRef} className="max-h-[70vh] overflow-auto">
            <table
              className="w-full table-fixed border-separate border-spacing-0"
              style={{ minWidth: Math.max(totalTableWidth, 860) }}
            >
              <thead className="sticky top-0 z-20 bg-[color-mix(in_srgb,var(--panel)_94%,white)] backdrop-blur">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const column = renderColumnById.get(header.column.id);
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "overflow-hidden border-b border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]",
                            column?.align === "center" && "text-center",
                            column?.align === "left" && "text-left",
                            column?.align === "right" && "text-right",
                            leftOffsets.has(header.column.id) ||
                              rightOffsets.has(header.column.id)
                              ? "bg-white"
                              : "",
                          )}
                          style={getCellStyle(header.column.id)}
                        >
                          {header.isPlaceholder || !column ? null : header.column.id === ROW_SELECTION_COLUMN_ID ? (
                            flexRender(header.column.columnDef.header, header.getContext())
                          ) : (
                            <StickyHeaderLabel
                              align={column.align}
                              label={column.headerLabel ?? column.label}
                              onSortToggle={toggleSortFromHeader}
                              sortKey={column.sortKey}
                              sort={normalizedLayoutState.sort}
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {topSpacer > 0 ? (
                  <tr>
                    <td colSpan={visibleLeafColumns.length} style={{ height: topSpacer }} />
                  </tr>
                ) : null}
                {virtualItems.map((virtualItem: (typeof virtualItems)[number]) => {
                  const item = groupedRows[virtualItem.index];
                  if (!item) {
                    return null;
                  }

                  if (item.kind === "group") {
                    return (
                      <tr key={`group-${item.value}-${virtualItem.index}`}>
                        <td
                          colSpan={visibleLeafColumns.length}
                          className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent-soft)_38%,white)] px-4 py-2 text-sm font-medium text-[var(--panel-ink)]"
                        >
                          <span>{item.label}</span>
                          <span className="ml-2 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                            {item.count} rows
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  const tableRow = rowModelById.get(item.row.id);
                  if (!tableRow) {
                    return null;
                  }

                  return (
                    <tr key={tableRow.id} className="group/row">
                      {tableRow.getVisibleCells().map((cell) => {
                        const columnConfig = renderColumnById.get(cell.column.id);
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "overflow-hidden border-b border-[color-mix(in_srgb,var(--line)_70%,white)] px-4 py-2.5 align-top text-sm text-[var(--panel-ink)]",
                              cell.column.id === ROW_SELECTION_COLUMN_ID && "align-middle",
                              columnConfig?.align === "center" && "text-center",
                              columnConfig?.align === "left" && "text-left",
                              columnConfig?.align === "right" && "text-right",
                              leftOffsets.has(cell.column.id) ||
                                rightOffsets.has(cell.column.id)
                                ? "bg-white"
                                : "bg-transparent",
                            )}
                            data-row-interactive={columnConfig?.interactive ? "true" : "false"}
                            style={getCellStyle(cell.column.id)}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {bottomSpacer > 0 ? (
                  <tr>
                    <td colSpan={visibleLeafColumns.length} style={{ height: bottomSpacer }} />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,white)] px-4 py-3 text-sm">
          <p className="text-[var(--ink-muted)]">{tableStatusLabel}</p>
          <p className="font-medium text-[var(--panel-ink)]">{tablePageLabel}</p>
        </div>
      </div>
    );
  }

  function renderMobileCards() {
    if (groupedRows.length === 0) {
      return (
        <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-white/70 px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--panel-ink)]">{emptyState.title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            {emptyState.description}
          </p>
        </div>
      );
    }

    const cardColumns = visibleColumns.filter((column) => !column.interactive);

    return (
      <div className="grid gap-4">
        {groupedRows.map((item, index) => {
          if (item.kind === "group") {
            return (
              <div
                key={`mobile-group-${item.value}-${index}`}
                className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent-soft)_36%,white)] px-4 py-2 text-sm font-medium text-[var(--panel-ink)]"
              >
                {item.label}
                <span className="ml-2 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {item.count}
                </span>
              </div>
            );
          }

          return (
            <article
              key={item.row.id}
              className="rounded-[28px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,white)] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {selectionEnabled ? (
                    <div className="flex items-center" data-row-interactive="true">
                      <SelectionCheckbox
                        ariaLabel={`Select ${item.row.id}`}
                        checked={Boolean(rowSelection[item.row.id])}
                        onChange={(checked) =>
                          setRowSelection((current) => ({
                            ...current,
                            [item.row.id]: checked,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-base font-semibold text-[var(--panel-ink)]">
                      {String(cardColumns[0]?.getValue(item.row) ?? item.row.id)}
                    </p>
                    {cardColumns[1] ? (
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        {String(cardColumns[1].getValue(item.row) ?? "")}
                      </p>
                    ) : null}
                  </div>
                </div>
                {renderCardActions ? renderCardActions(item.row) : null}
              </div>
              <dl className="mt-4 grid gap-3">
                {cardColumns.slice(2, 6).map((column) => (
                  <Fragment key={column.id}>
                    <div className="grid gap-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {column.mobileLabel ?? column.label}
                      </dt>
                      <dd className="text-sm text-[var(--panel-ink)]">
                        {String(column.getValue(item.row) ?? "—")}
                      </dd>
                    </div>
                  </Fragment>
                ))}
              </dl>
            </article>
          );
        })}
      </div>
    );
  }

  function renderKanbanBoard() {
    if (rows.length === 0) {
      return (
        <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-white/70 px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--panel-ink)]">{emptyState.title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            {emptyState.description}
          </p>
        </div>
      );
    }

    const boardColumns = visibleColumns.filter((column) => !column.interactive);

    return (
      <div
        className={cn(
          "flex gap-4 overflow-x-auto pb-2",
          isMobileViewport ? "snap-x snap-mandatory" : "",
        )}
      >
        {kanbanBuckets.map((bucket) => (
          <section
            key={bucket.value}
            className={cn(
              "min-w-[18rem] shrink-0 rounded-[28px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_92%,white)] p-4",
              isMobileViewport ? "w-[88vw] snap-start" : "w-[21rem]",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {bucket.label}
                </h3>
                <p className="mt-1 text-sm text-[var(--panel-ink)]">
                  {bucket.items.length} leads
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {bucket.items.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-[var(--line)] bg-white/85 p-4 shadow-[0_12px_30px_-24px_color-mix(in_srgb,var(--accent)_36%,transparent)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {selectionEnabled ? (
                        <div className="flex items-center" data-row-interactive="true">
                          <SelectionCheckbox
                            ariaLabel={`Select ${row.id}`}
                            checked={Boolean(rowSelection[row.id])}
                            onChange={(checked) =>
                              setRowSelection((current) => ({
                                ...current,
                                [row.id]: checked,
                              }))
                            }
                          />
                        </div>
                      ) : null}
                      <div>
                        <p className="text-sm font-semibold text-[var(--panel-ink)]">
                          {String(boardColumns[0]?.getValue(row) ?? row.id)}
                        </p>
                        {boardColumns[1] ? (
                          <p className="mt-1 text-sm text-[var(--ink-muted)]">
                            {String(boardColumns[1].getValue(row) ?? "")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {renderCardActions ? renderCardActions(row) : null}
                  </div>
                  <dl className="mt-4 grid gap-2">
                    {boardColumns.slice(2, 5).map((column) => (
                      <div key={column.id} className="grid gap-1">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                          {column.mobileLabel ?? column.label}
                        </dt>
                        <dd className="text-sm text-[var(--panel-ink)]">
                          {String(column.getValue(row) ?? "—")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  function showListView() {
    setLayoutState((current) => ({
      ...current,
      viewMode: "list",
    }));
  }

  function showKanbanView() {
    setLayoutState((current) =>
      normalizeLayoutState(columns, {
        ...current,
        kanbanLaneField:
          current.kanbanLaneField ??
          kanban.fields[0]?.field ??
          null,
        viewMode: "kanban",
      }),
    );
  }

  function renderTopToolbar() {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded px-3 py-1 text-sm font-medium text-[var(--panel-ink)] transition hover:bg-[color-mix(in_srgb,var(--accent-soft)_60%,white)]"
          >
            All
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Open filter options"
            className={buttonClasses({
              size: "sm",
              variant: "ghost",
              className:
                "min-h-8 min-w-8 rounded border-transparent px-0 text-[var(--panel-ink)] hover:border-transparent hover:bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] hover:text-[var(--panel-ink)]",
            })}
          >
            <ListFilterPlus className="h-4 w-4" />
          </button>

          <DropdownMenu open={isSortMenuOpen} onOpenChange={setIsSortMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open sort options"
                className={buttonClasses({
                  size: "sm",
                  variant: "secondary",
                  className:
                    "min-h-8 min-w-8 rounded border-[color-mix(in_srgb,var(--line)_80%,white)] px-0",
                })}
              >
                <SortTriggerIcon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="grid h-[24rem] min-w-[15rem] grid-rows-[minmax(0,1fr)_auto] overflow-hidden p-0"
            >
              <div className="relative min-h-0 h-full">
                {showSortScrollTop ? (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center bg-gradient-to-b from-[color-mix(in_srgb,white_96%,var(--panel))] via-[color-mix(in_srgb,white_96%,var(--panel))] to-transparent pt-1">
                    <ChevronUp className="h-4 w-4 text-[var(--ink-muted)]" />
                  </div>
                ) : null}
                <div
                  ref={sortMenuScrollRef}
                  className="h-full min-h-0 overflow-y-auto p-1"
                  onScroll={syncSortMenuScrollIndicators}
                >
                  <RadioGroup
                    className="gap-1"
                    value={normalizedLayoutState.sort?.field ?? sortableColumns[0]?.sortKey ?? ""}
                    onValueChange={setSortField}
                  >
                    {sortableColumns.map((column) => {
                      const columnSortKey = column.sortKey ?? column.id;
                      const isActive = normalizedLayoutState.sort?.field === columnSortKey;

                      return (
                        <label
                          key={column.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded px-2.5 py-2 text-sm text-[var(--panel-ink)] transition hover:bg-slate-100",
                            isActive &&
                              "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                          )}
                          onClick={() => setSortField(columnSortKey)}
                        >
                          <RadioGroupItem
                            aria-label={`Sort by ${column.label}`}
                            className="size-4 border-[var(--panel-ink)] data-[state=checked]:border-[var(--panel-ink)]"
                            value={columnSortKey}
                          />
                          <span>{column.label}</span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </div>
                {showSortScrollBottom ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-[color-mix(in_srgb,white_96%,var(--panel))] via-[color-mix(in_srgb,white_96%,var(--panel))] to-transparent pb-1">
                    <ChevronDown className="h-4 w-4 text-[var(--ink-muted)]" />
                  </div>
                ) : null}
              </div>
              <div className="border-t border-[var(--line)] bg-[color-mix(in_srgb,white_96%,var(--panel))] p-1">
                <RadioGroup
                  className="gap-1"
                  value={normalizedLayoutState.sort?.direction ?? "desc"}
                  onValueChange={(value) =>
                    updateSortDirection(value === "asc" ? "asc" : "desc")
                  }
                >
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded px-2.5 py-2 text-sm text-[var(--panel-ink)] transition hover:bg-slate-100",
                      normalizedLayoutState.sort?.direction === "asc" &&
                        "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                    )}
                    onClick={() => updateSortDirection("asc")}
                  >
                    <RadioGroupItem
                      aria-label="Sort ascending"
                      className="size-4 border-[var(--panel-ink)] data-[state=checked]:border-[var(--panel-ink)]"
                      value="asc"
                    />
                    <span>Ascending</span>
                  </label>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded px-2.5 py-2 text-sm text-[var(--panel-ink)] transition hover:bg-slate-100",
                      normalizedLayoutState.sort?.direction !== "asc" &&
                        "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                    )}
                    onClick={() => updateSortDirection("desc")}
                  >
                    <RadioGroupItem
                      aria-label="Sort descending"
                      className="size-4 border-[var(--panel-ink)] data-[state=checked]:border-[var(--panel-ink)]"
                      value="desc"
                    />
                    <span>Descending</span>
                  </label>
                </RadioGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open more actions"
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
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              <DropdownMenuItem
                className={cn(
                  normalizedLayoutState.viewMode === "list" &&
                    "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                )}
                onSelect={() => showListView()}
              >
                List view
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  normalizedLayoutState.viewMode === "kanban" &&
                    "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--panel-ink)]",
                )}
                onSelect={() => showKanbanView()}
              >
                Kanban view
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setIsLayoutEditorOpen((current) => !current)}
              >
                {isLayoutEditorOpen ? "Hide" : "Table layout editor"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={resetToDefault}>
                Reset table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            className={buttonClasses({
              size: "sm",
              variant: "primary",
              className: "min-h-8 rounded px-3",
            })}
          >
            Add lead
          </button>
        </div>
      </div>
    );
  }

  function renderLayoutEditor() {
    return (
      <details
        open={isLayoutEditorOpen}
        className="rounded border border-[var(--line)] bg-white/65 p-4"
      >
        <summary className="cursor-pointer text-sm font-medium text-[var(--panel-ink)]">
          Table layout editor
        </summary>
        <div className="mt-4 grid gap-3">
          {orderedColumns.map((column) => {
            const isSystemPinned =
              column.pinning === "system-left" || column.pinning === "system-right";
            const selectedPinning = normalizedLayoutState.pinnedLeftColumnIds.includes(column.id)
              ? "left"
              : normalizedLayoutState.pinnedRightColumnIds.includes(column.id)
                ? "right"
                : "none";

            return (
              <div
                key={column.id}
                className="grid gap-3 rounded border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_74%,white)] px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--panel-ink)]">{column.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {isSystemPinned
                      ? column.pinning === "system-left"
                        ? "System sticky left"
                        : "System sticky right"
                      : column.pinning === "user"
                        ? "User pinning enabled"
                        : "Standard column"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--panel-ink)]">
                  <input
                    checked={visibleColumnIds.has(column.id)}
                    disabled={isSystemPinned || column.canHide === false}
                    type="checkbox"
                    onChange={(event) =>
                      setColumnVisibility(column.id, event.target.checked)
                    }
                  />
                  Visible
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonClasses({ size: "sm", variant: "ghost" })}
                    onClick={() => moveColumn(column.id, "up")}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className={buttonClasses({ size: "sm", variant: "ghost" })}
                    onClick={() => moveColumn(column.id, "down")}
                  >
                    Down
                  </button>
                  {column.pinning === "user" ? (
                    <select
                      className="min-h-10 rounded border border-[var(--line)] bg-white px-3 text-sm text-[var(--panel-ink)]"
                      value={selectedPinning}
                      onChange={(event) =>
                        setColumnPinning(
                          column.id,
                          event.target.value as "left" | "none" | "right",
                        )
                      }
                    >
                      <option value="none">No sticky</option>
                      <option value="left">Sticky left</option>
                      <option value="right">Sticky right</option>
                    </select>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <div className="grid gap-4">
      {renderTopToolbar()}
      {isLayoutEditorOpen ? renderLayoutEditor() : null}
      {normalizedLayoutState.viewMode === "kanban"
        ? renderKanbanBoard()
        : isMobileViewport
          ? renderMobileCards()
          : renderListRows()}
    </div>
  );
}
