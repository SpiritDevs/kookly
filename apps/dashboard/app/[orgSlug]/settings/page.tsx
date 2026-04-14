import { redirect } from "next/navigation";

export default function SettingsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  return <ResolvedSettingsPage params={params} />;
}

async function ResolvedSettingsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/profile`);

  return null;
}
