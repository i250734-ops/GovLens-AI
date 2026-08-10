# Task 3 & 4 Review — Feedback and Fix Plan

Reviewed your `patch-3` branch (the one with both the schema and the SAM.gov client). This is genuinely a solid first attempt — the parts that work, work correctly. Here's what's good, what needs fixing, why, and exactly how to fix it.

## What's already working — real, not just "nice effort"

- The Prisma schema syntax is valid, and the migration files show you used the real `prisma migrate` workflow correctly (not just hand-editing files and hoping).
- The SAM.gov client actually works — I ran it live against the real API with your key and got real data back, 812 records. The connection, authentication, and response handling all work.
- You used an environment variable for the API key instead of hardcoding it. Correct instinct.

The fixes below are about *missing pieces the task explicitly asked for*, not about the approach being wrong.

---

## Part 1: Database schema (`packages/db/prisma/schema.prisma`)

### Fix 1.1 — Restore the direct database connection (blocking)

**What happened:** Your version removed this line from the `datasource` block:
```prisma
directUrl = env("DIRECT_URL")
```

**Why it matters:** Supabase (our database host) puts a "connection pooler" in front of the real database — think of it like a receptionist who shares a limited number of phone lines across many callers, so the database itself isn't overwhelmed by too many direct connections at once. Our app's normal code talks through that pooler (`DATABASE_URL`). But Prisma's *migration* tool — the thing that actually creates/changes tables — needs to skip the pooler and talk to the database directly (`DIRECT_URL`), because the pooler doesn't support the kind of connection migrations need. Without `directUrl`, migrations can fail or behave unpredictably.

**How to fix:** Add the line back:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Fix 1.2 — Add `naicsCode` and `setAside` to the `Opportunity` model (blocking)

**What happened:** The task spec requires these two fields on `opportunities`, and they're missing from your model.

**Why it matters:** This is the most important one. The entire product exists to match opportunities to a user's NAICS codes (their industry classification). If an opportunity in the database doesn't record its own NAICS code, there is no way — ever — to match it to anyone. This isn't a nice-to-have field, it's the core of what the product does. Same logic for `setAside` (SBA set-aside category like WOSB/HUBZone/8(a)) — that's the other half of eligibility matching.

