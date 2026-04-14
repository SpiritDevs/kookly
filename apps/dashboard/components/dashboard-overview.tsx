import { useGT, useMessages } from "gt-next";
import { BookingMomentumBarChart } from "@/components/booking-momentum-chart";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui";
import type { MetricCardData, MomentumDayPoint, UpcomingBooking } from "@/lib/mock-data";

function MetricCardBody({ metric }: Readonly<{ metric: MetricCardData }>) {
  const m = useMessages();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--ink-muted)]">{m(metric.label)}</p>
          <p className="mt-3 font-[family-name:var(--font-dashboard-display)] text-3xl font-semibold tracking-[-0.02em] text-[var(--panel-ink)] sm:text-[2.15rem]">
            {metric.value}
          </p>
        </div>
        <span
          className={
            metric.delta.startsWith("+")
              ? "text-sm font-medium text-[var(--success)]"
              : "text-sm font-medium text-[var(--ink-muted)]"
          }
        >
          {metric.delta}
        </span>
      </div>
      <p className="mt-4 border-t border-[color-mix(in_srgb,var(--line)_80%,transparent)] pt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
        {m(metric.description)}
      </p>
    </>
  );
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: Readonly<{
  eyebrow?: string;
  title: string;
  description: string;
  actions: React.ReactNode;
}>) {
  return (
    <header className="border-b border-[var(--line)] pb-5 sm:pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="max-w-2xl space-y-4">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ink-muted)]">{eyebrow}</p>
          ) : null}
          <h1 className="font-[family-name:var(--font-dashboard-display)] text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--panel-ink)] sm:text-5xl">
            {title}
          </h1>
          <p className="text-base leading-relaxed text-[var(--ink-muted)] sm:max-w-xl">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
      </div>
    </header>
  );
}

export function MetricsStrip({
  metrics,
}: Readonly<{
  metrics: MetricCardData[];
}>) {
  const gt = useGT();

  return (
    <section aria-label={gt("Key metrics")}>
      <div className="sm:hidden">
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 scroll-pr-4 px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-roledescription={gt("carousel")}
          aria-label={gt("Key metrics, swipe horizontally")}
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="w-[min(calc(100vw-3.25rem),22rem)] shrink-0 snap-center rounded-2xl border border-[var(--line)] bg-white/60 p-6 shadow-[var(--shadow-xl)]"
            >
              <MetricCardBody metric={metric} />
            </article>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-[var(--ink-muted)]">
          {gt("Swipe for more metrics")}
        </p>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white/60 shadow-[var(--shadow-xl)] sm:block">
        <div className="grid divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="p-6 sm:p-7">
              <MetricCardBody metric={metric} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrendChartSection({
  title,
  description,
  rangeLabel,
  summaryValue,
  series,
}: Readonly<{
  title: string;
  description: string;
  rangeLabel: string;
  summaryValue: string;
  series: MomentumDayPoint[];
}>) {
  const gt = useGT();

  return (
    <section className="flex min-h-0 flex-col border-b border-[var(--line)] py-12 lg:col-span-7 lg:border-b-0 lg:border-r lg:py-0 lg:pr-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="accent">{rangeLabel}</Badge>
            <span className="text-sm font-medium text-[var(--success)]">
              {gt("{summaryValue} vs prior period", { summaryValue })}
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-dashboard-display)] text-3xl font-semibold tracking-[-0.02em] text-[var(--panel-ink)] sm:text-[2rem]">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{description}</p>
        </div>
        <dl className="grid min-w-[200px] gap-3 text-sm">
          <div className="flex justify-between gap-6 border-b border-[var(--line)] pb-2">
            <dt className="text-[var(--ink-muted)]">{gt("Response SLAs")}</dt>
            <dd className="font-medium tabular-nums text-[var(--panel-ink)]">93%</dd>
          </div>
          <div className="flex justify-between gap-6 border-b border-[var(--line)] pb-2">
            <dt className="text-[var(--ink-muted)]">{gt("Routing pass")}</dt>
            <dd className="font-medium tabular-nums text-[var(--panel-ink)]">86%</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-[var(--ink-muted)]">{gt("No-show risk")}</dt>
            <dd className="font-medium text-[var(--success)]">{gt("Low")}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-10">
        <BookingMomentumBarChart series={series} />
      </div>
    </section>
  );
}

export function UpcomingBookingsList({
  bookings,
}: Readonly<{
  bookings: UpcomingBooking[];
}>) {
  const gt = useGT();
  const m = useMessages();

  return (
    <section className="py-12 lg:col-span-5 lg:py-0 lg:pl-12">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ink-muted)]">
            {gt("Schedule")}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-dashboard-display)] text-3xl font-semibold tracking-[-0.02em] text-[var(--panel-ink)]">
            {gt("Up next")}
          </h2>
        </div>
        <Badge tone="success">{gt("Live")}</Badge>
      </div>

      <ol className="mt-8 flex flex-col gap-3">
        {bookings.map((booking) => (
          <li
            key={`${booking.name}-${booking.time}`}
            className="flex cursor-pointer gap-4 rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,white_88%,var(--canvas))] p-4 shadow-[var(--shadow-xl)] transition-[border-color,box-shadow] duration-200 hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--line))] hover:shadow-[0_8px_30px_color-mix(in_srgb,var(--accent-strong)_6%,transparent)] sm:p-5"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent-strong)] ring-1 ring-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
              {booking.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium leading-snug text-[var(--panel-ink)]">{booking.name}</p>
                <time className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                  {m(booking.day)}
                </time>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {m(booking.event)}
              </p>
              <p className="mt-3 flex items-center gap-2 border-t border-[color-mix(in_srgb,var(--line)_70%,transparent)] pt-3 text-sm text-[var(--ink-muted)]">
                <Icon name="clock" className="size-4 shrink-0 opacity-70" />
                {m(booking.time)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
