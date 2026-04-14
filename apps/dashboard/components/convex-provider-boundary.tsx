import { Suspense, type ReactNode } from "react";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { getConvexEnv } from "@/lib/convex-env";

export function ConvexProviderBoundary({
  children,
  fallback,
}: Readonly<{
  children: ReactNode;
  fallback: ReactNode;
}>) {
  const { convexUrl } = getConvexEnv();

  return (
    <Suspense fallback={fallback}>
      <ConvexClientProvider convexUrl={convexUrl}>{children}</ConvexClientProvider>
    </Suspense>
  );
}
