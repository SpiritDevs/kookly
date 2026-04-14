# Dashboard Home Screen Spec

## Source Intent
- Use the provided dashboard template as the visual direction for the signed-in admin landing page
- Keep the layout premium, airy, and highly legible, with strong hierarchy across metrics, trends, and upcoming bookings
- Implement it with Tailwind utilities only

## Route
- `apps/dashboard/app/[orgSlug]/page.tsx`

## Layout Zones
- `DashboardShell`
  - Left sidebar navigation
  - Top navigation/search bar
  - Main content canvas
- `DashboardHeader`
  - Page title
  - Welcome copy
  - Primary and secondary actions
- `MetricsGrid`
  - KPI cards for bookings, active users, revenue, and leads
- `BookingTrendsPanel`
  - Date range control
  - Chart container
  - Trend labels
- `UpcomingBookingsPanel`
  - Upcoming booking list
  - CTA to full schedule

## Component Breakdown
- `DashboardSidebar`
  - Brand block
  - Primary nav items
  - User profile block
  - Quick action button
- `DashboardTopbar`
  - Search field
  - Support action
  - Notifications action
  - Help action
- `DashboardPageHeader`
  - Heading
  - Contextual welcome text
  - Invite user action
  - Create booking action
- `KpiCard`
  - Icon
  - Label
  - Primary metric
  - Delta badge
- `TrendChartCard`
  - Section heading
  - Range select
  - Chart body
  - Time axis
- `UpcomingBookingItem`
  - Avatar
  - Presence or status indicator
  - Attendee name
  - Event title and time
  - Day label
- `PanelCard`
  - Shared container primitive for overview panels

## Tailwind-Only Translation Rules
- Rebuild glass, blur, gradient, depth, spacing, and rounded surfaces with Tailwind utilities only
- Do not add page-specific CSS files or inline stylesheet blocks
- Translate repeated visual treatments into shared Tailwind-friendly component primitives
- Replace remote avatars and template-only assets with local placeholders or dynamic data renderers during implementation

## Data Mapping
- `Welcome back, Alex` should come from the signed-in user profile in Convex
- Sidebar profile block should come from the signed-in member profile and current org role
- KPI cards should be sourced from overview analytics queries
- Booking trends should be sourced from a bookings analytics series query
- Upcoming bookings should be sourced from a date-scoped bookings query filtered to the current user or org context
- Search should query dashboard entities such as bookings, users, teams, and event types

## Convex Connections
- Use a server-rendered shell with preloaded data for:
  - signed-in member summary
  - current org summary
  - initial KPI metrics
- Keep live client subscriptions for:
  - KPI refresh
  - upcoming bookings list
  - notification counts
- Use Convex queries for:
  - `dashboard.getOverviewMetrics`
  - `dashboard.getBookingTrendSeries`
  - `bookings.listUpcoming`
  - `memberships.getCurrentMember`
- Use Convex mutations or actions for:
  - quick booking creation entry point
  - invite user shortcut flow

## Cache And Reactivity Strategy
- Cache the dashboard chrome and low-churn org framing with Cache Components
- Use `preloadQuery` for initial metrics and upcoming bookings so the first render feels immediate
- Rehydrate into live Convex queries after load for fluid updates
- Keep the chart panel streaming behind a Suspense boundary if analytics data is slower than the rest of the overview page
- Use tag invalidation only for low-churn dashboard shell content, not for high-frequency live metrics

## Motion And Interaction
- Animate sidebar and panel entrance subtly on first load
- Use hover and press feedback on navigation items and primary actions
- Animate KPI number changes conservatively
- Animate upcoming booking list insertions and removals
- Use smooth transitions for chart range changes without blocking input

## Loading And Empty States
- Show skeleton KPI cards while metrics hydrate
- Show a panel skeleton for chart loading
- Show an empty-state card if there are no upcoming bookings
- Keep the shell visible while data panels stream in

## Acceptance Criteria
- The screen matches the supplied dashboard composition closely in structure and tone
- The screen uses Tailwind only
- The screen is split into reusable shell, panel, and list components
- The screen uses Cache Components plus live Convex updates appropriately
- The overview feels fast and polished rather than static
