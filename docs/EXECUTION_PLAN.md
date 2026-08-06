# GovLens AI — Execution Plan (from here forward)

This is the step-by-step plan from where the project stands today. Read `PROJECT_BRIEF.md` and `PROGRESS_REPORT.md` first.

## How we're collaborating

No fixed process yet, and that's intentional — get familiar with the codebase and build first, in whatever local setup works for you. Once there's real work to look at, we'll figure out together how it gets into the repo.

## Rough timeline (so this doesn't run forever)

These are estimates, not commitments — real numbers depend on how fast the partner picks up TypeScript and how quickly the manual outreach (Track B below) produces real signal. Assumes today is early August, partner is close to full-time until **Aug 17**, then reduced/part-time once university starts.

| Phase | Estimate | Notes |
|---|---|---|
| Milestone 1 remaining (Tasks 3–6) | **~1 week** | Small, bounded, no design ambiguity. Realistic to finish inside the partner's intensive window, with buffer before Aug 17. |
| Milestone 2 (AI summarization) | **~1–1.5 weeks** | Starts right after Milestone 1. May straddle the Aug 17 pace-change. |
| Milestone 3 (matching + dashboard + capability statements) | **~3–5 weeks** | The biggest chunk — real UI, PDF export, matching logic. This is also gated on real feedback from the manual pilot (Track B) — if outreach is slow to produce signal, this milestone should wait rather than guess, per the project's own stated philosophy. |
| Milestone 4 (billing + email digest) | **~1.5–2.5 weeks** | Founder reviews this one most carefully personally — it's the money-touching milestone. |

**Rough total: 8–12 weeks (2–3 months) from now to a complete MVP**, assuming Milestone 3 isn't stalled waiting on pilot feedback. That's the single biggest variable — a founder-side commitment to actually running Track B outreach starting now (not after Milestone 1 finishes) is what keeps this estimate realistic instead of optimistic. If outreach stalls, Milestone 3 stalls with it — worth deciding now whether to build Milestone 3 on assumptions instead if the timeline pressure is high enough to accept that tradeoff.

## Two parallel tracks from here

This project has two workstreams running side by side, not one sequential list. Don't treat the manual outreach track as blocking the technical one, or vice versa.

**Track A — technical build (this repo).** Milestone 1 tasks 3–6, then Milestones 2–4. Detailed below.

**Track B — manual concierge pilot outreach (not started yet).** Both founders, in parallel with the technical build:
1. Find a handful of real small business owners who are SAM.gov-registered (or eligible) and would want this — via LinkedIn, PTAC referrals, or govcon communities (r/govcon, GovCon Chamber-type groups).
2. For each one, manually search SAM.gov for matching opportunities and manually ask Claude (a normal chat, no app needed) to summarize the top matches in plain English. Send it as a weekly email or spreadsheet.
3. Charge a small monthly fee for this — real money changing hands is the actual signal, not just people saying it's a good idea.
4. If and when this gets real customers, their feedback shapes Milestone 2+ decisions (summary format, matching priorities, capability statement structure) before those get built — this is *why* Milestone 1 is scoped to infrastructure only.

Track B has no dependency on Track A being finished — outreach can start any time, and should start **now**, in parallel with Milestone 1, not after it. Track A's Milestone 2+ work, though, should wait on real signal from Track B rather than guessing. See `OUTREACH_PLAN.md` for the actual outreach timing research, lead-sourcing approach, and how this splits between the founder and the partner.

## Immediate next step on the technical track

**Finish verifying Task 2 end-to-end.** This is small but it's the current blocker:
1. Figure out what's running on port 3000 on the dev machine and resolve it (stop it if it's not needed, or run the dev server on another port and add that as a second redirect URL in the Supabase dashboard under Authentication → URL Configuration).
2. Start the dev server (`pnpm --filter @govlens/web dev`), go to `/login`, request a magic link with a real email address, click the link from your inbox, confirm you land on `/dashboard`, then confirm sign-out actually logs you out (visiting `/dashboard` again should redirect back to `/login`).
3. Once that works, Task 2 is fully closed out — no code changes expected, just confirmation.

## Milestone 1 — remaining tasks, in order

Each task follows the locked process: spec/design → plan lock → implement → adversarial review → commit + push → report back → wait for go-ahead before the next task. Don't skip ahead.

