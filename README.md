# Kookly

Kookly is a Bun-powered Turborepo for building scheduling experiences across the public site and an authenticated dashboard.

## What is in the repo

### Apps

- `apps/web` - the main Next.js app on port `3000`
- `apps/dashboard` - the product dashboard app on port `3002`

### Shared packages

- `packages/ui` - shared React UI exports
- `packages/eslint-config` - shared ESLint config
- `packages/typescript-config` - shared TypeScript config

## Tech stack

- [Next.js 16](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Turborepo](https://turbo.build/repo)
- [Bun](https://bun.sh/)
- TypeScript

## Getting started

### Prerequisites

- Node.js `18+`
- Bun `1.3.5+`

### Install dependencies

```bash
bun install
```

### Start all apps

```bash
bun run dev
```

This also starts the local Convex backend used by Better Auth and the dashboard.

### Start one app

```bash
bun run dev:convex
bunx turbo run dev --filter=web
bunx turbo run dev --filter=dashboard
```

## Workspace commands

```bash
bun run dev
bun run build
bun run lint
bun run check-types
bun run format
```

## Project structure

```text
.
|-- apps/
|   |-- dashboard/
|   `-- web/
|-- packages/
|   |-- eslint-config/
|   |-- typescript-config/
|   `-- ui/
|-- turbo.json
`-- package.json
```

## Notes

- Turborepo task orchestration is configured in `turbo.json`.
- The repo uses Bun workspaces from the root `package.json`.
- Local build output, Turbo cache files, and Next.js artifacts are ignored in `.gitignore`.

## Next steps

- Replace the remaining starter page in `apps/web`
- Expand the shared UI package as the product surface grows
- Add product-specific docs, architecture notes, and deployment instructions
