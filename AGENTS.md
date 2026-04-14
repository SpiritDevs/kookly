<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Verification

- After **any** code change, run **lint** and **TypeScript** checks before you finish. Do not stop until both pass with **zero** errors.
- From the repo root, run `bun run lint` and `bun run check-types` (these run across the monorepo via Turbo). If you only touched a single app or package, you may run that workspace’s `lint` and `check-types` instead—but the change must still typecheck and lint cleanly.
- If either command reports errors or warnings that apply to your edits, **fix them** (or resolve them in a justified, minimal way) before finishing. Do not leave known lint or `tsc` failures in place.
- For dashboard-only work, `bun run --cwd apps/dashboard lint` and `bun run --cwd apps/dashboard check-types` are equivalent to the workspace slice of the root commands.
