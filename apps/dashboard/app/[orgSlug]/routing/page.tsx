import { RoutingWorkspacePage } from "@/components/workspace-pages";

export default async function RoutingPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <RoutingWorkspacePage orgSlug={orgSlug} />;
}
