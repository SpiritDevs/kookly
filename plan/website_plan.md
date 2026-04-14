# Website Subplan

## Goal
- [ ] Build the public website after the dashboard and widget are established
- [ ] Make the site both a marketing surface and the home of public booking and routing pages
- [ ] Use Cache Components heavily for fast first load while keeping booking flows reactive where freshness matters

## Done When
- [ ] The site can advertise Scheduler Pro clearly
- [ ] The site can host public booking pages, routing pages, and cancel/reschedule flows
- [ ] Dashboard changes that affect public pages can be reflected through clear cache invalidation paths
- [ ] The website feels premium, fast, and animated with Motion
- [ ] Website tasks are only marked complete after tests pass and browser screenshots confirm the design is on track

## App Architecture
- [ ] Use Next 16 App Router for `apps/site`
- [ ] Enable `cacheComponents: true`
- [ ] Use `gt-next` for localization in the website app
- [ ] Configure website routes under `app/[locale]/...`
- [ ] Add `GTProvider`, `withGTConfig`, and `proxy.ts` locale middleware in the website app
- [ ] Keep marketing pages mostly static or cached
- [ ] Keep booking config and page shell cached where possible
- [ ] Keep live slot selection and booking submission in client islands connected to Convex
- [ ] Use `preloadQuery` when first paint benefits from server-rendered Convex data that stays reactive later
- [ ] Use `use cache`, `cacheLife`, and `cacheTag` for pricing, feature marketing, docs-lite content, and public event configuration that can be tag-invalidated
- [ ] Use `updateTag` or `revalidateTag` after dashboard mutations that change published public content
- [ ] Pass `locale` into cached translated website components so cache entries stay locale-correct
- [ ] Use Motion for hero reveals, page transitions, modal flows, and booking success states

## Information Architecture
- [ ] Home
- [ ] Product or features
- [ ] Pricing
- [ ] Docs-lite or help
- [ ] Public booking pages
- [ ] Public routing pages
- [ ] Cancel and reschedule pages

## Marketing Surface Todo
- [ ] Create a distinct visual identity for Scheduler Pro
- [ ] Build hero, feature sections, integrations story, and CTA paths to signup/demo
- [ ] Build pricing page aligned with the v1 packaging strategy
- [ ] Build docs-lite content for embeds, booking pages, and integrations
- [ ] Add localized metadata, navigation copy, and marketing copy from the beginning
- [ ] Build SEO metadata, OG metadata, sitemap, and robots handling

## Public Booking Pages Todo
- [ ] Build event page route structure
- [ ] Render public event information, host or team details, locale-aware calendar UI, and booking form
- [ ] Support single-host and round-robin event types
- [ ] Show buffers, booking notice rules, and time zone context correctly
- [ ] Handle no availability and unpublished or invalid event pages cleanly

## Public Routing Pages Todo
- [ ] Build routing page route structure
- [ ] Render routing form, branching flow, and post-routing booking step
- [ ] Keep the routing-to-booking experience coherent and fast
- [ ] Surface qualification results and fallback messaging gracefully

## Cancel And Reschedule Todo
- [ ] Build tokenized cancel flow
- [ ] Build tokenized reschedule flow
- [ ] Reuse booking context and time zone logic cleanly
- [ ] Show confirmation states and follow-up guidance clearly

## Performance And UX Todo
- [ ] Cache the global site shell and reusable marketing sections aggressively
- [ ] Cache public page config and invalidate it when dashboard publishing changes occur
- [ ] Stream dynamic areas behind Suspense boundaries
- [ ] Keep slot lookup and booking submission reactive and client-driven where freshness is required
- [ ] Add skeletons and partial-loading states instead of blank pages
- [ ] Use Motion to add polish without slowing content discovery
- [ ] Keep the website performant on mobile-first networks and devices

## Testing
- [ ] Unit test route helpers, metadata builders, and cache invalidation helpers
- [ ] Unit test locale routing helpers, localized path mapping, and locale-aware metadata helpers
- [ ] Integration test public booking config loading and cache refresh behavior
- [ ] Integration test public routing flows
- [ ] Integration test site locale routing, locale switching, and locale persistence
- [ ] End-to-end test first visit to booking completion
- [ ] End-to-end test routing form to booking completion
- [ ] End-to-end test cancel and reschedule links
- [ ] End-to-end test a non-default locale and at least one RTL locale on key public pages
- [ ] End-to-end test SEO-critical marketing pages and structured metadata
- [ ] Use [$agent-browser](/Users/coreybaines/.agents/skills/agent-browser/SKILL.md) to capture desktop screenshots of marketing, booking, routing, and cancel/reschedule flows
- [ ] Use `$agent-browser` to capture mobile screenshots for key public pages
- [ ] Use `$agent-browser` to capture screenshots in at least one non-default locale before closing localization-related items
- [ ] Use `$agent-browser` walkthroughs to confirm the implementation stays aligned with the intended design before closing checklist items

## Exit Criteria
- [ ] The site markets the product well
- [ ] The site serves public booking and routing flows reliably
- [ ] Cached content stays fast while live booking data stays fresh
- [ ] Website features are not marked complete until tests pass and screenshot-based QA is done
- [ ] The site feels polished and animated, not generic
