"use client";

import { useGT } from "gt-next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { api } from "@convex/_generated/api";
import {
  OnboardingIntegrationsForm,
  type OnboardingIntegrationsStepValues,
} from "@/components/onboarding-integrations-form";
import {
  OnboardingOrganizationForm,
  type OnboardingOrganizationStepValues,
} from "@/components/onboarding-organization-form";
import { OnboardingLogoForm } from "@/components/onboarding-logo-form";
import {
  OnboardingSchedulingForm,
  type OnboardingSchedulingStepValues,
} from "@/components/onboarding-scheduling-form";
import {
  DEFAULT_AVAILABILITY_PRESET,
  DEFAULT_CALENDAR_PROVIDER,
  DEFAULT_EVENT_DURATION_MINUTES,
  DEFAULT_EVENT_TYPE_NAME,
  DEFAULT_MEETING_PROVIDER,
  DEFAULT_ORGANIZATION_NAME,
  DEFAULT_ORGANIZATION_SLUG,
  DEFAULT_ORGANIZATION_TIMEZONE,
  DEFAULT_SYNC_MODE,
} from "@/lib/onboarding-draft";
import type { OnboardingStep } from "@/lib/onboarding-routing";
import { authClient } from "@/lib/auth-client";
import { getBrowserTimezone } from "@/lib/timezones";
import { useUploadThing } from "@/lib/uploadthing";

type OnboardingFlowStep = OnboardingStep | "logo";

const steps: OnboardingFlowStep[] = [
  "organization",
  "logo",
  "scheduling",
  "integrations",
];

const stepCopy: Record<
  OnboardingFlowStep,
  {
    title: string;
    description: string;
    footer: string;
  }
> = {
  organization: {
    title: "Organization details",
    description:
      "Give your team a clear home base before you connect calendars and publish booking links.",
    footer: "Logo is next.",
  },
  logo: {
    title: "Company logo",
    description:
      "Add the mark your team should see across booking pages, calendar invites, and workspace surfaces.",
    footer: "Scheduling is next.",
  },
  scheduling: {
    title: "Scheduling setup",
    description:
      "Set the defaults your team can ship with on day one, from event length to the time zone that anchors new bookings.",
    footer: "Integrations are next.",
  },
  integrations: {
    title: "Integrations",
    description:
      "Choose the calendar and meeting defaults that should support every booking once the workspace goes live.",
    footer: "You're one step away from the dashboard.",
  },
};

export function OnboardingFlowFallback({
  label,
}: Readonly<{
  label: string;
}>) {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <p className="font-[family-name:var(--font-dashboard-mono)] text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </p>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
        <div className="h-32 rounded-lg bg-[color-mix(in_srgb,var(--line)_58%,white)]" />
        <div className="grid gap-4">
          <div className="h-12 rounded-lg bg-[color-mix(in_srgb,var(--line)_72%,white)]" />
          <div className="h-12 rounded-lg bg-[color-mix(in_srgb,var(--line)_68%,white)]" />
          <div className="h-12 rounded-lg bg-[color-mix(in_srgb,var(--line)_64%,white)]" />
        </div>
      </div>
      <div className="h-12 rounded-lg bg-[color-mix(in_srgb,var(--line)_60%,white)]" />
    </div>
  );
}

