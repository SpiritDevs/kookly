import type { ReactNode } from "react";

export type DashboardDrawerId = "create-event";

export type DashboardDrawerSource =
  | "event-types-page"
  | "dashboard-header"
  | "command-menu"
  | "calendar-empty-state"
  | "unknown";

export type CreateEventDrawerMode = "create" | "edit";

export type CreateEventDrawerPrefill = {
  name?: string;
  durationMinutes?: 15 | 30 | 45 | 60;
  location?: "meet" | "zoom" | "phone" | "office";
  bookingWindowDays?: 7 | 14 | 30 | 60;
  description?: string;
};

export type CreateEventDrawerPayload = {
  orgSlug: string;
  source: DashboardDrawerSource;
  mode: CreateEventDrawerMode;
  prefill?: CreateEventDrawerPrefill;
};

export type DashboardDrawerPayloadMap = {
  "create-event": CreateEventDrawerPayload;
};

export type DashboardDrawerOpenPayloadMap = {
  "create-event": Omit<CreateEventDrawerPayload, "orgSlug"> & {
    orgSlug?: string;
  };
};

export type ActiveDashboardDrawer = {
  [TId in DashboardDrawerId]: {
    id: TId;
    payload: DashboardDrawerPayloadMap[TId];
  };
}[DashboardDrawerId];

export type DashboardDrawerOpen = <TId extends DashboardDrawerId>(
  id: TId,
  payload: DashboardDrawerOpenPayloadMap[TId],
) => void;

export type DashboardDrawerReplace = DashboardDrawerOpen;

export type DashboardDrawerDefinition<TId extends DashboardDrawerId> = {
  id: TId;
  headerLabel?: (payload: DashboardDrawerPayloadMap[TId]) => ReactNode;
  title: (payload: DashboardDrawerPayloadMap[TId]) => ReactNode;
  description?: (payload: DashboardDrawerPayloadMap[TId]) => ReactNode;
  header?: "default" | "hidden";
  content: (args: {
    payload: DashboardDrawerPayloadMap[TId];
    closeDrawer: () => void;
    replaceDrawer: DashboardDrawerReplace;
  }) => ReactNode;
  footer?: (args: {
    payload: DashboardDrawerPayloadMap[TId];
    closeDrawer: () => void;
    replaceDrawer: DashboardDrawerReplace;
  }) => ReactNode;
  size?: "default";
  routeSync?: "none" | "query";
};

export type DashboardDrawerRegistry = {
  [TId in DashboardDrawerId]: DashboardDrawerDefinition<TId>;
};
