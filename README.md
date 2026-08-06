# GovLens AI

GovLens AI matches US small businesses to federal contract opportunities from SAM.gov, summarizes dense solicitations in plain English using Claude, and drafts capability statements — built for small business owners (1–50 employees) who want federal contract work but have no dedicated proposal team. Full details in [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md).

## Status

**Milestone 1 (foundation), Tasks 1–2 of 6 done.** Repo scaffold and Supabase auth + Prisma connection are built and verified end-to-end (real magic-link sign-in tested against a live Supabase project). Tasks 3–6 (database schema, SAM.gov client, nightly ingestion, this README) are next. Full current status: [`docs/PROGRESS_REPORT.md`](docs/PROGRESS_REPORT.md). What's next and roughly when: [`docs/EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md).

## Running locally

**Prerequisites:** Node.js ≥22, [pnpm](https://pnpm.io) (`npm install -g pnpm`).

```bash
git clone https://github.com/AbdullahTariq74/GovLens-AI.git
cd GovLens-AI
pnpm install
```

**Environment variables:** copy `.env.example` to `apps/web/.env.local` (for the web app) and `packages/db/.env` (for Prisma) and fill in real values. Never commit either file — both are gitignored. Depending on what you're working on, you may not need all the values:
- Working on `packages/sam-gov-client` or `apps/worker`? You'll need a free SAM.gov API key from [sam.gov/data-services](https://sam.gov/data-services) — no Supabase credentials required.
- Working on auth, the database schema, or anything in `apps/web` that touches Supabase/Prisma? You'll need the Supabase project credentials — ask the founder for these rather than creating your own separate project, so everyone's working against the same data.

**Run the dev server:**
```bash
pnpm --filter @govlens/web dev
```
Then visit `http://localhost:3000`.

**Run tests:**
```bash
pnpm --filter @govlens/web run test
pnpm --filter @govlens/db run test
```

## Repo structure

```
apps/
  web/      Next.js (App Router, TypeScript) — dashboard, onboarding, auth, billing UI
  worker/   Plain Node/TypeScript — nightly SAM.gov ingestion + summarization cron job
packages/
  db/               Prisma schema + client (Supabase Postgres)
  claude-client/    Claude API wrapper (Milestone 2+, placeholder for now)
  sam-gov-client/   SAM.gov API client (Task 4, in progress)
  paddle-client/    Paddle checkout + webhooks (Milestone 4, placeholder for now)
docs/       Project brief, progress report, execution plan, outreach plan
specs/      Product brief and milestone specs (source of truth for scope)
```

## Before you start working

Read `CLAUDE.md` in full — it defines the hard constraints (billing provider, no interest-based logic, no scraping) and the current milestone boundary (what not to build yet, even if it seems like the natural next step). Then `specs/01-milestone-1-scope.md` for the exact task list this milestone covers.
