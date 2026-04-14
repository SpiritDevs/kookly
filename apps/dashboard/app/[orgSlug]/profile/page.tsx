import { ProfileWorkspacePage } from "@/components/profile-workspace-page";

export default async function ProfilePage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <ProfileWorkspacePage orgSlug={orgSlug} />;
}
