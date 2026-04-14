import { redirect } from "next/navigation";
import { ConvexProviderBoundary } from "@/components/convex-provider-boundary";
import { OnboardingFlow, OnboardingFlowFallback } from "@/components/onboarding-flow";
import { requireAuthenticatedUser } from "@/lib/auth-routing";
import type { OnboardingStep } from "@/lib/onboarding-routing";

export default async function OnboardingPage() {
  const viewer = await requireAuthenticatedUser();

  if (
    viewer.onboardingStatus === "completed" &&
    viewer.defaultOrganizationSlug
  ) {
    redirect(`/${viewer.defaultOrganizationSlug}`);
  }

  const initialStep = (
    viewer.onboardingStatus === "completed"
      ? "organization"
      : viewer.onboardingStatus
  ) as OnboardingStep;

  return (
    <ConvexProviderBoundary
      fallback={<OnboardingFlowFallback label="Loading onboarding step" />}
    >
      <OnboardingFlow initialStep={initialStep} />
    </ConvexProviderBoundary>
  );
}
