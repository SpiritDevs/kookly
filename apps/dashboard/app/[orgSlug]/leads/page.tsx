import { LeadsWorkspacePage } from "@/components/leads-workspace-page";

export default async function LeadsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <LeadsWorkspacePage orgSlug={orgSlug} />;
}
