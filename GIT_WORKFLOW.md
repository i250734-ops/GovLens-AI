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

## Rule 5 — Branching (updated: two contributors now, not one — fork model, kept deliberately simple)

This rule changed as of the second contributor (the founder's new partner) joining the project. The old rule ("work directly on main, no branches") explicitly said to revisit this once there's more than one person — that point has arrived. The simplest possible version of "more than one person" is used here on purpose: **no collaborator invite, no branch protection setup, no shared write access to this repo at all.**

**Founder (working with Claude Code):** keeps committing directly to `main` with small, frequent commits, exactly as before. Nothing changes here.

**Partner:** works from her **own fork** of this repo, not from this repo directly.
1. She forks `https://github.com/AbdullahTariq74/GovLens-AI` into her own GitHub account (the repo is public, so this needs no invite or permission from the founder — just the "Fork" button on GitHub).
2. She clones her own fork and works there — commits, pushes, experiments freely on her own copy. She cannot accidentally push anything to the founder's actual repo; a fork has no write access back to the original by default.
3. When a task is ready for review, she opens a Pull Request from her fork's branch back to `AbdullahTariq74/GovLens-AI`'s `main`. GitHub handles this natively — it's the standard open-source contribution flow.
4. The founder (with Claude Code's help — ask Claude to run `/review` against her PR) reviews before merging. Nothing lands in the real repo without that review step.

**Why this model specifically:** it solves "what if her commits aren't correct" as simply as possible — she never has write access to the real repo at all, so there's nothing to protect against. No GitHub settings to configure, no collaborator management, no branch protection rules. If this ever feels limiting (e.g., she needs to work with the founder on the exact same branch in real time), revisit toward a shared-repo-with-branch-protection model then — not before.

## Rule 6 — Never commit secrets
`.env`, `.env.local`, and any file containing real API keys must never be committed. Only `.env.example` (with placeholder values) belongs in the repo. Double-check `.gitignore` covers this before the first commit.

This applies doubly now that a second person is working with this codebase — remind the partner explicitly, don't assume she'll know this convention. Since she's working from her own fork, this mostly protects her own fork's `.gitignore` discipline, but it's worth saying explicitly anyway.
