import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth-routing";

type OnboardingStep = "organization" | "scheduling" | "integrations";
export type { OnboardingStep };

export async function requireOnboardingStep(step: OnboardingStep) {
  const viewer = await requireAuthenticatedUser();

  if (
    viewer.onboardingStatus === "completed" &&
    viewer.defaultOrganizationSlug
  ) {
    redirect(`/${viewer.defaultOrganizationSlug}`);
  }

  if (step === "organization") {
    return viewer;
  }

  if (viewer.onboardingStatus === "organization") {
    redirect("/onboarding");
  }

  if (step === "scheduling") {
    return viewer;
  }

  if (viewer.onboardingStatus === "scheduling") {
    redirect("/onboarding");
  }

  return viewer;
}
