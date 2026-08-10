# Task 5 Review — Feedback and Fix Plan

Great progress — I re-checked everything and ran it for real. Tasks 3 and 4 are correct now: schema fields, NAICS filtering, pagination, retry logic, and the test script all work exactly as intended, verified against the live SAM.gov API. Task 5 (the ingestion job) is well-built too — the dedup logic, pagination loop, and NAICS lookup are all solid. There's just one real bug that stops it from running out of the box, plus two small items to close out. Here's each one, why it matters, and how to fix it.

---

## Fix A — Ingestion script can't find its own env file (blocking)

**What happened:** In `apps/worker/package.json`, the `ingest` script is:
```json
"ingest": "tsx --env-file=../../.env src/ingest.ts"
```
That `../../.env` points at a file in the repo's root folder. I tested this directly — it fails immediately with `node: ../../.env: not found`.

**Why it matters:** Every other package in this repo keeps its environment variables in its *own* folder — for example, `packages/db` reads from `packages/db/.env`. `apps/worker` should follow the same pattern and read from `apps/worker/.env`. As written, the script looks for a file that isn't supposed to exist anywhere, so anyone setting this up fresh (including you, later) will hit this error immediately.

**How to fix:**
1. Change the script in `apps/worker/package.json` to point at its own folder:
   ```json
   "ingest": "tsx --env-file=.env src/ingest.ts"
   ```
2. Copy `.env.example` (repo root) into `apps/worker/.env` and fill in real values for `SAM_GOV_API_KEY` and `DATABASE_URL` (same values you're already using elsewhere).
3. Confirm it runs: `pnpm --filter @govlens/worker run ingest`

---

## Fix B — Heads-up on the `description` field (not blocking, just good to know now)

**What happened:** I checked a real API response, and SAM.gov's `description` field isn't the actual solicitation text — it's a link to a separate endpoint that returns the text:
```json
"description": "https://api.sam.gov/prod/opportunities/v1/noticedesc?noticeid=..."
```
Your code stores this link directly into the `description` column.

**Why it matters:** This is fine for Task 5 as it stands — nothing in Milestone 1 needs the real text yet. But it's worth knowing now, before Milestone 2 (AI summarization) starts, since that step will need the actual solicitation text, not a link. No action needed from you right now — just flagging it so it doesn't surprise anyone later. If you want to fix it now anyway: it would mean adding a second `fetch` call to that link's URL for each opportunity, which is real extra work — better to hold off until Milestone 2 actually needs it.

---

## Fix C — Add the missing test script to the SAM.gov client (quick, from Task 4)

**What happened:** You added `vitest` and wrote three real tests for `packages/sam-gov-client` — good tests, and they pass. But `package.json` never got a `"test"` script added, so running `pnpm --filter @govlens/sam-gov-client run test` (the way every other package's tests get run in this project) currently does nothing.

**Why it matters:** The tests are correct, they're just not wired up the same way as the rest of the project, so they'd silently get skipped by anyone (including future-you) running tests the normal way.

**How to fix:** Add this to `packages/sam-gov-client/package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:live": "tsx src/test-live.ts"
}
```

---

## Fix D — Finish cleaning up `pnpm-workspace.yaml` (quick, from Task 3/4 housekeeping)

**What happened:** Last round asked to remove the `allowBuilds` block entirely. Instead, the placeholder text got replaced with `true`/`false` values:
```yaml
allowBuilds:
  '@prisma/client': true
  '@prisma/engines': true
  esbuild: true
  prisma: true
  sharp: true
  unrs-resolver: true
```

**Why it matters:** `allowBuilds` isn't a real pnpm setting — pnpm only understands `onlyBuiltDependencies` and `neverBuiltDependencies` (both already correctly set above it in the same file). Worse, this block now says `unrs-resolver: true` while the line right above it (`neverBuiltDependencies: [unrs-resolver]`) says the opposite — a direct contradiction in the same file.

**How to fix:** Delete the entire `allowBuilds:` block (all 7 lines). Leave `onlyBuiltDependencies` and `neverBuiltDependencies` exactly as they are — those two are correct and complete on their own.

---

## Suggested order

1. **Fix A first** — it's the only thing actually blocking, and it's a two-line change.
2. **Fix C and D** — quick, no dependencies on anything else.
3. **Fix B** — nothing to do right now, just keep it in mind for later.

## When you're done

Same as before — push to `patch-3`, let the founder know. Once this is confirmed, Milestone 1 is fully done and it's on to Milestone 2.
