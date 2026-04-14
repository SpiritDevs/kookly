"use client";

import { useQuery } from "convex/react";
import { startTransition, useEffect, useRef } from "react";
import { useLocale, useSetLocale } from "gt-next/client";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import {
  DEFAULT_DASHBOARD_LANGUAGE,
  normalizeDashboardLanguage,
} from "@convex/lib/dashboardLanguage";
import { getLocaleDirection } from "@/lib/mock-data";

type DashboardLocaleSyncProps = {
  children: React.ReactNode;
  initialLocale: string;
};

export function DashboardLocaleSync({
  children,
  initialLocale,
}: Readonly<DashboardLocaleSyncProps>) {
  const router = useRouter();
  const currentLocale = useLocale();
  const setLocale = useSetLocale();
  const liveDashboardLanguage = useQuery(api.users.viewerDashboardLanguage);
  const targetLocale =
    liveDashboardLanguage ??
    normalizeDashboardLanguage(initialLocale) ??
    DEFAULT_DASHBOARD_LANGUAGE;
  const resolvedCurrentLocale =
    normalizeDashboardLanguage(currentLocale) ??
    normalizeDashboardLanguage(initialLocale) ??
    DEFAULT_DASHBOARD_LANGUAGE;
  const previousLiveDashboardLanguageRef = useRef<
    DashboardLocaleSyncProps["initialLocale"] | null
  >(null);

  useEffect(() => {
    if (!liveDashboardLanguage) {
      return;
    }

    const previousLiveDashboardLanguage = previousLiveDashboardLanguageRef.current;
    previousLiveDashboardLanguageRef.current = liveDashboardLanguage;

    if (
      previousLiveDashboardLanguage &&
      previousLiveDashboardLanguage !== liveDashboardLanguage
    ) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [liveDashboardLanguage, router]);

  useEffect(() => {
    if (targetLocale === resolvedCurrentLocale) {
      return;
    }

    const originalRefresh = router.refresh.bind(router);

    (router as typeof router & { refresh: () => void }).refresh = () => {};
    setLocale(targetLocale);

    queueMicrotask(() => {
      (router as typeof router & { refresh: typeof originalRefresh }).refresh =
        originalRefresh;
      // Refresh the RSC payload after the client locale updates so
      // server-rendered labels pick up the same language without a hard reload.
      startTransition(() => {
        originalRefresh();
      });
    });
  }, [resolvedCurrentLocale, router, setLocale, targetLocale]);

  useEffect(() => {
    document.documentElement.lang = resolvedCurrentLocale;
    document.documentElement.dir = getLocaleDirection(resolvedCurrentLocale);
  }, [resolvedCurrentLocale]);

  return children;
}
