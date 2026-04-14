"use client";

import { useGT } from "gt-next";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { AuthMessage } from "@/components/auth-message";
import { TimezoneSelectInput } from "@/components/timezone-select-input";
import { Field, TextInput, buttonClasses } from "@/components/ui";
import { toSlug } from "@/lib/onboarding-draft";

const authInputClassName =
  "rounded-lg border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]";

export type OnboardingOrganizationStepValues = Readonly<{
  organizationName: string;
  organizationSlug: string;
  timezone: string;
  logoFile: File | null;
  logoPreviewUrl: string | null;
}>;

type OnboardingOrganizationFormProps = Readonly<{
  initialValues: OnboardingOrganizationStepValues;
  onContinue?: (values: OnboardingOrganizationStepValues) => void;
}>;

export function OnboardingOrganizationForm({
  initialValues,
  onContinue,
}: OnboardingOrganizationFormProps) {
  const gt = useGT();
  const [organizationName, setOrganizationName] = useState(
    initialValues.organizationName,
  );
  const [slug, setSlug] = useState(initialValues.organizationSlug);
  const [timezone, setTimezone] = useState(initialValues.timezone);
  const [hasTouchedSlug, setHasTouchedSlug] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const deferredSlug = useDeferredValue(slug.trim());
  const slugAvailability = useQuery(
    api.users.organizationSlugAvailability,
    deferredSlug ? { slug: deferredSlug } : "skip",
  );

  const slugStatus = deferredSlug ? slugAvailability?.status ?? null : null;
  const isSlugChecking = Boolean(deferredSlug) && slugAvailability === undefined;
  const isSlugTaken = slugStatus === "taken";
  const canContinue =
    organizationName.trim().length > 0 &&
    slug.trim().length > 0 &&
    timezone.trim().length > 0 &&
    !isSlugChecking &&
    !isSlugTaken;

  const handleContinue = () => {
    setSubmitError(null);

    if (!canContinue) {
      setSubmitError(gt("Resolve the organization details before continuing."));
      return;
    }

    onContinue?.({
      organizationName: organizationName.trim(),
      organizationSlug: slug.trim(),
      timezone: timezone.trim(),
      logoFile: initialValues.logoFile,
      logoPreviewUrl: initialValues.logoPreviewUrl,
    });
  };

  return (
    <div className="grid gap-5">
      <Field label={gt("Organization name")}>
        <TextInput
          type="text"
          value={organizationName}
          placeholder={gt("Northstar Revenue")}
          onChange={(event) => {
            const nextName = event.target.value;
            setOrganizationName(nextName);
            if (!hasTouchedSlug) {
              setSlug(toSlug(nextName));
            }
          }}
          className={authInputClassName}
        />
      </Field>
      <Field
        label={gt("Booking slug")}
        hint={
          !slug.trim() ? null : isSlugChecking ? (
            <span className="text-[var(--ink-muted)]">
              {gt("Checking availability...")}
            </span>
          ) : slugStatus === "taken" ? (
            <span className="text-[var(--danger,#a42b2b)]">
              {gt("Already in use")}
            </span>
          ) : slugStatus === "reserved-by-current-org" ? (
            <span className="text-[var(--success)]">
              {gt("Reserved for this workspace")}
            </span>
          ) : slugStatus === "available" ? (
            <span className="text-[var(--success)]">
              {gt("Available right now")}
            </span>
          ) : null
        }
      >
        <TextInput
          type="text"
          value={slug}
          placeholder={gt("northstar-revenue")}
          onFocus={() => setHasTouchedSlug(true)}
          onChange={(event) => setSlug(toSlug(event.target.value))}
          className={authInputClassName}
        />
      </Field>
      <Field label={gt("Primary time zone")}>
        <TimezoneSelectInput
          value={timezone}
          onChange={setTimezone}
          className={authInputClassName}
        />
      </Field>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <Link
          href="/"
          className={buttonClasses({
            variant: "ghost",
            className:
              "h-12 rounded-lg border-[var(--line)] sm:min-w-[140px]",
          })}
        >
          {gt("Exit for now")}
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={buttonClasses({
            className:
              "h-12 rounded-lg text-center text-[15px] font-semibold shadow-[0_12px_40px_-12px_color-mix(in_srgb,var(--accent)_55%,transparent)] sm:flex-1",
          })}
        >
          {gt("Continue to logo")}
        </button>
      </div>
      {submitError ? <AuthMessage tone="danger">{submitError}</AuthMessage> : null}
    </div>
  );
}
