"use client";

import { useGT } from "gt-next";
import { useDashboardDrawer } from "@/components/dashboard-drawer-provider";
import { buttonClasses, cn } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EventTypesPageVariant = "all" | "drafts" | "archived";

function getEventTypesPageCopy(
  gt: ReturnType<typeof useGT>,
  variant: EventTypesPageVariant,
) {
  switch (variant) {
    case "drafts":
      return {
        title: gt("Draft events"),
        heading: gt("Finish the event types that are still in progress."),
        description: gt(
          "Keep unfinished configurations here until the booking flow, copy, and scheduling rules are ready to publish.",
        ),
      };
    case "archived":
      return {
        title: gt("Archived events"),
        heading: gt("Review event types that are no longer live."),
        description: gt(
          "Use this space to audit retired configurations and restore the ones you want to bring back into circulation.",
        ),
      };
    case "all":
    default:
      return {
        title: gt("Event types"),
        heading: gt("Create your first event configuration."),
        description: gt(
          "Use the Add Event button to open a full-height drawer and define the booking details without leaving this screen.",
        ),
      };
  }
}

export function EventTypesPageContent({
  variant = "all",
}: Readonly<{
  variant?: EventTypesPageVariant;
}>) {
  const gt = useGT();
  const { openDrawer } = useDashboardDrawer();
  const copy = getEventTypesPageCopy(gt, variant);

  return (
    <>
      <div className="flex shrink-0 items-center justify-end">
        <Button
          type="button"
          className={cn(
            buttonClasses({ size: "sm" }),
            "min-h-9 px-3 text-[13px]",
          )}
          onClick={() =>
            openDrawer("create-event", {
              mode: "create",
              source: "event-types-page",
            })
          }
        >
          {gt("Add Event")}
        </Button>
      </div>

      <Card className="flex h-full min-h-0 min-w-0 flex-1 rounded-lg border border-[color-mix(in_srgb,var(--line)_65%,white)] bg-[color-mix(in_srgb,var(--panel)_88%,white)] py-0 shadow-sm">
        <CardHeader className="border-b border-[color-mix(in_srgb,var(--line)_55%,white)] py-5">
          <CardTitle className="text-[15px] text-[var(--panel-ink)]">
            {copy.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 items-center justify-center py-10">
          <div className="max-w-sm text-center">
            <p className="text-sm font-medium text-[var(--panel-ink)]">
              {copy.heading}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
              {copy.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
