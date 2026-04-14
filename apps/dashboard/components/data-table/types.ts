"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

export type DataTableViewMode = "list" | "kanban";

export type DataTableSort = {
  direction: "asc" | "desc";
  field: string;
} | null;

export type DataTableColumnFilter = {
  columnId: string;
  value: string;
};

export type DataTableFilterState = {
  columnFilters: DataTableColumnFilter[];
  searchText: string;
};

export type DataTableLayoutState = {
  columnOrder: string[];
  groupBy: string | null;
  kanbanLaneField: string | null;
  pinnedLeftColumnIds: string[];
  pinnedRightColumnIds: string[];
  sort: DataTableSort;
  viewMode: DataTableViewMode;
  visibleColumnIds: string[];
};

export type DataTableColumnPinning = "none" | "system-left" | "system-right" | "user";

export type DataTableColumnFilterOption = {
  label: string;
  value: string;
};

export type DataTableColumn<TData extends { id: string }> = {
  align?: "center" | "left" | "right";
  canHide?: boolean;
  canReorder?: boolean;
  columnDef: ColumnDef<TData>;
  filterOptions?: DataTableColumnFilterOption[];
  getGroupValue?: (row: TData) => string | null;
  getKanbanValue?: (row: TData) => string | null;
  getValue: (row: TData) => string | number | null;
  headerLabel?: string;
  id: string;
  interactive?: boolean;
  kanban?: {
    label: string;
  };
  label: string;
  mobileLabel?: string;
  pinning?: DataTableColumnPinning;
  searchable?: boolean;
  sortKey?: string;
  width?: number;
};

export type DataTableKanbanLane = {
  label: string;
  value: string;
};

export type DataTableKanbanField<TData extends { id: string }> = {
  field: string;
  getValue: (row: TData) => string | null;
  label: string;
  lanes: DataTableKanbanLane[];
};

export type SavedDataTableProfile<TState> = {
  id: string;
  isEditable: boolean;
  isOrgShared: boolean;
  name: string;
  ownerUserId: string;
  state: TState;
};

export type ShareableDataTableUser = {
  email: string;
  id: string;
  initials: string;
  name: string;
  role: string;
};

export type DataTableProfileSaveInput<TState> = {
  isOrgShared: boolean;
  name: string;
  profileId?: string;
  sharedWithUserIds: string[];
  state: TState;
};

export type FlattenedListRow<TData extends { id: string }> =
  | {
      count: number;
      kind: "group";
      label: string;
      value: string;
    }
  | {
      kind: "row";
      row: TData;
    };

export type KanbanLaneBucket<TData extends { id: string }> = {
  items: TData[];
  label: string;
  value: string;
};

export type DataTableProps<TData extends { id: string }> = {
  columns: DataTableColumn<TData>[];
  defaultFilters: DataTableFilterState;
  defaultLayout: DataTableLayoutState;
  emptyState: {
    description: string;
    title: string;
  };
  filterProfiles: SavedDataTableProfile<DataTableFilterState>[];
  hasMore: boolean;
  kanban: {
    fields: DataTableKanbanField<TData>[];
  };
  layoutProfiles: SavedDataTableProfile<DataTableLayoutState>[];
  onDeleteProfile: (args: { profileId: string; profileKind: "filter" | "layout" }) => Promise<void>;
  onFilterProfilesChange?: (profiles: SavedDataTableProfile<DataTableFilterState>[]) => void;
  onLayoutProfilesChange?: (profiles: SavedDataTableProfile<DataTableLayoutState>[]) => void;
  onSaveFilterProfile: (
    input: DataTableProfileSaveInput<DataTableFilterState>,
  ) => Promise<string>;
  onSaveLayoutProfile: (
    input: DataTableProfileSaveInput<DataTableLayoutState>,
  ) => Promise<string>;
  onTableStateChange?: (state: {
    filters: DataTableFilterState;
    layout: DataTableLayoutState;
  }) => void;
  renderCardActions?: (row: TData) => ReactNode;
  resourceKey: string;
  rows: TData[];
  searchPlaceholder: string;
  selection?: {
    enabled: boolean;
  };
  status?: {
    isLoading?: boolean;
    pageSize?: number;
    totalCount?: number;
  };
  shareableUsers: ShareableDataTableUser[];
};
