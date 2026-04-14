import { headers } from "next/headers";
import { api } from "@convex/_generated/api";
import { pickDashboardLanguage } from "@convex/lib/dashboardLanguage";
import { authServer } from "@/lib/auth-server";

export async function resolveDashboardLocale() {
  const viewer = await authServer.fetchAuthQuery(api.users.viewerRoutingState);
  const requestHeaders = await headers();

  return pickDashboardLanguage([
    viewer?.dashboardLanguage,
    requestHeaders.get("accept-language"),
  ]);
}
