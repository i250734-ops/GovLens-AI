# GovLens AI — Progress Report

Status as of the most recent work session. This is the technical companion to `PROJECT_BRIEF.md` — read that first if you haven't.

## Where we are: Milestone 1, Task 2 of 6, mostly done

`specs/01-milestone-1-scope.md` defines Milestone 1 as six tasks. Status:

| # | Task | Status |
|---|---|---|
| 1 | Repo scaffold (monorepo, workspace tooling) | **Done** |
| 2 | Supabase connection + auth | **Done, pending one live verification step** (see below) |
| 3 | Database schema (`users`, `opportunities` tables) | Not started |
| 4 | SAM.gov API client | Not started |
| 5 | Nightly ingestion job | Not started |
| 6 | Basic README | Not started |

## Task 1 — Repo scaffold (done)

- pnpm workspace monorepo: `apps/web` (real Next.js 16 App Router + TypeScript project), `apps/worker` (plain Node/TypeScript project, no framework — will run as a scheduled script), and four shared packages: `packages/db`, `packages/claude-client`, `packages/sam-gov-client`, `packages/paddle-client`.
- `packages/claude-client`, `packages/sam-gov-client`, `packages/paddle-client` are still empty placeholders — they get real implementations in later tasks/milestones (`sam-gov-client` in Task 4; `claude-client` in Milestone 2; `paddle-client` in Milestone 4).
- Root `.gitignore`, `.env.example` in place.

## Task 2 — Supabase connection + auth (functionally done, one manual step left)

**What's built:**
- **Auth flow**, fully hand-built (no third-party auth UI library, per a deliberate cost/maintenance tradeoff): a magic-link login page (`apps/web/app/login`), a callback route that exchanges the magic-link code for a session (`apps/web/app/auth/callback`), a sign-out route, and a placeholder `/dashboard` page.
- **Route protection** via `apps/web/proxy.ts` — Next.js 16 renamed "middleware" to "proxy"; this is the current-generation convention, not a typo — plus a second, independent auth check directly on the dashboard page itself (defense-in-depth, in case the proxy layer is ever bypassed).
- **Prisma connection** to Supabase Postgres in `packages/db`, using the correct two-connection-string pattern Supabase/Prisma requires: a pooled connection (`DATABASE_URL`, used at runtime) and a direct connection (`DIRECT_URL`, used only by Prisma's migration engine, which can't work through the pooler). A `check-connection` diagnostic script proves both actually work.
- **A real Supabase project now exists and is connected.** Project ref `hsuvaowtumchiubbsrzs`, region `us-west-1`. Both `DATABASE_URL` and `DIRECT_URL` have been verified working (`pnpm --filter @govlens/db run check-connection` → `DATABASE_URL: OK`, `DIRECT_URL: OK`). Credentials live in `apps/web/.env.local` and `packages/db/.env` — **never committed**, both confirmed gitignored.
- **18 automated tests** (Vitest) covering the auth flow's branching logic: successful sign-in, failed/expired links, the "email scanner prefetches the link before the user clicks it" edge case, sign-out, middleware pass-through vs. redirect, and the Prisma connectivity check's pass/fail paths.
- Everything typechecks cleanly and `next build` succeeds.

**What's NOT done yet — the one remaining manual step:**
The milestone's own definition of done for this task is *"a user can sign up/log in end-to-end."* That requires an actual browser click-through against the live Supabase project — something an AI agent can drive up to a point (the app, the API calls), but not all the way (clicking a real link inside a real email inbox requires a human, or email API access we haven't set up). This was in progress when the session paused:
- A stray, unrelated process was found occupying port 3000 (been running since well before this session — likely orphaned from something else on this machine, not related to GovLens AI). This needs to be resolved (killed, if it's not needed, or the dev server run on a different port with a matching Supabase redirect URL added) before the live click-through can happen.
- Once that's resolved: start the dev server, go to `/login`, request a magic link, check the inbox tied to the email you test with, click the link, confirm you land on `/dashboard` and can sign out.

This is a small, mechanical thing to finish — not a design or architecture gap.

## How the work has been done (process, for context)

Every task in this repo goes through a locked workflow (see `GIT_WORKFLOW.md` and `CLAUDE.md`):
1. **Spec/design pass** before writing code (adversarial review — Task 2's design doc survived 3 rounds, catching 21 real issues before implementation started, including an architecture mistake that would have broken the worker app later).
2. **Plan lock** — architecture decisions get reviewed and explicitly approved before implementation (Task 2's plan review caught 3 more issues, including a real Prisma misconception).
3. **Implementation.**
4. **Adversarial code review** before every commit — 5 parallel review specialists (testing, maintainability, security, performance, API-contract) plus an adversarial "how would this break in production" pass. Task 2's review caught and fixed a real bug that would have 405'd the sign-out flow, plus missing error handling that would have taken down login during any Supabase outage.
5. **Commit + push**, one logical unit at a time, every commit crediting Claude as co-author (you'll see this convention in the git log — it's intentional, not a mistake).

Two commits are pushed so far:
```
db342d5 Add Supabase magic-link auth and Prisma connection setup
5a1fe8e Fix pnpm-workspace.yaml to use valid onlyBuiltDependencies syntax
8c036f4 Scaffold monorepo structure for web and worker apps
```

## Known open items (tracked in `TODOS.md`)

- **E2E test automation** (Playwright) for the full magic-link flow — deliberately deferred. Unit tests cover the logic; a full browser-driven test needs a test-email-inbox strategy that's worth setting up once more of the app exists, not right now.

## A note on tooling you'll see in this repo

This project uses a third-party Claude Code skill pack called **gstack** (installed globally on this machine, not something you need to set up per-project) for the spec → plan → review discipline described above. It is not an Anthropic product — treat anything it produces the same way you'd treat any AI output: reviewed, not rubber-stamped. You don't need to understand its internals to work in this repo; just know that `/office-hours`, `/plan-eng-review`, and `/review` are the names of the workflow stages if you see them referenced in commit messages or docs.

## What's genuinely solid vs. what's genuinely unverified

**Solid, verified:**
- Repo builds, typechecks, and all 18 tests pass.
- Database connectivity is proven against the real, live Supabase project.
- Code has been through a real adversarial review process, not just written and shipped.

**Unverified:**
- Nobody has actually clicked a real magic link and landed on the dashboard yet. The code is designed correctly and unit-tested, but "designed correctly" and "actually works when a human tries it" are different claims until that click-through happens.
