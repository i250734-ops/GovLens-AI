# GovLens AI — Project Brief

Welcome aboard. This document explains what we're building, why it matters, who it's for, and how the pieces fit together. Read this before looking at any code.

## The problem

The US federal government awards roughly **$500 billion in contracts every year**, and by law about **23% ($115B)** of that is required to go to small businesses. SAM.gov — the government's official portal for these opportunities — posts over **24,000 new solicitations every month**.

In theory, that's a huge, legally-guaranteed market for small businesses. In practice, almost none of them can use it:

- SAM.gov itself is notoriously hard to search and filter meaningfully.
- Solicitations are long, dense, legal/technical documents — a small business owner has to read 10+ pages just to figure out if they're even eligible.
- The tools that *do* solve this well (GovWin IQ, Deltek, GovDash, Bloomberg Government) are priced for companies with dedicated capture/proposal teams — **$8,000–$20,000+ per year**. A 5-person IT services company or a solo veteran-owned consultancy can't justify that.

So the market is large, legally mandated, and almost entirely underserved at the bottom end.

## Who we're building for

US small business owners (1–50 employees) who are SAM.gov-registered or eligible, with **no dedicated business-development staff**. Especially relevant to holders of SBA certifications: 8(a), HUBZone, WOSB, SDVOSB. Think: a small IT services shop, a construction subcontractor, a light-manufacturing outfit — someone who wants federal contract work but doesn't have time to become a SAM.gov power user.

## What we actually build

GovLens AI does three things a small business owner can't easily do for themselves:

