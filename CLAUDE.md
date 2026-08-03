# CLAUDE.md — GovLens AI

This file is read automatically by Claude Code at the start of every session in this repo. It is the single source of truth for scope, constraints, and workflow. If anything in a conversation seems to conflict with this file, this file wins — ask the founder before proceeding.

## Repository
https://github.com/AbdullahTariq74/GovLens-AI (public repo, currently empty — you are scaffolding it from scratch)

## What this product is
GovLens AI matches US small businesses to federal contract opportunities from SAM.gov, summarizes dense solicitations in plain English using Claude, and drafts capability statements. Full product brief: `specs/00-product-brief.md`.

## Founder context (hard constraints — do not violate)
- Solo founder, based in **Pakistan**. No team, no funding, budget-conscious.
- **No US LLC currently.** Billing provider is **Paddle** (Merchant of Record) — never Stripe. Payout via Payoneer or bank transfer. See `specs/02-billing-paddle.md`.
- **No interest-based ("riba") financial logic anywhere.** No "buy now pay later," no revolving credit, no compounding late fees. Failed/late payment = account pause, nothing more.
- No haram-industry integrations or dependencies.
- Budget-conscious infra: free tiers first (Supabase free tier, Vercel hobby tier), flag any new recurring cost before adding it.
- **Plan (not started yet):** run a manual concierge pilot alongside this build — hand-match a handful of real customers, charge a small monthly fee, to validate demand before the automated product replaces that manual work. No pilot customers exist yet; manual outreach to find them is planned parallel work, not a completed or currently-running activity. Once real pilot feedback exists, it will update the specs in this repo — expect specs to be revised at that point, that's intentional.

## ⚠️ CURRENT BUILD SCOPE — read this before writing any code

We are in **Milestone 1 only** right now (see `specs/01-milestone-1-scope.md` for the exact task list). This phase covers foundational, low-risk work that doesn't depend on customer feedback yet:
- Repo scaffold (folder structure, tooling, workspace config)
- Supabase project connection, auth, database schema
- SAM.gov API integration (client + nightly ingestion job, no summarization yet)

**Do NOT build any of the following until explicitly told to, even if it seems like the natural next step:**
- Claude API summarization pipeline (Milestone 2)
- Matching engine / dashboard UI (Milestone 3)
- Capability statement generator (Milestone 3)
- Paddle billing integration (Milestone 4)
- Email digest sending (Milestone 4)

This boundary exists because the founder is deliberately keeping customer-facing features unbuilt until real feedback from the manual concierge pilot shapes them — building ahead of that risks wasted work. If a task seems to require touching one of the "do not build" items, stop and ask instead of proceeding.

## Tech stack
- **Frontend/app:** Next.js (App Router), TypeScript
- **DB/Auth:** Supabase (Postgres + Auth)
- **ORM:** Prisma
- **Data source:** SAM.gov Contract Opportunities API (public, free)
- **AI:** Claude API (`claude-sonnet-5`) — for opportunity summarization and capability-statement drafting (Milestone 2+, not yet)
- **Billing:** Paddle (Milestone 4, not yet)
- **Email:** Resend (Milestone 4, not yet)
- **Hosting:** Vercel (web app) + Railway or Fly.io (nightly cron worker)

## Repository structure
```
govlens-ai/
├── CLAUDE.md
├── GIT_WORKFLOW.md
├── specs/
│   ├── 00-product-brief.md
│   ├── 01-milestone-1-scope.md
│   └── 02-billing-paddle.md          # reference only — do not implement yet
├── apps/
│   ├── web/                          # Next.js dashboard, onboarding, billing UI
│   └── worker/                       # nightly SAM.gov ingestion + summarization cron job
├── packages/
│   ├── db/                           # Prisma schema + migrations
│   ├── claude-client/                # Claude API wrapper (Milestone 2+)
│   ├── sam-gov-client/               # SAM.gov API client (build now)
│   └── paddle-client/                # Paddle checkout + webhooks (Milestone 4, not yet)
└── infra/                            # deploy configs
```

## Git workflow — read `GIT_WORKFLOW.md` in full before your first commit
Short version: commit and push in small, frequent, logical chunks — not one giant commit at the end. Every commit you make must credit yourself as co-author using the trailer format in `GIT_WORKFLOW.md`. Push after every commit unless told otherwise; don't let work sit unpushed for an entire session.

## Working process for every new feature (within the current milestone only)
1. Read the relevant file in `specs/`.
2. Use GStack's `/office-hours` to pressure-test the feature and produce a short written spec (edge cases, out-of-scope items) before writing code — for anything more than a trivial config change.
3. Use `/plan-eng-review` to lock the implementation approach.
4. Implement against the locked spec.
5. Write or update tests for anything with real logic (SAM.gov parsing, matching, data validation). Skip heavy tests for placeholder/scaffold code.
6. Run `/review` before committing — catch bugs and scope creep.
7. Commit + push per `GIT_WORKFLOW.md`.
8. Summarize what changed in plain language for the founder.

## Cost-control rules (enforce in code, not just docs)
- Once summarization exists (Milestone 2+): summarize each SAM.gov opportunity **once**, store it, reuse across all matching users — never call the Claude API per-user for the same opportunity.
- Batch SAM.gov API calls where possible; respect its rate limits; cache aggressively.
- Log estimated API/token usage per pipeline run so cost is visible early.

## What NOT to do (always, not just this phase)
- Do not add Stripe as a billing dependency.
- Do not add any interest-bearing, credit, or "pay later" financial feature.
- Do not scrape SAM.gov — use only the official public API.
- Do not add paid infrastructure without flagging the recurring cost first.
- Do not imply or let marketing copy imply a guaranteed contract win.
- Do not build past the current milestone boundary above without being told.
