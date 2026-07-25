# chained-chat — pickup state handoff

> Written 2026-05-26 01:15 ET by chief during consolidation of two parallel working trees.
> Read this end-to-end before working on this project in a new session.

## what this folder is

The canonical home for the **chained-chat** project. Replaces the two prior parallel working trees:
- `~/Code/projects/websites/chained-chat/` (hyphen, the active cloudflare-workers WIP — became this folder)
- `~/Code/projects/chained.chat/` (dot, the older v2 turborepo scaffold attempt — now at `./_archive/v2-scaffold-dot-clone/`)

Folder convention: kebab-case, no TLD, matches github repo name (`anipotts/chained-chat`). See `[[folder-naming-convention]]` memory.

## active state (root of this folder)

| field | value |
|---|---|
| github | `https://github.com/anipotts/chained-chat.git` |
| current branch | `migrate/cloudflare-workers` |
| upstream | `origin/migrate/cloudflare-workers`, 0 ahead / 0 behind (after 2026-05-26 sync) |
| origin/main | the real 159-commit v1 history from a year ago — **DO NOT FORCE-PUSH OVER THIS** |
| working tree | has uncommitted WIP — see "dirty files" below |

## dirty files in the working tree (NOT committed yet, NOT pushed)

real code edits in flight. preserved on local disk in this canonical + in the rsync snapshots (see "preservation receipts" below).

```
M  .gitignore
M  app/api/create-session/route.ts
M  app/api/stream-agent/route.ts
M  app/api/stream-parallel/route.ts
M  app/api/supervisor-interact/route.ts
M  app/api/transcribe-audio/route.ts
M  app/api/upload-file/route.ts
M  app/convex-provider.tsx
M  lib/internal-agent-execution.ts
M  lib/llm-stream.ts
M  lib/llm.ts
D  package-lock.json       (staged delete)
M  package.json            (staged)
A  pnpm-lock.yaml          (staged add)
?? lib/convex-client.ts    (UNTRACKED — real new file, NOT in git anywhere)
```

**before committing any of these:** inspect `lib/convex-client.ts` for embedded secrets (convex deploy keys, auth tokens). per `~/.claude/rules/git.md`, never blind-commit. once cleared, this branch is the natural place to commit + push.

## what's in `_archive/`

`_archive/` is **gitignored** (added 2026-05-26). Contains past project states preserved locally. Will not be committed.

```
_archive/
└── v2-scaffold-dot-clone/        (592M — the entire prior dot-clone, intact)
    ├── apps/                     (turborepo monorepo structure)
    ├── docs/                     (4 dirty docs in docs/agents/phase-0/)
    ├── packages/
    ├── worktrees/
    ├── legacy-chain-chat/        (434M — even-older nested attempt)
    ├── matrix-hebbia.MOV         (untracked content asset)
    ├── .git/                     (the dot clone's git, with its own branches)
    └── package.json, turbo.json, pnpm-workspace.yaml, etc.
```

**what was in the dot clone's git that's NOT in this canonical's git:**
- local `main` branch was a fresh "Initial scaffold: Turborepo + Next.js 16" commit, diverged from origin/main's 159 v1 commits
- 5 local-only branches: `claude/funny-gates-3f6ff1`, `claude/objective-nash-8245cc`, `feature/api`, `feature/frontend`, `feature/infrastructure`
- all preserved as `safety/dot-*-2026-05-26` branches on github (see below)

## preservation receipts (where copies of pre-consolidation state live)

belt-and-suspenders preservation. nothing was destroyed.

**1. github safety branches** (durable cloud copy):

| branch | what |
|---|---|
| `safety/dot-claude-funny-gates-3f6ff1-2026-05-26` | dot-clone's claude session branch |
| `safety/dot-claude-objective-nash-8245cc-2026-05-26` | dot-clone's claude session branch |
| `safety/dot-feature-api-2026-05-26` | dot-clone's feature/api state |
| `safety/dot-feature-frontend-2026-05-26` | dot-clone's feature/frontend state |
| `safety/dot-feature-infrastructure-2026-05-26` | dot-clone's feature/infrastructure state |
| `safety/dot-main-v2-scaffold-2026-05-26` | the lone v2 turborepo scaffold commit |
| `safety/hyphen-migrate-cloudflare-workers-2026-05-26` | hyphen-clone's pre-sync state of migrate/cloudflare-workers |

verify any time with: `git ls-remote origin "refs/heads/safety/*"`