1. **Filters SAM.gov down to what's actually relevant.** The user sets up their NAICS codes, set-aside status (8(a), WOSB, etc.), and keywords once. Every night, we pull new opportunities matching their profile — they never touch SAM.gov's own clunky UI.
2. **Explains each opportunity in plain English.** Claude (Anthropic's AI) reads the dense solicitation and produces a short summary: what's the scope, what's the deadline, are they actually eligible, what's the estimated value. A bid/no-bid decision that used to take 20 minutes of reading now takes 2 minutes.
3. **Drafts a capability statement.** When a user finds a match worth pursuing, AI drafts a first-pass capability statement tailored to that specific solicitation's stated requirements — the single most common "we need this to bid" document in government contracting. The user edits and exports it as a PDF.

On top of that: a Kanban-style tracker (Watching / Pursuing / Submitted / No-bid) so users can manage their pipeline, and a daily/weekly email digest so they don't have to log in to find out something new matched.

## The value proposition, in one line

*"Stop scrolling SAM.gov. Get only the contracts you're actually eligible to win, explained in plain English, with a bid-ready capability statement drafted for you — for a fraction of what enterprise tools cost."*

## Pricing (subscription, via Paddle — see Constraints below)

| Tier | Price/mo | NAICS codes tracked | AI summaries | AI capability-statement drafts |
|---|---|---|---|---|
| Starter | $49 | 3 | 20/mo | 1/mo |
| Growth | $149 | 10 | Unlimited | 5/mo |
| Pro | $349 | Unlimited | Unlimited | Unlimited + weekly forecast digest |

10–170x cheaper than the enterprise incumbents, priced for exactly the segment they ignore.

## How we'll validate this (planned, not started yet)

Before finishing the automated product, the plan is to run a **manual concierge pilot**: find a handful of real small business owners who'd want this, and manually do the SAM.gov searching + Claude summarizing for them by hand (no app needed) in exchange for a small monthly fee. The logic: if real people won't pay for the *manual* version of this service, they won't pay for the automated one either — so this proves demand before the software fully exists, instead of after.

**This has not started yet.** There are no pilot customers today, and no manual-outreach revenue yet. Finding these first customers — manual outreach via LinkedIn, PTAC referrals, govcon communities — is planned work both of us will do in parallel with the technical build, not something already running. Once real pilot customers exist, their feedback will shape the specs in this repo. **Expect specs to change once that happens** — that's intentional, not scope creep.

## Hard constraints (these shape technical decisions — don't design around them by accident)

- **Solo founder, based in Pakistan.** No team (until now), no outside funding, budget-conscious by necessity.
- **No US LLC.** This is why billing goes through **Paddle**, not Stripe — Stripe doesn't support Pakistan-based sellers directly. Paddle is a "Merchant of Record": it's legally the seller on every transaction, so no US entity is required.
- **No interest-based ("riba") financial logic, anywhere.** No buy-now-pay-later, no revolving credit, no compounding late fees. A failed payment pauses the account — nothing more punitive than that.
- **No haram-industry integrations or dependencies.**
- **Budget-conscious infrastructure.** Free tiers first (Supabase free tier, Vercel hobby tier). Any new recurring cost gets flagged before it's added.
- **No scraping, ever.** SAM.gov has a free, official public API for exactly this data. We only use that.
- **Marketing must never imply a guaranteed contract win.** This is a research/alerting/drafting tool, not a promise.

## Tech stack (accurate as of today — this is a TypeScript project, not Python)

- **Frontend/app:** Next.js (App Router), TypeScript — a single web app for the dashboard, onboarding, and billing UI.
- **Database + Auth:** Supabase (hosted Postgres + built-in authentication).
- **ORM:** Prisma (typed database access on top of Supabase's Postgres).
- **Data source:** SAM.gov Contract Opportunities API (official, free, public).
- **AI:** Claude API (Anthropic) — for opportunity summarization and capability-statement drafting.
- **Billing:** Paddle (once we get to that milestone).
- **Email:** Resend (for the digest, once we get to that milestone).
- **Hosting:** Vercel for the web app; a small worker process (Railway or Fly.io) for the nightly data-sync job.
- **Monorepo tooling:** pnpm workspaces — one repo, multiple packages (`apps/web`, `apps/worker`, and shared `packages/*` libraries).

There is currently no Python anywhere in this project. If that ever changes, it'll be a deliberate, documented decision — not an assumption.

## How the pieces connect (high level)

```
SAM.gov API  →  nightly worker  →  opportunities table (Postgres)
                                          |
                                          v
                              Claude summarizes each one ONCE
                              (shared across all matching users,
                               never re-summarized per user —
                               this is a hard cost-control rule)
                                          |
                                          v
                          matched against each user's saved filters
                                          |
                                          v
                    dashboard (Next.js) + daily/weekly email digest
```

## The build is happening in milestones, on purpose

We are **not** building this all at once. The founder deliberately ordered the work so that low-risk infrastructure gets built first, and anything that depends on real customer feedback (from the manual pilot) waits until that feedback exists:

- **Milestone 1 — Foundation** (in progress now): repo scaffold, Supabase connection + auth, SAM.gov API client, nightly ingestion (no AI yet).
- **Milestone 2 — AI summarization:** the Claude pipeline that turns raw solicitations into plain-English summaries.
- **Milestone 3 — Matching + dashboard + capability statements:** the actual product UI a customer would see and use.
- **Milestone 4 — Billing + email digest:** Paddle integration, plan gating, Resend digest.

This matters for you specifically: **do not build ahead of the current milestone**, even if a later feature seems like the obvious next step. That's a deliberate constraint, not an oversight — building customer-facing features before the pilot feedback shapes them risks throwing away work.

## What your role looks like

You'll be picking up real Milestone 1 tasks — things like the SAM.gov API client and the nightly ingestion job. These are genuinely useful, bounded pieces of TypeScript/Node work, good for learning the stack by doing something that actually ships, rather than a toy exercise. A detailed progress report and step-by-step plan will follow once you've had a chance to get familiar with the problem space.

## Before you touch any code

Spend some real time understanding the pain point this solves: look at SAM.gov itself (sam.gov), read a couple of real solicitation notices, and get a feel for how confusing and time-consuming this genuinely is for someone without a proposal team. Understanding *why* this is worth building will make every technical decision downstream make a lot more sense.
