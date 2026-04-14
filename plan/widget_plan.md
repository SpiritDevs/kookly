# Widget Subplan

## Goal
- [ ] Build the embeddable scheduler experience after the dashboard is functional
- [ ] Support both React consumers and plain JavaScript embeds
- [ ] Make locale-aware date/time selection, fast slot browsing, and fluid step transitions core to the package

## Done When
- [ ] A React app can install the widget package and render booking or routing widgets
- [ ] A non-React site can mount the widget through a plain JS loader
- [ ] The widget can book single-host and round-robin event types
- [ ] The widget respects locale, time zone, branding, and embed mode configuration
- [ ] Widget tasks are only marked complete after tests pass and browser screenshots confirm the design is on track

## Package Architecture
- [ ] Create `packages/widget`
- [ ] Use `gt-react` or a GT-compatible shared locale layer for widget localization
- [ ] Export React-first components for booking and routing experiences
- [ ] Export a plain JS `createSchedulerWidget` mount API
- [ ] Share visual primitives from `packages/ui` while keeping widget-specific composition local to the package
- [ ] Bundle styles, tokens, and motion primitives in a way that is safe for host sites
- [ ] Keep the package framework-friendly and avoid assumptions about the embedding site stack

## Public API Todo
- [ ] Define React component props for org slug, event slug or form slug, mode, locale, time zone, theme, and callbacks
- [ ] Define JS mount API for target element, mode, locale, time zone, theme, and lifecycle callbacks
- [ ] Define widget lifecycle events such as ready, step change, booking success, booking failure, and resize
- [ ] Define error surfaces for no slots, unavailable event, misconfiguration, and network failure

## Booking Experience Todo
- [ ] Build inline booking widget mode
- [ ] Build modal or popup booking widget mode
- [ ] Build the step flow: date selection, time selection, attendee details, confirm, success
- [ ] Build locale-aware month, weekday, date, and time formatting
- [ ] Detect browser locale and time zone by default and allow explicit override by integrators
- [ ] Show time zone context clearly throughout the flow
- [ ] Handle slot refresh when availability changes before final submission

## Routing Experience Todo
- [ ] Build routing widget flow for qualification-first booking
- [ ] Support deterministic branching to event types or teams
- [ ] Show a clean transition from routing answers to slot selection
- [ ] Preserve form answers and routing context into the booking confirmation state

## Data And Reactivity Todo
- [ ] Use Convex-backed public queries for event metadata, routing forms, and slot availability
- [ ] Keep high-value widget state client-side for instant step transitions
- [ ] Use optimistic local UI for step progression and lightweight form actions
- [ ] Revalidate availability on final booking submission
- [ ] Make booking mutation results update the widget without reload
- [ ] Keep widget copy, labels, validation states, and success messages translatable and locale-driven

## Performance And Motion Todo
- [ ] Keep the initial widget bundle as small as possible
- [ ] Lazy-load lower-priority substeps when possible
- [ ] Stream or defer non-critical help content and secondary UI
- [ ] Add Motion-based transitions between steps, slot selection, modal open/close, and success confirmation
- [ ] Ensure animations remain fast and subtle on lower-powered devices

## Host Integration Todo
- [ ] Support embedding inside React apps
- [ ] Support embedding inside plain HTML/JS sites
- [ ] Support host-driven theming inputs
- [ ] Support responsive layout from small mobile containers up to desktop sidebars
- [ ] Support accessible focus management when opened as a modal
- [ ] Document how host sites pass locale and time zone overrides

## Testing
- [ ] Unit test locale formatting and time zone conversion helpers
- [ ] Unit test embed API normalization and validation
- [ ] Unit test widget locale switching and fallback behavior
- [ ] Integration test single-host booking flow
- [ ] Integration test round-robin booking flow
- [ ] Integration test routing-to-booking flow
- [ ] Integration test React embed and plain JS embed mounting
- [ ] Integration test non-default locale rendering in embedded contexts
- [ ] End-to-end test mobile and desktop containers
- [ ] End-to-end test no-slot, conflict, and error states
- [ ] End-to-end test RTL-safe layout behavior if RTL locales are enabled in the widget
- [ ] Use [$agent-browser](/Users/coreybaines/.agents/skills/agent-browser/SKILL.md) to capture desktop screenshots of inline and modal widget states
- [ ] Use `$agent-browser` to capture mobile screenshots for narrow embedded layouts
- [ ] Use `$agent-browser` to capture widget screenshots in at least one non-default locale before closing localization-related items
- [ ] Use `$agent-browser` to validate embed behavior in realistic host pages before closing checklist items

## Exit Criteria
- [ ] Widget works independently of the website implementation
- [ ] Widget works in React and non-React environments
- [ ] Widget feels snappy, localized, and motion-polished
- [ ] Widget features are not marked complete until tests pass and screenshot-based QA is done
- [ ] Widget covers the brief requirement for a reusable calendar scheduler package
