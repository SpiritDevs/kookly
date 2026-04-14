"use client";

import { dashboardDrawerRegistry } from "@/components/dashboard-drawers/registry";
import { useDashboardDrawer } from "@/components/dashboard-drawer-provider";
import { BottomDrawerSurface } from "@/components/ui/bottom-drawer-surface";

export function DashboardDrawerHost() {
  const { activeDrawer, closeDrawer, replaceDrawer, isOpen, onDrawerExitComplete } =
    useDashboardDrawer();

  let title: React.ReactNode = null;
  let description: React.ReactNode = null;
  let footer: React.ReactNode = null;
  let children: React.ReactNode = null;
  let hideHeader = false;

  if (activeDrawer) {
    const definition = dashboardDrawerRegistry[activeDrawer.id];

    title = definition.title(activeDrawer.payload);
    description = definition.description?.(activeDrawer.payload) ?? null;
    hideHeader = definition.header === "hidden";
    footer =
      definition.footer?.({
        payload: activeDrawer.payload,
        closeDrawer,
        replaceDrawer,
      }) ?? null;
    children = definition.content({
      payload: activeDrawer.payload,
      closeDrawer,
      replaceDrawer,
    });
  }

  return (
    <BottomDrawerSurface
      open={isOpen && activeDrawer !== null}
      onExitComplete={onDrawerExitComplete}
      onOpenChange={(open) => {
        if (!open) {
          closeDrawer();
        }
      }}
      title={title}
      description={description}
      footer={footer}
      hideHeader={hideHeader}
    >
      {children}
    </BottomDrawerSurface>
  );
}
