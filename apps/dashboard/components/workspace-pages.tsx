"use client";

import { useGT, useLocale } from "gt-next";
import { useTransition } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Stack,
  StatGrid,
  useWorkspaceSnapshot,
  WorkspaceErrorCard,
  WorkspaceLoadingCard,
} from "@/components/dashboard-workspace-ui";
import { Badge, Panel, buttonClasses } from "@/components/ui";
import {
  formatBookingDate,
  summarizeWeeklyRules,
} from "@/lib/dashboard-format";

const dashboardApi = (api as typeof api & {
  dashboard: {
    createEventType: unknown;
    duplicateEventType: unknown;
    toggleEventTypeActive: unknown;
    updateBookingStatus: unknown;
    updateOrganizationSettings: unknown;
  };
}).dashboard;

type MutationFn<TArgs, TResult = { ok: boolean }> = (args: TArgs) => Promise<TResult>;

function useTypedMutation<TArgs, TResult = { ok: boolean }>(ref: unknown) {
  return useMutation(ref as never) as unknown as MutationFn<TArgs, TResult>;
}

function PendingNote({ pending }: Readonly<{ pending: boolean }>) {
  const gt = useGT();

  return pending ? <Badge tone="accent">{gt("Saving")}</Badge> : null;
}

function getBookingStatusLabel(
  status: string,
  gt: ReturnType<typeof useGT>,
) {
  switch (status) {
    case "confirmed":
      return gt("Confirmed");
    case "pending":
      return gt("Pending");
    case "cancelled":
      return gt("Cancelled");
    case "rescheduled":
      return gt("Rescheduled");
    default:
      return status;
  }
}

function getEventTypeStateLabel(
  isActive: boolean,
  gt: ReturnType<typeof useGT>,
) {
  return isActive ? gt("Active") : gt("Archived");
}

function useSnapshotOrState(orgSlug: string, label: string) {
  const gt = useGT();
  const snapshot = useWorkspaceSnapshot(orgSlug);

  if (snapshot === undefined) {
    return { loading: <WorkspaceLoadingCard label={label} />, snapshot: null };
  }

  if (!snapshot) {
    return {
      loading: (
        <WorkspaceErrorCard
          message={gt("This workspace could not be loaded.")}
        />
      ),
      snapshot: null,
    };
  }

  return { loading: null, snapshot };
}

export function OverviewWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const locale = useLocale();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading overview"));
  if (loading || !snapshot) return loading;

  return (
    <Stack className="gap-5">
      <StatGrid
        items={[
          { label: gt("Event types"), value: String(snapshot.eventTypes.length) },
          {
            label: gt("Confirmed bookings"),
            value: String(snapshot.analytics.totals.confirmed),
          },
          { label: gt("Pending invites"), value: String(snapshot.invites.length) },
          { label: gt("Workflows"), value: gt("Pending") },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="rounded-[28px] bg-white/80">
          <h2 className="text-xl font-semibold text-[var(--panel-ink)]">
            {gt("Live weekly availability")}
          </h2>
          <ul className="mt-4 grid gap-2 text-sm text-[var(--ink-muted)]">
            {summarizeWeeklyRules(snapshot.availability.rules, locale).map((rule) => (
              <li key={rule} className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
                {rule}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="rounded-[28px] bg-white/80">
          <h2 className="text-xl font-semibold text-[var(--panel-ink)]">
            {gt("Upcoming bookings")}
          </h2>
          <div className="mt-4 grid gap-3">
            {snapshot.bookings.slice(0, 4).map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--panel-ink)]">{booking.attendeeName}</p>
                    <p className="text-sm text-[var(--ink-muted)]">{booking.eventTypeName}</p>
                  </div>
                  <Badge tone={booking.status === "confirmed" ? "success" : "accent"}>
                    {getBookingStatusLabel(booking.status, gt)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--ink-muted)]">
                  {formatBookingDate(booking.startsAt, locale)} · {booking.timezone}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Stack>
  );
}

export function EventTypesWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading event types"));
  const duplicateEventType = useTypedMutation<{ orgSlug: string; eventTypeId: string }>(
    dashboardApi.duplicateEventType,
  );
  const toggleEventTypeActive = useTypedMutation<{ orgSlug: string; eventTypeId: string }>(
    dashboardApi.toggleEventTypeActive,
  );
  const [isPending, startTransition] = useTransition();

  if (loading || !snapshot) return loading;

  const visibleEventTypes = snapshot.eventTypes.filter((eventType) => (
    eventType.slug !== "intro-call"
  ));

  return (
    <Stack className="gap-5">
      {visibleEventTypes.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleEventTypes.map((eventType) => (
            <Panel key={eventType.id} className="rounded-[28px] bg-white/80">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--panel-ink)]">
                      {eventType.name}
                    </h2>
                    <Badge tone={eventType.isActive ? "success" : "neutral"}>
                      {getEventTypeStateLabel(eventType.isActive, gt)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    /{snapshot.organization.slug}/{eventType.slug} · {eventType.hostMode}
                  </p>
                </div>
                <Badge tone="accent">
                  {gt("{minutes} min", { minutes: eventType.durationMinutes })}
                </Badge>
              </div>
              <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-4">
                  <dt className="text-[var(--ink-muted)]">{gt("Question")}</dt>
                  <dd className="mt-1 text-[var(--panel-ink)]">{eventType.bookingQuestion}</dd>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-4">
                  <dt className="text-[var(--ink-muted)]">{gt("Limits")}</dt>
                  <dd className="mt-1 text-[var(--panel-ink)]">
                    {gt("{hours}h notice · {minutes}m interval", {
                      hours: eventType.minNoticeMinutes / 60,
                      minutes: eventType.slotIntervalMinutes,
                    })}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                  onClick={() =>
                    startTransition(async () => {
                      await duplicateEventType({ orgSlug, eventTypeId: eventType.id });
                    })
                  }
                >
                  {gt("Duplicate")}
                </button>
                <button
                  type="button"
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleEventTypeActive({ orgSlug, eventTypeId: eventType.id });
                    })
                  }
                >
                  {eventType.isActive ? gt("Archive") : gt("Restore")}
                </button>
                <PendingNote pending={isPending} />
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="rounded-[28px] border-dashed bg-white/70">
          <p className="text-sm text-[var(--ink-muted)]">
            {gt("No event types to show yet.")}
          </p>
        </Panel>
      )}
    </Stack>
  );
}

