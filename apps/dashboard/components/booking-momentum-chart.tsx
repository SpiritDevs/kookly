"use client";

import { useGT, useLocale, useMessages } from "gt-next";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BOOKING_EVENT_TYPE_LABELS,
  BOOKING_EVENT_TYPE_ORDER,
  type BookingEventTypeId,
  type MomentumDayPoint,
} from "@/lib/mock-data";
import { cn } from "@/components/ui";

const SEGMENT_GRADIENT: Record<BookingEventTypeId, string> = {
  demo: "linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)",
  consult:
    "linear-gradient(180deg, oklch(0.58 0.11 195) 0%, oklch(0.44 0.1 195) 100%)",
  support:
    "linear-gradient(180deg, oklch(0.74 0.14 78) 0%, oklch(0.58 0.12 68) 100%)",
  internal:
    "linear-gradient(180deg, oklch(0.58 0.14 285) 0%, oklch(0.44 0.13 285) 100%)",
};

const SEGMENT_SHADOW: Record<BookingEventTypeId, string> = {
  demo: "0 -3px 12px color-mix(in srgb, var(--accent) 20%, transparent)",
  consult: "0 -3px 12px color-mix(in srgb, oklch(0.5 0.1 195) 22%, transparent)",
  support: "0 -3px 12px color-mix(in srgb, oklch(0.65 0.12 70) 24%, transparent)",
  internal: "0 -3px 12px color-mix(in srgb, oklch(0.52 0.12 285) 22%, transparent)",
};

function dayTotal(point: MomentumDayPoint, visible: ReadonlySet<BookingEventTypeId>) {
  return BOOKING_EVENT_TYPE_ORDER.reduce(
    (sum, id) => sum + (visible.has(id) ? point.byType[id] : 0),
    0,
  );
}

function yAxisTicks(maxVal: number): number[] {
  if (maxVal <= 0) return [0];
  const steps = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(maxVal * f));
  return [...new Set(steps)].sort((a, b) => b - a);
}

/** Mock labels look like `6 Mar`; group bands for the x-axis. */
function formatDateLabel(isoDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

function formatDateRangeBand(
  slice: readonly MomentumDayPoint[],
  locale: string,
): string {
  const firstPoint = slice[0];
  const lastPoint = slice[slice.length - 1];
  if (!firstPoint || !lastPoint) return "";
  const first = formatDateLabel(firstPoint.date, locale);
  const last = formatDateLabel(lastPoint.date, locale);
  if (first === last) return first;
  return `${first}–${last}`;
}

function buildDateGroups(
  series: readonly MomentumDayPoint[],
  groupSize: number,
  locale: string,
) {
  const groups: Array<{ span: number; rangeLabel: string }> = [];
  for (let i = 0; i < series.length; i += groupSize) {
    const chunk = series.slice(i, i + groupSize);
    groups.push({
      span: chunk.length,
      rangeLabel: formatDateRangeBand(chunk, locale),
    });
  }
  return groups;
}

const X_AXIS_DATE_GROUP = 4;

const TOOLTIP_OFFSET = 14;
const TOOLTIP_EST_W = 232;
const TOOLTIP_EST_H = 140;

type BarTooltipState = {
  clientX: number;
  clientY: number;
  index: number;
};

function BarHoverTooltip({
  state,
  series,
  totals,
  visibleTypes,
}: Readonly<{
  state: BarTooltipState;
  series: MomentumDayPoint[];
  totals: number[];
  visibleTypes: ReadonlySet<BookingEventTypeId>;
}>) {
  const gt = useGT();
  const locale = useLocale();
  const m = useMessages();
  const item = series[state.index];
  if (!item) return null;

  const total = totals[state.index] ?? 0;
  const rows = BOOKING_EVENT_TYPE_ORDER.filter((id) => visibleTypes.has(id) && item.byType[id] > 0).map(
    (id) => ({
      id,
      label: m(BOOKING_EVENT_TYPE_LABELS[id]),
      count: item.byType[id],
      swatch: SEGMENT_GRADIENT[id],
    }),
  );

  let left = state.clientX + TOOLTIP_OFFSET;
  let top = state.clientY + TOOLTIP_OFFSET;
  if (typeof window !== "undefined") {
    left = Math.min(left, window.innerWidth - TOOLTIP_EST_W - 8);
    top = Math.min(top, window.innerHeight - TOOLTIP_EST_H - 8);
    left = Math.max(8, left);
    top = Math.max(8, top);
  }

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[10000] w-[min(100vw-1rem,14rem)] rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,white_92%,var(--panel))] p-3 shadow-[0_12px_40px_color-mix(in_srgb,var(--accent-strong)_12%,transparent)] backdrop-blur-sm"
      style={{ left, top }}
    >
      <p className="font-[family-name:var(--font-dashboard-display)] text-sm font-medium tracking-tight text-[var(--panel-ink)]">
        {formatDateLabel(item.date, locale)}
      </p>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">
        {total === 0
          ? gt("No bookings in selected types")
          : total === 1
            ? gt("1 booking (visible types)")
            : gt("{total} bookings (visible types)", { total })}
      </p>
      {rows.length > 0 ? (
        <ul className="mt-2 space-y-1.5 border-t border-[color-mix(in_srgb,var(--line)_80%,transparent)] pt-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-[var(--ink-muted)]">
                <span
                  className="size-2 shrink-0 rounded-sm ring-1 ring-black/5"
                  style={{ background: row.swatch }}
                  aria-hidden
                />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="shrink-0 font-[family-name:var(--font-dashboard-mono)] tabular-nums text-[var(--panel-ink)]">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>,
    document.body,
  );
}

