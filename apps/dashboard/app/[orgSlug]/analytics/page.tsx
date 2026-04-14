import { AnalyticsWorkspacePage } from "@/components/workspace-pages";

export default async function AnalyticsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <AnalyticsWorkspacePage orgSlug={orgSlug} />;
}
