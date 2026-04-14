import { BookingsWorkspacePage } from "@/components/workspace-pages";

export default async function BookingsPage({
  params,
}: Readonly<{
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  return <BookingsWorkspacePage orgSlug={orgSlug} />;
}
