# Dashboard Onboarding Organization Screen Spec

## Source Intent
- Use the provided onboarding template as the first onboarding step after registration
- Preserve the progressive, high-trust setup feel with a clear step indicator and a strong form canvas
- Implement it with Tailwind utilities only

## Route
- `apps/dashboard/app/(onboarding)/onboarding/organization/page.tsx`

## Component Breakdown
- `OnboardingShell`
  - Full-screen onboarding layout
  - Suppresses dashboard nav
  - Handles centered canvas and footer partner strip
- `OnboardingHeader`
  - Scheduler Pro brand row
  - Step label
  - Progress indicator
- `OnboardingIntroPanel`
  - Headline
  - Supporting copy
  - Trust or verification callout
- `OrganizationSetupForm`
  - Logo upload field
  - Organization name field
  - Booking slug field
  - Primary timezone select
  - Save progress action
  - Continue action
- `LogoUploadField`
  - Local preview state
  - Upload trigger
  - File type and size guidance
- `OnboardingFooterStrip`
  - Decorative partner or trust marks

## Tailwind-Only Translation Rules
- Implement the progress bar, panel spacing, and upload canvas using Tailwind only
- Do not add custom CSS files or inline stylesheet blocks
- Convert all bespoke visuals into utility-driven markup or shared Tailwind tokens
- Keep onboarding visual language aligned with the login and registration screens

## Data And Behavior
- Organization name should prefill from registration draft data when available
- Booking slug should validate uniqueness before continue
- Time zone should default from browser or user profile when available
- Save progress should persist onboarding draft state and keep the user on the same step
- Continue should create or update the organization record and then route to the next onboarding step
- Logo upload can ship as draft metadata first if file storage is not ready in the same slice

## Convex Connections
- Persist onboarding draft state in Convex
- Create or update:
  - organization
  - organization slug
  - primary time zone
  - branding draft metadata
- Run a slug availability query as the user edits the booking URL
- Track onboarding step completion so resume flows can recover the user into the correct step

## Loading And Error States
- Show slug availability feedback inline
- Show file upload validation for unsupported types or oversized images
- Show save-progress success feedback without leaving the page
- Disable continue while the required fields are incomplete or slug validation is unresolved
- Animate:
  - step progress changes
  - validation messages
  - save success confirmation

## Acceptance Criteria
- The screen matches the supplied onboarding composition closely
- The screen uses Tailwind only
- The screen persists onboarding progress in Convex
- The screen creates the organization setup state needed for later onboarding steps
