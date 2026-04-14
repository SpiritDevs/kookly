"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Panel, cn } from "@/components/ui";

const dashboardApi = (api as typeof api & {
  dashboard: {
    workspaceSnapshot: unknown;
  };
}).dashboard;

export type WorkspaceSnapshot = {
  organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    locale: string;
    brandColor: string;
    bookingNoticeHours: number;
    bookingBufferMinutes: number;
    bookingIntervalMinutes: number;
    bookingHorizonDays: number;
  };
  viewer: {
    id: string;
    name: string;
    firstName: string;
    role: string;
    initials: string;
  };
  eventTypes: Array<{
    id: string;
    name: string;
    slug: string;
    hostMode: string;
    durationMinutes: number;
    timezone: string;
    bookingQuestion: string;
    minNoticeMinutes: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    slotIntervalMinutes: number;
    bookingHorizonDays: number;
    isActive: boolean;
  }>;
  availability: {
    scheduleId: string | null;
    scheduleName: string;
    timezone: string;
    rules: Array<{ id?: string; weekday: number; startMinute: number; endMinute: number }>;
    overrides: Array<{
      id: string;
      date: string;
      startMinute: number;
      endMinute: number;
      isUnavailable: boolean;
    }>;
  };
  teammates: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    initials: string;
    status: string;
  }>;
  invites: Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  }>;
  routing: Array<{
    id: string;
    label: string;
    field: string;
    value: string;
    destinationKind: string;
    destinationId: string;
    destinationLabel: string;
    priority: number;
    isActive: boolean;
  }>;
  bookings: Array<{
    id: string;
    attendeeName: string;
    attendeeEmail: string;
    startsAt: number;
    endsAt: number;
    timezone: string;
    status: string;
    source: string;
    notes: string;
    eventTypeName: string;
    assigneeName: string;
    auditTrail: Array<{ id: string; message: string; createdAt: number }>;
  }>;
  analytics: {
    totals: {
      total: number;
      confirmed: number;
      pending: number;
      cancelled: number;
      rescheduled: number;
      conversion: number;
    };
    eventTypeBreakdown: Array<{ id: string; name: string; total: number }>;
    assignmentDistribution: Array<{ memberName: string; bookings: number }>;
  };
  notifications: Array<{ id: string; title: string; body?: string; time?: string }>;
  metadata: {
    roleLabel: string;
  };
};

export function WorkspaceLoadingCard({ label }: Readonly<{ label: string }>) {
  return (
    <Panel className="rounded-3xl border-dashed bg-white/70">
      <p className="text-sm text-[var(--ink-muted)]">{label}</p>
    </Panel>
  );
}

export function WorkspaceErrorCard({ message }: Readonly<{ message: string }>) {
  return (
    <Panel className="rounded-3xl border-[color-mix(in_srgb,var(--danger,#a42b2b)_18%,var(--line))] bg-[color-mix(in_srgb,var(--danger,#a42b2b)_6%,white)]">
      <p className="text-sm font-medium text-[var(--danger,#a42b2b)]">{message}</p>
    </Panel>
  );
}

export function useWorkspaceSnapshot(orgSlug: string) {
  return useQuery(dashboardApi.workspaceSnapshot as never, {
    orgSlug,
  } as never) as WorkspaceSnapshot | null | undefined;
}

export function StatGrid({
  items,
}: Readonly<{
  items: Array<{ label: string; value: string }>;
}>) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Panel key={item.label} className="rounded-[28px] bg-white/80 p-5">
          <p className="text-sm text-[var(--ink-muted)]">{item.label}</p>
          <p className="mt-3 font-[family-name:var(--font-dashboard-display)] text-3xl font-semibold tracking-[-0.03em] text-[var(--panel-ink)]">
            {item.value}
          </p>
        </Panel>
      ))}
    </div>
  );
}

export function Stack({
  className,
  children,
}: Readonly<{ className?: string; children: React.ReactNode }>) {
  return <div className={cn("grid gap-4", className)}>{children}</div>;
}
