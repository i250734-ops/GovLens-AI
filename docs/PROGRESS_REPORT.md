# GovLens AI — Progress Report

Status as of the most recent work session. This is the technical companion to `PROJECT_BRIEF.md` — read that first if you haven't.

## Where we are: Milestone 1, Tasks 1, 2, and 6 of 6 done

`specs/01-milestone-1-scope.md` defines Milestone 1 as six tasks. Status:

| # | Task | Status |
|---|---|---|
| 1 | Repo scaffold (monorepo, workspace tooling) | **Done** |
| 2 | Supabase connection + auth | **Done — verified end-to-end with a real sign-in** |
| 3 | Database schema (`users`, `opportunities` tables) | Not started — **this is the next task** |
| 4 | SAM.gov API client | Not started — likely the new partner's first task |
| 5 | Nightly ingestion job | Not started |
| 6 | Basic README | **Done** — see `README.md` at repo root |

## Task 1 — Repo scaffold (done)

- pnpm workspace monorepo: `apps/web` (real Next.js 16 App Router + TypeScript project), `apps/worker` (plain Node/TypeScript project, no framework — will run as a scheduled script), and four shared packages: `packages/db`, `packages/claude-client`, `packages/sam-gov-client`, `packages/paddle-client`.
- `packages/claude-client`, `packages/sam-gov-client`, `packages/paddle-client` are still empty placeholders — they get real implementations in later tasks/milestones (`sam-gov-client` in Task 4; `claude-client` in Milestone 2; `paddle-client` in Milestone 4).
- Root `.gitignore`, `.env.example` in place.

## Task 2 — Supabase connection + auth (fully done, verified live)

**What's built:**
- **Auth flow**, fully hand-built (no third-party auth UI library, per a deliberate cost/maintenance tradeoff): a magic-link login page (`apps/web/app/login`), a callback route that exchanges the magic-link code for a session (`apps/web/app/auth/callback`), a sign-out route, and a placeholder `/dashboard` page.
- **Route protection** via `apps/web/proxy.ts` — Next.js 16 renamed "middleware" to "proxy"; this is the current-generation convention, not a typo — plus a second, independent auth check directly on the dashboard page itself (defense-in-depth, in case the proxy layer is ever bypassed).
- **Prisma connection** to Supabase Postgres in `packages/db`, using the correct two-connection-string pattern Supabase/Prisma requires: a pooled connection (`DATABASE_URL`, used at runtime) and a direct connection (`DIRECT_URL`, used only by Prisma's migration engine, which can't work through the pooler). A `check-connection` diagnostic script proves both actually work.
- **A real Supabase project exists and is connected.** Project ref `hsuvaowtumchiubbsrzs`, region `us-west-1`. Both `DATABASE_URL` and `DIRECT_URL` verified working. Credentials live in `apps/web/.env.local` and `packages/db/.env` — **never committed**, both confirmed gitignored.
- **15 automated tests** (Vitest) covering the auth flow's branching logic: successful sign-in, failed/expired links, the "email scanner prefetches the link before the user clicks it" edge case, sign-out, middleware pass-through vs. redirect, and the Prisma connectivity check's pass/fail paths.
- Everything typechecks cleanly and `next build` succeeds.

**Live end-to-end verification: done.** A real magic-link sign-in was completed against the live Supabase project — request link → click link in a real inbox → land on `/dashboard` → sign out → confirm `/dashboard` redirects back to `/login` when signed out. This is the milestone's actual definition of done for this task, and it's now met, not just unit-tested.

**A real bug was caught and fixed during this live test** — worth knowing about since it's a subtle Next.js-specific issue, not something a unit test could ever catch: the browser-side Supabase client (`apps/web/lib/supabase/client.ts`) was reading its Supabase URL/key through a shared helper that does `process.env[name]` — a *dynamic* lookup. Next.js only inlines `NEXT_PUBLIC_*` environment variables into the browser bundle when it sees the *static* literal expression `process.env.NEXT_PUBLIC_X` at build time; a dynamic bracket-notation lookup is left as-is and evaluates against an empty `process.env` in the browser at runtime. This silently broke sign-in with a "missing environment variable" error even though `.env.local` was completely correct — the server-side clients (`server.ts`, `middleware-client.ts`) were unaffected since Node/Edge runtime has real env vars at runtime, not just build-time-inlined literals. Fixed by reading those two vars as static literal expressions directly in `client.ts`. This is exactly the kind of environment-specific bug that only shows up when you actually run the thing in a real browser — a good concrete example of why "unit tests pass" and "verified working" are different claims.

## How the work has been done (process, for context)

Every task in this repo goes through a locked workflow (see `GIT_WORKFLOW.md` and `CLAUDE.md`):
1. **Spec/design pass** before writing code (adversarial review — Task 2's design doc survived 3 rounds, catching 21 real issues before implementation started, including an architecture mistake that would have broken the worker app later).
2. **Plan lock** — architecture decisions get reviewed and explicitly approved before implementation (Task 2's plan review caught 3 more issues, including a real Prisma misconception).
3. **Implementation.**
4. **Adversarial code review** before every commit — 5 parallel review specialists (testing, maintainability, security, performance, API-contract) plus an adversarial "how would this break in production" pass. Task 2's review caught and fixed a real bug that would have 405'd the sign-out flow, plus missing error handling that would have taken down login during any Supabase outage.
5. **Commit + push**, one logical unit at a time, every commit crediting Claude as co-author (you'll see this convention in the git log — it's intentional, not a mistake).

Commits pushed so far (newest first):
```
c8970ab Fix browser Supabase client silently failing on env vars
acb87b0 Remove premature git process for the partner, drop internal rationale
e688865 Switch to fork-based collaboration model, fix pronouns, expand outreach research
873f47f Add two-person git workflow, timeline estimates, and outreach plan
40d9c79 Correct concierge pilot status from active to planned
82edc97 Add project brief, progress report, and execution plan docs
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
- Repo builds, typechecks, and all 15 tests pass.
- Database connectivity is proven against the real, live Supabase project.
- Code has been through a real adversarial review process, not just written and shipped.
- **A real human has signed in via a real magic link, reached the dashboard, signed out, and confirmed the redirect-when-signed-out behavior works.** Auth is genuinely done, not just unit-tested.

**Still unverified (nothing blocking — just hasn't happened yet):**
- No automated end-to-end (Playwright) coverage of the login flow yet — see `TODOS.md`, deliberately deferred.
- Milestone 1 Tasks 3–6 haven't started, so there's no real data flowing through the system yet (no schema, no SAM.gov client, no ingestion job).
