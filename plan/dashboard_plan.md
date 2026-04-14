# Dashboard Subplan

## Goal
- [ ] Build the authenticated admin surface first
- [ ] Let an org owner sign up, configure their team, connect Google, set availability, create event types, manage routing, and monitor bookings
- [ ] Make the dashboard feel instant through Cache Components, streaming, live Convex reactivity, and Motion-based transitions

## Done When
- [ ] Owners can register, create an organization, and invite teammates
- [ ] Admins can manage settings, event types, availability, integrations, routing, bookings, analytics, and webhooks
- [ ] Google Calendar and Google Meet are fully connected from the dashboard
- [ ] Changes made in the dashboard update relevant UI without manual refresh
- [ ] Dashboard tasks are only marked complete after tests pass and browser screenshots confirm the design is on track

## App Architecture
- [ ] Use Next 16 App Router for `apps/dashboard`
- [ ] Enable `cacheComponents: true`
- [ ] Use `gt-next` for localization in the dashboard app
- [ ] Use Tailwind CSS only for styling the dashboard experience, including auth and onboarding screens
- [ ] Configure dashboard routes under `app/[locale]/[orgSlug]/...`
- [ ] Add `GTProvider`, `withGTConfig`, and `proxy.ts` locale middleware in the dashboard app
- [ ] Use Server Component shells for layouts, breadcrumbs, nav, metadata, and org-scoped page framing
- [ ] Use `preloadQuery` to server-render first paint for reactive sections
- [ ] Use live Convex client components for settings forms, booking tables, calendars, and routing builders
- [ ] Use `use cache` only for low-churn content such as help copy, static settings metadata, and reusable dashboard chrome
- [ ] Use `updateTag` or `revalidateTag` after server-driven mutations that affect cached dashboard shell content
- [ ] Pass `locale` into cached translated dashboard components so cache entries stay locale-correct
- [ ] Use Motion for navigation changes, modal/dialog choreography, step flows, save feedback, and success/error transitions

## Dashboard Information Architecture
- [ ] Overview
- [ ] Event Types
- [ ] Availability
- [ ] Teams
- [ ] Routing
- [ ] Integrations
- [ ] Bookings
- [ ] Analytics
- [ ] Webhooks
- [ ] Org Settings

## Screen Specifications
- [x] Track dashboard screen specs in separate implementation docs
- [x] Login screen spec: [dashboard_screens/login_screen.md](./dashboard_screens/login_screen.md)
- [x] Registration screen spec: [dashboard_screens/registration_screen.md](./dashboard_screens/registration_screen.md)
- [x] Onboarding organization screen spec: [dashboard_screens/onboarding_organization_screen.md](./dashboard_screens/onboarding_organization_screen.md)
- [x] Dashboard home screen spec: [dashboard_screens/dashboard_home_screen.md](./dashboard_screens/dashboard_home_screen.md)
- [ ] Break each screen into reusable components before implementation
- [ ] Connect form submissions to Better Auth and Convex where appropriate
- [ ] Translate the supplied HTML references into Tailwind-only React components without custom CSS files

## Workstream 1: Setup And Shell
- [ ] Create the dashboard app structure and route groups
- [ ] Add shared dashboard layout, sidebar, top bar, command surface, and notifications
- [ ] Implement the dashboard shell primitives from the dashboard home screen spec
- [ ] Add authenticated app providers for Better Auth, Convex, theme, motion, and toasts
- [ ] Add dashboard locale layout concerns: `lang`, `dir`, locale provider wiring, and language-switching entry points
- [ ] Define loading, empty, error, and unauthorized states per major route
- [ ] Create a reusable dashboard page template with page header, toolbar, filters, and content zones

## Workstream 2: Auth, Organizations, And Roles
- [ ] Build login, registration, forgot password, and session restore flows
- [x] Implement the login screen using the linked screen spec and shared auth primitives
- [x] Implement the registration screen using the linked screen spec and shared auth primitives
- [x] Set up Better Auth plus Convex email/password auth for the dashboard app
- [x] Create Convex-backed app user, organization, and organization membership tables separate from Better Auth internals
- [x] Add Vercel BotID protection to the Better Auth sign-in and sign-up POST endpoints
- [ ] Build org creation on first signup
- [ ] Implement the onboarding organization step using the linked screen spec and Convex-backed org creation flow
- [x] Implement a three-step onboarding draft flow for organization, scheduling, and integrations
- [x] Persist onboarding draft state in Convex and resume users on the correct onboarding step
- [ ] Add invite teammate flow
- [ ] Add role management for `owner`, `admin`, and `member`
- [ ] Add org switcher groundwork even if v1 only uses a single org per user most of the time
- [ ] Add org profile settings: name, slug, branding basics, locale, time zone, and booking defaults