### Task 3 — Database schema (`users`, `opportunities`)
- Add two Prisma models to `packages/db/prisma/schema.prisma`:
  - `users` — id, email, created_at, naics_codes (array or join table), set_aside_status, keywords.
  - `opportunities` — id, notice_id (unique, from SAM.gov), title, naics_code, set_aside, deadline, raw_description, posted_date, created_at.
- **Explicitly do not** create `opportunity_summaries`, `user_matches`, `capability_statements`, or any billing tables yet — those belong to later milestones. Building them now would be exactly the kind of ahead-of-schedule work this project deliberately avoids.
- This is a good task for someone new to the stack: bounded, low-ambiguity, and it's the natural next step after Task 2's Prisma connection work.

### Task 4 — SAM.gov API client
- Build out `packages/sam-gov-client` (currently an empty placeholder) into a real, typed client wrapping the SAM.gov Contract Opportunities API.
- Needs: NAICS-code filtering, pagination, and retry/backoff on rate limits.
- Requires a free SAM.gov API key (register at https://sam.gov/data-services) if one hasn't been obtained yet.
- Definition of done includes an actual test script that fetches a real page of opportunities for one NAICS code (e.g. 541512) and logs the results — proving the integration works against the real API, not just against mocks.
- **This is a strong candidate for the new partner's first real task** — self-contained, has a clear success criterion, and doesn't require deep familiarity with the rest of the codebase yet.

### Task 5 — Nightly ingestion job
- Build `apps/worker`'s ingestion script: reads tracked NAICS codes, calls the SAM.gov client (Task 4) for each, dedupes against existing `notice_id`s, inserts new rows.
- No AI summarization yet — that's Milestone 2.
- Runs manually for now (`npm run ingest` or equivalent) — don't set up the actual cron/scheduler deployment (Railway/Fly.io) until the core logic is proven locally.
- Depends on Task 3 (schema) and Task 4 (SAM.gov client) both being done first.

### Task 6 — Basic README
- One paragraph on what the project is, how to run it locally, current status.
- Quick to do, but genuinely useful once there's more than one person touching this repo.

**Milestone 1 is "done" when:** the ingestion job pulls real opportunities from SAM.gov for at least one NAICS code, stores them with no duplicates on a second run, and auth works end-to-end (already true, pending the manual click-through above) — all pushed to `main` in small, reviewable commits.

## After Milestone 1 (do not start early — flagged here only so you know the shape of what's coming)

- **Milestone 2 — AI summarization.** Build out `packages/claude-client` (currently a placeholder) to call the Claude API and turn each raw opportunity into a structured summary (deadline, scope, eligibility, plain-English explanation). Hard cost-control rule: summarize each opportunity **once**, store it, reuse across every user who matches it — never call Claude per-user for the same opportunity.
- **Milestone 3 — Matching + dashboard + capability statements.** The actual product UI: a matching engine that joins user filters against summarized opportunities, the real dashboard (replacing today's placeholder), the Kanban tracker, and the AI-drafted capability statement generator (editable, PDF export).
- **Milestone 4 — Billing + email digest.** Paddle integration (`packages/paddle-client`, currently a placeholder) — checkout, webhooks, plan-based feature gating — plus the Resend-powered daily/weekly digest. This is explicitly the milestone to review most carefully before shipping, since it's the one touching money and the founder's hard "no Stripe, no interest-based logic" constraints.

Why this order: Milestone 1 is pure infrastructure that doesn't depend on customer feedback. Milestones 2–4 shape customer-facing behavior (what a summary looks like, what the matching logic prioritizes, what the capability statement template looks like) — and the plan is to wait for real feedback from a manual concierge pilot (not started yet — see `PROJECT_BRIEF.md`) before locking those decisions in, so building them early risks throwing away work once real feedback arrives. Manual outreach to actually get that pilot running is planned parallel work, not a prerequisite that blocks Milestone 1 — it just needs to happen before Milestone 2+ decisions get locked in.

## A note on pace

This project runs on a "one task, then check in" rhythm, not "build everything and report at the end." Each task gets its own commit(s), its own report back to the founder in plain language, and a pause before the next one starts. That's intentional — it's what keeps a solo founder (plus now one part-time contributor) able to actually track what's happening in the project without reading a giant diff every few weeks.
