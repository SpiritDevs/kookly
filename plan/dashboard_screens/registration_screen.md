# Dashboard Registration Screen Spec

## Source Intent
- Use the provided registration template as the visual direction for first-time account creation
- Keep the split-screen brand storytelling on large screens and a compact focused layout on smaller screens
- Implement it with Tailwind utilities only

## Route
- `apps/dashboard/app/(auth)/register/page.tsx`

## Component Breakdown
- `RegistrationShell`
  - Handles split layout on desktop and single-column layout on mobile
  - Suppresses authenticated dashboard chrome
- `RegistrationBrandPanel`
  - Brand icon and name
  - Editorial headline
  - Supporting copy
  - Trust testimonial block
- `RegistrationFormPanel`
  - Screen heading
  - Provider sign-in buttons
  - Email registration form
  - Existing account link
  - Compliance and trust strip
- `ProviderButtons`
  - Google registration
  - SSO placeholder or disabled state
- `RegistrationForm`
  - Full name field
  - Work email field
  - Company name field
  - Password field and strength helper
  - Submit button
- `RegistrationFooter`
  - Legal and trust links

## Tailwind-Only Translation Rules
- Build the split-screen layout, decorative background, and card depth with Tailwind only
- Avoid custom CSS files and inline stylesheet blocks
- Replace template-specific icons and remote imagery with local assets or reusable icon components during implementation
- Keep typography, spacing, and trust surfaces consistent with the login screen tokens

## Data And Behavior
- Email registration should call Better Auth sign-up
- Google button should initiate Better Auth Google sign-up
- Company name from this screen should be carried into onboarding as a default suggestion, not treated as final org state unless the flow decides to create the org immediately
- After successful account creation:
  - create the initial user profile
  - route into onboarding organization setup
- Existing account link should route to login

## Convex And Auth Connections
- Better Auth creates the account and session
- Convex should persist or initialize:
  - user profile
  - registration source
  - initial onboarding progress record
- If company name is collected here, persist it as onboarding draft state for reuse on the next step

## Loading And Error States
- Validate required fields inline
- Show email-in-use, weak-password, and generic server failures clearly
- Disable submit while pending
- Animate:
  - panel entrance
  - field validation feedback
  - success transition into onboarding

## Acceptance Criteria
- The screen matches the supplied split-screen concept closely
- The screen uses Tailwind only
- The screen supports email and Google account creation
- Successful registration transitions directly into onboarding with draft state preserved
