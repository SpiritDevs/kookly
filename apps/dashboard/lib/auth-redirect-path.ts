import {
  type DashboardLanguage,
} from "@convex/lib/dashboardLanguage";

export type ViewerRoutingState =
  | {
      dashboardLanguage: DashboardLanguage;
      defaultOrganizationSlug: string | null;
      onboardingStatus: "organization" | "scheduling" | "integrations" | "completed";
    }
  | null;

export function getPostAuthRedirectPathFromViewer(viewer: ViewerRoutingState) {
  if (!viewer) {
    return "/login";
  }

  if (viewer.onboardingStatus === "scheduling") {
    return "/onboarding";
  }

  if (viewer.onboardingStatus === "integrations") {
    return "/onboarding";
  }

  if (viewer.onboardingStatus === "completed") {
    if (viewer.defaultOrganizationSlug) {
      return `/${viewer.defaultOrganizationSlug}`;
    }
    return "/onboarding";
  }

  if (viewer.defaultOrganizationSlug) {
    return "/onboarding";
  }

  return "/onboarding";
}
