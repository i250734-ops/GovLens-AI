# GIT_WORKFLOW.md — how to commit and push in this repo

## Why this file exists
The founder wants visible, incremental progress on GitHub — not one giant commit at the end of a session. This file defines exactly how and when to commit and push, and how to credit Claude as co-author on every commit.

## Rule 1 — Commit early, commit often
Commit after every **logical unit of work**, not after every file. A logical unit is something like:
- "scaffolded the apps/web Next.js project"
- "added Prisma schema for users and opportunities tables"
- "built the SAM.gov API client with pagination"
- "added the nightly ingestion cron job"

Do not batch multiple unrelated units into one commit, and do not wait until an entire milestone is done to make your first commit. If a work session touches 4 logical units, that should be 4 commits.

## Rule 2 — Push after every commit
Run `git push` right after every `git commit` unless the founder has explicitly said to hold off (e.g., mid-debugging on a broken branch). The remote `main` should reflect real progress throughout the session, not just at the end.

```bash
git add <files>
git commit -m "..."
git push origin main
```

## Rule 3 — Every commit must credit Claude as co-author
Use this exact trailer format in every commit message (blank line, then the trailer, at the very end of the message):

```
<short summary line, imperative mood, under 72 chars>

<optional longer description if needed>

Co-authored-by: Claude <noreply@anthropic.com>
```

Example:
```bash
git commit -m "$(cat <<'EOF'
Add SAM.gov API client with NAICS-code filtering

Implements pagination and rate-limit backoff per specs/01-milestone-1-scope.md.

Co-authored-by: Claude <noreply@anthropic.com>
EOF
)"
```

This trailer is what makes GitHub display Claude as a co-author on the commit alongside the founder's own name — it will not appear automatically unless it's included in every commit message, so don't skip it even on small commits.

## Rule 4 — Commit message format
- First line: imperative mood, under 72 characters (e.g., "Add Prisma schema for opportunities table", not "Added" or "Adding").
- Reference the milestone/spec it belongs to when relevant (e.g., "per specs/01-milestone-1-scope.md").
- Always end with the `Co-authored-by` trailer from Rule 3.

## Rule 5 — Branching (updated: two contributors now, not one)

This rule changed as of the second contributor joining the project. The old rule ("work directly on main, no branches") explicitly said to revisit this once there's more than one person — that point has arrived.

**Founder (working with Claude Code):** may continue committing directly to `main` with small, frequent commits, as before. This isn't changing — it's been working fine and the founder reviews everything Claude does in real time anyway.

**Any other contributor (the new partner, and anyone added later):** must **never** push directly to `main`. All work happens on a feature branch, opened as a Pull Request, and reviewed before merging. Specifically:

1. Branch naming: `task/<milestone-task-number>-<short-description>`, e.g. `task/4-sam-gov-client`.
2. Commit on that branch following Rules 1–4 above (same logical-unit-per-commit discipline, same co-author trailer).
3. Push the branch and open a PR against `main` when the task is ready for review — not necessarily "finished," but at a point where feedback is useful.
4. The founder (with Claude Code's help — ask Claude to run `/review` against the PR branch) reviews before merging. Don't self-merge.
5. Once approved, merge via the PR (squash or regular merge, founder's preference) — don't merge locally and push directly.

**Why this specific split:** the founder's own concern was "what if the partner's commits aren't correct and land directly in the repo" — this rule solves exactly that, without slowing down the founder's own already-working workflow.

**Enforcement (recommended, not yet configured):** GitHub branch protection on `main` — require a pull request before merging, and don't include administrators in that requirement (so the founder can still push directly per the rule above, but any other collaborator cannot). This needs to be set up once the partner is added as a GitHub collaborator; ask Claude Code to do it via `gh` once you have the partner's GitHub username.

## Rule 6 — Never commit secrets
`.env`, `.env.local`, and any file containing real API keys must never be committed. Only `.env.example` (with placeholder values) belongs in the repo. Double-check `.gitignore` covers this before the first commit.

This applies doubly now that a second person has repo access — remind the partner explicitly, don't assume he'll know this convention.
