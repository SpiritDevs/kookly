"use client";

import { useGT } from "gt-next";
import Link from "next/link";
import { useState } from "react";
import { AuthMessage } from "@/components/auth-message";
import { SelectInput } from "@/components/select-input";
import { TimezoneSelectInput } from "@/components/timezone-select-input";
import { Field, TextInput, buttonClasses } from "@/components/ui";

const inputClassName =
  "rounded-lg border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]";

export type OnboardingSchedulingStepValues = Readonly<{
  eventTypeName: string;
  eventDurationMinutes: string;
  availabilityPreset: string;
  timezone: string;
}>;

type OnboardingSchedulingFormProps = Readonly<{
  initialValues: OnboardingSchedulingStepValues;
  organizationName: string;
  onBack?: (values: OnboardingSchedulingStepValues) => void;
  onContinue?: (values: OnboardingSchedulingStepValues) => void;
  showIntro?: boolean;
}>;

export function OnboardingSchedulingForm({
  initialValues,
  organizationName,
  onBack,
  onContinue,
  showIntro = true,
}: OnboardingSchedulingFormProps) {
  const gt = useGT();
  const [eventTypeName, setEventTypeName] = useState(initialValues.eventTypeName);
  const [duration, setDuration] = useState(initialValues.eventDurationMinutes);
  const [availabilityPreset, setAvailabilityPreset] = useState(
    initialValues.availabilityPreset,
  );
  const [timezone, setTimezone] = useState(initialValues.timezone);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleContinue = () => {
    setSubmitError(null);

    if (!eventTypeName.trim() || !duration.trim() || !availabilityPreset.trim()) {
      setSubmitError(gt("Complete the scheduling defaults before continuing."));
      return;
    }

    onContinue?.({
      eventTypeName: eventTypeName.trim(),
      eventDurationMinutes: duration.trim(),
      availabilityPreset,
      timezone: timezone.trim(),
    });
  };

  return (
    <div className="grid gap-5">
      {showIntro ? (
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--panel-ink)]">
            {gt("Shape the first booking flow for {organizationName}.", {
              organizationName,
            })}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            {gt(
              "Start with one event type, a default schedule, and the time zone that should anchor new bookings.",
            )}
          </p>
        </div>
      ) : null}
      <Field label={gt("First event type")}>
        <TextInput
          type="text"
          value={eventTypeName}
          onChange={(event) => setEventTypeName(event.target.value)}
          className={inputClassName}
        />
      </Field>
      <Field label={gt("Meeting length")}>
        <SelectInput
          value={duration}
          onValueChange={setDuration}
          className={inputClassName}
        >
          <option value="15">{gt("15 minutes")}</option>
          <option value="30">{gt("30 minutes")}</option>
          <option value="45">{gt("45 minutes")}</option>
          <option value="60">{gt("60 minutes")}</option>
        </SelectInput>
      </Field>
      <Field label={gt("Availability template")}>
        <SelectInput
          value={availabilityPreset}
          onValueChange={setAvailabilityPreset}
          className={inputClassName}
        >
          <option value="weekday">{gt("Weekdays, 9am-5pm")}</option>
          <option value="extended">{gt("Weekdays, 8am-6pm")}</option>
          <option value="compact">{gt("Weekdays, 10am-4pm")}</option>
        </SelectInput>
      </Field>
      <Field label={gt("Scheduling time zone")}>
        <TimezoneSelectInput
          value={timezone}
          onChange={setTimezone}
          className={inputClassName}
        />
      </Field>
      <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--canvas)] p-4 text-sm leading-relaxed text-[var(--ink-muted)]">
        {gt(
          "Round-robin pools, date overrides, and booking questions can layer on after onboarding. This step just gives the workspace a working default.",
        )}
      </div>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        {onBack ? (
          <button
            type="button"
            onClick={() =>
              onBack({
                eventTypeName: eventTypeName.trim(),
                eventDurationMinutes: duration.trim(),
                availabilityPreset,
                timezone: timezone.trim(),
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
          onClick={handleContinue}
          className={buttonClasses({
            className:
              "h-12 rounded-lg text-center text-[15px] font-semibold shadow-[0_12px_40px_-12px_color-mix(in_srgb,var(--accent)_55%,transparent)] sm:flex-1",
          })}
        >
          {gt("Continue to integrations")}
        </button>
      </div>
      {submitError ? <AuthMessage tone="danger">{submitError}</AuthMessage> : null}
    </div>
  );
}
