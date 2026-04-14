import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { getConvexEnv } from "@/lib/convex-env";

const { convexUrl, convexSiteUrl } = getConvexEnv();

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  process.env.NEXT_PUBLIC_CONVEX_URL = convexUrl;
}

if (!process.env.NEXT_PUBLIC_CONVEX_SITE_URL) {
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL = convexSiteUrl;
}

export const authServer: ReturnType<typeof convexBetterAuthNextJs> =
  convexBetterAuthNextJs({
    convexUrl,
    convexSiteUrl,
  });
