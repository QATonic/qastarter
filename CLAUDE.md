# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

QAStarter is a QA automation framework generator. A user picks a stack (testing type × framework × language × test runner × build tool, plus optional CI/CD, reporting, and patterns), and the server renders a complete, downloadable test-automation project as a ZIP. The same generation engine is exposed three ways: the web wizard (`client/`), a published CLI + MCP server (`cli/`), and the HTTP API (`server/`).

## Commands

```bash
npm run dev            # Start dev server (tsx watch, serves API + Vite-built SPA on PORT, default 5000)
npm run build          # Vite build client + esbuild-bundle server into dist/
npm start              # Run production build from dist/
npm run check          # TypeScript typecheck (tsc, no emit)
npm run lint           # ESLint; lint:fix to autofix
npm run format         # Prettier write; format:check to verify

# Tests
npm test               # Server + shared unit tests (vitest, node env) — server/**/*.test.ts, shared/**/*.test.ts
npm run test:client    # Client tests (separate config: client/vitest.config.ts, jsdom env)
npm run test:all       # Server/shared + client + CLI tests
npm test -- server/services/projectService.test.ts   # Run a single test file
npm run test:watch     # Watch mode
npm run test:e2e       # Playwright E2E (also :ui, :headed, :firefox, :webkit, :api project variants)

# Templates (see "Template packs" below)
npm run validate:templates       # Validate every pack manifest + render
npm run templates:maintain       # validate + sync manifests + check BOM versions + parity
```

There are **two separate vitest configs**: the root one (`vitest.config.ts`) covers `server/` and `shared/` in a node environment; `client/vitest.config.ts` covers the React client in jsdom. `npm test` does NOT run client tests — use `test:client` or `test:all`. The `cli/` package has its own `package.json`, tests, and build; treat it as a sub-project.

## Architecture

### Generation pipeline (the core)

A `ProjectConfig` (validated against `shared/schema.ts` via Zod) flows through:

1. **`server/routes/projectRoutes.ts`** → **`server/services/projectService.ts`** (`ProjectService.generateAndStreamProject`) — orchestrates generation and streams a ZIP via `archiver` directly to the HTTP response.
2. **`server/templates/templatePackEngine.ts`** (`TemplatePackEngine`) — loads the matching pack from `server/templates/packs/<pack-id>/`, renders each file through an **isolated Handlebars instance** (`handlebars.create()`, with dynamic partials disabled for security) using a `TemplateContext` built from the config. Custom helpers (`eq`, `pascalCase`, `camelCase`, `packageToPath`, `escapeXml`, `json`, etc.) are registered here.
3. Manifests and rendered templates are cached via `server/services/cacheService.ts` (in-memory, or Redis when available — see Caching).

### Template packs (`server/templates/packs/`)

Each pack is a directory named `<testingType>-<language>-<framework>-<testRunner>-<buildTool>` (e.g. `web-typescript-playwright-jest-npm`) containing:
- **`manifest.json`** — declares `id`, `supportedCombination`, `dynamicSupport` (which reporting/CI-CD/pattern add-ons it can layer in), pinned `toolVersions` (the BOM), and a `files[]` list marking which are Handlebars templates (`isTemplate: true`).
- **`files/`** — the actual template/static files rendered into the output project.

Shared/canonical fragments live in `server/templates/_canonical/<language>/` and `server/templates/shared/` (e.g. `versionLoader.ts` merges shared dependency versions into per-pack versions). When adding or editing packs, keep the manifest in sync — `scripts/sync-all-manifests.ts` regenerates the `files[]` list, `scripts/check-bom-staleness.ts` checks pinned versions, and `scripts/check-pack-parity.ts` enforces feature parity across packs (with `scripts/parity-exceptions.json` for sanctioned gaps). `npm run templates:maintain` runs all of these.

### Validation matrix (`shared/validationMatrix.ts`)

The single source of truth for which combinations are valid (testing types → frameworks → languages → runners → build tools → CI/CD → reporting → patterns, plus framework+language-specific refinements and cloud device farms). Both the client wizard and the server use this to validate and to drive dropdown options. It is **kept aligned with the actual pack inventory on disk** — changing available stacks means editing both the packs and this matrix.

### Server (`server/`)

Express app (`server/index.ts`) with environment-split security: helmet CSP and CORS are permissive in development, strict in production. CSP upgrades apply to secure requests, including trusted HTTPS proxy traffic. CORS is scoped to `/api` only (top-level SPA navigations carry no Origin and must not be blocked); originless requests proceed without CORS response headers so same-origin GETs and readiness probes work. The `X-QAStarter-Client` header identifies CLI/MCP clients for analytics and rate-limit classification. Routes are modular under `server/routes/` (health, analytics, config, project, dependency, github), registered in `server/routes.ts`, all under `/api/v1/` — `server/middleware/apiVersionRedirect.ts` rewrites legacy unversioned paths. Centralized error handling in `server/errors.ts` (`ErrorCode` enum, `errorHandler`, `notFoundHandler`). Correlation IDs added early via `server/middleware/correlationMiddleware.ts`. Swagger docs served via `server/swagger.ts`. Logging is Winston-based (`server/utils/logger.ts`).

### Client (`client/`)

Vite + React 18 + TypeScript SPA. Routing via **wouter** (not react-router). Data fetching via TanStack Query. UI is shadcn/Radix + Tailwind (`components.json`, `tailwind.config.ts`). The generation wizard lives in `client/src/pages/` (`Home.tsx`, `ExpressGenerator.tsx`). In dev, Vite is mounted onto the Express server (`server/vite.ts`); in prod the server serves the static build.

### CLI + MCP (`cli/`)

Standalone npm package `@qatonic_innovations/qastarter-cli`. `cli/src/commands/` holds CLI commands, `cli/src/lib/api.ts` calls the QAStarter HTTP API (overridable via `QASTARTER_API_URL`), and `cli/src/mcp/server.ts` is a Model Context Protocol server (JSON-RPC over stdio) exposing tools like `list_combinations`, `validate_combination`, `preview_project`, and `generate_project`. The MCP `generate_project` has zip-slip guards and refuses absolute/non-empty target dirs unless explicitly forced.

### Caching (`server/services/cache/`)

A cache abstraction with a Redis provider (`redisCacheProvider.ts`) and in-memory fallback. Rate limiting (`express-rate-limit`) uses the Redis store when healthy, otherwise an in-memory store. Set `DISABLE_CACHE=true` for dev hot-reload of templates.

## Path aliases

`@shared/*` → `shared/` (configured in `tsconfig.json`, `vite.config.ts`, and both vitest configs). `@/*` → `client/src/`. The `shared/` directory is imported by server, client, and CLI — keep it framework-agnostic.

## Conventions

- ESM throughout (`"type": "module"`); use `.ts`/`.tsx`, `import.meta.url` for `__dirname`.
- Pre-commit hooks run via husky (`.husky/`). Node ≥18, npm ≥9.
- API responses follow `{ success, error: { code, message, timestamp } }` on failure — reuse `ErrorCode` from `server/errors.ts`.