export function BookingMomentumBarChart({ series }: Readonly<{ series: MomentumDayPoint[] }>) {
  const gt = useGT();
  const locale = useLocale();
  const m = useMessages();
  const reduceMotion = useReducedMotion();
  const [visibleTypes, setVisibleTypes] = useState(() => new Set<BookingEventTypeId>(BOOKING_EVENT_TYPE_ORDER));
  const [barTooltip, setBarTooltip] = useState<BarTooltipState | null>(null);

  const toggleType = useCallback((id: BookingEventTypeId) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const computed = useMemo(() => {
    const totals = series.map((p) => dayTotal(p, visibleTypes));
    const max = Math.max(...totals, 1);
    return { totals, max, yTicks: yAxisTicks(max) };
  }, [series, visibleTypes]);

  const dateGroups = useMemo(
    () => buildDateGroups(series, X_AXIS_DATE_GROUP, locale),
    [locale, series],
  );

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  const summary = series
    .map((p, i) => `${formatDateLabel(p.date, locale)} ${computed.totals[i] ?? 0}`)
    .join(", ");

  const activeFilterDescription = BOOKING_EVENT_TYPE_ORDER.filter((id) => visibleTypes.has(id))
    .map((id) => m(BOOKING_EVENT_TYPE_LABELS[id]))
    .join(", ");

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas-strong)_55%,white)]"
      role="region"
      aria-label={gt(
        "Booking volume by day. Showing: {activeFilterDescription}. {summary}",
        { activeFilterDescription, summary },
      )}
    >
      <div
        className="flex flex-wrap items-center gap-2 border-b border-[color-mix(in_srgb,var(--line)_85%,transparent)] px-3 py-3 sm:px-4"
        role="group"
        aria-label={gt("Filter by event type")}
      >
        <span className="w-full text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)] sm:w-auto sm:pr-2">
          {gt("Event types")}
        </span>
        {BOOKING_EVENT_TYPE_ORDER.map((id) => {
          const on = visibleTypes.has(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleType(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left text-[11px] font-medium transition duration-200",
                "focus-visible:outline-none focus-visible:ring-0",
                on
                  ? "border-[color-mix(in_srgb,var(--panel-ink)_18%,var(--line))] bg-white/80 text-[var(--panel-ink)] shadow-[var(--shadow-xl)]"
                  : "border-[var(--line)] bg-[color-mix(in_srgb,white_40%,var(--canvas-strong))] text-[var(--ink-muted)] opacity-70 hover:opacity-100",
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full ring-1 ring-black/5"
                style={{ background: SEGMENT_GRADIENT[id] }}
                aria-hidden
              />
              {m(BOOKING_EVENT_TYPE_LABELS[id])}
            </button>
          );
        })}
      </div>

      <div className="px-3 pt-8 pb-0 sm:px-4">
        <div className="flex gap-2 sm:gap-3">
          <div
            className="flex w-9 shrink-0 flex-col justify-between pt-px sm:w-10"
            style={{ height: "var(--momentum-plot-h)" }}
            aria-hidden
          >
            {computed.yTicks.map((tick) => (
              <span
                key={tick}
                className="block text-right font-[family-name:var(--font-dashboard-mono)] text-[10px] tabular-nums leading-none text-[var(--ink-muted)]"
              >
                {tick}
              </span>
            ))}
          </div>

          <div
            className="relative min-w-0 flex-1 [--momentum-plot-h:12rem] sm:[--momentum-plot-h:13rem]"
            style={{ height: "var(--momentum-plot-h)" }}
          >
            <div className="pointer-events-none absolute inset-0 flex flex-col" aria-hidden>
              {computed.yTicks.map((tick, i) => (
                <div key={tick} className="relative flex min-h-0 flex-1 flex-col">
                  {i < computed.yTicks.length - 1 ? (
                    <div className="absolute inset-x-0 bottom-0 h-px bg-[color-mix(in_srgb,var(--accent-strong)_8%,transparent)]" />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="relative flex h-full items-end gap-1.5 sm:gap-2">
              {series.map((item, index) => {
                const total = computed.totals[index] ?? 0;
                const pct = (total / computed.max) * 100;
                return (
                  <div
                    key={`${item.date}-${index}`}
                    className="flex h-full min-w-0 flex-1 cursor-crosshair flex-col items-stretch justify-end"
                    onPointerEnter={(e) => {
                      setBarTooltip({
                        clientX: e.clientX,
                        clientY: e.clientY,
                        index,
                      });
                    }}
                    onPointerMove={(e) => {
                      setBarTooltip((prev) =>
                        prev?.index === index
                          ? { clientX: e.clientX, clientY: e.clientY, index }
                          : { clientX: e.clientX, clientY: e.clientY, index },
                      );
                    }}
                    onPointerLeave={() => {
                      setBarTooltip((prev) => (prev?.index === index ? null : prev));
                    }}
                  >
                    <div className="flex h-full min-h-0 w-full flex-col justify-end">
                      <motion.div
                        className="mx-auto flex w-full max-w-[2rem] flex-col-reverse overflow-hidden rounded-t-md"
                        initial={{ height: 0, opacity: 0.85 }}
                        animate={{ height: `${pct}%`, opacity: 1 }}
                        transition={{
                          ...transition,
                          delay: reduceMotion ? 0 : 0.06 * index,
                        }}
                      >
                        {BOOKING_EVENT_TYPE_ORDER.map((id) => {
                          if (!visibleTypes.has(id) || item.byType[id] <= 0) return null;
                          const share = total > 0 ? (item.byType[id] / total) * 100 : 0;
                          return (
                            <div
                              key={id}
                              className="min-h-0 w-full shrink-0"
                              style={{
                                height: `${share}%`,
                                background: SEGMENT_GRADIENT[id],
                                boxShadow: SEGMENT_SHADOW[id],
                              }}
                            />
                          );
                        })}
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <div className="w-9 shrink-0 sm:w-10" aria-hidden />
          <div
            className="grid min-w-0 flex-1 gap-x-1.5 border-t border-[var(--line)] py-3 sm:gap-x-2"
            style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
          >
            {dateGroups.map((g, gi) => (
              <div
                key={`${g.rangeLabel}-${gi}`}
                className="min-w-0 text-center text-[10px] font-medium leading-tight text-[var(--ink-muted)]"
                style={{ gridColumn: `span ${g.span}` }}
              >
                <span className="block truncate normal-case tracking-normal">{g.rangeLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {barTooltip ? (
        <BarHoverTooltip
          state={barTooltip}
          series={series}
          totals={computed.totals}
          visibleTypes={visibleTypes}
        />
      ) : null}
    </div>
  );
}
