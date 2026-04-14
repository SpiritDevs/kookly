import { redirect } from "next/navigation";
import { api } from "@convex/_generated/api";
import { authServer } from "@/lib/auth-server";
import { getPostAuthRedirectPathFromViewer } from "@/lib/auth-redirect-path";

export async function getViewerRoutingState() {
  return await authServer.fetchAuthQuery(api.users.viewerRoutingState);
}

export async function getPostAuthRedirectPath() {
  const viewer = await getViewerRoutingState();
  return getPostAuthRedirectPathFromViewer(viewer);
}

export async function redirectAuthenticatedUser() {
  const viewer = await getViewerRoutingState();

  if (!viewer) {
    return;
  }

  redirect(getPostAuthRedirectPathFromViewer(viewer));
}

export async function requireAuthenticatedUser() {
  const viewer = await getViewerRoutingState();

  if (!viewer) {
    redirect("/login");
  }

  return viewer;
}
