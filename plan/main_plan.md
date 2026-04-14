# Scheduler Pro Master Todo Plan

## Delivery Order
- [ ] Phase 1: Build the admin dashboard first
- [ ] Phase 2: Build the embeddable widget second
- [ ] Phase 3: Build the public website last

## Subplans
- [ ] Dashboard subplan: [dashboard_plan.md](./dashboard_plan.md)
- [ ] Widget subplan: [widget_plan.md](./widget_plan.md)
- [ ] Website subplan: [website_plan.md](./website_plan.md)

## Product Goals
- [ ] Build Scheduler Pro as a scheduling SaaS for revenue teams
- [ ] Support three surfaces: marketing website, admin dashboard, embeddable widget
- [ ] Keep Convex as the v1 backend and system of record
- [ ] Use Better Auth for login, registration, and session management
- [ ] Use General Translation as the localization foundation from the start
- [ ] Ship Google Calendar integration in v1
- [ ] Ship Google Meet link creation in v1
- [ ] Model full organizations from day one
- [ ] Keep path-based multitenancy for v1
- [ ] Defer payments, SCIM/SAML, marketplace plugins, custom domains, and recurring series

## Brief Coverage Checklist

### Apps
- [ ] Website advertising the platform
- [ ] Dashboard app with login/register, settings, bookings, integrations, routing, and analytics
- [ ] Widget app/package that can be embedded into external websites

### Core Libraries And Services
- [ ] Convex backend
- [ ] Better Auth
- [ ] Google Calendar integration
- [ ] Google Meet integration
- [ ] UploadThing for all file storage requirements

### Scheduling Engine
- [ ] Organizations, members, teams, and roles
- [ ] Event types for single-host and round-robin
- [ ] Availability schedules and date overrides
- [ ] Minimum notice, buffers, and slot interval controls
- [ ] Locale-aware booking flows
- [ ] Time zone-aware slot rendering and booking creation
- [ ] Booking confirmation, cancel, and reschedule flows
- [ ] Routing forms for lead qualification and team assignment
- [ ] Webhooks and booking analytics

### Localization
- [ ] Internationalize dashboard and website with `gt-next`
- [ ] Internationalize the widget with `gt-react` or an equivalent shared GT-compatible locale layer
- [ ] Support locale-aware routing in the Next apps
- [ ] Support runtime locale switching and persisted language preference
- [ ] Design for RTL support from the start
- [ ] Keep app copy, labels, validation messages, and empty states translatable

## Cross-Cutting Architecture Todo
- [ ] Replace the starter structure with product workspaces and keep Turborepo task definitions package-local
- [ ] Create or rename workspaces to `apps/site`, `apps/dashboard`, and `packages/widget`
- [ ] Keep `packages/ui` as the shared design system foundation
- [ ] Add shared schema/types package for booking, routing, integrations, and embed contracts
- [ ] Add shared env/config package for app and package configuration
- [ ] Standardize on UploadThing as the file storage layer for all uploads and stored assets instead of talking to S3 directly
- [ ] Plan UploadThing integration so the required authorization token is provided by the user during implementation and kept in server-side env/config only
- [ ] Add root `gt.config.json` with supported locales and default locale
- [ ] Define Convex modules for auth, organizations, teams, availability, event types, bookings, routing, integrations, webhooks, analytics, and audit
- [ ] Standardize locale-aware and org-scoped route patterns for dashboard, booking, and routing pages
- [ ] Store timestamps in UTC and store locale/time zone separately on orgs, members, attendees, and widget sessions
- [ ] Split slot lookup from booking creation so reads stay cacheable and writes stay transactional
- [ ] Use no temporary slot holds in v1; revalidate on final booking submit

## Localization Architecture Todo
- [ ] Configure `withGTConfig` in both Next apps
- [ ] Wrap both Next apps with `GTProvider`
- [ ] Add `proxy.ts` for Next 16 locale routing using `createNextMiddleware`
- [ ] Move app routes under `app/[locale]/...` in the Next apps so locale is available to layouts and pages
- [ ] Decide and document the initial supported locales and default locale in `gt.config.json`
- [ ] Use locale-aware route structures for public and dashboard paths:
  - [ ] Dashboard app route tree rooted under `app/[locale]/[orgSlug]/...`
  - [ ] Site route tree rooted under `app/[locale]/book/[orgSlug]/[eventSlug]` and `app/[locale]/route/[orgSlug]/[formSlug]`
- [ ] Use GT language switching primitives and persist locale choice via middleware-supported cookies
- [ ] Add RTL support by setting `lang` and `dir` correctly in locale layouts
- [ ] Keep all user-facing strings in translatable GT flows instead of hardcoded one-off literals
- [ ] Add translation generation to CI and production build flows with `gtx-cli translate`
- [ ] Keep production GT API keys server-side only and never expose them as public env vars

