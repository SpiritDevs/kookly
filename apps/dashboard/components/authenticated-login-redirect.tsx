"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { getPostAuthRedirectPathFromViewer } from "@/lib/auth-redirect-path";

export function AuthenticatedLoginRedirect() {
  const router = useRouter();
  const viewer = useQuery(api.users.viewerRoutingState);

  useEffect(() => {
    if (!viewer) {
      return;
    }

    router.replace(getPostAuthRedirectPathFromViewer(viewer));
    router.refresh();
  }, [router, viewer]);

  return null;
}
