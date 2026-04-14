import { WorkflowsWorkspacePage } from "@/components/workspace-pages";

export default async function WorkflowsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <WorkflowsWorkspacePage orgSlug={orgSlug} />;
}
