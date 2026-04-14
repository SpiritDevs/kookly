# Dashboard Login Screen Spec

## Source Intent
- Use the provided login template as the visual direction for the dashboard sign-in entry point
- Preserve the editorial, polished, trust-heavy tone of the reference
- Implement it with Tailwind utilities only

## Route
- `apps/dashboard/app/(auth)/login/page.tsx`

## Component Breakdown
- `AuthShell`
  - Centers the transactional layout
  - Suppresses dashboard navigation chrome
  - Owns ambient background layers and page framing
- `AuthBrandBlock`
  - Renders Scheduler Pro wordmark and supporting tagline
- `LoginCard`
  - Wraps the auth form, SSO actions, and footer support copy
- `LoginForm`
  - Email field
  - Password field
  - Forgot password link
  - Submit button
- `AuthDivider`
  - Renders the "or continue with" separator
- `AuthProviderButtons`
  - Google sign-in button
  - SSO placeholder button for future enterprise auth
- `TrustFooter`
  - Renders security and reach trust points

## Tailwind-Only Translation Rules
- Recreate gradients, blur, panel depth, and spacing using Tailwind utility classes only
- Do not add page-specific CSS files or inline `<style>` blocks
- Move repeated visual tokens into Tailwind theme extensions or reusable class helpers only if they are needed across multiple auth screens
- Replace CDN-loaded icon assumptions with a local icon strategy during implementation

## Data And Behavior
- Email/password submit should call Better Auth sign-in actions
- Google button should trigger Better Auth social sign-in for Google
- SSO button should be present but disabled or clearly marked as coming later unless enterprise auth is implemented in that slice
- Forgot password link should point to the password recovery flow once built
- On successful sign-in:
  - If the user has no organization, route to onboarding
  - If the user has an organization, route to the dashboard org home

## Convex And Auth Connections
- Better Auth handles credential validation and session creation
- Convex is queried after auth success to resolve:
  - user profile
  - organization membership
  - onboarding completion state
- Use a lightweight post-login bootstrap query to determine redirect destination

## Loading And Error States
- Show inline field validation for invalid email and empty password
- Show a form-level error banner for auth failures
- Disable submit while the request is in flight
- Use Motion for:
  - button press feedback
  - error banner entrance
  - card entrance on first load

## Acceptance Criteria
- The screen matches the supplied composition closely in layout and tone
- The screen uses Tailwind only
- The screen works for email/password and Google auth
- The screen routes users correctly based on onboarding state
