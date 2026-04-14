import { DeveloperHubWorkspacePage } from "@/components/workspace-pages";

export default async function DeveloperHubPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <DeveloperHubWorkspacePage orgSlug={orgSlug} />;
}
