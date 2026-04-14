"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { dashboardDrawerRegistry } from "@/components/dashboard-drawers/registry";
import type {
  ActiveDashboardDrawer,
  DashboardDrawerId,
  DashboardDrawerOpen,
  DashboardDrawerOpenPayloadMap,
  DashboardDrawerPayloadMap,
  DashboardDrawerReplace,
} from "@/components/dashboard-drawers/types";

type DashboardDrawerContextValue = {
  openDrawer: DashboardDrawerOpen;
  closeDrawer: () => void;
  replaceDrawer: DashboardDrawerReplace;
  onDrawerExitComplete: () => void;
  activeDrawer: ActiveDashboardDrawer | null;
  activeDrawerHeaderLabel: ReactNode;
  activeDrawerTitle: ReactNode;
  isOpen: boolean;
};

const DashboardDrawerContext =
  createContext<DashboardDrawerContextValue | null>(null);

function resolveDashboardDrawerPayload(
  orgSlug: string,
  id: DashboardDrawerId,
  payload: DashboardDrawerOpenPayloadMap[DashboardDrawerId],
): DashboardDrawerPayloadMap[DashboardDrawerId] {
  switch (id) {
    case "create-event":
      return {
        orgSlug: payload.orgSlug ?? orgSlug,
        source: payload.source,
        mode: payload.mode ?? "create",
        prefill: payload.prefill,
      };
    default: {
      if (process.env.NODE_ENV !== "production") {
        console.error("Unhandled dashboard drawer id", id);
      }

      return {
        orgSlug,
        mode: "create",
        source: "unknown",
      };
    }
  }
}

export function DashboardDrawerProvider({
  orgSlug,
  children,
}: Readonly<{
  orgSlug: string;
  children: React.ReactNode;
}>) {
  const [activeDrawer, setActiveDrawer] = useState<ActiveDashboardDrawer | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const setDrawer = useCallback(
    (
      id: DashboardDrawerId,
      payload: DashboardDrawerOpenPayloadMap[DashboardDrawerId],
    ) => {
      const activeElement = document.activeElement;
      restoreFocusRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;

      setActiveDrawer({
        id,
        payload: resolveDashboardDrawerPayload(orgSlug, id, payload),
      });
      setIsOpen(true);
    },
    [orgSlug],
  );

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleDrawerExitComplete = useCallback(() => {
    if (isOpen || !activeDrawer) {
      return;
    }

    setActiveDrawer(null);
    const focusTarget = restoreFocusRef.current;
    restoreFocusRef.current = null;

    if (!focusTarget) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (focusTarget.isConnected) {
        focusTarget.focus();
      }
    });
  }, [activeDrawer, isOpen]);

  const contextValue = useMemo<DashboardDrawerContextValue>(
    () => ({
      activeDrawer,
      activeDrawerHeaderLabel: activeDrawer
        ? dashboardDrawerRegistry[activeDrawer.id].headerLabel?.(
            activeDrawer.payload,
          ) ?? null
        : null,
      activeDrawerTitle: activeDrawer
        ? dashboardDrawerRegistry[activeDrawer.id].title(activeDrawer.payload)
        : null,
      openDrawer: ((id, payload) =>
        setDrawer(
          id,
          payload as DashboardDrawerOpenPayloadMap[DashboardDrawerId],
        )) as DashboardDrawerOpen,
      closeDrawer,
      replaceDrawer: ((id, payload) =>
        setDrawer(
          id,
          payload as DashboardDrawerOpenPayloadMap[DashboardDrawerId],
        )) as DashboardDrawerReplace,
      onDrawerExitComplete: handleDrawerExitComplete,
      isOpen,
    }),
    [activeDrawer, closeDrawer, handleDrawerExitComplete, isOpen, setDrawer],
  );

  return (
    <DashboardDrawerContext.Provider value={contextValue}>
      {children}
    </DashboardDrawerContext.Provider>
  );
}

export function useDashboardDrawer() {
  const context = useContext(DashboardDrawerContext);

  if (!context) {
    throw new Error(
      "useDashboardDrawer must be used within a DashboardDrawerProvider.",
    );
  }

  return context;
}
