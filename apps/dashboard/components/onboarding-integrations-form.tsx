"use client";

import { useGT } from "gt-next";
import Link from "next/link";
import { useState } from "react";
import { AuthMessage } from "@/components/auth-message";
import { SelectInput } from "@/components/select-input";
import { Field, buttonClasses } from "@/components/ui";

const inputClassName =
  "rounded-lg border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]";

export type OnboardingIntegrationsStepValues = Readonly<{
  calendarProvider: string;
  meetingProvider: string;
  syncMode: string;
}>;

type OnboardingIntegrationsFormProps = Readonly<{
  initialValues: OnboardingIntegrationsStepValues;
  organizationName: string;
  eventTypeName: string;
  isSubmitting?: boolean;
  submitError?: string | null;
  onBack?: (values: OnboardingIntegrationsStepValues) => void;
  onFinish?: (values: OnboardingIntegrationsStepValues) => void;
  showIntro?: boolean;
}>;

export function OnboardingIntegrationsForm({
  initialValues,
  organizationName,
  eventTypeName,
  isSubmitting = false,
  submitError = null,
  onBack,
  onFinish,
  showIntro = true,
}: OnboardingIntegrationsFormProps) {
  const gt = useGT();
  const [calendarProvider, setCalendarProvider] = useState(
    initialValues.calendarProvider,
  );
  const [meetingProvider, setMeetingProvider] = useState(
    initialValues.meetingProvider,
  );
  const [syncMode, setSyncMode] = useState(initialValues.syncMode);

  const handleFinish = () => {
    onFinish?.({
      calendarProvider,
      meetingProvider,
      syncMode,
    });
  };

  return (
    <div className="grid gap-5">
      {showIntro ? (
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--panel-ink)]">
            {gt("Connect the calendars behind {organizationName}.", {
              organizationName,
            })}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            {gt(
              "Finish onboarding by choosing the calendar and meeting defaults that should support {eventType} bookings.",
              { eventType: eventTypeName.toLowerCase() },
            )}
          </p>
        </div>
      ) : null}
      <Field label={gt("Calendar provider")}>
        <SelectInput
          value={calendarProvider}
          onValueChange={setCalendarProvider}
          className={inputClassName}
        >
          <option value="google">{gt("Google Calendar")}</option>
          <option value="outlook">{gt("Outlook Calendar")}</option>
        </SelectInput>
      </Field>
      <Field label={gt("Video conferencing")}>
        <SelectInput
          value={meetingProvider}
          onValueChange={setMeetingProvider}
          className={inputClassName}
        >
          <option value="google-meet">{gt("Google Meet")}</option>
          <option value="zoom">{gt("Zoom")}</option>
          <option value="manual">{gt("No automatic video link")}</option>
        </SelectInput>
      </Field>
      <Field label={gt("Calendar sync behavior")}>
        <SelectInput
          value={syncMode}
          onValueChange={setSyncMode}
          className={inputClassName}
        >
          <option value="conflicts">
            {gt("Block conflicting events only")}
          </option>
          <option value="primary">
            {gt("Use the primary calendar for availability")}
          </option>
          <option value="all">{gt("Merge all connected calendars")}</option>
        </SelectInput>
      </Field>
      <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--canvas)] p-4 text-sm leading-relaxed text-[var(--ink-muted)]">
        {gt(
          "These defaults become the starting point for calendar sync and meeting links. You can connect live providers later without redoing onboarding.",
        )}
      </div>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        {onBack ? (
          <button
            type="button"
            onClick={() =>
              onBack({
                calendarProvider,
                meetingProvider,
                syncMode,
              })
            }
            className={buttonClasses({
              variant: "ghost",
              className: "h-12 rounded-lg border-[var(--line)] sm:min-w-[140px]",
            })}
          >
            {gt("Back")}
          </button>
        ) : (
          <Link
            href="/onboarding"
            className={buttonClasses({
              variant: "ghost",
              className: "h-12 rounded-lg border-[var(--line)] sm:min-w-[140px]",
            })}
          >
            {gt("Back")}
          </Link>
        )}
        <button
          type="button"
          onClick={handleFinish}
          disabled={isSubmitting}
          className={buttonClasses({
            className:
              "h-12 rounded-lg text-center text-[15px] font-semibold shadow-[0_12px_40px_-12px_color-mix(in_srgb,var(--accent)_55%,transparent)] sm:flex-1",
          })}
        >
          {isSubmitting ? gt("Saving...") : gt("Finish onboarding")}
        </button>
      </div>
      {submitError ? <AuthMessage tone="danger">{submitError}</AuthMessage> : null}
    </div>
  );
}
