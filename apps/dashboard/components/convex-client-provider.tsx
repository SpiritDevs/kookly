"use client";

import { useMemo, type ReactNode } from "react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";

export function ConvexClientProvider({
  children,
  convexUrl,
  initialToken,
}: Readonly<{
  children: ReactNode;
  convexUrl: string;
  initialToken?: string | null;
}>) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
