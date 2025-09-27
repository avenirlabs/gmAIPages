# Setup

Prereqs
- Node 20+ (Node 22 supported), pnpm 8/10

Install
- pnpm install

Run
- pnpm run dev → http://localhost:8080

Build
- pnpm run build (client + server)
- pnpm run build:client, pnpm run build:server

TypeScript
- Strict mode enabled (strict, noUncheckedIndexedAccess, noImplicitOverride, strictNullChecks, noImplicitAny).
- Local skipLibCheck=true; in CI use `pnpm run typecheck:ci` (tsconfig.ci.json) with skipLibCheck=false.

Environment
- Copy env vars from docs/env.md. For local dev, create .env with server-only secrets omitted from client (never expose service keys in client!).