export function AvailabilityWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading availability"));

  if (loading || !snapshot) return loading;

  return null;
}

export function TeamsWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading teams"));

  if (loading || !snapshot) return loading;

  return null;
}

export function RoutingWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading routing"));

  if (loading || !snapshot) return loading;

  return null;
}

export function WorkflowsWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading workflows"));

  if (loading || !snapshot) return loading;

  return null;
}

export function DeveloperHubWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading developer hub"));

  if (loading || !snapshot) return loading;

  return null;
}

export function BookingsWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const locale = useLocale();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading bookings"));
  const updateBookingStatus = useTypedMutation<{
    orgSlug: string;
    bookingId: string;
    status: "confirmed" | "pending" | "cancelled" | "rescheduled";
  }>(dashboardApi.updateBookingStatus);
  const [isPending, startTransition] = useTransition();

  if (loading || !snapshot) return loading;

  return (
    <Stack className="gap-5">
      <div className="grid gap-4">
        {snapshot.bookings.map((booking) => (
          <Panel key={booking.id} className="rounded-[28px] bg-white/80">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-[var(--panel-ink)]">{booking.attendeeName}</h2>
                  <Badge tone={booking.status === "confirmed" ? "success" : "accent"}>
                    {getBookingStatusLabel(booking.status, gt)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  {booking.eventTypeName} · {formatBookingDate(booking.startsAt, locale)} · {booking.source}
                </p>
                <p className="mt-3 text-sm text-[var(--ink-muted)]">{booking.notes}</p>
                <ul className="mt-4 grid gap-2 text-sm text-[var(--ink-muted)]">
                  {booking.auditTrail.map((event) => (
                    <li key={event.id} className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
                      {event.message}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  className={buttonClasses({ size: "sm" })}
                  onClick={() =>
                    startTransition(async () => {
                      await updateBookingStatus({ orgSlug, bookingId: booking.id, status: "confirmed" });
                    })
                  }
                >
                  {gt("Confirm")}
                </button>
                <button
                  type="button"
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                  onClick={() =>
                    startTransition(async () => {
                      await updateBookingStatus({ orgSlug, bookingId: booking.id, status: "rescheduled" });
                    })
                  }
                >
                  {gt("Reschedule")}
                </button>
                <button
                  type="button"
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                  onClick={() =>
                    startTransition(async () => {
                      await updateBookingStatus({ orgSlug, bookingId: booking.id, status: "cancelled" });
                    })
                  }
                >
                  {gt("Cancel")}
                </button>
                <PendingNote pending={isPending} />
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </Stack>
  );
}

export function AnalyticsWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading analytics"));
  if (loading || !snapshot) return loading;

  return null;
}

export function SettingsWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const { loading, snapshot } = useSnapshotOrState(orgSlug, gt("Loading settings"));

  if (loading || !snapshot) return loading;

  return <Stack className="gap-5">{null}</Stack>;
}
