import type { ReactNode } from "react";

export function OnboardingFormFallback({
  label,
}: Readonly<{
  label: ReactNode;
}>) {
  return (
    <div className="flex min-w-0 flex-col gap-6" aria-busy="true" aria-live="polite">
      <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white/90 p-6 shadow-sm sm:p-8">
        <div className="space-y-5">
          <p className="font-[family-name:var(--font-dashboard-mono)] text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {label}
          </p>
          <div className="space-y-3">
            <div className="h-12 rounded-2xl bg-[color-mix(in_srgb,var(--line)_72%,white)]" />
            <div className="h-12 rounded-2xl bg-[color-mix(in_srgb,var(--line)_68%,white)]" />
            <div className="h-12 rounded-2xl bg-[color-mix(in_srgb,var(--line)_64%,white)]" />
            <div className="h-24 rounded-3xl bg-[color-mix(in_srgb,var(--line)_58%,white)]" />
          </div>
        </div>
      </section>
    </div>
  );
}
