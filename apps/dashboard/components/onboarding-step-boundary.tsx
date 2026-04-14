import { Suspense, type ReactNode } from "react";
import {
  requireOnboardingStep,
  type OnboardingStep,
} from "@/lib/onboarding-routing";

export function OnboardingStepBoundary({
  step,
  fallback,
  children,
}: Readonly<{
  step: OnboardingStep;
  fallback: ReactNode;
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={fallback}>
      <ResolvedOnboardingStep step={step}>{children}</ResolvedOnboardingStep>
    </Suspense>
  );
}

async function ResolvedOnboardingStep({
  step,
  children,
}: Readonly<{
  step: OnboardingStep;
  children: ReactNode;
}>) {
  await requireOnboardingStep(step);
  return children;
}