## Performance And UX Architecture Todo
- [ ] Enable Next.js Cache Components for the dashboard app
- [ ] Enable Next.js Cache Components for the website app
- [ ] Use Server Component shells for page chrome, navigation, metadata, and low-churn content
- [ ] Use `use cache`, `cacheLife`, and `cacheTag` for low-churn server-rendered content
- [ ] Use `preloadQuery` for initial Convex-backed renders that need to stay reactive after hydration
- [ ] Use client islands with live Convex queries for fast post-hydration updates
- [ ] Use optimistic mutations where safe for dashboard interactions
- [ ] Use `updateTag` or `revalidateTag` after mutations that affect cached website or dashboard server content
- [ ] Stream dynamic sections with Suspense and intentional loading states
- [ ] Build skeletons, empty states, and background refresh states instead of blocking spinners
- [ ] Use Motion for page transitions, modal flows, step transitions, slot selection feedback, and success states
- [ ] Add performance instrumentation for Web Vitals, query latency, booking latency, and webhook delivery latency
- [ ] Pass `locale` into cached translated components so each locale gets the correct cache entry when using Cache Components with `gt-next`

## Quality And Validation Policy
- [ ] Do not mark work complete until the relevant automated tests have been written and are passing
- [ ] Match each finished feature with the right level of coverage: unit, integration, and end-to-end where appropriate
- [ ] Treat visual QA as part of completion, not a follow-up task
- [ ] Use [$agent-browser](/Users/coreybaines/.agents/skills/agent-browser/SKILL.md) to take screenshots and validate implemented UI against the intended designs
- [ ] Capture both desktop and mobile screenshots for key user-facing flows before marking them done
- [ ] Use screenshot comparison and browser walkthroughs to catch layout drift, broken states, and interaction regressions
- [ ] Keep a checklist item open if implementation is present but tests or visual validation are still missing

## Delivery Milestones

### Milestone 0: Foundations
- [ ] Finalize monorepo app/package names
- [ ] Wire Bun, Turbo, TypeScript, ESLint, Prettier, and env handling for all workspaces
- [ ] Set up Convex project, schema folders, generated API flow, and local/dev/prod environments
- [x] Set up Better Auth integration and shared auth utilities
- [ ] Set up General Translation in both Next apps and the widget from the beginning
- [ ] Establish shared design tokens, component primitives, and motion primitives
- [ ] Define the v1 domain model and route conventions
- [ ] Set up testing layers for unit, integration, and end-to-end coverage

### Milestone 1: Dashboard First
- [ ] Complete the admin dashboard subplan
- [ ] Verify dashboard auth, scheduling setup, integrations, and booking operations end to end
- [ ] Verify dashboard performance strategy with Cache Components plus reactive Convex updates
- [ ] Validate key dashboard screens with `$agent-browser` screenshots before marking milestone items done

### Milestone 2: Widget Second
- [ ] Complete the widget subplan
- [ ] Verify widget React and plain JS embed flows
- [ ] Verify locale, time zone, and booking behavior across host sites
- [ ] Validate key widget states with `$agent-browser` screenshots before marking milestone items done

### Milestone 3: Website Last
- [ ] Complete the website subplan
- [ ] Verify marketing pages, public booking pages, routing flows, and SEO/performance baselines
- [ ] Verify website cache invalidation after dashboard mutations that change public-facing content
- [ ] Validate key public pages with `$agent-browser` screenshots before marking milestone items done

## Definition Of Done
- [ ] Admin dashboard is production-usable for org setup and scheduling operations
- [ ] Widget can be embedded into React and non-React websites
- [ ] Website can advertise the platform and serve public booking/routing flows
- [ ] Dashboard and website feel fast via Cache Components, streaming, and reactive Convex updates
- [ ] Motion-based animations are present, purposeful, and not ornamental
- [ ] Localization is built in from the start, not retrofitted later
- [ ] Locale routing, switching, and RTL behavior work correctly in the Next apps
- [ ] Relevant automated tests exist and pass before tasks are marked complete
- [ ] Key user-facing screens have been reviewed with `$agent-browser` screenshots before tasks are marked complete
- [ ] The v1 brief is covered without leaving major requested areas unplanned

## References
- [ ] Better Auth Convex integration: https://better-auth.com/docs/integrations/convex
- [ ] Convex Next.js server rendering: https://docs.convex.dev/client/react/nextjs/server-rendering
- [ ] Convex React reactivity: https://docs.convex.dev/client/react
- [ ] General Translation Next.js quickstart: https://generaltranslation.com/en-US/docs/next
- [ ] General Translation middleware guide: https://generaltranslation.com/en-US/docs/next/guides/middleware
- [ ] General Translation Cache Components guide: https://generaltranslation.com/en-US/docs/next/guides/cache-components
- [ ] General Translation RTL guide: https://generaltranslation.com/en-US/docs/next/guides/rtl
- [ ] General Translation React quickstart: https://generaltranslation.com/en/docs/react
- [ ] Next.js internationalization guide: https://nextjs.org/docs/app/guides/internationalization
- [ ] Google Calendar Freebusy API: https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query
- [ ] Google Calendar event creation and Meet conference data: https://developers.google.com/workspace/calendar/api/guides/create-events
