"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import type { AuthClient } from "@convex-dev/better-auth/react";
import type { BetterAuthClientPlugin } from "better-auth";
import { createAuthClient } from "better-auth/react";

// The Convex Better Auth plugin currently resolves to a compatible runtime shape,
// but its published client types do not line up cleanly with createAuthClient().
const plugins = [convexClient() as unknown as BetterAuthClientPlugin];

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins,
}) as unknown as AuthClient;