## Workstream 3: Scheduling Primitives
- [ ] Model and build event types for single-host and round-robin meetings
- [ ] Build event type list, create, edit, duplicate, archive, and slug management flows
- [ ] Build booking question configuration for event types
- [ ] Build availability schedule management with day rules and date overrides
- [ ] Build controls for minimum notice, buffers, slot intervals, and booking horizons
- [ ] Build preview tools for how a booking page will behave in different time zones

## Workstream 4: Team And Revenue Features
- [ ] Build team creation and membership management
- [ ] Build round-robin pool assignment UX
- [ ] Build least-recently-booked default assignment behavior
- [ ] Build routing form list, builder, edit, publish, and archive flows
- [ ] Build deterministic rule configuration that maps form answers to team/event destinations
- [ ] Build routing result preview and validation tooling for admins

## Workstream 5: Integrations
- [ ] Build integrations index page and connection status cards
- [ ] Build Google OAuth connect and disconnect flows
- [ ] Build Google Calendar selection and conflict-check settings
- [ ] Build Google Meet enablement per event type or org default
- [ ] Surface sync errors, token issues, and retry actions inside the dashboard

## Workstream 6: Booking Operations
- [ ] Build bookings list with filters for team member, event type, status, and date range
- [ ] Build booking detail drawer or page with attendee info, routing source, calendar sync state, and audit trail
- [ ] Build cancel and reschedule controls for admins where permitted
- [ ] Build no-slot and conflict diagnostics for supportability
- [ ] Add search and pagination or infinite loading where needed

## Workstream 7: Analytics And Webhooks
- [ ] Build overview metrics for bookings, cancellations, routing conversion, and assignment distribution
- [ ] Build lightweight charts and tables for v1 analytics
- [ ] Implement the dashboard overview screen using the linked screen spec and live Convex-backed data panels
- [ ] Build webhook endpoint management
- [ ] Build webhook delivery log with status, payload summary, retries, and replay action
- [ ] Build audit activity stream for important org-level changes

## Workstream 8: Fluid UX And Performance
- [ ] Use preloaded Convex queries for high-value first paint sections
- [ ] Keep high-frequency data live with Convex subscriptions after hydration
- [ ] Add optimistic updates for event type edits, availability changes, and lightweight settings mutations
- [ ] Add fine-grained Suspense boundaries so filters, tables, and panels load independently
- [ ] Avoid full-page reload patterns for CRUD flows
- [ ] Add keyboard-friendly interactions and fast form validation feedback
- [ ] Add Motion-driven transitions for route changes, step builders, dialogs, side panels, and success states

## Workstream 9: Testing
- [ ] Unit test org, team, availability, routing, and event type helpers
- [ ] Unit test locale helpers, localized path helpers, and RTL-aware layout helpers
- [ ] Integration test Better Auth plus Convex session handling
- [ ] Integration test Google connect, token refresh, calendar selection, and Meet enablement
- [ ] Integration test dashboard locale routing, locale switching, and locale persistence
- [ ] End-to-end test owner signup to org setup
- [ ] End-to-end test teammate invite and role changes
- [ ] End-to-end test event type creation and availability editing
- [ ] End-to-end test routing setup and booking outcome visibility
- [ ] End-to-end test booking operations and webhook management
- [ ] End-to-end test a non-default dashboard locale and at least one RTL locale
- [ ] Use [$agent-browser](/Users/coreybaines/.agents/skills/agent-browser/SKILL.md) to capture desktop screenshots for auth, onboarding, and dashboard overview flows
- [ ] Use `$agent-browser` to capture mobile screenshots for key responsive dashboard screens
- [ ] Use `$agent-browser` to capture screenshots in at least one non-default locale before closing localization-related items
- [ ] Use `$agent-browser` walkthroughs to verify interactions, loading states, and visual regressions before closing checklist items

## Exit Criteria
- [ ] Dashboard can fully configure the product without relying on unfinished website flows
- [ ] Dashboard data feels reactive and fast
- [ ] Dashboard UI has polished loading states and Motion-based feedback
- [ ] Dashboard features are not marked complete until tests pass and screenshot-based QA is done
- [ ] Dashboard covers the brief items for login/register, settings, booking calendar, and integrations
