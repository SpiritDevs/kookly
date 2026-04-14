import { TeamsWorkspacePage } from "@/components/workspace-pages";

export default async function TeamsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <TeamsWorkspacePage orgSlug={orgSlug} />;
}
