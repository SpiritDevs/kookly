export const DEFAULT_ORGANIZATION_NAME = "Northstar Revenue";
export const DEFAULT_ORGANIZATION_SLUG = "northstar";
export const DEFAULT_ORGANIZATION_TIMEZONE = "Australia/Sydney";
export const DEFAULT_EVENT_TYPE_NAME = "Intro call";
export const DEFAULT_EVENT_DURATION_MINUTES = "30";
export const DEFAULT_AVAILABILITY_PRESET = "weekday";
export const DEFAULT_CALENDAR_PROVIDER = "google";
export const DEFAULT_MEETING_PROVIDER = "google-meet";
export const DEFAULT_SYNC_MODE = "conflicts";

export function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
