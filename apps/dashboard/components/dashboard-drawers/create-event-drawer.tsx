"use client";

import { useState } from "react";
import { useGT } from "gt-next";
import type {
  CreateEventDrawerPayload,
  DashboardDrawerReplace,
} from "@/components/dashboard-drawers/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, SelectInput, TextInput } from "@/components/ui";

const DURATION_OPTIONS = [15, 30, 45, 60] as const;
const BOOKING_WINDOW_OPTIONS = [7, 14, 30, 60] as const;
type EventLocation = NonNullable<
  NonNullable<CreateEventDrawerPayload["prefill"]>["location"]
>;

const LOCATION_OPTIONS: EventLocation[] = ["meet", "zoom", "phone", "office"];

function getLocationLabel(
  gt: ReturnType<typeof useGT>,
  location: EventLocation,
) {
  switch (location) {
    case "zoom":
      return gt("Zoom");
    case "phone":
      return gt("Phone call");
    case "office":
      return gt("In person");
    case "meet":
    default:
      return gt("Google Meet");
  }
}

type CreateEventDraft = {
  name: string;
  durationMinutes: 15 | 30 | 45 | 60;
  location: EventLocation;
  bookingWindowDays: 7 | 14 | 30 | 60;
  description: string;
};

function getInitialDraft(
  payload: CreateEventDrawerPayload,
): CreateEventDraft {
  return {
    name: payload.prefill?.name ?? "Discovery call",
    durationMinutes: payload.prefill?.durationMinutes ?? 30,
    location: payload.prefill?.location ?? "meet",
    bookingWindowDays: payload.prefill?.bookingWindowDays ?? 14,
    description:
      payload.prefill?.description ??
      "A short conversation to understand team needs, current scheduling pain points, and the best setup for launch.",
  };
}

function getDraftName(payload: CreateEventDrawerPayload) {
  return payload.prefill?.name?.trim() || null;
}

export function CreateEventDrawerHeaderLabel({
  payload,
}: Readonly<{
  payload: CreateEventDrawerPayload;
}>) {
  const gt = useGT();
  const draftName = getDraftName(payload);

  if (payload.mode === "edit") {
    return draftName
      ? gt("Editing {eventName}", { eventName: draftName })
      : gt("Editing event");
  }

  return gt("Create a new event");
}

export function CreateEventDrawerTitle({
  payload,
}: Readonly<{
  payload: CreateEventDrawerPayload;
}>) {
  const gt = useGT();

  return payload.mode === "edit" ? gt("Edit Event") : gt("Create Event");
}

export function CreateEventDrawerDescription() {
  const gt = useGT();

  return gt(
    "Capture the essential details here, then keep refining availability, reminders, and routing in the next step.",
  );
}

export function CreateEventDrawerContent({
  payload,
}: Readonly<{
  payload: CreateEventDrawerPayload;
}>) {
  const gt = useGT();
  const [draft, setDraft] = useState(() => getInitialDraft(payload));

  return (
    <div className="grid min-h-full gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)] lg:gap-8 lg:py-6">
      <section className="grid content-start gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={gt("Event name")}>
            <TextInput
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={gt("Discovery call")}
            />
          </Field>

          <Field label={gt("Duration")}>
            <SelectInput
              value={String(draft.durationMinutes)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  durationMinutes: Number(event.target.value) as
                    | 15
                    | 30
                    | 45
                    | 60,
                }))
              }
            >
              {DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {gt("{minutes} minutes", { minutes })}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={gt("Location")}>
            <SelectInput
              value={draft.location}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  location: event.target.value as EventLocation,
                }))
              }
            >
              {LOCATION_OPTIONS.map((location) => (
                <option key={location} value={location}>
                  {getLocationLabel(gt, location)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={gt("Booking window")}>
            <SelectInput
              value={String(draft.bookingWindowDays)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  bookingWindowDays: Number(event.target.value) as
                    | 7
                    | 14
                    | 30
                    | 60,
                }))
              }
            >
              {BOOKING_WINDOW_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {gt("Next {days} days", { days })}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field
          label={gt("Description")}
          hint={gt("Shown on your booking page")}
        >
          <Textarea
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder={gt(
              "Share what this session is for, who should book it, and what guests should prepare ahead of time.",
            )}
            className="min-h-36"
          />
        </Field>
      </section>

      <aside className="grid content-start gap-4 rounded-lg border border-[color-mix(in_srgb,var(--line)_65%,white)] bg-[color-mix(in_srgb,var(--panel)_86%,white)] p-4 shadow-sm">
        <div className="space-y-1 border-b border-[color-mix(in_srgb,var(--line)_55%,white)] pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            {gt("Preview")}
          </p>
          <h3 className="text-base font-semibold text-[var(--panel-ink)]">
            {draft.name.trim() || gt("Untitled event")}
          </h3>
          <p className="text-sm leading-6 text-[var(--ink-muted)]">
            {draft.description.trim() ||
              gt("Add a short explanation so guests know what this event is for.")}
          </p>
        </div>

        <dl className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-white/70 px-3 py-2.5">
            <dt className="text-[var(--ink-muted)]">{gt("Length")}</dt>
            <dd className="font-medium text-[var(--panel-ink)]">
              {gt("{minutes} min", { minutes: draft.durationMinutes })}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-white/70 px-3 py-2.5">
            <dt className="text-[var(--ink-muted)]">{gt("Location")}</dt>
            <dd className="font-medium text-[var(--panel-ink)]">
              {getLocationLabel(gt, draft.location)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-white/70 px-3 py-2.5">
            <dt className="text-[var(--ink-muted)]">{gt("Booking window")}</dt>
            <dd className="font-medium text-[var(--panel-ink)]">
              {gt("{days} days", { days: draft.bookingWindowDays })}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-white/70 px-3 py-2.5">
            <dt className="text-[var(--ink-muted)]">{gt("Opened from")}</dt>
            <dd className="font-medium capitalize text-[var(--panel-ink)]">
              {payload.source.replaceAll("-", " ")}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

export function CreateEventDrawerFooter({
  closeDrawer,
}: Readonly<{
  closeDrawer: () => void;
  replaceDrawer: DashboardDrawerReplace;
}>) {
  const gt = useGT();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--ink-muted)]">
        {gt("Draft details are only local for now.")}
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={closeDrawer}
        >
          {gt("Cancel")}
        </Button>
        <Button type="button" size="lg">
          {gt("Continue")}
        </Button>
      </div>
    </div>
  );
}
