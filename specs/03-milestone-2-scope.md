# 03 — Milestone 2 Scope: AI Summarization

Milestone 1 (done) gets raw opportunities into the database. This milestone turns each raw opportunity into a short, plain-English summary — the thing that lets a small business owner decide "worth pursuing or not" in two minutes instead of twenty. Nothing here is customer-facing yet: no dashboard, no matching, no per-user anything. That's Milestone 3.

## Model & cost guidance — read this before writing any code

- **Use Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) for all development and testing.** It's roughly 3x cheaper than the model this product will eventually ship with (Haiku: $1/$5 per million input/output tokens vs. Sonnet 5: $3/$15) — plenty good enough to confirm the pipeline works and to sanity-check summary quality while building, without burning meaningful balance off the API key.
- **Never hardcode the model name.** Read it from an environment variable with a safe default, e.g.:
  ```ts
  const MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";
  ```
  This makes switching models later (e.g. to Sonnet 5 for real production summaries) a one-line config change, not a code change. Don't switch the default yourself — that's a deliberate cost/quality decision the founder makes, not something to decide mid-implementation.
- Every test run should print how many tokens were used and roughly what it cost (see Task 5 below) — this is how we keep the "don't exhaust the balance" goal visible instead of just hoping.

## Task list, in order

### 1. Fix the `description` field to hold real text
- Milestone 1's ingestion job stores whatever SAM.gov's `description` field contains — which turns out to be a *link* to a separate endpoint, not the actual solicitation text (confirmed during Task 5's review).
- Add a small function (in `packages/sam-gov-client` or a new helper) that fetches the real text from that link.
- Verify against a real opportunity first — the link uses a different base path (`/prod/opportunities/v1/noticedesc`) than the search endpoint, so confirm it needs the same `api_key` and returns plain text or JSON before assuming the shape.
- Update the ingestion flow so `Opportunity.description` stores the real fetched text going forward (existing rows can stay as-is for now — a backfill isn't required for this milestone).
- Commit: "Fetch real solicitation description text instead of storing the link"

### 2. Add the `opportunity_summaries` table
- New Prisma model, one row per opportunity (1:1), e.g.:
  ```prisma
  model OpportunitySummary {
    id                String      @id @default(uuid())
    opportunityId     String      @unique
    opportunity       Opportunity @relation(fields: [opportunityId], references: [id])
    scope             String
    deadlineSummary   String
    eligibility       String
    plainEnglish      String
    modelUsed         String
    promptTokens      Int
    completionTokens  Int
    createdAt         DateTime    @default(now())
  }
  ```
- Add the matching `summaries OpportunitySummary?` relation field on `Opportunity`.
- Generate the migration.
- **Do not** create `user_matches`, `capability_statements`, or any billing tables yet — those are Milestone 3/4.
- Commit: "Add OpportunitySummary model and migration"

### 3. Build `packages/claude-client`
- A typed wrapper around the Anthropic API, same shape as `packages/sam-gov-client`:
  - `summarizeOpportunity(opportunity): Promise<{ scope, deadlineSummary, eligibility, plainEnglish, promptTokens, completionTokens }>`
  - Fail-fast API key validation at import time (same pattern as the SAM.gov client — check `ANTHROPIC_API_KEY` is set, throw a clear error if not).
  - A fixed system prompt asking for exactly those four fields back, in a strict structured format (use Claude's tool-use / structured output feature so the response is reliably parseable — don't rely on parsing free-form text).
  - Retry with backoff on rate limits/transient errors, same pattern as the SAM.gov client's `fetchWithRetry`.
  - Model name read from `CLAUDE_MODEL` env var per the guidance above.
- Commit: "Add Claude API client for opportunity summarization"

### 4. Enforce "summarize once" in code
- Before calling Claude on any opportunity, check whether `OpportunitySummary` already has a row for it (query by `opportunityId`) — skip if it does.
- This is the cost-control rule from `CLAUDE.md`: never re-summarize the same opportunity, no matter how many users end up matching it later.
- Commit: "Skip opportunities that already have a summary"

### 5. Worker script: `apps/worker/src/summarize.ts`
- Reads all `Opportunity` rows that don't yet have a summary.
- Calls `packages/claude-client` for each, stores the result via `OpportunitySummary.create`.
- Runs manually for now via `pnpm run summarize` — same as Task 5's `ingest`, no cron/scheduler setup yet.
- After each run, log: opportunities summarized, total tokens used, and an estimated dollar cost (using the per-token prices above) — this is the visible cost-tracking `CLAUDE.md` asks for.
- Commit: "Add manual summarization worker script"

### 6. Live sanity-check script
- `packages/claude-client/src/test-live.ts` — run `summarizeOpportunity` against 2–3 real opportunities already sitting in the database and print the results.
- There's no automated pass/fail here the way Task 4 had one — summary quality needs an actual human read. The point of this script is just to confirm the real API call works end-to-end and the structured output actually parses, then eyeball whether the summaries read sensibly.
- Commit: "Add live test script for Claude summarization"

### 7. Automated tests for `packages/claude-client`
- Mock the Anthropic API call (same pattern as the SAM.gov client's tests) and cover:
  - A successful call returns correctly parsed structured data
  - A non-ok/error response is handled and throws clearly
  - Retry logic actually retries on a rate-limit response
- Add a `"test": "vitest run"` script to this package's `package.json` from the start — don't repeat the gap from Task 4.
- Commit: "Add tests for Claude client"

### 8. Env file update
- Add `ANTHROPIC_API_KEY` and `CLAUDE_MODEL` to `.env.example`, and to `apps/worker/.env` (same per-package convention established in Milestone 1 — not a shared root `.env`).

## Definition of done for Milestone 2
- `pnpm run summarize` (or equivalent) successfully generates and stores a real, structured summary for at least one opportunity using the real Claude API, with Haiku set as the model.
- Running it a second time does not re-summarize (and re-charge for) opportunities that already have a summary.
- Token usage and estimated cost are printed after each run.
- All new logic (client + skip-if-already-summarized) has passing automated tests.

## Out of scope for this milestone (do not start these)
- Matching engine (which opportunities go to which user)
- Dashboard UI
- Capability statement generator
- Paddle billing integration
- Email digest
- Switching the default model away from Haiku for real/production use — that's a founder decision made once this milestone is verified working, not part of building it
