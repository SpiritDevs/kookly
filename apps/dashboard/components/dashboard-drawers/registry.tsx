import type { DashboardDrawerRegistry } from "@/components/dashboard-drawers/types";
import {
  CreateEventDrawerContent,
  CreateEventDrawerDescription,
  CreateEventDrawerFooter,
  CreateEventDrawerHeaderLabel,
  CreateEventDrawerTitle,
} from "@/components/dashboard-drawers/create-event-drawer";

export const dashboardDrawerRegistry: DashboardDrawerRegistry = {
  "create-event": {
    id: "create-event",
    headerLabel: (payload) => <CreateEventDrawerHeaderLabel payload={payload} />,
    title: (payload) => <CreateEventDrawerTitle payload={payload} />,
    description: () => <CreateEventDrawerDescription />,
    header: "hidden",
    content: ({ payload }) => <CreateEventDrawerContent payload={payload} />,
    footer: ({ closeDrawer, replaceDrawer }) => (
      <CreateEventDrawerFooter
        closeDrawer={closeDrawer}
        replaceDrawer={replaceDrawer}
      />
    ),
    size: "default",
    routeSync: "none",
  },
};
