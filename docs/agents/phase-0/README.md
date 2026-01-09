# Phase 0: Compare Mode MVP

## Overview

Phase 0 establishes the foundation of chained.chat with a working Compare Mode that lets users send a single prompt to 4 LLM providers (GPT-4, Claude, Gemini, Grok) and see responses stream side-by-side.

**Timeline:** 1-2 weeks
**Goal:** Deployable MVP with core comparison functionality

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PHASE 0 EXECUTION                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: SCAFFOLD AGENT (runs first, alone)                             │
│  ├── Create GitHub repo                                                  │
│  ├── Initialize Turborepo monorepo                                       │
│  ├── Create Next.js 15 app with landing page                            │
│  ├── Deploy to Vercel                                                    │
│  └── Prepare worktrees directory                                         │
│                                                                          │
│  Step 2: CREATE WORKTREES (you run manually)                             │
│  ├── git worktree add worktrees/agent-1-infrastructure feature/infra    │
│  ├── git worktree add worktrees/agent-2-frontend feature/frontend       │
│  └── git worktree add worktrees/agent-3-api feature/api                 │
│                                                                          │
│  Step 3: PARALLEL AGENTS (3 Claude Code instances)                       │
│  ┌─────────────────┬─────────────────┬─────────────────┐                │
│  │ Agent 1         │ Agent 2         │ Agent 3         │                │
│  │ Infrastructure  │ Frontend        │ API             │                │
│  ├─────────────────┼─────────────────┼─────────────────┤                │
│  │ packages/db/    │ components/     │ app/api/        │                │
│  │ packages/shared/│ stores/         │ lib/providers/  │                │
│  │ security/       │ hooks/          │ lib/cache/      │                │
│  │ governance/     │ animations/     │ middleware      │                │
│  └─────────────────┴─────────────────┴─────────────────┘                │
│                                                                          │
│  Step 4: MERGE (sequential, in order)                                    │
│  ├── 1. Merge feature/infrastructure → main                             │
│  ├── 2. Merge feature/api → main                                        │
│  └── 3. Merge feature/frontend → main                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Step 1: Run Scaffold Agent

```bash
# Open terminal
cd /Users/anipotts/Code/active/gpt-wrappers
claude

# Paste contents of: docs/agents/phase-0/00-scaffold-agent.md
```

Wait for the scaffold agent to complete. It will output:
```
✅ SCAFFOLD COMPLETE
GitHub Repository: https://github.com/{username}/chained-chat
Vercel Deployment: https://chained-chat.vercel.app
```

### Step 2: Create Git Worktrees

```bash
cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat

# Create isolated worktrees for each agent
git worktree add worktrees/agent-1-infrastructure feature/infrastructure
git worktree add worktrees/agent-2-frontend feature/frontend
git worktree add worktrees/agent-3-api feature/api

# Verify worktrees
git worktree list
```

### Step 3: Launch 3 Parallel Agents

Open **3 separate terminal windows/tabs**:

**Terminal 1 - Infrastructure Agent:**
```bash
cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat/worktrees/agent-1-infrastructure
claude
# Paste contents of: docs/agents/phase-0/01-agent-infrastructure.md
```

**Terminal 2 - Frontend Agent:**
```bash
cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat/worktrees/agent-2-frontend
claude
# Paste contents of: docs/agents/phase-0/02-agent-frontend.md
```

**Terminal 3 - API Agent:**
```bash
cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat/worktrees/agent-3-api
claude
# Paste contents of: docs/agents/phase-0/03-agent-api.md
```

### Step 4: Monitor Progress

Watch each terminal for completion. Each agent will:
1. Install dependencies
2. Create their owned files
3. Write tests
4. Commit and push to their feature branch

### Step 5: Merge Branches

**Important:** Merge in this exact order to handle dependencies correctly.

```bash
cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat

# 1. Merge Infrastructure first (no dependencies)
git checkout main
git merge feature/infrastructure
git push

# 2. Merge API second (depends on Infrastructure)
git merge feature/api
git push

# 3. Merge Frontend last (depends on both)
git merge feature/frontend
git push

# Clean up worktrees
git worktree remove worktrees/agent-1-infrastructure
git worktree remove worktrees/agent-2-frontend
git worktree remove worktrees/agent-3-api
```

---

## Agent Ownership Matrix

| Directory | Agent 1 (Infra) | Agent 2 (Frontend) | Agent 3 (API) |
|-----------|-----------------|-------------------|---------------|
| `packages/db/` | ✅ OWN | ❌ READ ONLY | ❌ READ ONLY |
| `packages/shared/` | ✅ OWN | ❌ READ ONLY | ❌ READ ONLY |
| `apps/web/src/components/` | ❌ | ✅ OWN | ❌ |
| `apps/web/src/stores/` | ❌ | ✅ OWN | ❌ |
| `apps/web/src/hooks/` | ❌ | ✅ OWN | ❌ |
| `apps/web/src/app/api/` | ❌ | ❌ | ✅ OWN |
| `apps/web/src/lib/providers/` | ❌ | ❌ | ✅ OWN |
| `apps/web/src/lib/cache/` | ❌ | ❌ | ✅ OWN |
| `apps/web/src/middleware.ts` | ❌ | ❌ | ✅ OWN |

---

## Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│   @chained/shared (Agent 1)                                  │
│   ├── Types, interfaces, Zod schemas                         │
│   ├── Security guardrails (Dual LLM pattern)                 │
│   ├── Governance limits                                       │
│   └── Observability setup                                     │
│                                                               │
│          ↓ imported by ↓                                      │
│                                                               │
│   ┌─────────────────────────┐   ┌──────────────────────────┐ │
│   │ Frontend (Agent 2)      │   │ API (Agent 3)            │ │
│   │ • Compare UI components │   │ • /api/compare route     │ │
│   │ • Zustand store         │   │ • Provider registry      │ │
│   │ • Animation variants    │   │ • Semantic cache         │ │
│   │ • SSE consumer hook     │   │ • SSE producer           │ │
│   └─────────────────────────┘   └──────────────────────────┘ │
│                                                               │
│   @chained/db (Agent 1)                                      │
│   └── Prisma schema + client                                  │
│                                                               │
│          ↓ imported by ↓                                      │
│                                                               │
│   API (Agent 3)                                               │
│   └── Usage logging, user management                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## SSE Event Contract

The Frontend and API agents must agree on this exact event format:

```typescript
// Event types
type StreamEvent =
  | { type: 'init'; modelId: string }
  | { type: 'chunk'; modelId: string; data: string }
  | { type: 'complete'; modelId: string; tokens: { input: number; output: number }; cost: number; latencyMs: number; cached: boolean }
  | { type: 'error'; modelId: string; error: string };

// SSE format
data: {"type":"init","modelId":"gpt-4o"}\n\n
data: {"type":"chunk","modelId":"gpt-4o","data":"Hello"}\n\n
data: {"type":"complete","modelId":"gpt-4o","tokens":{"input":10,"output":5},"cost":0.001,"latencyMs":500,"cached":false}\n\n
```

---

## Environment Variables

Create `.env.local` in `apps/web/`:

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
XAI_API_KEY=xai-...

# Upstash (Semantic Cache)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=...

# Observability
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
AGENTOPS_API_KEY=...
```

---

## Verification Checklist

After all agents complete and branches are merged:

### Infrastructure (Agent 1)
- [ ] `packages/shared/` builds without errors
- [ ] `packages/db/` builds without errors
- [ ] Prisma schema is valid (`pnpm db:generate`)
- [ ] Security functions detect injection patterns
- [ ] Governance limits calculate correctly

### Frontend (Agent 2)
- [ ] Components render without errors
- [ ] Zustand store works (run tests)
- [ ] Animations play correctly
- [ ] Can import from `@chained/shared`
- [ ] Compare page loads

### API (Agent 3)
- [ ] API routes respond correctly
- [ ] SSE streaming works
- [ ] Auth middleware protects routes
- [ ] Cache hits/misses logged
- [ ] Can import from `@chained/shared` and `@chained/db`

### Integration
- [ ] `pnpm dev` starts all apps
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes all tests
- [ ] Landing page shows at `/`
- [ ] Compare page shows at `/compare` (after auth)
- [ ] Can sign up via Clerk
- [ ] Can run a comparison with 4 models
- [ ] Responses stream in real-time
- [ ] Usage is logged to database

---

## Troubleshooting

### Worktree Issues

```bash
# List worktrees
git worktree list

# Remove a worktree
git worktree remove worktrees/agent-1-infrastructure --force

# Prune stale worktree references
git worktree prune
```

### Merge Conflicts

If conflicts occur during merge:

1. Identify conflicting files
2. Check which agent owns the file (see Ownership Matrix)
3. Keep the owning agent's version
4. Complete the merge

```bash
# During conflict
git status  # See conflicting files
# Edit files to resolve
git add .
git commit
```

### Build Failures

```bash
# Clear all caches
pnpm clean
rm -rf node_modules
rm -rf apps/web/.next
pnpm install
pnpm build
```

### Database Issues

```bash
# Regenerate Prisma client
cd packages/db
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

---

## Files Created by Each Agent

### Agent 1: Infrastructure
```
packages/
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── types/index.ts
│       ├── security/guardrails.ts
│       ├── governance/limits.ts
│       └── observability/index.ts
└── db/
    ├── package.json
    ├── tsconfig.json
    ├── prisma/schema.prisma
    └── src/index.ts

.env.example
```

### Agent 2: Frontend
```
apps/web/src/
├── stores/
│   ├── compare-store.ts
│   ├── index.ts
│   └── __tests__/compare-store.test.ts
├── hooks/
│   ├── use-compare-stream.ts
│   └── index.ts
├── components/compare/
│   ├── animation-variants.ts
│   ├── CompareCard.tsx
│   ├── CompareGrid.tsx
│   ├── PromptInput.tsx
│   ├── ModelSelector.tsx
│   ├── StreamingText.tsx
│   └── index.ts
├── app/(routes)/
│   ├── layout.tsx
│   └── compare/
│       ├── page.tsx
│       └── ComparePageClient.tsx
├── test/setup.ts
├── globals.css (updated)
└── vitest.config.ts

tailwind.config.ts (updated)
```

### Agent 3: API
```
apps/web/src/
├── lib/
│   ├── providers/registry.ts
│   ├── cache/semantic-cache.ts
│   └── stream/sse.ts
├── app/
│   ├── layout.tsx (updated)
│   ├── api/
│   │   ├── compare/route.ts
│   │   ├── health/route.ts
│   │   ├── user/route.ts
│   │   ├── keys/route.ts
│   │   ├── comparisons/route.ts
│   │   └── __tests__/compare.test.ts
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
└── middleware.ts
```

---

## Next Steps (After Phase 0)

Once Phase 0 is complete and deployed:

1. **Validate:** Test with real users
2. **Iterate:** Fix bugs, improve UX
3. **Phase 1:** Add semantic caching dashboard, cost tracking UI
4. **Phase 2:** Build @chained/sdk, implement chains

---

## Support

If agents get stuck or need clarification:
- Check the main spec at `docs/spec.md`
- Review this README for coordination details
- Ensure env vars are set correctly
- Check the dependency graph for import issues
