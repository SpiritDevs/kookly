export const dashboardLanguages = [
  "en",
  "de",
  "es",
  "fr",
  "ja",
  "pt-BR",
] as const;

export type DashboardLanguage = (typeof dashboardLanguages)[number];

export const DEFAULT_DASHBOARD_LANGUAGE: DashboardLanguage = "en";

export function isDashboardLanguage(value: string): value is DashboardLanguage {
  return dashboardLanguages.includes(value as DashboardLanguage);
}

export function normalizeDashboardLanguage(
  value: string | null | undefined,
): DashboardLanguage | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const exactMatch = dashboardLanguages.find(
    (language) => language.toLowerCase() === normalized,
  );

  if (exactMatch) {
    return exactMatch;
  }

  if (normalized.startsWith("pt")) {
    return "pt-BR";
  }

  return (
    dashboardLanguages.find((language) =>
      normalized.startsWith(language.toLowerCase()),
    ) ?? null
  );
}

export function pickDashboardLanguage(
  values: ReadonlyArray<string | null | undefined>,
): DashboardLanguage {
  for (const value of values) {
    const language = normalizeDashboardLanguage(value);
    if (language) {
      return language;
    }
  }

  return DEFAULT_DASHBOARD_LANGUAGE;
}
