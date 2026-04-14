function getWeekdayLabel(weekday: number, locale: string) {
  const normalizedWeekday = ((weekday % 7) + 7) % 7;
  const date = new Date(Date.UTC(2024, 0, 7 + normalizedWeekday));

  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
  }).format(date);
}

export function formatMinutesOfDay(totalMinutes: number, locale = "en-US") {
  const date = new Date(Date.UTC(2024, 0, 1, 0, totalMinutes));

  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function summarizeWeeklyRules(
  rules: Array<{ weekday: number; startMinute: number; endMinute: number }>,
  locale = "en-US",
) {
  return rules
    .slice()
    .sort((left, right) => left.weekday - right.weekday)
    .map(
      (rule) =>
        `${getWeekdayLabel(rule.weekday, locale)} · ${formatMinutesOfDay(rule.startMinute, locale)}–${formatMinutesOfDay(rule.endMinute, locale)}`,
    );
}

export function formatBookingDate(isoOrEpoch: number, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoOrEpoch));
}

export function filterBookingsByStatus<T extends { status: string }>(
  bookings: T[],
  status: string,
) {
  if (status === "all") {
    return bookings;
  }
  return bookings.filter((booking) => booking.status === status);
}

export function buildRoutingPreview(
  rules: Array<{
    field: string;
    value: string;
    destinationLabel: string;
    priority: number;
    isActive: boolean;
  }>,
  input: Record<string, string>,
) {
  const match = rules
    .filter((rule) => rule.isActive)
    .sort((left, right) => left.priority - right.priority)
    .find((rule) => input[rule.field] === rule.value);

  return match?.destinationLabel ?? "Fallback owner review";
}
