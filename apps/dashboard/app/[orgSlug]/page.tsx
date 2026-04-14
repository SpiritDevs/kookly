import { OverviewWorkspacePage } from "@/components/workspace-pages";

export default async function DashboardOverviewPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <OverviewWorkspacePage orgSlug={orgSlug} />;
}