**2. rsync filesystem snapshots** (local belt-and-suspenders):

| snapshot | size | what it captures |
|---|---|---|
| `~/Archive/projects/chained-chat-dot-clone-snapshot-2026-05-26/` | 592M | every byte of the dot clone at consolidation time, including dirty + untracked + .git |
| `~/Archive/projects/chained-chat-hyphen-clone-snapshot-2026-05-26/` | 3.0G | every byte of the hyphen clone at consolidation time, including .next/ build cache (since stripped from canonical) and all dirty work |

**3. macOS Trash** (transient):
- `.next/` (2.5G), `.turbo/`, `node_modules/` were trashed (not `rm -rf`'d) before move. recoverable from `~/.Trash/` for ~30 days unless emptied.

## next-session work (in priority order)

1. **inspect `lib/convex-client.ts` for secrets.** If clean, decide whether to commit it on the current `migrate/cloudflare-workers` branch.

2. **decide what to do with the 11 dirty tracked files.** They're real api/lib edits to the cloudflare migration. Either:
   - finish them and commit + push to `origin/migrate/cloudflare-workers`
   - stash them via `git stash push -m "wip 2026-05-26 cloudflare api migration"`
   - commit them as WIP on a side branch

3. **continue the cloudflare migration.** This is the `migrate/cloudflare-workers` branch's purpose. Pairs with `[[vercel-to-cloudflare-migration]]` memory.

4. **decide about `_archive/` long-term.** Options:
   - keep here forever (gitignored, lives alongside active project)
   - move to `~/Archive/projects/chained-chat-attempts-history/` (cleaner separation but harder to remember)
   - if any of the safety/* github branches are confirmed durable + sufficient, the local `_archive/` can be deleted later (but the rsync snapshots in `~/Archive/projects/` still exist as a third layer)

5. **think about whether dot-clone's v2 turborepo scaffold is worth merging back into the active line.** The scaffold has a different architecture (monorepo apps/packages/) vs the current single-app working tree. If the future direction is monorepo, the `safety/dot-main-v2-scaffold-2026-05-26` branch on github is the seed.

6. **figure out what `_archive/v2-scaffold-dot-clone/matrix-hebbia.MOV` is** (content asset? landing demo video? hebbia is a company name). If it's a content asset, move to `~/Media/` or `~/Brand/media/`. If it's project documentation, keep in archive.

## things that should NOT happen in future sessions

- DO NOT force-push to `origin/main` from any local clone. origin/main holds the only copy of the 159-commit v1 history. forcing over it loses a year of work.
- DO NOT `rm -rf _archive/`. use `trash _archive/v2-scaffold-dot-clone/` if you ever want it gone, but the rsync snapshot at `~/Archive/projects/` is still the safety net.
- DO NOT delete the `safety/*` branches from github until you're 100% confident the canonical contains everything you want. Tags are forever; branches can be deleted by accident.
- DO NOT change the folder name. `chained-chat` is the canonical kebab-case form per `[[folder-naming-convention]]`. matches github repo, shell-safe, tab-complete friendly.

## quick reference

```bash
# enter the project
cd ~/Code/projects/chained-chat/

# verify all safety branches still exist on github
git ls-remote origin "refs/heads/safety/*"

# inspect dirty work without acting
git status -s
git diff lib/llm.ts        # etc

# install deps fresh after build-cache purge
pnpm install               # or whatever the package.json declares

# run dev
pnpm dev
```

## origin sessions

- 2026-05-26 ~01:00 ET — ani's chief session executed the consolidation after a vyvanse-up midnight push. Two clones existed in parallel due to a months-long branching history. Snapshots + safety branches preserved everything before the mv operations.
- prior history: see git log + the safety/* branches on github.

## 2026-07-25 convergence disposition

- This handoff and `lib/convex-client.ts` are preserved together on the remote
  archive branch `archive/pro/chained-chat-local-context-2026-07-25`.
- `_archive/v2-scaffold-dot-clone/` was verified byte-identical outside nested
  Git metadata to
  `~/Archive/projects/chained-chat-dot-clone-snapshot-2026-05-26/`.
- The seven `safety/*` branches listed above were verified on GitHub before the
  redundant in-project `_archive/` copy was removed.
- `dist/` was classified as generated output: the active Worker entry point is
  `.open-next/worker.js`, and no source, script, or documentation consumes
  `dist/worker.js`.
- The draft Cloudflare migration remains intentionally open. No provider,
  secret, deployment, or production state was changed by this convergence.
