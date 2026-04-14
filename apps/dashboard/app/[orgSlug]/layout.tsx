import { GTProvider } from "gt-next";
import { redirect } from "next/navigation";
import { api } from "@convex/_generated/api";
import { ConvexProviderBoundary } from "@/components/convex-provider-boundary";
import { DashboardDrawerProvider } from "@/components/dashboard-drawer-provider";
import { DashboardLocaleSync } from "@/components/dashboard-locale-sync";
import { DashboardShell } from "@/components/dashboard-shell";
import { getPostAuthRedirectPathFromViewer } from "@/lib/auth-redirect-path";
import { authServer } from "@/lib/auth-server";
import { requireAuthenticatedUser } from "@/lib/auth-routing";

export default function OrgLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}>) {
  return <ResolvedOrgLayout params={params}>{children}</ResolvedOrgLayout>;
}

async function ResolvedOrgLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;
  const viewer = await requireAuthenticatedUser();
  const shellData = await authServer.fetchAuthQuery(api.users.orgShellData, {
    orgSlug,
  });

  if (!shellData) {
    redirect(getPostAuthRedirectPathFromViewer(viewer));
  }

  return (
    <ConvexProviderBoundary fallback={<></>}>
      <GTProvider locale={shellData.member.dashboardLanguage} region="AU">
        <DashboardLocaleSync initialLocale={shellData.member.dashboardLanguage}>
          <DashboardDrawerProvider orgSlug={orgSlug}>
            <DashboardShell
              orgSlug={orgSlug}
              createWorkspaceHref="/workspaces/new"
              member={shellData.member}
              organization={shellData.organization}
              workspaces={shellData.workspaces}
              notifications={shellData.notifications}
            >
              {children}
            </DashboardShell>
          </DashboardDrawerProvider>
        </DashboardLocaleSync>
      </GTProvider>
    </ConvexProviderBoundary>
  );
}
