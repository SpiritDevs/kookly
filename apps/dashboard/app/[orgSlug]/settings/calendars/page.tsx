import { SettingsWorkspacePage } from "@/components/workspace-pages";

export default async function SettingsCalendarsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <SettingsWorkspacePage orgSlug={orgSlug} />;
}
