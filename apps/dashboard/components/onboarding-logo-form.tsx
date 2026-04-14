"use client";

import { useGT } from "gt-next";
import { useEffect, useRef, useState } from "react";
import { AuthMessage } from "@/components/auth-message";
import {
  type OnboardingOrganizationStepValues,
} from "@/components/onboarding-organization-form";
import { buttonClasses } from "@/components/ui";

const allowedLogoTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);

type OnboardingLogoFormProps = Readonly<{
  initialValues: OnboardingOrganizationStepValues;
  onBack?: (values: OnboardingOrganizationStepValues) => void;
  onContinue?: (values: OnboardingOrganizationStepValues) => void;
}>;

export function OnboardingLogoForm({
  initialValues,
  onBack,
  onContinue,
}: OnboardingLogoFormProps) {
  const gt = useGT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(initialValues.logoFile);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    initialValues.logoPreviewUrl,
  );
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const nextValues: OnboardingOrganizationStepValues = {
    ...initialValues,
    logoFile,
    logoPreviewUrl,
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;

            if (!file) {
              setLogoFile(null);
              setLogoError(null);
              setLogoPreviewUrl(initialValues.logoPreviewUrl);
              return;
            }

            if (!allowedLogoTypes.has(file.type)) {
              setLogoFile(null);
              setLogoError(gt("Logo must be a PNG, JPG, or SVG file."));
              event.target.value = "";
              return;
            }

            if (file.size > 2 * 1024 * 1024) {
              setLogoFile(null);
              setLogoError(gt("Logo must be 2 MB or smaller."));
              event.target.value = "";
              return;
            }

            setLogoError(null);
            setLogoFile(file);
          }}
        />
        <button
          type="button"
          className="flex min-h-52 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--line)] bg-[var(--canvas)] px-6 text-center text-sm leading-relaxed text-[var(--ink-muted)] transition hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] hover:bg-white/80"
          onClick={() => fileInputRef.current?.click()}
        >
          {logoPreviewUrl ? (
            // Object URLs are local previews, so Next image optimization does not apply here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreviewUrl}
              alt={gt("Organization logo preview")}
              className="max-h-36 w-auto max-w-full rounded-lg object-contain"
            />
          ) : (
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[var(--panel-ink)]">
                {gt("Upload a company logo")}
              </span>
              <span>{gt("PNG, JPG, or SVG up to 2 MB.")}</span>
            </div>
          )}
        </button>
        {logoError ? (
          <p className="text-sm text-[var(--danger,#a42b2b)]">{logoError}</p>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">
            {gt("You can skip this for now and add it later from workspace settings.")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => onBack?.(nextValues)}
          className={buttonClasses({
            variant: "ghost",
            className: "h-12 rounded-lg border-[var(--line)] sm:min-w-[140px]",
          })}
        >
          {gt("Back")}
        </button>
        <button
          type="button"
          onClick={() => onContinue?.(nextValues)}
          className={buttonClasses({
            className:
              "h-12 rounded-lg text-center text-[15px] font-semibold shadow-[0_12px_40px_-12px_color-mix(in_srgb,var(--accent)_55%,transparent)] sm:flex-1",
          })}
        >
          {gt("Continue to scheduling")}
        </button>
      </div>

      {logoError ? <AuthMessage tone="danger">{logoError}</AuthMessage> : null}
    </div>
  );
}
