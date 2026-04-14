import { T } from "gt-next";
import Link from "next/link";
import { getPostAuthRedirectPathFromViewer } from "@/lib/auth-redirect-path";
import { requireAuthenticatedUser } from "@/lib/auth-routing";

export default async function NewWorkspacePage() {
  const viewer = await requireAuthenticatedUser();
  const backHref = getPostAuthRedirectPathFromViewer(viewer);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-900 px-6 py-16 text-zinc-100">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-xl">
        <h1 className="font-[family-name:var(--font-dashboard-display)] text-2xl font-semibold tracking-tight">
          <T>New workspace</T>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          <T>
            Additional workspaces are not available yet. You&apos;ll be able to
            create another business from here soon.
          </T>
        </p>
        <Link
          href={backHref}
          className="mt-8 inline-flex text-sm font-medium text-lime-300 underline-offset-4 hover:underline"
        >
          <T>Back to dashboard</T>
        </Link>
      </div>
    </div>
  );
}