**How to fix:** Add these two fields to your `Opportunity` model:
```prisma
model Opportunity {
  id          String    @id @default(uuid())
  samGovId    String    @unique
  title       String
  naicsCode   String
  setAside    String?
  agency      String?
  description String?
  postedDate  DateTime?
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
}
```
(`naicsCode` has no `?` — it's required, since every real SAM.gov opportunity has one. `setAside` has `?` since not every opportunity has a set-aside designation.)

After editing the schema, you need to generate a new migration so the actual database gets these new columns:
```bash
pnpm --filter @govlens/db run migrate
```
It'll ask you to name the migration — something like `add_naics_and_set_aside_to_opportunity` is fine.

### Fix 1.3 — Remove the `summaryAI` field (not blocking, but please do it)

**What happened:** You added a `summaryAI` field to `Opportunity`.

**Why it matters:** This isn't wrong code, it's a scope question. AI summarization is explicitly a *later* milestone (Milestone 2) — CLAUDE.md is specific that we don't build ahead of the current milestone, even in small ways, because the founder wants real customer feedback before deciding exactly what a summary should look like. Adding this field now is a small example of building ahead — better to add it when Milestone 2 actually starts and we know what shape it should take.

**How to fix:** Just delete that line from the model. If you already ran a migration that added this column, it's fine — a follow-up migration will just not have it anymore, no real harm done from it existing briefly.

### Fix 1.4 — Declare `dotenv` as an explicit dependency (minor)

**What happened:** `packages/db/prisma.config.ts` imports `dotenv/config`, but `dotenv` isn't listed in `packages/db/package.json`'s dependencies. It happened to work when tested, but that's likely by luck (another package in the workspace already depends on it) rather than something you can rely on.

**Why it matters:** If a package uses something, it should say so explicitly. Otherwise the code can break unpredictably later if the "lucky" indirect path disappears (e.g., if the other package stops needing `dotenv`).

**How to fix:** Add it to `packages/db/package.json`:
```json
"dependencies": {
  "dotenv": "^16.6.1"
}
```
(match whatever version shows up when you run `pnpm why dotenv` from the repo root, just to be safe.)

---

## Part 2: SAM.gov API client (`packages/sam-gov-client`)

### Fix 2.1 — Add NAICS code filtering (blocking)

**What happened:** `getOpportunities` doesn't accept or send a NAICS code filter at all — I confirmed this by actually running it, and it returned unfiltered results across every industry.

**Why it matters:** This is Task 4's single most important explicit requirement ("Must support: filtering by NAICS code"), and it's the same core reason as Fix 1.2 — without this, nobody ever gets matched to relevant opportunities.

**How to fix:**
```typescript
export async function getOpportunities(params: {
  naicsCode: string;
  postedFrom: string;
  postedTo: string;
  limit?: number;
}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", SAM_GOV_API_KEY!);
  url.searchParams.set("naicsCode", params.naicsCode);
  url.searchParams.set("postedFrom", params.postedFrom);
  url.searchParams.set("postedTo", params.postedTo);
  url.searchParams.set("limit", String(params.limit ?? 10));
  // ...rest stays the same
}
```

### Fix 2.2 — Add pagination support (blocking)

**What happened:** No way to fetch more than one page of results.

**Why it matters:** SAM.gov's real API caps how many results come back in a single request. There are 24,000+ new solicitations posted monthly across all NAICS codes — any real query needs to be able to step through multiple pages, or you'll silently miss opportunities.

**How to fix:** Add an `offset` parameter and pass it through:
```typescript
export async function getOpportunities(params: {
  naicsCode: string;
  postedFrom: string;
  postedTo: string;
  limit?: number;
  offset?: number;
}) {
  // ...
  url.searchParams.set("offset", String(params.offset ?? 0));
  // ...
}
```
The response includes `totalRecords` — the caller (eventually Task 5's ingestion job) can use that to know when to stop requesting more pages.

### Fix 2.3 — Add retry on rate limits (blocking)

**What happened:** If SAM.gov returns a rate-limit error (HTTP 429) or a server error (5xx), the code just throws immediately.

**Why it matters:** APIs get temporarily rate-limited or have brief hiccups — that's normal, expected behavior, not a real failure. Giving up immediately means a normal, recoverable blip becomes a hard failure of the whole ingestion run.

**How to fix (a simple version is fine — this doesn't need to be fancy):**
```typescript
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (response.status === 429 || response.status >= 500) {
      const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    throw new Error("SAM.gov API error: " + response.status);
  }
  throw new Error("SAM.gov API error: exceeded retry attempts");
}
```
Then call `fetchWithRetry(url.toString())` instead of `fetch(url.toString())` directly.

### Fix 2.4 — Validate the API key instead of using `!` (minor, but please match project convention)

**What happened:** `SAM_GOV_API_KEY!` — the `!` tells TypeScript "trust me, this exists," but if it's actually missing, the literal string `"undefined"` gets sent to the API instead of a clear error.

**Why it matters:** We hit this exact bug in Task 2 (the Supabase client) and fixed it by validating explicitly and failing fast with a clear message — much easier to debug than a mysterious API error later.

**How to fix,** matching the pattern already in `apps/web/lib/supabase/env.ts`:
```typescript
const SAM_GOV_API_KEY = process.env.SAM_GOV_API_KEY;
if (!SAM_GOV_API_KEY) {
  throw new Error(
    "Missing required environment variable: SAM_GOV_API_KEY. Check your .env against .env.example."
  );
}
```
(put this check near the top of the file, once — not inside the function, so it fails immediately on import rather than on first use.)

### Fix 2.5 — Write the required test/demo script (blocking)

**What happened:** Task 4's own definition of done requires "a small test script that fetches a real page of opportunities for one NAICS code (e.g. 541512) and logs the results" — this doesn't exist yet.

**Why it matters:** This is the actual proof the integration works, not just that it compiles. I had to write this myself to verify your code during review — it should exist as part of the submission.

**How to fix:** Create `packages/sam-gov-client/src/test-live.ts`:
```typescript
import { getOpportunities } from "./index";

getOpportunities({
  naicsCode: "541512",
  postedFrom: "01/01/2026",
  postedTo: "01/31/2026",
  limit: 5,
})
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error("ERROR:", err));
```
And add a script to `packages/sam-gov-client/package.json`:
```json
"scripts": {
  "test:live": "tsx src/test-live.ts"
}
```

### Fix 2.6 — Add automated tests (minor, but expected project-wide)

**Why it matters:** Every other package with real logic in this repo (auth, the connectivity checker) has Vitest tests. This package should too, per the project's own rule: real logic gets tests.

**How to fix:** Mock `fetch` and test at least: a successful response returns parsed data, a non-ok response throws, and the NAICS code actually gets included in the request URL. Ask if you want a starting example — happy to write one once the retry/pagination logic above is in place, since the tests should cover those too.

---

## Part 3: Housekeeping

### Fix 3.1 — Clean up `pnpm-workspace.yaml`

Your branch picked up a stray `allowBuilds` block with placeholder text like `esbuild: set this to true or false` — this isn't valid pnpm syntax and shouldn't be committed. Just remove that block entirely; the existing `onlyBuiltDependencies`/`neverBuiltDependencies` lines above it are correct and don't need to change.

### Fix 3.2 — Clean up extra branches

You have three branches on your fork: `patch-1`, `patch-2`, `patch-3`. Only `patch-3` has the real, complete work — the other two look like earlier drafts. Feel free to delete `patch-1` and `patch-2` so there's no confusion later about which one is current.

---

## Suggested order to tackle these

1. **Fixes 1.1, 1.2, 2.1** first — these three unblock everything else, including Task 5, which genuinely cannot be built correctly without NAICS support existing in both the schema and the SAM.gov client.
2. Then **2.2, 2.3, 2.5** — the rest of Task 4's required pieces.
3. Then the rest (1.3, 1.4, 2.4, 2.6, housekeeping) — all worth doing, none blocking.

## When you're done

Push all the fixes to the same `patch-3` branch on your fork (no need for a new branch or a new PR) — just commit and push as you go, same as before. Let the founder know when you're ready for another look; the re-review will just check these specific items, not the whole project again.
