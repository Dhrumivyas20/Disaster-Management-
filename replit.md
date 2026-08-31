# PixelAlchemy Risk Dashboard

A full-stack disaster-management decision dashboard for assessing village hazard exposure, relocation priority, and capacity-verified candidate sites across Rudraprayag and Chamoli, Uttarakhand.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/pixelalchemy-dashboard run dev` — run the Vite dashboard
- Required env: `DATABASE_URL` — managed Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter, TanStack React Query, Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/pixelalchemy-dashboard/` — responsive dashboard UI and routes
- `artifacts/api-server/src/lib/pixelalchemy.ts` — weighted hazard, priority, and AHP suitability logic
- `artifacts/api-server/src/lib/seed.ts` — first-run CSV seed for the demo dataset
- `lib/db/src/schema/pixelalchemy.ts` — source of truth for persisted villages, facilities, and candidate sites
- `lib/api-spec/openapi.yaml` — source of truth for API contracts and generated client hooks
- `data/` — curated demo CSV inputs for villages, facilities, and candidate sites

## Architecture decisions

- The prototype uses an auditable weighted risk index and AHP suitability score instead of ML training or live GIS feeds.
- The three supplied CSVs are seeded into managed PostgreSQL on first API startup; the API computes derived scores from persisted records.
- The frontend uses generated OpenAPI hooks so screens consume the same typed contract implemented by the API.
- Map rendering is a lightweight coordinate-based risk layer suitable for the curated pilot region, not a polygon/GIS pipeline.
- The map provider is isolated in `src/lib/map-provider.ts`; the keyless sample layer stays active until both a custom API URL and tile URL template are configured.

## Product

- Live regional overview with exposure totals, risk-zone markers, and priority action queue
- Searchable and filterable village register with explainable scores
- Village detail records with nearby critical facilities
- Relocation handoff with ranked candidate sites, carrying-capacity status, and criterion breakdowns
- Risk map, hazard analysis, population exposure, relocation priority, safe-site discovery, site comparison, and print-ready reports
- Critical facilities reference list for hospitals, schools, and water sources

## User preferences

- User requested a complete working full-stack prototype and preferred React + Vite for the frontend.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Run the database push after changing `lib/db/src/schema/`.
- The API seeds from the workspace-root `data/` directory while its workflow runs with the API package as the working directory.
- To replace the map layer, set `VITE_MAP_API_URL`, `VITE_MAP_TILE_URL_TEMPLATE`, and optionally `VITE_MAP_API_KEY`, or replace the adapter in `artifacts/pixelalchemy-dashboard/src/lib/map-provider.ts`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
