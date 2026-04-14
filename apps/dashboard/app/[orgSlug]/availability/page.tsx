import { AvailabilityWorkspacePage } from "@/components/workspace-pages";

export default async function AvailabilityPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <AvailabilityWorkspacePage orgSlug={orgSlug} />;
}
