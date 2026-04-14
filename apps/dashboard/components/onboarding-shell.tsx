import { getGT } from "gt-next/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui";

const editorialAsideBackground = `
                radial-gradient(ellipse 100% 80% at 0% 0%, oklch(0.32 0.12 268 / 0.55), transparent 55%),
                radial-gradient(ellipse 70% 50% at 100% 100%, oklch(0.28 0.08 220 / 0.4), transparent 50%),
                oklch(0.2 0.045 268)
              `;

const editorialAsidePattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export async function OnboardingShell({
  stepLabel,
  title,
  description,
  mainTitle,
  currentStep = 1,
  totalSteps = 3,
  children,
}: Readonly<{
  stepLabel: ReactNode;
  title: ReactNode;
  description: ReactNode;
  /** Short heading above the form column on small viewports (editorial aside is hidden). */
  mainTitle?: ReactNode;
  /** 1-based index of the active step; earlier steps render as completed segments. */
  currentStep?: number;
  /** Number of step segments (default 3). */
  totalSteps?: number;
  children: ReactNode;
}>) {
  const gt = await getGT();
  const stepCount = Math.max(1, totalSteps);
  const activeStep = Math.min(stepCount, Math.max(1, currentStep));
  const resolvedMainTitle = mainTitle ?? gt("Organization setup");

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--canvas)] lg:h-dvh lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute -right-32 top-[-10%] h-[min(70vh,520px)] w-[min(70vw,520px)] rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[35%] h-96 w-96 rounded-full bg-[color-mix(in_srgb,var(--success)_8%,transparent)] blur-[90px]" />
      </div>

      <div className="relative z-[1] mr-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 items-stretch lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <aside className="relative hidden min-h-dvh flex-col justify-between px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-14 lg:py-14">
          <div
            className="absolute inset-0 -z-10 lg:rounded-br-[48px] lg:rounded-tr-[48px]"
            style={{ background: editorialAsideBackground }}
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] lg:rounded-br-[48px] lg:rounded-tr-[48px]"
            style={{ backgroundImage: editorialAsidePattern }}
            aria-hidden
          />

          <header className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="font-[family-name:var(--font-dashboard-mono)] text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 transition hover:text-white"
            >
              Kookly
            </Link>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-[family-name:var(--font-dashboard-mono)] text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
              {gt("Onboarding")}
            </span>
          </header>

          <div className="mt-14 max-w-xl space-y-8 lg:mt-0">
            <div className="space-y-5">
              <p className="font-[family-name:var(--font-dashboard-mono)] text-[11px] font-medium uppercase tracking-[0.28em] text-[color-mix(in_srgb,white_45%,transparent)]">
                {stepLabel}
              </p>
              <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-white">
                {title}
              </h1>
              <p className="max-w-md text-base leading-relaxed text-[color-mix(in_srgb,white_62%,transparent)]">
                {description}
              </p>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-white/[0.12] bg-white/[0.06] p-4 backdrop-blur-md">
              <span className="font-[family-name:var(--font-dashboard-mono)] text-[10px] font-medium uppercase tracking-[0.2em] text-white/45">
                {gt("Progress")}
              </span>
              <div
                className="mt-3 flex w-full max-w-xs gap-1.5"
                role="group"
                aria-label={gt("Onboarding progress, step {activeStep} of {stepCount}", {
                  activeStep,
                  stepCount,
                })}
              >
                {Array.from({ length: stepCount }, (_, i) => {
                  const done = i < activeStep;
                  return (
                    <div
                      key={i}
                      className={`h-2 min-w-0 flex-1 rounded-full transition-colors duration-300 ${
                        done
                          ? "bg-[color-mix(in_srgb,white_82%,var(--accent))]"
                          : "bg-white/12"
                      }`}
                      aria-hidden
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-12 hidden font-[family-name:var(--font-dashboard-mono)] text-[10px] uppercase tracking-[0.2em] text-white/30 lg:block">
            {gt("Encrypted session · SOC2 roadmap")}
          </p>
        </aside>

        <main className="flex w-full min-w-0 flex-col justify-start px-6 py-10 sm:px-10 sm:py-12 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:px-16 lg:py-12 lg:pb-16">
          <div className="mx-auto w-full min-w-0 max-w-[min(100%,640px)] space-y-8">
            <div className="space-y-1 lg:hidden">
              <p className="font-[family-name:var(--font-dashboard-mono)] text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ink-muted)]">
                Kookly
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--panel-ink)]">
                  {resolvedMainTitle}
                </h2>
                <Badge tone="accent">{stepLabel}</Badge>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