export function OnboardingFlow({
  initialStep,
}: Readonly<{
  initialStep: OnboardingStep;
}>) {
  const gt = useGT();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const draft = useQuery(api.users.onboardingDraft);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const { startUpload, isUploading } = useUploadThing("onboardingOrganizationLogo");
  const [currentStep, setCurrentStep] = useState<OnboardingFlowStep>(initialStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [flowDraft, setFlowDraft] = useState<{
    organization: OnboardingOrganizationStepValues;
    scheduling: OnboardingSchedulingStepValues;
    integrations: OnboardingIntegrationsStepValues;
  } | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const [isSigningOut, startSignOutTransition] = useTransition();
  const currentIndex = steps.indexOf(currentStep);
  const remainingSteps = steps.length - currentIndex - 1;
  const stepInfo = stepCopy[currentStep];
  const stackMaskStyle = {
    WebkitMaskImage:
      "linear-gradient(to bottom, black 0, black 6.25rem, transparent 6.25rem, transparent 100%)",
    maskImage:
      "linear-gradient(to bottom, black 0, black 6.25rem, transparent 6.25rem, transparent 100%)",
    WebkitMaskRepeat: "no-repeat" as const,
    maskRepeat: "no-repeat" as const,
  };

  const stepMotion = {
    enter: (stepDirection: 1 | -1) =>
      prefersReducedMotion
        ? { opacity: 0 }
        : {
            opacity: 0.96,
            y: 0,
            scale: stepDirection === 1 ? 0.994 : 1.006,
            filter: "blur(1px)",
          },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (stepDirection: 1 | -1) =>
      prefersReducedMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            y: stepDirection === 1 ? 40 : -40,
            scale: stepDirection === 1 ? 1 : 0.994,
            filter: "blur(1px)",
          },
  };

  function moveToStep(nextStep: OnboardingFlowStep) {
    const nextIndex = steps.indexOf(nextStep);
    setDirection(nextIndex >= currentIndex ? 1 : -1);
    setCurrentStep(nextStep);
  }

  useEffect(() => {
    if (draft === undefined || flowDraft) {
      return;
    }

    const timezone = draft?.timezone ?? getBrowserTimezone() ?? DEFAULT_ORGANIZATION_TIMEZONE;

    setFlowDraft({
      organization: {
        organizationName: draft?.organizationName ?? DEFAULT_ORGANIZATION_NAME,
        organizationSlug: draft?.organizationSlug ?? DEFAULT_ORGANIZATION_SLUG,
        timezone,
        logoFile: null,
        logoPreviewUrl: draft?.logoUrl ?? null,
      },
      scheduling: {
        eventTypeName: draft?.eventTypeName ?? gt(DEFAULT_EVENT_TYPE_NAME),
        eventDurationMinutes: String(
          draft?.eventDurationMinutes ?? DEFAULT_EVENT_DURATION_MINUTES,
        ),
        availabilityPreset:
          draft?.availabilityPreset ?? DEFAULT_AVAILABILITY_PRESET,
        timezone,
      },
      integrations: {
        calendarProvider:
          draft?.calendarProvider ?? DEFAULT_CALENDAR_PROVIDER,
        meetingProvider:
          draft?.meetingProvider ?? DEFAULT_MEETING_PROVIDER,
        syncMode: draft?.syncMode ?? DEFAULT_SYNC_MODE,
      },
    });
  }, [draft, flowDraft, gt]);

  async function handleFinish(values: OnboardingIntegrationsStepValues) {
    if (!flowDraft) {
      return;
    }

    setSubmitError(null);

    startTransition(() => {
      void (async () => {
        try {
          let logoUpload:
            | {
                logoUrl: string;
                logoStorageKey: string;
              }
            | undefined;

          if (flowDraft.organization.logoFile) {
            const uploadResult = await startUpload([flowDraft.organization.logoFile]);
            const uploadedLogo = uploadResult?.[0];

            if (!uploadedLogo?.serverData) {
              throw new Error(gt("Logo upload finished without file metadata."));
            }

            logoUpload = {
              logoUrl: uploadedLogo.serverData.logoUrl,
              logoStorageKey: uploadedLogo.serverData.logoStorageKey,
            };
          }

          const result = await completeOnboarding({
            organizationName: flowDraft.organization.organizationName,
            organizationSlug: flowDraft.organization.organizationSlug,
            timezone: flowDraft.scheduling.timezone,
            eventTypeName: flowDraft.scheduling.eventTypeName,
            eventDurationMinutes: Number(
              flowDraft.scheduling.eventDurationMinutes,
            ),
            availabilityPreset: flowDraft.scheduling.availabilityPreset,
            calendarProvider: values.calendarProvider,
            meetingProvider: values.meetingProvider,
            syncMode: values.syncMode,
            logoUrl: logoUpload?.logoUrl,
            logoStorageKey: logoUpload?.logoStorageKey,
          });

          router.push(`/${result.organizationSlug}/conversations`);
        } catch (error) {
          setSubmitError(
            error instanceof Error
              ? error.message
              : gt("We couldn’t finish onboarding. Try again."),
          );
        }
      })();
    });
  }

  function handleReturnToLogin() {
    startSignOutTransition(() => {
      void (async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      })();
    });
  }

  const activeDraft = flowDraft ?? {
    organization: {
      organizationName: DEFAULT_ORGANIZATION_NAME,
      organizationSlug: DEFAULT_ORGANIZATION_SLUG,
      timezone: DEFAULT_ORGANIZATION_TIMEZONE,
      logoFile: null,
      logoPreviewUrl: null,
    },
    scheduling: {
      eventTypeName: gt(DEFAULT_EVENT_TYPE_NAME),
      eventDurationMinutes: DEFAULT_EVENT_DURATION_MINUTES,
      availabilityPreset: DEFAULT_AVAILABILITY_PRESET,
      timezone: DEFAULT_ORGANIZATION_TIMEZONE,
    },
    integrations: {
      calendarProvider: DEFAULT_CALENDAR_PROVIDER,
      meetingProvider: DEFAULT_MEETING_PROVIDER,
      syncMode: DEFAULT_SYNC_MODE,
    },
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--canvas)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute left-1/2 top-[-8rem] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] blur-[110px]" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-[20rem] w-[20rem] rounded-full bg-[color-mix(in_srgb,var(--success)_10%,transparent)] blur-[110px]" />
        <div className="absolute left-[-5rem] top-1/3 h-[16rem] w-[16rem] rounded-full bg-[color-mix(in_srgb,var(--panel-ink)_5%,transparent)] blur-[95px]" />
      </div>

      <div className="absolute right-6 top-4 z-[2] sm:right-8 sm:top-4 lg:right-10 lg:top-4">
        <span className="rounded-full border border-[color-mix(in_srgb,var(--line)_78%,white)] bg-white/70 px-3 py-1 font-[family-name:var(--font-dashboard-mono)] text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)] shadow-[0_10px_30px_-18px_color-mix(in_srgb,var(--panel-ink)_20%,transparent)] backdrop-blur-sm">
          {gt("Private beta")}
        </span>
      </div>

      <div className="relative z-[1] flex min-h-dvh items-start justify-center px-6 py-10 sm:px-8 lg:px-10">
        <main className="w-full max-w-[40rem]">
          <div className="relative pt-6">
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-lg border border-[color-mix(in_srgb,var(--line)_72%,white)] bg-[color-mix(in_srgb,white_56%,var(--canvas))] shadow-[0_22px_48px_-34px_color-mix(in_srgb,var(--panel-ink)_18%,transparent)]"
              aria-hidden
              style={{
                ...stackMaskStyle,
                transformOrigin: "top center",
              }}
              initial={false}
              animate={{
                opacity: remainingSteps >= 2 ? 1 : 0,
                y: remainingSteps >= 2 ? 2 : -6,
                scale: remainingSteps >= 2 ? 0.986 : 0.982,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.12 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-lg border border-[color-mix(in_srgb,var(--line)_80%,white)] bg-[color-mix(in_srgb,white_72%,var(--panel))] shadow-[0_28px_56px_-34px_color-mix(in_srgb,var(--panel-ink)_20%,transparent)]"
              aria-hidden
              style={{
                ...stackMaskStyle,
                transformOrigin: "top center",
              }}
              initial={false}
              animate={{
                opacity: remainingSteps >= 1 ? 1 : 0,
                y: remainingSteps >= 1 ? 10 : 2,
                scale: remainingSteps >= 1 ? 0.994 : 0.986,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.12 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepMotion}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: prefersReducedMotion ? 0.12 : 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative z-[1] overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--line)_82%,white)] bg-[color-mix(in_srgb,var(--panel)_92%,white)] p-6 shadow-[0_32px_90px_-40px_color-mix(in_srgb,var(--panel-ink)_22%,transparent)] backdrop-blur-xl sm:p-8"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.65]"
                  aria-hidden
                  style={{
                    background:
                      "linear-gradient(180deg, color-mix(in_srgb, white 72%, transparent), transparent 28%), radial-gradient(circle at top, color-mix(in_srgb, var(--accent) 10%, transparent), transparent 42%)",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent-strong)_18%,white),transparent)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  aria-hidden
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, color-mix(in_srgb,var(--line)_55%,transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in_srgb,var(--line)_55%,transparent) 1px, transparent 1px)",
                    backgroundPosition: "center",
                    backgroundSize: "36px 36px",
                  }}
                />

                <div className="relative space-y-8">
                    {draft === undefined || !flowDraft ? (
                      <OnboardingFlowFallback label={gt("Loading onboarding step")} />
                    ) : (
                      <>
                    <header className="space-y-5">
                      <div className="space-y-2">
                        <h1 className="text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-[-0.055em] text-[var(--panel-ink)]">
                          {gt(stepInfo.title)}
                        </h1>
                        <p className="max-w-lg text-sm leading-6 text-[var(--ink-muted)] sm:text-[0.95rem]">
                          {gt(stepInfo.description)}
                        </p>
                      </div>
                    </header>

                    {currentStep === "organization" ? (
                      <OnboardingOrganizationForm
                        initialValues={activeDraft.organization}
                        onContinue={(organization) => {
                          setFlowDraft((currentDraft) =>
                            currentDraft
                              ? { ...currentDraft, organization }
                              : currentDraft,
                          );
                          moveToStep("logo");
                        }}
                      />
                    ) : null}

                    {currentStep === "logo" ? (
                      <OnboardingLogoForm
                        initialValues={activeDraft.organization}
                        onBack={(organization) => {
                          setFlowDraft((currentDraft) =>
                            currentDraft
                              ? { ...currentDraft, organization }
                              : currentDraft,
                          );
                          moveToStep("organization");
                        }}
                        onContinue={(organization) => {
                          setFlowDraft((currentDraft) =>
                            currentDraft
                              ? { ...currentDraft, organization }
                              : currentDraft,
                          );
                          moveToStep("scheduling");
                        }}
                      />
                    ) : null}

                    {currentStep === "scheduling" ? (
                      <OnboardingSchedulingForm
                        initialValues={activeDraft.scheduling}
                        organizationName={activeDraft.organization.organizationName}
                        showIntro={false}
                        onBack={(scheduling) => {
                          setFlowDraft((currentDraft) =>
                            currentDraft
                              ? { ...currentDraft, scheduling }
                              : currentDraft,
                          );
                          moveToStep("logo");
                        }}
                        onContinue={(scheduling) => {
                          setFlowDraft((currentDraft) =>
                            currentDraft
                              ? { ...currentDraft, scheduling }
                              : currentDraft,
                          );
                          moveToStep("integrations");
                        }}
                      />
                    ) : null}

                    {currentStep === "integrations" ? (
                      <OnboardingIntegrationsForm
                        initialValues={activeDraft.integrations}
                        organizationName={activeDraft.organization.organizationName}
                        eventTypeName={activeDraft.scheduling.eventTypeName}
                        showIntro={false}
                        isSubmitting={isSubmitting || isUploading}
                        submitError={submitError}
                        onBack={(integrations) => {
                          setSubmitError(null);
                          setFlowDraft((currentDraft) =>
                            currentDraft
                              ? { ...currentDraft, integrations }
                              : currentDraft,
                          );
                          moveToStep("scheduling");
                        }}
                        onFinish={(integrations) => {
                          setFlowDraft((currentDraft) =>
                            currentDraft
                              ? { ...currentDraft, integrations }
                              : currentDraft,
                          );
                          void handleFinish(integrations);
                        }}
                      />
                    ) : null}
                      </>
                    )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleReturnToLogin}
              disabled={isSigningOut}
              className="text-xs text-[color-mix(in_srgb,var(--ink-muted)_82%,white)] transition hover:text-[var(--panel-ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? gt("Returning to login...") : gt("Return to login")}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
