import { onboardingTimezones } from "@/lib/mock-data";
import { DEFAULT_ORGANIZATION_TIMEZONE } from "@/lib/onboarding-draft";

type SupportedValuesOfIntl = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

const supportedTimezones =
  (Intl as SupportedValuesOfIntl).supportedValuesOf?.("timeZone") ??
  onboardingTimezones;

export const allTimezones = [...new Set(supportedTimezones)].sort((left, right) =>
  left.localeCompare(right),
);

export function getBrowserTimezone() {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (browserTimezone && allTimezones.includes(browserTimezone)) {
    return browserTimezone;
  }

  return DEFAULT_ORGANIZATION_TIMEZONE;
}
