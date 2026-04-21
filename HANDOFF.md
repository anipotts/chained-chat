# ChainedChat v3 — Complete Engineering Handoff

> **Date:** April 21, 2026
> **Author:** Ani Potts (via Claude Code)
> **Purpose:** Arm a new Claude Code session with full context to research, challenge, design, then build the best possible v3.
> **Business Entity:** Ani Potts LLC (formed March 20, 2026)
> **Domain:** chained.chat
> **Status:** Portfolio project — not the flagship product

---

## How to Use This Document

You are a **challenging consultant**, not a yes-man. Before writing a single line of code:

1. **Read this entire document.** It is your only source of truth.
2. **Research every competitor** listed in Part 6. Do not rely on this document's descriptions — go verify what they actually do today.
3. **Ask hard questions.** Part 10 lists the ones Ani must answer. Do not proceed until she does.
4. **Push back on scope.** If something is overengineered for a portfolio project with one user, say so.
5. **Then and only then**, design the architecture and build.

---

## Table of Contents

- [Part 1: Project Identity & History](#part-1-project-identity--history)
- [Part 2: V1 Deep Technical Audit (Convex + Clerk)](#part-2-v1-deep-technical-audit-convex--clerk)
- [Part 3: V2 Deep Technical Audit (Supabase)](#part-3-v2-deep-technical-audit-supabase)
- [Part 4: Sandbox Repo Analysis](#part-4-sandbox-repo-analysis)
- [Part 5: Lessons Learned — 6 Months of Building](#part-5-lessons-learned--6-months-of-building)
- [Part 6: Competitive Landscape — April 2026](#part-6-competitive-landscape--april-2026)
- [Part 7: V3 Architecture Exploration](#part-7-v3-architecture-exploration)
- [Part 8: User Journey & Wireframe Spec](#part-8-user-journey--wireframe-spec)
- [Part 9: Multi-Session Claude Code Strategy](#part-9-multi-session-claude-code-strategy)
- [Part 10: Questions for Ani — The Consultant's Challenge](#part-10-questions-for-ani--the-consultants-challenge)

---

# Part 1: Project Identity & History

## What Is ChainedChat?

ChainedChat (chained.chat) is a web application that lets users chain multiple AI models together in a single conversation. You configure a pipeline of 1–4 agents (e.g., GPT-4o → Claude Sonnet 4 → Gemini 2.5 Pro), send a message, and each agent processes the output of the previous one in sequence. The result is streamed back in real-time with per-agent output sections.

**Core value proposition:** "One prompt. Multiple AI perspectives. Chained together."

The product was inspired by an iMessage conversation where a friend of Ani's was actively looking for exactly this kind of tool — real demand from a real person, not a hypothetical.

## The Domain

- **Domain:** chained.chat
- **Registrar:** (managed by Ani)
- **Current deployment:** Vercel (Next.js)
- **Supabase project:** bugbuiitqsyvkuzzzkqd (shared with other Ani Potts LLC projects — cc_ prefixed tables)

## Business Context

- **Entity:** Ani Potts LLC, formed March 20, 2026
- **Role of ChainedChat:** Portfolio project — demonstrates full-stack engineering, AI integration, and product design
- **Other projects under the LLC:** Quantercise (fitness), portfolio site (anipotts.com), and others
- **Revenue model:** None currently. Potential future monetization explored in Part 10.
- **User base:** Single user (Ani) + friends with access codes. Not a SaaS product (yet).

## Timeline

### V1: The Overengineered Phase (Oct 2025 – Feb 2026)

**Stack:** Next.js 15 + Convex + Clerk + Three.js + GSAP + Framer Motion + PostHog + Stripe

Built as an ambitious full-featured product with:
- 15 Convex database tables
- 42 npm dependencies
- 114 TypeScript/TSX source files
- 4 LLM providers (OpenAI, Anthropic, Google, xAI/Grok)
- Supervisor mode, parallel execution, collaborative chains, conditional execution
- 3D animations with Three.js
- Full billing system with Stripe integration
- PostHog analytics
- Beta access codes with usage limits and waitlist management
- Comprehensive pricing page, features page, API docs page

**Result:** Massively overengineered for a single-user portfolio project. Complex, fragile, expensive to maintain. Most features were never used.

### V2: The Simplification (April 2026)

**Stack:** Next.js 15 + Supabase + native LLM SDKs

A complete from-scratch rewrite that stripped everything down to essentials:
- 5 Supabase tables (cc_ prefixed)
- 20 npm dependencies
- 26 TypeScript/TSX source files (2,442 total lines)
- 3 LLM providers (OpenAI, Anthropic, Google)
- Sequential chaining only (up to 4 agents)
- Simple access code auth (no OAuth, no Clerk)
- Claude Code-inspired dark theme
- No 3D, no animations library, no analytics, no billing

**Result:** Clean, functional, professional. Ships the core value prop without the bloat. But still room for improvement — see Part 5.

### V3: The Vision (This Document)

Potential directions being explored:
- Cloudflare-native backend (Workers, D1, R2, KV, Durable Objects)
- Reactive frontend (SvelteKit, SolidStart, or stay with Next.js)
- Infinite canvas UI for visual chain building
- Real-time collaboration capabilities
- Better mobile experience

**This document does NOT implement v3.** It provides everything a new agent needs to make informed decisions.


---

# Part 2: V1 Deep Technical Audit (Convex + Clerk)

## Overview

V1 was built with Convex (serverless database with real-time sync) and Clerk (authentication). It had 114 source files, 42 dependencies, and 15 database tables. This section documents everything so the next agent understands what existed, what worked, and what was cut.

## Convex Database Schema (15 Tables)

### Core Tables

**users**
- Clerk authentication integration with extended profile fields
- Fields: bio, company, location, timezone, profileImageUrl, subscription info
- Subscription tier tracking (free/pro)

**userPreferences**
- Theme, language, notification settings
- AI preferences, privacy settings
- Per-user customization

**subscriptionPlans**
- Tiered plans (free/pro) with feature mappings
- Stripe plan ID linking

**userBilling**
- Full Stripe integration
- Usage tracking, billing cycle dates
- Payment method storage

### Session Management

**chatSessions**
- User chat sessions with title and timestamps
- Ownership verification via user ID

**agentSteps**
- Individual agent execution records
- Fields: model, prompt, response, thinking, tokenUsage, performance metrics
- Connection types: direct, conditional, parallel, collaborative, supervisor
- Execution duration, token rates, latency tracking

**supervisorTurns**
- Supervisor conversation history
- Reference tracking for agent mentions
- Parsed mentions for UI rendering

**agentConversations**
- Agent conversation history with multimodal support
- Isolated per-agent context

### Features & Tracking

**usageHistory**
- Event types: chain_created, agent_executed, tokens_consumed, file_uploaded, subscription_changed
- Comprehensive usage analytics

**fileAttachments**
- File storage metadata (images, audio, documents)
- Linked to sessions and steps
- MIME type and size tracking

**accessCodes**
- Beta access codes with usage limits and expiration dates
- Redeemable codes for gated access

**accessCodeUsage**
- Track who redeemed which code and when

**waitlist**
- Pre-launch waitlist with email collection
- UTM tracking for attribution
- Status tracking (pending, invited, joined)

**webhooks**
- Stripe webhook event storage
- Event type and payload logging

**savedChains**
- User-saved chain configurations
- Full agent definitions with models and prompts
- Shareable chain templates

## All 42 Dependencies (V1)

### AI/LLM (8 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| @anthropic-ai/sdk | ^0.52.0 | Direct Claude API access |
| openai | ^4.103.0 | Direct OpenAI API access |
| @google/generative-ai | ^0.24.1 | Direct Gemini API access |
| @ai-sdk/anthropic | ^1.2.12 | Vercel AI SDK Claude adapter |
| @ai-sdk/openai | ^1.3.22 | Vercel AI SDK OpenAI adapter |
| @ai-sdk/google | ^1.2.22 | Vercel AI SDK Google adapter |
| @ai-sdk/xai | ^1.2.16 | Vercel AI SDK Grok adapter |
| ai | ^4.3.16 | Vercel AI SDK core |

### Database & Auth (2 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| convex | ^1.24.1 | Serverless database with real-time sync |
| @clerk/nextjs | ^6.20.1 | Authentication (OAuth, social login) |

### Search & Tools (1 package)
| Package | Version | Purpose |
|---------|---------|---------|
| @tavily/core | ^0.5.3 | Web search API for agent tool use |

### UI & Animations (7 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| framer-motion | ^12.15.0 | Animation library |
| antd | ^5.26.4 | Ant Design component library |
| lucide-react | ^0.511.0 | Icon library |
| react-icons | ^5.5.0 | Additional icon sets |
| @lobehub/icons | ^2.11.0 | AI provider brand icons |
| react-dropzone | ^14.3.8 | File upload drag-and-drop |
| class-variance-authority | ^0.7.1 | Variant-based component styling |

### 3D & Media (3 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| three | ^0.177.0 | Three.js 3D rendering |
| @react-three/fiber | ^9.1.2 | React Three.js bindings |
| @react-three/drei | ^10.3.0 | Three.js helper components |

### Content Rendering (7 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| react-markdown | ^10.1.0 | Markdown rendering |
| react-syntax-highlighter | ^15.6.1 | Code syntax highlighting |
| react-katex | ^3.1.0 | LaTeX math rendering |
| katex | ^0.16.22 | KaTeX engine |
| remark-gfm | ^4.0.1 | GitHub Flavored Markdown |
| remark-math | ^6.0.0 | Math expression parsing |
| rehype-katex | ^7.0.1 | KaTeX rehype plugin |

### Utilities (7 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| uuid | ^11.1.0 | UUID generation |
| gpt-tokenizer | ^2.9.0 | Token counting for cost estimation |
| zod | ^3.25.67 | Runtime type validation |
| gsap | ^3.13.0 | GreenSock animation |
| node-fetch | ^3.3.2 | Server-side HTTP |
| form-data | ^4.0.2 | Multipart form data |
| tailwind-merge | ^3.3.0 | Tailwind class merging |

### Analytics (2 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| posthog-js | ^1.249.0 | Client-side analytics |
| posthog-node | ^4.18.0 | Server-side analytics |

### Framework (4+ packages)
| Package | Version | Purpose |
|---------|---------|---------|
| next | ^15.3.3 | React framework |
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | React DOM |
| clsx | ^2.1.1 | Class name utility |

## V1 File Structure (114 Files)

### API Routes (8 endpoints)
```
app/api/
  create-session/route.ts      — Create new chat session
  run-chain/route.ts            — Execute full chain (non-streaming)
  stream-agent/route.ts         — Stream single agent response
  stream-parallel/route.ts      — Stream parallel agent execution
  supervisor-interact/route.ts  — Supervisor mode interaction
  transcribe-audio/route.ts     — Audio transcription via Whisper
  upload-file/route.ts          — File upload handling (50MB limit)
  web-search/route.ts           — Tavily web search proxy
```

### Page Routes (14 pages)
```
app/
  page.tsx                      — Landing page (marketing)
  layout.tsx                    — Root layout with providers
  globals.css                   — Global styles
  convex-provider.tsx           — Convex client provider
  posthog-provider.tsx          — PostHog analytics provider
  api-docs/page.tsx             — API documentation page
  beta-access/page.tsx          — Beta access code entry
  billing/page.tsx              — Billing management
  chains/layout.tsx             — Chains layout wrapper
  chains/page.tsx               — Chain list/management
  chat/[chainId]/page.tsx       — Dynamic chat page per chain
  chat/page.tsx                 — Main chat interface
  features/page.tsx             — Features showcase
  preferences/page.tsx          — User preferences
  pricing/page.tsx              — Pricing tiers
  profile/page.tsx              — User profile
  sign-in/[[...sign-in]]/page.tsx — Clerk sign-in
  sign-up/[[...sign-up]]/page.tsx — Clerk sign-up
  test/page.tsx                 — Test/debug page
```

### Components (47+ files across 14 directories)
```
components/
  Animations/                   — Custom animation wrappers
  Backgrounds/                  — Background effects (beams, gradients)
  Components/                   — Shared UI components
  TextAnimations/               — Text animation effects
  auth/                         — Auth-related components
  chains/                       — Chain configuration UI
  chat/                         — Chat interface components
  core/                         — Core layout components
  features/                     — Feature showcase components
  input/                        — Input handling components
  layout/                       — Layout wrappers
  performance/                  — Performance monitoring UI
  supervisor/                   — Supervisor mode components
  ui/                           — Base UI primitives
```

### Library Files (30+ modules)
```
lib/
  ai-tools.ts                   — Tavily web search + file analysis tool definitions
  analytics.ts                  — PostHog event tracking
  api-validation.ts             — Request validation and rate limit key gen
  beta-access.ts                — Beta access code validation
  claude-enhanced.ts            — Enhanced Claude integration (tools, thinking, files)
  condition-evaluator.ts        — Conditional chain logic evaluation
  constants.ts                  — Model configs, provider definitions
  copy-storage.ts               — Copy/paste tracking storage
  copy-tracking-context.tsx     — React context for copy tracking
  env-check.ts                  — Environment variable validation
  gemini-enhanced.ts            — Enhanced Gemini (tools, thinking simulation)
  grok-enhanced.ts              — Enhanced Grok (real-time data, thinking)
  grok-icon.tsx                 — Custom Grok icon component
  highlight-tracking.ts         — Text highlight tracking
  internal-agent-execution.ts   — Internal chain execution orchestration
  llm-stream.ts                 — LLM streaming utilities
  llm.ts                        — Main LLM orchestration (1,334 lines!)
  modality-utils.ts             — Multi-modal input handling
  performance-context.tsx       — Performance metrics context
  posthog.ts                    — PostHog client initialization
  pricing.ts                    — Pricing tier definitions
  rate-limiter.ts               — API rate limiting (different tiers)
  route-warmer.ts               — Route warming for performance
  sidebar-context.tsx           — Sidebar state context
  supervisor-parser.ts          — Supervisor conversation parsing
  tavily-search.ts              — Tavily search integration
  template-personalization.ts   — Prompt template personalization
  thinking-manager.ts           — Thinking/reasoning simulation with batching
  utils.ts                      — Common utilities
```

### Convex Backend
```
convex/
  schema.ts                     — Full 15-table schema
  queries.ts                    — Read queries (getCurrentUser, getChatSessions, getAgentSteps, etc.)
  mutations.ts                  — Write mutations (createSession, addAgentStep, updateAgentStep, etc.)
  auth.config.ts                — Clerk auth configuration
  _generated/                   — Auto-generated Convex types
```

## V1 LLM Provider Integrations

### Main Orchestration (lib/llm.ts — 1,334 lines)
The monolithic LLM file handled all four providers with:
- Provider detection and routing
- Multi-modal input assembly (text, images, audio, files)
- Streaming response handling
- Tool call processing
- Token counting and cost tracking
- Error handling and retries

### Provider-Specific Enhanced Files

**lib/claude-enhanced.ts**
- Models: claude-opus-4, claude-sonnet-4, claude-3-5-sonnet, claude-3-5-haiku
- Tools: web_search, analyze_file
- Thinking manager integration for extended reasoning
- File attachments with LaTeX formatting
- Streaming with token usage tracking

**lib/gemini-enhanced.ts**
- Models: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash
- Web search tool integration
- Thinking simulation (not native — simulated phases)
- Multi-modal content support

**lib/grok-enhanced.ts**
- Models: grok-3, grok-2-1212, grok-2-vision-1212, grok-2-public, grok-beta
- Real-time X/web data access
- Thinking mode with structured output
- LaTeX formatting for math
- Response length guidance

### Thinking Manager (lib/thinking-manager.ts)
- Simulated thinking phases for all models
- Batched updates (50ms intervals) for efficient Convex writes
- Provider-specific thinking content
- Reasoning model detection

## V1 Middleware (middleware.ts)

The middleware handled:
- **Clerk authentication:** Route protection for `/chat(.*)` paths
- **Security headers:** X-Frame-Options, CSP, CORS
- **Rate limiting:** Different tiers for different routes
  - General API: standard limits
  - Upload routes: 50MB max
  - LLM routes: skipped (handled in route handlers)
- **CORS headers** for API routes
- **Beta access cookie checking** (disabled in later versions)

## V1 Connection Types

The chain execution engine supported five connection types:
1. **Direct:** Simple sequential A → B → C
2. **Conditional:** If/then branching based on output analysis
3. **Parallel:** Multiple agents execute simultaneously, results merged
4. **Collaborative:** Agents share context and build on each other iteratively
5. **Supervisor:** Meta-agent orchestrates other agents with @mentions

## What Worked in V1
- The core chaining concept was validated — sequential agent pipelines are genuinely useful
- Streaming SSE architecture worked well for real-time output
- The model selector UI pattern was clean and intuitive
- Markdown rendering with syntax highlighting and LaTeX was solid

## What Was Overengineered in V1
- Supervisor mode: Complex meta-agent orchestration nobody used
- Parallel execution: Cool but unnecessary for the actual use case
- Conditional execution: Required an "evaluator" LLM call to decide branching — expensive and slow
- Collaborative mode: Iterative back-and-forth between agents — confusing UX
- 3D animations: Three.js for a chat app is absurd — hurt mobile performance
- Billing/Stripe: No paying users to bill
- PostHog analytics: No user base to analyze
- Waitlist: No audience to wait-list
- 15 database tables: Could have been 3
- 4 LLM providers: Grok added complexity without proportional value


---

# Part 3: V2 Deep Technical Audit (Supabase)

## Overview

V2 is the current codebase on branch `claude/modernize-chained-chat-dhRhc` — a complete from-scratch rewrite that stripped V1 down to essentials. The goal was a clean, professional, mobile-responsive AI chaining tool with no bloat.

**Scale comparison:**
- V1: 114 files, 42 deps, 15 tables, ~56,972 lines
- V2: 26 files, 20 deps, 5 tables, 2,442 lines (**~95% reduction**)

## Supabase Database Schema (5 Tables)

All tables use the `cc_` prefix because the Supabase project (`bugbuiitqsyvkuzzzkqd`) is shared with other Ani Potts LLC projects (Quantercise, portfolio, etc.) due to the 2-project free tier limit.

### cc_access_codes
```sql
CREATE TABLE cc_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
Stores access codes for authentication. Default seeded code: `chained2026`.

### cc_sessions
```sql
CREATE TABLE cc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
Each chat conversation. Tied to access_code (not user — there are no users).

### cc_messages
```sql
CREATE TABLE cc_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES cc_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'chain')) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  chain_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
Messages in a session. `role='user'` for user input, `role='chain'` for the composite chain output. `chain_config` stores the agent configuration used.

### cc_agent_steps
```sql
CREATE TABLE cc_agent_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES cc_messages(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  agent_name TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('openai', 'anthropic', 'google')) NOT NULL,
  system_prompt TEXT,
  input TEXT,
  output TEXT,
  thinking TEXT,
  web_search_results JSONB,
  token_usage JSONB,
  duration_ms INT,
  status TEXT CHECK (status IN ('pending', 'streaming', 'complete', 'error')) DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
Individual agent execution records. One per step in the chain.

### cc_saved_chains
```sql
CREATE TABLE cc_saved_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  agents JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
User-saved chain configurations. Currently unused by the UI but schema is ready.

**RLS:** Row-Level Security is enabled on all tables. Access is gated through the service role key on the server (not user-level RLS since there are no users).


## All 20 Dependencies (V2)

### AI/LLM (4 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| @anthropic-ai/sdk | ^0.52.0 | Direct Claude API |
| @google/generative-ai | ^0.24.1 | Direct Gemini API |
| openai | ^4.103.0 | Direct OpenAI API |
| ai | ^4.3.16 | Vercel AI SDK (minimally used — kept for future) |

### Database & Auth (2 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/ssr | ^0.6.1 | Supabase server-side rendering helpers |
| @supabase/supabase-js | ^2.49.4 | Supabase client |

### UI (3 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| lucide-react | ^0.511.0 | Icons |
| clsx | ^2.1.1 | Class name utility |
| tailwind-merge | ^3.3.0 | Tailwind class deduplication |

### Content Rendering (6 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| react-markdown | ^10.1.0 | Markdown rendering |
| react-syntax-highlighter | ^15.6.1 | Code highlighting |
| react-katex | ^3.1.0 | LaTeX rendering |
| katex | ^0.16.22 | KaTeX engine |
| remark-gfm | ^4.0.1 | GFM parser |
| remark-math | ^6.0.0 | Math parser |
| rehype-katex | ^7.0.1 | KaTeX rehype plugin |

### Framework (4 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| next | ^15.3.3 | Next.js |
| react | ^18.3.1 | React |
| react-dom | ^18.3.1 | React DOM |
| zod | ^3.25.67 | Runtime validation |

**Cut from V1:** Clerk, Convex, Three.js, GSAP, Framer Motion, PostHog (both), Ant Design, react-icons, @lobehub/icons, @tavily/core, @ai-sdk/xai, @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google, gpt-tokenizer, react-dropzone, uuid, gsap, node-fetch, form-data, class-variance-authority.

## V2 Source Files (26 files, 2,442 lines)

```
app/
  api/auth/verify/route.ts         23 lines  — Access code verification endpoint
  api/chat/stream/route.ts         218 lines — Main SSE streaming endpoint
  api/sessions/route.ts            44 lines  — Session CRUD (GET list, POST create)
  globals.css                      163 lines — Dark theme, fonts, markdown styles
  layout.tsx                       56 lines  — Root layout with AuthProvider
  page.tsx                         15 lines  — Auth gate → chat interface

components/
  access-gate.tsx                  74 lines  — Access code entry screen
  chain/agent-card.tsx             74 lines  — Individual agent config card
  chain/chain-builder.tsx          160 lines — Chain config with presets
  chain/model-selector.tsx         102 lines — Provider-grouped dropdown
  chat/chat-interface.tsx          299 lines — Main orchestrator
  chat/input-area.tsx              153 lines — Message input with image upload
  chat/message-list.tsx            156 lines — Message rendering with agent steps
  chat/sidebar.tsx                 144 lines — Session list sidebar
  ui/markdown-renderer.tsx         87 lines  — Markdown + code + LaTeX

lib/
  auth-context.tsx                 55 lines  — Auth React Context
  constants.ts                     205 lines — Models, providers, presets
  llm/anthropic.ts                 72 lines  — Claude streaming with thinking
  llm/gemini.ts                    83 lines  — Gemini streaming with search
  llm/openai.ts                    59 lines  — OpenAI streaming with tools
  llm/stream.ts                    93 lines  — Chain orchestration
  supabase/client.ts               8 lines   — Browser Supabase client
  supabase/server.ts               10 lines  — Server Supabase client (service role)
  utils.ts                         16 lines  — cn(), truncate(), generateTitle()

postcss.config.mjs                 8 lines
tailwind.config.ts                 65 lines  — cc-* color palette, animations
```


## V2 API Endpoints (3 routes)

### POST /api/auth/verify
Verifies an access code against `cc_access_codes`. Case-insensitive, trimmed.
- Input: `{ code: string }`
- Output: `{ ok: true }` on success, `{ error: 'Invalid code' }` with 401 on failure

### GET /api/sessions?code=<access_code>
Lists sessions for an access code. Returns last 50 sessions ordered by `updated_at DESC`.
- Response: `[{ id, title, created_at, updated_at }]`

### POST /api/sessions
Creates a new session.
- Input: `{ accessCode, title? }`
- Output: `{ id, title, created_at }`

### POST /api/chat/stream (the critical endpoint)
The main streaming endpoint. Validates access code, creates/reuses session, saves user message, creates chain message placeholder + agent step records, then streams chain execution.

**Input:**
```ts
{
  sessionId?: string;
  accessCode: string;
  userInput: string;
  agents: Array<{ name: string; model: string; systemPrompt: string }>;
  images?: string[]; // data URLs
}
```

**Response:** `text/event-stream` with SSE events.

**Event Protocol:**
```ts
// Sent first
{ type: 'session', sessionId: string, messageId: string }

// When each agent begins
{ type: 'agent_start', agentIndex: number, agentName: string }

// Streaming output tokens
{ type: 'text', content: string, agentIndex: number, agentName: string }

// Extended thinking (Anthropic/Gemini only)
{ type: 'thinking', content: string, agentIndex: number, agentName: string }

// Terminal events
{ type: 'done' }
{ type: 'error', content: string }
```

`maxDuration = 120` seconds (Vercel serverless timeout).

Fire-and-forget DB writes update `cc_agent_steps.status` and `duration_ms` during streaming without blocking.

## V2 LLM Provider Integrations

### lib/llm/openai.ts (OpenAI)
- Lazy client init via `function getClient()` — avoids build-time env var errors
- Vision: `image_url` content parts for GPT-4o/4.1
- Web search: function-calling tool definition
- Streams via `chat.completions.create({ stream: true })`

### lib/llm/anthropic.ts (Anthropic)
- Lazy client init
- Vision: `{ type: 'image', source: { type: 'url', url } }` content blocks
- Extended thinking: `thinking: { type: 'enabled', budget_tokens: 8000 }` for Sonnet 4, Opus 4, 3.7
- `max_tokens: 16000` when thinking enabled, else 4096
- Yields `{ type: 'thinking' | 'text', content }` tuples

### lib/llm/gemini.ts (Google)
- Lazy GenAI init
- Vision: base64 `inlineData` from data URLs
- Web search: `tools: [{ googleSearch: {} }]`
- Chat history + `systemInstruction` support
- Thinking detection via `candidate.content.parts[].thought`

### lib/llm/stream.ts (orchestrator)
- `streamLLM(req)` — dispatches to provider-specific stream based on model prefix
- `streamChain(agents, userInput, images)` — sequential chain executor
  - First agent gets user input + images
  - Subsequent agents receive "Previous agent's output:\n\n...\n\nOriginal user request:\n..."
  - Yields `ChainStreamEvent` (StreamEvent + agentIndex + agentName)

## V2 Models (latest as of March/April 2026)

### OpenAI
- `gpt-4o` (default) — text, vision, web-search, code
- `gpt-4o-mini` — text, vision, fast
- `gpt-4.1` — text, vision, code
- `o4-mini` — text, reasoning

### Anthropic
- `claude-sonnet-4-20250514` (default) — text, vision, code, thinking
- `claude-opus-4-20250514` — text, vision, code, thinking
- `claude-3-7-sonnet-20250219` — text, vision, code, thinking
- `claude-haiku-4-5-20251001` — text, vision, fast

### Google
- `gemini-2.5-pro-preview-05-06` (default) — text, vision, code, thinking
- `gemini-2.5-flash-preview-05-20` — text, vision, code, fast
- `gemini-2.0-flash` — text, vision, fast

**Note to next agent:** These model IDs may be stale. Check current API docs before coding.

## V2 Chain Presets (3 defaults)

### Draft & Review
1. Writer (GPT-4o) — "Write clear, engaging content..."
2. Reviewer (Claude Sonnet 4) — "Review and improve the previous content..."

### Multi-Perspective
1. Analyst A (GPT-4o) — "Analyze from a practical, implementation-focused perspective."
2. Analyst B (Claude Sonnet 4) — "Analyze from a critical, devil's advocate perspective..."
3. Synthesizer (Gemini 2.5 Pro) — "Synthesize the previous analyses..."

### Code Pipeline
1. Coder (Claude Sonnet 4) — "Write clean, well-structured code..."
2. Reviewer (GPT-4o) — "Review the code for bugs, security issues..."

## V2 Design System (Claude Code-inspired)

**Colors (cc-* palette):**
- `bg`: #0a0a0a (near-black)
- `surface`: #141414 (slightly lighter panels)
- `border`: #262626
- `border-hover`: #3a3a3a
- `text`: #e5e5e5
- `text-muted`: #737373
- `text-dim`: #525252
- `accent`: #d4a574 (warm amber)
- `accent-dim`: #a67c52
- `green`: #4ade80, `red`: #f87171, `blue`: #60a5fa, `amber`: #fbbf24

**Provider colors:**
- OpenAI: #10a37f (green)
- Anthropic: #d4a574 (matches cc-accent)
- Google: #4285f4 (blue)

**Fonts:**
- Sans: Inter, system-ui, sans-serif
- Mono: JetBrains Mono, SF Mono, Menlo

**Animations:**
- `blink` — 1s streaming cursor blink
- `fade-in` — 0.2s entrance (opacity + 4px y-translate)
- `pulse-slow` — 2s opacity pulse

**UI patterns:**
- 7×7 rounded squares for avatars with provider-colored backgrounds at 15% opacity
- 4px scrollbar, minimal
- Border-based separation (no shadows)
- Lowercase "blank chain", "reset", "thinking" labels for Claude Code feel
- Uppercase tracking-wider for section labels
- Monospace for technical content

## V2 Data Flow (end-to-end)

1. User enters access code → `AuthProvider.login(code)` → POST `/api/auth/verify` → localStorage persist
2. User configures chain in `ChainBuilder` (up to 4 agents, each with name/model/prompt)
3. User types message + optional images → `InputArea.onSubmit`
4. `ChatInterface.handleSubmit` optimistically renders user message + chain placeholder
5. POST `/api/chat/stream` with `{ sessionId, accessCode, userInput, agents, images }`
6. Server verifies code, creates session if needed, saves user message, creates chain message + agent step rows
7. Server opens `ReadableStream`, yields SSE events: `session` → `agent_start` → `text`/`thinking` (×N) → repeat → `done`
8. Client reader parses `data: {...}\n\n` blocks, mutates `messages[].agentSteps[].content`
9. During streaming, server fire-and-forgets agent step updates (status, output, duration_ms)
10. On complete, chain message `content` is set to the last agent's output


## What Was Kept From V1

- **Core chaining concept** — sequential agents, each receiving previous output
- **SSE streaming architecture** — simple and reliable
- **Markdown + syntax highlighting + KaTeX** — output quality matters
- **Model selector pattern** — grouped dropdown by provider with colored dots
- **Extended thinking** — Anthropic's native thinking API integrated
- **Image upload** — data URL encoding, inline preview
- **Claude Code-inspired dark theme** — but cleaner and more consistent

## What Was Cut From V1 (And Why)

| Feature | Reason for Cut |
|---------|----------------|
| Convex | Vendor lock-in, proprietary query language, pricing model doesn't fit |
| Clerk | OAuth overkill for a single-user tool; access code is simpler |
| Three.js / 3D | Hurt mobile perf, distracting, zero product value |
| GSAP / Framer Motion | CSS animations are sufficient for this product |
| PostHog | No user base to analyze |
| Stripe / Billing | No paying customers yet |
| xAI / Grok | Less reliable, lower quality, adds complexity |
| Supervisor mode | Overengineered abstraction nobody used |
| Parallel execution | Unnecessary for the actual use case |
| Conditional execution | Required an extra LLM call — expensive and slow |
| Collaborative chains | Confusing UX, never worked reliably |
| Landing/pricing/features pages | No audience to market to |
| API docs page | No public API |
| Profile/preferences pages | No per-user state to manage |
| Waitlist | No launch to wait for |
| Rate limiting middleware | Access code gating is sufficient |
| Route warming | Premature optimization |
| Custom icon components (Grok) | Cut with Grok |

## V2 Known Issues & TODOs

1. **Session messages don't load on session selection** — `handleSelectSession` sets sessionId but `// TODO: Load session messages from API`. Needs a GET `/api/messages?sessionId=...` endpoint.
2. **No session deletion** — Can't remove old sessions from sidebar.
3. **No chain save/load** — `cc_saved_chains` table exists but UI doesn't use it.
4. **Image handling inconsistency** — OpenAI/Anthropic get URLs, Gemini gets base64. If a user pastes a data URL image, OpenAI/Anthropic SDKs handle it, but this is implicit.
5. **No abort propagation to server** — Client can abort the fetch, but the server continues streaming and writing to DB.
6. **No token counting / cost display** — V1 had this; V2 doesn't.
7. **No error recovery** — If one agent fails mid-chain, the whole chain stops. V1 had retry logic.
8. **Chain config doesn't persist** — Refresh loses your chain setup. Should persist to localStorage or DB.
9. **Web search toggle hidden** — `enableWebSearch` param exists in `LLMRequest` but no UI exposes it.
10. **Mobile chain builder takes 45vh** — Feels cramped when typing.

## Build Issue That Was Fixed

During the V2 build, the OpenAI SDK's top-level `new OpenAI(...)` instantiation threw `Error: The OPENAI_API_KEY environment variable is missing or empty` during `next build` because Next.js collects page data at build time.

**Fix:** Changed all three LLM provider files (openai.ts, anthropic.ts, gemini.ts) from top-level client instantiation to lazy init:

```ts
// Before (broken at build time)
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// After (lazy — only instantiated on request)
function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
```


---

# Part 4: Sandbox Repo Analysis

## Overview

A separate repository at `/home/user/chained-chat-sandbox/` was created during an earlier exploration phase to prototype a different architecture. It contains significant planning work that was never shipped.

**Stack:** Turborepo monorepo with Next.js 16 + React 19 + Tailwind v4 + pnpm workspaces.

## Repo Structure

```
chained-chat-sandbox/
├── apps/web/                        — Next.js 15 app
├── docs/
│   ├── spec.md                      — 1,400-line product spec
│   ├── agents/
│   │   └── phase-0/
│   │       ├── README.md            — Multi-agent coordination strategy
│   │       ├── 00-scaffold-agent.md — Repo initialization tasks
│   │       ├── 01-agent-infrastructure.md — DB/security/governance packages
│   │       ├── 02-agent-frontend.md — UI components, stores, hooks
│   │       └── 03-agent-api.md      — API routes, provider registry, caching
│   └── research/                    — LLM-generated research (ChatGPT, Gemini, Grok, Opus)
├── turbo.json                       — Turborepo pipeline
├── pnpm-workspace.yaml
└── package.json                     — Monorepo root
```

## The 1,400-Line spec.md — Core Concepts

**Tagline:** "One prompt. All models. See the difference."

**Core concept:** Instead of chaining (current V2), the sandbox imagined **Compare Mode** — send one prompt to 4 models simultaneously and see responses stream side-by-side in animated cards (Hebbia-style).

### Planned Differentiators

1. **Compare Mode (Phase 0 MVP):** 4 models in parallel, winner badges (fastest/cheapest/best quality)
2. **SDK-First Architecture:** `@chained/sdk` npm package for developers
3. **Cost Intelligence:** 50-90% savings via semantic caching + intelligent routing
4. **Grok Fact-Checking Chain:** Multi-agent fact verification
5. **Security Guardrails:** Dual LLM Pattern (P-LLM/Q-LLM) + LLM Guard integration

### Planned Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 App Router |
| Styling | Tailwind + Framer Motion |
| LLM Gateway | TensorZero (Rust) or Vercel AI SDK 4.1 |
| Database | Supabase PostgreSQL + Prisma ORM |
| Cache | Upstash Redis + Upstash Vector (semantic cache, 0.92 similarity threshold) |
| Auth | Clerk |
| Security | Dual LLM Pattern + LLM Guard |
| Observability | Langfuse (20k stars) + AgentOps (5.2k stars) |
| Deployment | Vercel |

### Planned Features That Were Never Built

- Semantic caching via vector similarity (Upstash Vector)
- BYOK (bring your own key) with SHA256-hashed storage per user
- Governance limits: $1/request, $5/min, $20/hr, $50/day
- Circuit breakers: 50% error rate threshold, 5 consecutive failures trip the break
- Symbolic variable system to prevent cross-model prompt injection
- Real-time trust hierarchy (Anthropic/OpenAI = high, Google/xAI = medium)
- Compare Mode UI with animated Hebbia-style cards
- Winner badges (fastest, cheapest, best quality)
- Session cost display in sticky header

## The Multi-Agent Parallel Development Strategy

The most interesting part of the sandbox isn't the features — it's the **coordination strategy** for running 3 Claude Code agents in parallel using Git worktrees.

### Agent Ownership Matrix (from docs/agents/phase-0/)

**Scaffold Agent (runs first, alone):**
- Creates repo structure, Turborepo init, Next.js scaffold, Vercel deploy
- Creates `worktrees/` directory

**Agent 1 — Infrastructure:**
- Owns: `packages/db/`, `packages/shared/`
- Modules: security, governance, observability, types
- No deps on other agents

**Agent 2 — Frontend:**
- Owns: `apps/web/src/components/`, stores, hooks, styles, `lib/` (frontend utilities)
- Depends on Agent 1's shared types

**Agent 3 — API:**
- Owns: `apps/web/src/app/api/`, `lib/providers/`, `lib/cache/`, middleware
- Depends on Agent 1's shared types and db

### Dependency Graph
```
@chained/shared (no deps)
  ↓ imported by ↓
Agent 2 (Frontend)    Agent 3 (API)
                        ↓
                    @chained/db (depends on @chained/shared)
```

### SSE Event Contract (critical coordination point)

Both Agent 2 (consumer) and Agent 3 (producer) must implement identical protocol:

```ts
{ type: 'init', modelId: 'gpt-4o' }
{ type: 'chunk', modelId: 'gpt-4o', data: 'Hello' }
{ type: 'complete', modelId: 'gpt-4o', tokens: { input: 10, output: 5 }, cost: 0.001, latencyMs: 500, cached: false }
{ type: 'error', modelId: 'gpt-4o', error: 'Rate limit exceeded' }
```

### Merge Order

1. Scaffold → main
2. Infrastructure (Agent 1) → main
3. API (Agent 3) → main (needs infrastructure)
4. Frontend (Agent 2) → main (needs infrastructure)

## Ideas From the Sandbox Worth Carrying Forward

1. **Compare Mode** is a stronger differentiator than chaining. Everyone chains — fewer products compare side-by-side beautifully.
2. **Semantic caching** is the most valuable moat available. A $0.02 Anthropic call cached and replayed is free.
3. **Governance/cost limits** are non-negotiable for any multi-user product (the $47k runaway incident is referenced multiple times in the spec).
4. **Multi-agent Claude Code with worktrees** is a real development accelerator — saw this work.
5. **Observability first:** Langfuse tracing pays dividends when debugging agent behavior.
6. **BYOK** sidesteps the infrastructure cost problem entirely for a portfolio project.

## Ideas From the Sandbox That Should Be Cut

1. **Dual LLM Pattern / Q-LLM separation** — Overkill unless this is a security product. Not relevant for a personal chaining tool.
2. **Symbolic variable system** — Same as above, overengineered for the use case.
3. **TensorZero** — Rust LLM gateway adds operational complexity. Vercel AI SDK is sufficient.
4. **Upstash Redis + Vector** — If going Cloudflare-native, use KV + Vectorize instead.
5. **Clerk** — Still wrong for this product.
6. **LLM Guard integration** — Only matters if you're running user-generated prompts against your own keys. Sidestepped by BYOK.


---

# Part 5: Lessons Learned — 6 Months of Building

## The Meta-Lesson

**This is a portfolio project with one real user (Ani's friend) and possibly a few friends with access codes. It is not a startup. Build it like a portfolio project.**

Every feature added to V1 that assumed "users" — billing, waitlist, OAuth, analytics, pricing — was wasted effort. The friend wanted to chain ChatGPT + Claude + Gemini. That's it.

## Why Convex Was Wrong

Convex is a legitimately good product for certain use cases. It was wrong here because:

1. **Vendor lock-in:** Proprietary reactive queries, proprietary schema language, no SQL escape hatch.
2. **Pricing:** Function call-based pricing punishes realtime workloads. A chat app with per-token DB writes is expensive.
3. **Developer experience degraded for this use case:** The real-time subscription model added complexity without value — a chat app doesn't need collaborative editing.
4. **Local dev friction:** `convex dev` requires a running cloud connection. Plain Postgres + Prisma/Supabase is just faster.
5. **Deployment coupling:** Convex dashboard, Convex deploys, Convex secrets — another system to manage.

**What the chat app actually needed:** A simple relational DB (Postgres). Supabase was a better fit.

## Why Clerk Was Overkill

Clerk is excellent for real products with real users. For this product:

1. **No users:** There is one user (Ani) and maybe a handful of friends.
2. **OAuth is unnecessary:** No Google sign-in needed, no Discord sign-in needed.
3. **User profiles are unused:** Nothing in the product actually needed Clerk's user metadata.
4. **Webhook complexity:** Clerk webhooks for user.created / user.updated were more code to maintain with zero product value.
5. **Cost:** Even the free tier adds one more vendor relationship.

**What the chat app actually needed:** Password in a database (or even just an access code string). A 20-line auth implementation.

## Why Supervisor Mode Failed

Supervisor mode in V1 was a meta-agent that could orchestrate other agents via @mentions. It was cut because:

1. **Unclear UX:** Users didn't understand when to use supervisor vs. a direct chain.
2. **Required extra LLM call:** The supervisor had to parse intent — slow and expensive.
3. **Parsing fragility:** @mentions were unreliable, especially with partial streaming.
4. **Solved a non-problem:** Real use cases were all linear chains anyway.

The abstraction was clever but added complexity for a workflow that a simple sequential chain already handled.

## Why 3D Animations Were a Mistake

V1 used Three.js + @react-three/fiber for animated backgrounds. This was wrong because:

1. **Mobile performance:** Three.js murders low-end phones. The site felt slow everywhere.
2. **Battery drain:** WebGL rendering runs constantly, even when idle.
3. **Bundle bloat:** Three.js is ~600KB gzipped.
4. **Zero functional value:** Decorative only. Didn't help users chain agents.
5. **Distraction:** Pulled attention from the core interaction.

**Lesson:** Portfolio projects need to feel polished, not showy. A subtle border-on-hover beats a particle field.

## Why Billing Was Premature

V1 had Stripe integration, pricing tiers, and a billing page. This was wrong because:

1. **No paying users:** Zero conversions because zero traffic.
2. **Stripe webhooks:** Added a whole event-handling surface for no benefit.
3. **Tier enforcement code:** Every feature had "is_pro" checks that were always true for the one user (Ani).
4. **Pricing page copywriting time:** Hours spent on headlines for customers who didn't exist.

**Lesson:** Don't build monetization until there's demand. Once there's demand, add a Stripe Payment Link in an afternoon.

## Why Column-Based Chat UI Feels Dated

Every AI chat product has the same layout: sidebar + vertical message feed + input at bottom. ChatGPT, Claude, Gemini, Perplexity — all identical. V1 and V2 both use this pattern.

**Problem:** For a product whose value prop is "multiple models working together," a vertical column flattens the chain into a single thread. You can't see agents working in parallel, you can't see the chain visually, you can't spatially organize experiments.

**Opportunity:** An infinite canvas (tldraw-style) where each agent is a node and connections are visible would match the product's actual topology.

**Risk:** Canvas UIs are unfamiliar. They discover poorly and power-user only. Mobile is nearly impossible.

## What The User Actually Wants vs What Was Built

The user (Ani's friend) said she wanted something like chained.chat. What she actually needs is probably just:

1. Pick two or three models
2. Give them a shared prompt
3. See what each says
4. Maybe pipe one's output into another's input

**V1 built:** 5 chain connection types, 15 DB tables, billing, waitlist, 114 files.
**V2 built:** Linear sequential chaining, 5 DB tables, 26 files.
**What she wanted:** Probably closer to V2, maybe simpler.

**Lesson:** The gap between "what one person said they want" and "complete product feature set" is where overengineering lives.

## Insights From Building Other Projects (Ani Potts LLC portfolio)

These lessons apply across the LLC's portfolio (Quantercise, anipotts.com, r-studio, merizo, etc.):

1. **The portfolio is the product.** Each individual project is a demonstration, not a business. Optimize for "showable in 60 seconds" not "10-year revenue".
2. **Ship the V2 before the V1 is done.** Every project in the LLC has gone through a "simplify everything" pass. Start simpler.
3. **Don't build custom what Vercel/Supabase/Cloudflare already does.** Every hour on custom auth, custom DB adapters, custom analytics is an hour not spent on the actual product idea.
4. **Dark theme is the right default for technical audiences** — but only if it's consistent and deliberate. Half-baked dark mode is worse than a polished light mode.
5. **Monorepos are a productivity tax for solo developers.** The sandbox's Turborepo setup added tooling overhead for zero collaboration benefit.
6. **Claude Code + git worktrees is the multiplier.** 3 parallel Claude Code sessions on independent feature branches genuinely ship faster — but only when the interface contracts are explicit (see the SSE event contract in Part 4).


---

# Part 6: Competitive Landscape — April 2026

**IMPORTANT:** The descriptions below are a starting point. You MUST research each of these products independently before designing v3. Use WebSearch or WebFetch to get current state — pricing, features, and positioning all move fast.

## Category 1: Multi-Model Chat Aggregators

These products let you chat with multiple LLMs through one interface. Most important competitors.

### TypingMind (typingmind.com)
- **What it is:** BYOK multi-model chat with plugins, prompt library, character personas
- **Why it matters:** Same positioning as chained.chat — "one interface, many models"
- **Strengths:** Mature, polished, plugin ecosystem, one-time $39 purchase (no subscription)
- **Weaknesses:** No chaining/sequencing; mostly a better chat UI
- **Research:** Current plugin ecosystem, multi-model features, whether chains exist yet

### Msty (msty.app)
- **What it is:** Desktop app for multi-model chat with local + cloud model support
- **Why it matters:** Parallel comparison ("Split Chats") and "Knowledge Stack" RAG
- **Strengths:** Native desktop, offline support via Ollama, parallel output
- **Weaknesses:** Desktop-only, no mobile, no web
- **Research:** Split Chats UX, pricing, user base size

### BoltAI (boltai.com)
- **What it is:** macOS-native AI assistant with multi-provider support
- **Why it matters:** Shows the "native app + BYOK" model
- **Strengths:** macOS integration, keyboard shortcuts, quick AI actions
- **Weaknesses:** macOS only, single-model per chat
- **Research:** How their BYOK works, pricing model

### Poe (poe.com) — Quora
- **What it is:** Massive multi-model chat with bot marketplace
- **Why it matters:** Largest consumer multi-model product
- **Strengths:** Huge model selection, community bots, mobile-first
- **Weaknesses:** Subscription required, no real chaining, closed ecosystem
- **Research:** Their new features as of 2026, revenue, bot creator economy

### LibreChat (github.com/danny-avila/LibreChat)
- **What it is:** Open-source multi-model chat (ChatGPT clone that supports many providers)
- **Why it matters:** Self-hostable competitor — anyone can run this for free
- **Strengths:** Free, open source, actively developed
- **Weaknesses:** Setup complexity, no chaining built-in
- **Research:** Star count trend, recent features, whether they've added chaining

### ChatHub (chathub.gg)
- **What it is:** Browser extension for side-by-side multi-model chat
- **Why it matters:** Solves the comparison use case without a full product
- **Strengths:** Zero setup, works across sites
- **Weaknesses:** Extension model, no state persistence, no chaining
- **Research:** User base, pricing, feature set

### OpenRouter Chat (openrouter.ai/chat)
- **What it is:** OpenRouter's hosted chat UI on top of their API aggregator
- **Why it matters:** Model selection breadth unmatched anywhere
- **Strengths:** ALL models behind one API, unified billing, BYOK optional
- **Weaknesses:** UI is basic, no chaining
- **Research:** Whether they've added multi-agent orchestration

### Hugging Chat (huggingface.co/chat)
- **What it is:** Free chat interface for open-source models
- **Why it matters:** Free tier pressure
- **Strengths:** Free, open models
- **Weaknesses:** No proprietary models, no chaining
- **Research:** Current state

## Category 2: Agent Orchestration Frameworks (Developer-Focused)

These are libraries/platforms developers use to build agent systems. NOT direct competitors but inform the technical space.

### LangGraph (github.com/langchain-ai/langgraph)
- **What it is:** Stateful agent orchestration built on LangChain
- **Relevance:** The reference implementation for "multi-agent as a graph"
- **Research:** Current API shape, popularity, pricing of LangSmith/LangGraph Cloud

### CrewAI (crewai.com)
- **What it is:** Role-based agent framework ("crews" of specialized agents)
- **Relevance:** Shows the "agents-as-teammates" framing
- **Research:** Production use cases, funding, momentum

### AutoGen (github.com/microsoft/autogen)
- **What it is:** Microsoft Research's multi-agent conversation framework
- **Relevance:** Research-grade multi-agent reference
- **Research:** Whether Microsoft is still investing, v2 launched?

### Mastra (mastra.ai)
- **What it is:** TypeScript-first agent framework (modern, developer-friendly)
- **Relevance:** Most relevant technical inspiration — TS, modern, simple
- **Research:** Current API, whether it supports chaining patterns

### Julep (julep.ai)
- **What it is:** Stateful agent platform with long-term memory
- **Relevance:** Shows the stateful/memory angle
- **Research:** Business traction, developer experience

### AgentStack (agentstack.sh)
- **What it is:** CLI for scaffolding agent systems
- **Relevance:** Shows tooling conventions
- **Research:** Whether it's being used in production

## Category 3: Canvas / Spatial AI Interfaces

These hint at what a visual v3 could look like.

### tldraw AI (tldraw.dev/ai)
- **What it is:** Infinite canvas with AI integration (drawing → code, etc.)
- **Relevance:** Best-in-class canvas primitive; MIT licensed React lib
- **Research:** tldraw's API for custom shapes, how they integrate AI

### Cursor Composer / Canvas (cursor.com)
- **What it is:** IDE-integrated multi-file code generation with visual diff
- **Relevance:** Shows canvas thinking applied to code
- **Research:** Current Composer UX patterns

### Replit Agent (replit.com/agent)
- **What it is:** End-to-end app building with an AI agent
- **Relevance:** The "vibe coding" target user
- **Research:** Growth metrics, Agent 3 features

### v0 by Vercel (v0.dev)
- **What it is:** UI generation from prompts with visual iteration
- **Relevance:** Shows "generate + iterate visually" as a pattern
- **Research:** Whether they've moved to chain-of-generations

### bolt.new (Stackblitz)
- **What it is:** Full-stack app generation in the browser
- **Relevance:** Another "build an app with AI" player
- **Research:** Competitive positioning vs. v0 and Replit

### Figma AI (figma.com)
- **What it is:** AI features inside Figma (design to code, etc.)
- **Relevance:** Canvas + AI in a mature product
- **Research:** Whether they've built workflow/chaining

## Category 4: API Aggregators (Infrastructure)

If v3 doesn't want to ship its own provider integrations.

### OpenRouter (openrouter.ai)
- **What it is:** Unified API for 100+ models with unified billing
- **Relevance:** Could be the entire LLM layer for v3
- **Pricing:** Pay-as-you-go, small markup over provider rates
- **Research:** Latest model coverage, SLA, failover behavior

### LiteLLM (litellm.ai)
- **What it is:** Python SDK + proxy for unified LLM access
- **Relevance:** Self-hosted alternative to OpenRouter
- **Research:** Proxy features, self-hosted cost

### Portkey (portkey.ai)
- **What it is:** AI Gateway with caching, observability, budgets
- **Relevance:** What you'd want if building for production scale
- **Research:** Features, pricing, comparison to OpenRouter

### Cloudflare AI Gateway
- **What it is:** Cloudflare's LLM proxy with caching, rate limiting, analytics
- **Relevance:** If going Cloudflare-native, this is THE answer for LLM routing
- **Research:** Current features, pricing, which providers are supported

### Helicone (helicone.ai)
- **What it is:** Observability layer for LLM calls
- **Relevance:** Alternative to Langfuse
- **Research:** Comparison to Langfuse, pricing


## Category 5: Developer Tooling (Supporting Stack)

### Vercel AI SDK (sdk.vercel.ai)
- **What it is:** Unified SDK for streaming, tool-calling, structured outputs across providers
- **Relevance:** V2 keeps this as a dep. For v3, it's the likely choice for UI streaming hooks
- **Research:** Current version, new features, React Server Component integration

### Instructor (jxnl.github.io/instructor)
- **What it is:** Structured outputs from LLMs via Pydantic (also TS port)
- **Relevance:** If v3 needs typed agent outputs
- **Research:** Maintainers, current state

### Outlines (github.com/dottxt-ai/outlines)
- **What it is:** Constrained LLM generation (regex, JSON schema, grammars)
- **Relevance:** If v3 needs guaranteed-structured outputs

### Langfuse (langfuse.com)
- **What it is:** Open-source LLM observability
- **Relevance:** V3 should have observability from day one
- **Research:** Self-hosted vs cloud pricing

## Key Questions the Agent Must Answer Before Designing V3

1. **Does the "chained" positioning actually differentiate?** Everyone compares; nobody chains — but is that because chaining is unique, or because it's not useful?
2. **Is there a canvas/spatial competitor that already nailed this?** Check Rive AI, Flowise (github.com/FlowiseAI/Flowise), Langflow (langflow.org).
3. **Has OpenRouter become the infrastructure default?** If so, v3 should use it instead of direct SDKs.
4. **Have any of the multi-model chat products added real chaining?** If TypingMind or Msty shipped it, the differentiation is gone.
5. **What's the state of the art in streaming UX?** Check the "Chasing 240 FPS in LLM Chat UIs" blog post referenced in the sandbox spec.
6. **Is BYOK expected now?** In 2026, most power users manage their own API keys. Hosting keys is a liability.
7. **Mobile-first or desktop-first?** Look at usage data for competitors if public.

## Market Positioning Analysis Framework

For v3, answer these:

- **Primary user:** Portfolio visitor evaluating Ani's skills? Ani herself? Her friend?
- **Primary job-to-be-done:** "Compare models," "Chain models," "Build agent workflows," "Be a portfolio piece"?
- **Moat:** Canvas UX? Chain library? Performance? Aesthetics? Being open-source?
- **Positioning one-liner:** What does chained.chat do that nothing else does as well?

## What's Actually Monetizable in This Space

If v3 were to monetize (debatable — see Part 10), the options are:

1. **BYOK + flat subscription** (TypingMind model): $40/year for unlimited use, user pays providers directly. Low revenue per user but zero infra cost.
2. **Markup on API calls** (OpenRouter model): Users pay you, you pay providers + margin. Requires usage at scale.
3. **Hosted + usage caps** (Poe model): Free tier with limits, paid tier for power users. Requires infra budget.
4. **One-time app purchase** (BoltAI/older TypingMind model): $30-50 one-time. Frictionless but no recurring revenue.
5. **Open-source + hosted tier** (LibreChat-adjacent): Free to self-host, paid cloud. Splits audience.
6. **Portfolio/lead-gen only**: Don't monetize. Product exists to demonstrate Ani's engineering.

**For Ani Potts LLC portfolio project:** Option 6 is probably right. Monetization distracts from the actual goal of demonstrating engineering capability.


---

# Part 7: V3 Architecture Exploration

This section presents architectural options for v3. **The new agent should not adopt these decisions uncritically.** Research, benchmark, and challenge before deciding.

## Backend Options

### Option A: Cloudflare-Native Stack (Ani's Current Lean)

**The stack:**
- **Workers:** Compute. Edge-deployed, 0ms cold start, 30s CPU limit (or 15min on Unbound)
- **D1:** SQLite-on-edge. Read-heavy workloads are fast. Writes via primary region.
- **R2:** S3-compatible object storage. Free egress. For images/files.
- **KV:** Eventually-consistent key-value. For cache, sessions.
- **Durable Objects:** Stateful, single-instance-per-key. For persistent connections.
- **Queues:** Async message processing. For chain execution that exceeds Workers timeout.
- **AI Gateway:** LLM proxy with caching, rate limiting, analytics.
- **Hyperdrive:** Connection pooling for external Postgres if needed.
- **Vectorize:** Vector DB for semantic caching (replaces Upstash Vector in the sandbox plan).

**Pros:**
- One vendor for 80% of the stack. Simplified billing, auth, observability.
- Edge-native: globally fast out of the box.
- No cold starts.
- Cost-effective at small scale (likely free tier).
- Modern DX: Wrangler CLI is good.
- AI Gateway is purpose-built for exactly this use case.

**Cons:**
- D1 is still maturing — write-scaling has rough edges.
- Durable Objects have a learning curve.
- Workers has 30s CPU limit (though 15 min on Unbound). Long chains might exceed it.
- Vendor lock-in (though less proprietary than Convex).
- Debugging edge code is harder than debugging a Node server.
- Hot reload / local dev is improving but not as smooth as Next.js dev.

**Cost model:** Free tier is generous. At Ani's scale, probably $0/month. Paid plan is $5/month for most Workers features.

### Option B: Stay With Supabase

**The stack:** Current V2 stack — Supabase Postgres + Next.js on Vercel.

**Pros:**
- Already working.
- PostgreSQL is reliable and familiar.
- Supabase Studio UI is excellent for debugging.
- Vercel deploys are frictionless.
- Edge Functions + Supabase + Vercel is a known-good combination.

**Cons:**
- Two vendors (Supabase + Vercel).
- Cold starts on Vercel serverless.
- Supabase project shared with other Ani Potts LLC projects — table prefix hack.
- No native LLM proxy/caching — have to build it.
- Realtime features require extra setup.

**Cost model:** Supabase free tier + Vercel Hobby = $0/month at current scale.

### Option C: Convex (Not Recommended)

**Why not:** Vendor lock-in, pricing model, proprietary query language. V1 tried this — see Part 5.

### Option D: Bare Postgres + Custom Everything

**The stack:** Postgres on Neon/Railway + Drizzle ORM + custom auth + Cloudflare Workers or Hono.

**Pros:**
- Maximum control.
- Portable across providers.

**Cons:**
- Have to build everything. Portfolio-project over-engineering territory.
- More things to maintain.

**Verdict:** Not for this project. Use a BaaS.

### Recommendation for New Agent

Probably go with **Option A (Cloudflare-native)** because:
1. It's a portfolio project — showcasing Cloudflare stack is portfolio-valuable.
2. AI Gateway is genuinely the best LLM proxy available.
3. D1 is production-ready for read-heavy workloads.
4. It forces simplicity: Workers' constraints prevent feature creep.

**But challenge this.** If the new agent evaluates and concludes Supabase is better, respect that.


## Frontend Framework Options

### Option A: SvelteKit 2

**Why interesting:**
- Compiled output: tiny bundles (~15KB vs React's ~45KB).
- Built-in SSR, load functions, form actions.
- Svelte 5 runes are modern and ergonomic.
- Store-based reactivity is perfect for streaming UIs.
- The `{#each ... }` + transition primitives handle streaming text beautifully.

**Why risky:**
- Ani's experience is primarily React/Next.js.
- Smaller ecosystem — fewer pre-built components.
- Hiring/collaboration harder (but this is a solo project).
- Cloudflare adapter exists but Next.js has better CF support.

### Option B: SolidStart

**Why interesting:**
- Fine-grained reactivity: no virtual DOM, minimal re-renders.
- JSX syntax — familiar to React devs.
- Genuinely the fastest client-side framework benchmarks-wise.
- Strong primitives for streaming (Suspense, Resource).

**Why risky:**
- Smaller ecosystem than Svelte.
- Less mature (SolidStart is newer than SvelteKit).
- Learning curve even for React devs (the reactivity model is different).

### Option C: Qwik

**Why interesting:**
- Resumability: zero JS hydration cost.
- Great for content sites.

**Why risky:**
- Different mental model than React.
- Ecosystem is smallest of the three.
- Maybe overkill for a client-heavy app like this.

### Option D: Stay With Next.js 15 / React 19

**Why interesting:**
- Already know it.
- RSC (React Server Components) + Server Actions are genuinely powerful for this use case.
- Largest ecosystem, best AI SDK support (Vercel AI SDK).
- Ship fast.

**Why risky:**
- Bundle size is larger than alternatives.
- Client-side reactivity is coarser than Solid.
- "What everyone else uses" — lower portfolio differentiation.

### Framework Decision Matrix

| Factor | SvelteKit | SolidStart | Qwik | Next.js |
|--------|-----------|-----------|------|---------|
| Bundle size | Excellent | Excellent | Best | Poor |
| Streaming UX | Excellent | Excellent | Good | Good |
| Ecosystem | Medium | Small | Small | Best |
| Portfolio value | High | High | Medium | Low |
| Ani's speed | Medium | Medium | Slow | Fastest |
| Cloudflare adapter | Good | Good | Good | OK |

### Recommendation for New Agent

**SvelteKit** is probably the strongest portfolio play: tiny bundles, reactive primitives well-suited to streaming, and it demonstrates range beyond React. But if shipping velocity matters more than portfolio differentiation, **stay with Next.js 15**.

## UI Pattern Options

### Option A: Traditional Chat (Current V2)

Sidebar + message feed + input. Proven, familiar. Downside: flat representation of chains.

### Option B: Infinite Canvas (Ambitious)

Chain agents as nodes on a canvas. Connections visible as edges. Results stream into each node.

**Libraries to evaluate:**
- **tldraw** (tldraw.dev) — MIT, React, extensible custom shapes, excellent DX. Best for polish.
- **ReactFlow / XYFlow** (reactflow.dev) — Purpose-built for node-based UIs. Best for "graph of agents" semantics.
- **Excalidraw** (excalidraw.com) — MIT, React, simpler than tldraw. Less suited to programmatic nodes.
- **Custom with Konva/Pixi/WebGL** — Maximum control, most effort.

**Pros of canvas:**
- Matches the product's actual topology.
- Strong portfolio differentiation.
- Enables visual chain-building with minimal text.

**Cons of canvas:**
- Mobile is a UX nightmare.
- Discovery is poor — new users don't know what to do.
- Harder to build and maintain.
- Performance with many nodes is non-trivial.

### Option C: Hybrid (Recommended)

Default view: traditional chat. "Canvas mode" toggle for power users who want to visualize the chain.

### Option D: Columnar Comparison (from Sandbox)

Side-by-side streaming cards, one per model, with winner badges. Works beautifully for Compare Mode but doesn't support chaining.

## Streaming Architecture Options

### Option A: SSE (current V2)
- Simple, HTTP-native, works everywhere.
- One-way: server → client.
- Proven in V2.

### Option B: WebSockets + Durable Objects
- Bidirectional: enables server → client streaming + client → server interruption.
- Durable Objects give a persistent stateful target per chain session.
- More complex to set up.
- Best for real-time collaboration or persistent streams across multiple consumers.

### Option C: WebTransport (HTTP/3)
- Future-forward: HTTP/3, multi-stream, lower overhead.
- Browser support is improving but not universal.
- Overkill for this use case.

### Recommendation

**SSE** for streaming output (current approach). Add **Durable Objects + WebSockets** only if v3 adds real-time collaboration.


## Recommended V3 Stack (Starting Point, Not Final)

Based on the above, a plausible v3 stack:

```
Frontend:    SvelteKit 2 on Cloudflare Pages
Backend:     Cloudflare Workers
Database:    Cloudflare D1 (SQLite)
Storage:     Cloudflare R2 (images)
Cache:       Cloudflare KV + Vectorize (semantic cache)
LLM Proxy:   Cloudflare AI Gateway
Realtime:    Durable Objects (only if needed)
Streaming:   SSE via Workers
Observ:      Cloudflare Analytics + optional Langfuse
Auth:        Access code in D1 + HttpOnly cookie
Deployment:  wrangler deploy
```

**Total vendors:** 1 (Cloudflare) + LLM providers.

**Expected cost at Ani's scale:** $0-5/month.

## Migration Path From V2 → V3

1. **Greenfield or in-place?** Recommended: greenfield. Build v3 in a new branch/repo, port data via SQL export/import.
2. **Data migration:** Export `cc_*` tables from Supabase → import to D1. Trivial since schema is small.
3. **Preserve the access code:** `chained2026` continues to work.
4. **DNS cutover:** Once v3 is stable, switch chained.chat DNS from Vercel to Cloudflare Pages.
5. **Keep V2 archived:** Tag V2 on the main branch. Useful reference and rollback.


---

# Part 8: User Journey & Wireframe Spec

This is the reference spec for Claude Design Labs (or any designer/agent) working on v3 UI. Every view, every state, every edge case.

## Primary User Journeys

### Journey 1: First-Time Visitor
1. Lands on chained.chat
2. Sees access gate (single input, no sign-up flow)
3. Enters access code
4. Lands on empty state with chain presets
5. Picks "Draft & Review" preset
6. Types message
7. Watches streaming output from both agents
8. Sees result, understands the concept

### Journey 2: Returning User
1. Lands on chained.chat
2. Auto-authenticated via stored cookie
3. Sees sidebar with previous conversations
4. Clicks a conversation OR starts a new chat
5. If new: chain builder is pre-populated with last-used chain
6. Types message, gets result

### Journey 3: Custom Chain Builder
1. Returning user, starts new chat
2. Clicks "blank chain" to skip presets
3. Adds agent 1: selects model, names it, writes system prompt
4. Adds agent 2: same
5. Optionally saves the chain with a name
6. Submits message

### Journey 4: Mobile User
1. Opens chained.chat on phone
2. Sidebar is hidden by default
3. Chain config collapses to a bottom sheet
4. Input area sticks to bottom, keyboard-aware
5. Streaming fills the viewport nicely
6. Tap to expand individual agent outputs

## View Inventory

### V1: Access Gate
**Purpose:** Gate access to the product with a simple code.

**Components:**
- Centered card (max-width 400px)
- Lock icon (20px, cc-accent color)
- "chained.chat" wordmark (mono, semibold)
- Subtitle: "Enter your access code to continue"
- Single input field with inline submit button (→ arrow)
- Error state below input in red mono text

**States:**
- Default (empty)
- Typing (input has content, submit enabled)
- Loading (spinner replaces arrow)
- Error (red text: "Invalid access code")
- Success (redirects to dashboard)

**Mobile:** Full-screen centered layout, 16px input font to prevent zoom.

### V2: Dashboard / Session List (Sidebar)
**Purpose:** Navigate between conversations + start new ones.

**Components:**
- Header: "chained.chat" wordmark + [+] new chat button + [X] close (mobile)
- Session list items:
  - MessageSquare icon + title (truncated)
  - Subtitle: formatted date ("Today", "Yesterday", "3d ago", "Mar 15")
  - Active state: cc-surface background
- Footer: "Sign out" button

**States:**
- Populated (list of sessions)
- Empty ("No conversations yet")
- Loading (skeleton rows)

**Mobile:** Slide-in drawer from left, overlay backdrop, swipe-to-close.

### V3: Canvas Workspace (The Main Interface, v3-specific)
**Purpose:** Configure + run agent chains.

**V2 layout (current):** Top bar + collapsible chain builder + message list + input.

**V3 canvas proposal:**
- Full-viewport canvas (tldraw-style)
- Agent nodes draggable
- Connections as edges (auto-routed)
- Input panel docked at bottom
- Minimap in corner
- Toolbar: add agent, save chain, run

**Canvas node design (per agent):**
- 200×160px card
- Header: provider-color dot + agent name + model badge + [X] remove
- Body: system prompt textarea (collapsed) / expanded
- Footer: status indicator (idle/streaming/done/error) + timing
- While streaming: border pulses in provider color, text streams in
- Drag handle on left edge (GripVertical icon)

**Connection edges:**
- Straight line with small arrow
- Provider gradient along the line (from-color to to-color)
- Animated dash while data flows

**Empty state:**
- Large "+" in center of canvas
- Preset buttons floating nearby
- "Start here" hint text

### V4: Chain Configuration (Dialog/Panel)
**Purpose:** Detailed agent editing when tapping a node.

**Components:**
- Modal or side panel
- Fields: name, model (selector), system prompt (textarea), temperature (slider), web search (toggle)
- Save/cancel buttons

**States:**
- New (all empty, Save disabled until required fields filled)
- Editing (populated, Save enabled)
- Invalid (red border on bad field)

### V5: Real-Time Execution View
**Purpose:** Watch chain execution unfold.

**Components (canvas variant):**
- Active agent node glows in provider color
- Previous agent nodes shown as "done" (green checkmark)
- Future nodes shown as "pending" (dim)
- Output streams inside each node as it happens
- A "run timeline" shows which agent is active, with progress

**Components (traditional chat variant, matches V2):**
- Chain message with agent step rows
- Each row: avatar, name, provider, streaming text
- Blinking cursor on the active row
- "done" indicator on completed rows
- "thinking" collapsible section for models that expose it

### V6: Results / History View
**Purpose:** Review a past chain run.

**Components:**
- Same layout as execution, but all done
- Copy button per agent output + full chain output
- Share button (creates shareable link with saved state)
- Re-run button (with option to modify prompt or chain)
- Metrics: total duration, tokens in/out, cost per agent

### V7: Settings / Preferences
**Purpose:** Configure personal defaults.

**Components:**
- API keys (BYOK if implemented): masked input per provider
- Default model per provider
- Theme toggle (dark-only for v2, maybe light-mode for v3)
- Data export (download your chats as JSON)
- Delete account / clear data

### V8: Admin View (Ani-Only)
**Purpose:** Manage access codes and see system state.

**Components:**
- List of access codes: code, label, active, created, last used
- Create/revoke access code
- See all sessions across all codes
- Usage metrics (total chains run, tokens consumed, cost)
- Access only via a specific admin access code

### V9: Saved Chains Library
**Purpose:** Reuse previously-saved chain configurations.

**Components:**
- Grid or list of saved chains
- Each card: name, description, agent chips
- Click to load into chain builder
- Edit/delete actions


## State Inventory (All Edge Cases)

### Loading States
- Session list loading → skeleton rows
- Message stream loading → skeleton lines with shimmer
- Image upload → thumb with progress ring
- Model selector loading → spinner in button
- Auth verification → spinner replaces submit arrow

### Empty States
- No sessions yet → "No conversations yet" with hint
- No agents in chain → "Quick Start" preset grid
- No messages in session → "Chain AI models together" centered
- No saved chains → "Save a chain to reuse it later"

### Error States
- Invalid access code → red "Invalid access code" under input
- Stream error mid-chain → `**Error:** <message>` appended to the current agent's output, isStreaming=false
- Image upload too large → toast "Image too large (max 20MB)"
- API rate limit → toast "Rate limit hit — wait a moment"
- Network offline → banner "Offline — reconnecting..."
- Model unavailable → "Model temporarily unavailable, try another"
- Provider API key invalid → "Provider key invalid — check settings"

### Edge Cases
- **Stream abort mid-chain:** User clicks back/refresh. Save partial output. Mark remaining agents as "cancelled".
- **Very long input (>8000 chars):** Truncate preview, allow scroll, warn about token cost.
- **Very long output:** Implement virtualization (react-virtuoso or similar) so 50k tokens don't crash the page.
- **Browser back button:** Preserve current session state, don't lose unsent input.
- **Multiple tabs same user:** Last-write-wins for session state, warn on stale writes.
- **Clock skew:** Use server timestamps, never client.
- **Emoji/unicode in prompts:** Handle correctly in all SDKs (sometimes cause streaming artifacts).
- **Code block rendering during streaming:** Don't flash on every token — buffer until language is detected.
- **LaTeX rendering during streaming:** Same — complete expressions only.

### Mobile-Specific States
- Portrait vs landscape
- Keyboard open (viewport shrink — use `height: 100dvh`)
- Pull-to-refresh on message list (disable or handle)
- Safe area insets (iOS notch, Android nav bar)
- Tap targets minimum 44×44px
- Chain builder collapsed by default

### Dark/Light Mode
V2 is dark-only. For v3, consider:
- System preference default
- Manual override in settings
- All cc-* colors have light-mode equivalents defined
- Images and code blocks look right in both

## Interaction Patterns

### Input Area
- Auto-resize textarea up to 200px
- Enter = submit, Shift+Enter = newline
- Cmd/Ctrl+Enter on mobile = submit
- Paste image = upload
- Drag-drop image = upload
- @ shortcut (v3) = insert agent reference

### Agent Card (Canvas)
- Click = select (shows edit panel)
- Double-click = expand inline
- Drag = reposition
- Drag from edge = create connection
- Right-click = context menu (duplicate, delete, change model)

### Streaming Interaction
- Abort button appears during streaming (top-right of active agent)
- Click abort = AbortController.abort() + server cleanup
- Resume (v3?) = if the stream disconnects, try to reconnect and continue

### Keyboard Shortcuts (v3)
- `Cmd+N` / `Ctrl+N` = new chat
- `Cmd+K` / `Ctrl+K` = command palette
- `Cmd+Enter` = submit
- `Esc` = close modal / cancel edit
- `/` = focus input
- `Shift+?` = show keyboard shortcuts help

## Responsive Breakpoints

- **Mobile:** <768px — sidebar hidden, chain builder bottom sheet, full-width messages
- **Tablet:** 768-1024px — sidebar collapsible, chain builder inline
- **Desktop:** >1024px — sidebar always visible, chain builder side panel or inline
- **Wide:** >1440px — optional center-column width constraint (max 1200px content)

## Accessibility Requirements

- All interactive elements keyboard-accessible
- `aria-label` on icon buttons
- `aria-live="polite"` on streaming regions for screen readers
- Color contrast: all text meets WCAG AA (4.5:1 normal, 3:1 large)
- Focus rings visible and styled (2px cc-accent outline)
- Reduced motion respect (`prefers-reduced-motion`): disable fade-in, pulse animations
- Font sizing respects browser zoom


---

# Part 9: Multi-Session Claude Code Strategy

Building v3 efficiently means parallelizing across multiple Claude Code sessions. This section lays out how.

## Why Multi-Session

Ani has a $200/mo Claude Code usage limit. Running 2-3 parallel sessions on independent concerns can:
- Cut wall-clock build time in half or more
- Maximize usage allotment value
- Force good modular architecture (sessions can't share context, so interfaces must be explicit)

## Session Split (Recommended for V3)

### Session A: Backend/Infrastructure
**Owns:**
- Cloudflare stack setup (Workers, D1, KV, R2, AI Gateway)
- Database schema + migrations
- Auth (access code verification, cookie management)
- LLM provider integrations (or AI Gateway config)
- SSE streaming endpoint
- Session/message CRUD endpoints

**Outputs:** Working API, deployed to Cloudflare, with docs.

**Working branch:** `claude/v3-backend-<session-id>`

### Session B: Frontend
**Owns:**
- SvelteKit (or Next.js) app scaffold
- All UI components
- Streaming consumer hooks
- State management (stores)
- Styling system

**Outputs:** Working UI that consumes Session A's API.

**Working branch:** `claude/v3-frontend-<session-id>`

### Session C (Optional): Canvas / Advanced UI
**Owns:**
- Canvas workspace (tldraw or ReactFlow integration)
- Node/edge custom shapes
- Advanced interactions (drag-drop, connection drawing)
- Visual execution rendering

**Outputs:** Canvas mode toggleable from main UI.

**Working branch:** `claude/v3-canvas-<session-id>`

## Shared Coordination Artifacts

All sessions read and write to these coordination files:

### 1. `docs/v3/api-contract.md`
The SSE event protocol, endpoint shapes, error codes. **Session A writes, Session B & C consume.** Any change requires notifying the other sessions.

### 2. `docs/v3/schema.sql`
The D1 schema. **Session A owns.** Changes flow to B & C via type regeneration.

### 3. `packages/shared/types.ts` (if monorepo)
Zod schemas for API request/response. Both sessions import. **Single source of truth for types.**

### 4. `.env.example`
Environment variables needed. Sessions update as they add vars.

### 5. `docs/v3/progress.md`
Running log: what's done, what's blocked, what's next. Update after every major milestone.

## Coordination Rules

1. **Don't edit each other's files.** If Session B needs to change something in `/backend`, open a small coordination PR or leave a comment in `progress.md`.
2. **Merge order: backend first.** Frontend depends on API shape. Canvas depends on both.
3. **Verification gates:** Before merging any session's work:
   - Type-check passes
   - The session's local demo works
   - The SSE contract hasn't changed unilaterally
4. **Shared local dev:** Document how to run everything together (`docker-compose.yaml` or a Makefile).

## Git Branching Strategy

```
main (v2, current production)
  └── claude/v3-main (the v3 integration branch)
        ├── claude/v3-backend-<session-id>
        ├── claude/v3-frontend-<session-id>
        └── claude/v3-canvas-<session-id>
```

Each session branch lives in its own Git worktree:
```bash
git worktree add worktrees/backend claude/v3-backend-<session-id>
git worktree add worktrees/frontend claude/v3-frontend-<session-id>
git worktree add worktrees/canvas claude/v3-canvas-<session-id>
```

Sessions work in their own worktree, don't step on each other's files.

**CRITICAL:** Branch names MUST start with `claude/` and end with the session ID, otherwise pushes will fail with 403.

## Verification Checkpoints

Before merging Session A (backend):
- [ ] All endpoints respond correctly via `curl`
- [ ] Schema migration applies cleanly
- [ ] Auth rejects bad codes and accepts `chained2026`
- [ ] Stream endpoint yields correct SSE format for a test chain
- [ ] Observability: can see a request in Cloudflare dashboard

Before merging Session B (frontend):
- [ ] App builds without type errors
- [ ] Auth gate accepts code and transitions to dashboard
- [ ] Chain builder correctly produces valid request payload
- [ ] Streaming display handles all event types correctly
- [ ] Mobile layout tested on actual phone (not just dev tools)

Before merging Session C (canvas):
- [ ] Canvas renders nodes for each agent
- [ ] Connections route correctly
- [ ] Drag-drop works smoothly on desktop
- [ ] Canvas mode toggles cleanly back to traditional mode
- [ ] Performance: 4-agent chain runs at 60fps during streaming

## Maximizing $200/mo Usage Efficiency

- **Use Sonnet for most work.** Opus for architecture decisions, schema design, complex debugging.
- **Don't let sessions idle.** If a session is waiting on research, kill it and come back later.
- **Batch questions to Ani.** Don't ping the user for every small decision — collect and ask once per milestone.
- **Avoid re-exploration.** Each session should read this HANDOFF.md first, then never re-exhaustively explore the codebase.
- **Keep context lean.** Long threads eat context budget. Branch into new sessions when a task is complete.
- **Use Explore subagents liberally.** Cheaper context, narrower focus.
- **Log decisions.** `docs/v3/decisions.md` prevents re-litigating the same questions across sessions.


---

# Part 10: Questions for Ani — The Consultant's Challenge

**This is the most important section of this document.**

You are not a yes-man. You are not a code monkey. You are a challenging consultant engaged by Ani Potts LLC to interrogate this project before writing a single line of v3 code. Your job is to prevent another 6-month rebuild.

Do not skip this section. Do not rush through it. **Ask every question. Wait for answers. Push back when answers feel soft.**

The last two versions failed because nobody asked these questions up front. Don't be the third.

## 10.1 Tone & Posture

You are a **senior technical advisor / business partner** reviewing a founder's third attempt at the same product. The founder has runway, talent, and conviction — but also a pattern of over-engineering and premature scope expansion. Your allegiance is to the success of the business, not to the founder's current excitement.

Rules for this session:
- Push back hard on any answer that begins with "I think" or "maybe" or "it would be cool if"
- If Ani can't articulate *who will pay for this and why*, that is a red flag — name it
- Do not start writing code until you have answers to **Section 10.3 (Business Viability)** and **Section 10.4 (Scope)**
- If Ani gives an answer that contradicts evidence in this HANDOFF (e.g., "users love supervisor mode" when there are no users), surface the contradiction
- You are allowed to tell Ani: "I don't think you should build this." That is more valuable than shipping the wrong thing for the third time.

## 10.2 Before You Ask Anything — What to Read First

Before the first question, the agent must have read:
1. This entire HANDOFF.md (especially Part 5: Lessons Learned)
2. The current V2 codebase (`/home/user/chained-chat/`)
3. The V1 git history summary in Part 2
4. The sandbox spec at `/home/user/chained-chat-sandbox/docs/spec.md`

If you skip the reading and ask questions cold, you will ask bad questions and waste Ani's time. Do the homework first.

## 10.3 Business Viability — The Hardest Questions

These are the questions that should make Ani uncomfortable. If they don't, you're asking them wrong.

**B1. Who is the target user?**
- Not "developers" or "AI enthusiasts" — a specific persona
- Do you know 5 people by name who would use this weekly?
- Of those 5, how many would pay $20/mo for it?
- If the answer is zero, what does that tell you?

**B2. What is the actual job-to-be-done?**
- Is this a *tool* (solves a specific task) or a *toy* (interesting to play with)?
- If it's a tool: what task, and what's the current workaround people use?
- If it's a toy: how is that compatible with monetization?

**B3. Why would someone use chained.chat instead of TypingMind / Poe / OpenRouter Chat / ChatGPT?**
- The honest answer, not the marketing answer
- "Chains of agents" is a *feature*, not a differentiator — those competitors can add it in a weekend
- What's the moat? What's the 10x improvement? What's the unique insight?

**B4. Is this actually a portfolio piece or a startup?**
- Ani Potts LLC is described as holding "portfolio projects." ChainedChat is explicitly "not the flagship."
- If it's a portfolio piece: what's the portfolio goal? Demonstrating capability? Attracting clients? SEO?
- If it's a startup: what's the funding/runway plan? Solo vs hire?
- These two paths demand **very different** architectures. A portfolio piece optimizes for impressiveness per hour; a startup optimizes for iteration speed and unit economics.

**B5. What happens if you build v3 and it gets 0 paying users in 3 months?**
- Do you shut it down? Pivot? Keep going?
- If you'd keep going regardless, that's fine — but name it as a hobby and budget accordingly
- If you'd shut it down, what's the kill criterion? Specific numbers.

**B6. What's the total time budget for v3?**
- V1 took ~3 months. V2 took ~1 month. What's the limit on v3 before you cut bait?
- How does that budget constrain scope?

**B7. Have you talked to the friend from the iMessage screenshot recently?**
- That was the inciting demand signal. Has it been validated?
- Would they actually use v3 if it existed? What features do they need?
- Are there 4 more people like them?

**B8. What would make you say "this is done"?**
- A concrete definition of success for v3
- Not "it works well" — a measurable outcome (X users, $Y MRR, Z % retention, or simply "I use it every day for a month")

## 10.4 Scope — MVP vs Full Vision

The v1 mistake was building the full vision before validating the MVP. Don't repeat it.

**S1. What is the single-sentence description of v3?**
- If it takes more than one sentence, the scope is too wide
- Good: "A multi-model chat UI where you can chain 2-5 AI agents together to collaborate on a task."
- Bad: "A unified platform for orchestrating AI agent workflows with real-time collaboration, extended reasoning, and visual canvas editing."

**S2. What is the smallest version you would still ship?**
- If Cloudflare migration adds 2 weeks of work for zero user-facing benefit, should it be in v1?
- If the canvas UI is 4 weeks of work, should it be in v1 or v2?
- Rank every feature idea by: "would shipping without this break the product?"

**S3. What is explicitly *not* in v3 scope?**
- Write the non-goals list before the goals list
- Not in scope: billing? auth beyond access codes? mobile app? team accounts? image generation? file uploads? search?
- Each "not in scope" is a gift of time

**S4. Are you reusing V2 or rebuilding from scratch?**
- V2 works. It streams. It has extended thinking. It has a clean schema.
- What's the argument for rebuilding vs iterating?
- If "Cloudflare backend" is the only reason, that's probably not enough — can you port V2 incrementally?
- If "canvas UI" is the reason, the canvas could be a new component in V2

**S5. Svelte vs Next.js — what's the actual reason?**
- "Svelte has smaller bundles" — is bundle size your bottleneck right now? (You have 0 users.)
- "I want to learn Svelte" — that's a valid reason for a portfolio piece, not for a startup
- "Next.js 16 had breaking changes" — OK, but does that justify abandoning the ecosystem?
- **Choose with your eyes open.** Don't frame a preference as a necessity.

## 10.5 Technical Architecture — Questions Requiring Human Input

**T1. Cloudflare lock-in — are you OK with it?**
- Workers + D1 + R2 + Durable Objects = Cloudflare-native
- Migrating off is non-trivial (D1 is SQLite but DO is proprietary)
- Is this a calculated bet (cheap, fast, global) or a fashion choice (shiny tech)?

**T2. Access codes vs real auth — long-term plan?**
- Access codes worked for V2 because there are 0 paying users
- If v3 gets paying users, you need real accounts for billing/audit
- Do you want to defer this (keep access codes) or do it right from day one?

**T3. LLM cost exposure — who pays for tokens?**
- Current V2: Ani pays all LLM costs out of the Anthropic/OpenAI/Google accounts
- If v3 has users running 5-agent chains with Opus + extended thinking, a single session can cost $2-5
- Is the plan: (a) pass-through costs via user BYOK, (b) flat subscription, (c) metered billing, (d) Ani eats it?
- This decision changes the architecture (BYOK needs key storage, metered needs usage tracking, subscription needs Stripe)

**T4. Data retention — what lives forever?**
- V2 stores all messages and agent steps in Supabase indefinitely
- If v3 is multi-tenant, this becomes a liability (GDPR, storage cost, PII)
- Retention policy: 7 days? 30 days? forever? user-configurable?

**T5. Realtime architecture — SSE vs WebSocket vs DO?**
- V2 SSE works. Durable Objects would enable multi-device sync and resumable streams.
- Do you need multi-device sync? Resumable streams? Or is SSE-per-request still fine?
- Answer drives whether Durable Objects is in scope.

**T6. Canvas: ReactFlow vs tldraw vs custom?**
- ReactFlow is the easy win for node-based chains — but it's "just another n8n clone"
- tldraw is freeform, more original, but higher implementation cost
- Custom is the riskiest, highest-reward play
- Which risk/reward tradeoff matches the portfolio-vs-startup positioning from B4?

## 10.6 Pricing & Monetization

**P1. Free tier: yes or no?**
- Free tier = acquisition channel + token costs + spam vector
- No free tier = slower growth, cleaner signal
- Which fits the time budget from B6?

**P2. What's the subscription price?**
- $10? $20? $50?
- What's the frame? TypingMind is $39 lifetime. Poe is $20/mo. ChatGPT Plus is $20/mo.
- Why would someone pay you vs them?

**P3. BYOK (bring your own key) or managed keys?**
- BYOK: zero LLM cost to you, but worse UX (key management) and limits UX decisions
- Managed: better UX, but you eat cost overruns
- Hybrid (free tier BYOK, paid tier managed) is a middle path — is the engineering cost worth it?

**P4. What do paying users get that free users don't?**
- Higher agent count in a chain?
- Access to premium models (Opus, o1-pro)?
- Longer context/history retention?
- Canvas mode?
- Extended thinking?

## 10.7 Brand & Positioning

**Br1. What does chained.chat actually mean?**
- "Chained" = sequential agents (like Unix pipes)
- "Chat" = conversational interface
- Is the name aspirational, descriptive, or a constraint? 
- If users want parallel/branching/canvas, does the name still fit? 

**Br2. How does this relate to Ani Potts LLC's other projects?**
- Quantercise, portfolio site, etc. — are they cross-marketed? Siloed?
- Does chained.chat need its own brand identity or inherit one?
- Is there a single "Ani Potts LLC" design system to reuse, or does each project get its own?

**Br3. Open source: yes or no?**
- Open-source chained.chat gets GitHub stars → SEO → signal of competence
- Closed-source chained.chat protects whatever IP you build (there isn't much yet)
- For a portfolio piece, open-source is usually the right call
- For a startup, it depends on the moat

**Br4. What's the landing page pitch?**
- Write the hero headline *now*, before you build
- If you can't write a compelling headline, the product isn't well-defined
- If the headline is generic ("chain AI agents"), you haven't found the wedge

## 10.8 Priority Ordering

**Pr1. If you had to ship v3 in 2 weeks, what would it be?**
- Force a brutal MVP definition
- This is your *real* v3; everything else is v4+

**Pr2. If v3 is getting traction in 6 weeks, what's the v4?**
- One feature, not five
- The honest first expansion

**Pr3. What's the risk-ordering of the work?**
- Highest-risk things first (will Cloudflare D1 actually work for this? can I get canvas to stream well?)
- De-risk with spikes before committing to architecture

**Pr4. Where does design (Claude Design Labs wireframes) fit in the timeline?**
- Before code? After MVP? Parallel with backend?
- If wireframes come before code: who reviews them, and when?
- If wireframes come after MVP: you're going to rebuild the UI twice. Accept that cost.

## 10.9 "Are You Sure?" Challenges

These are the specific assumptions baked into the v3 plan. Force Ani to defend each one or drop it.

**A1. "V3 needs a new framework (Svelte/Solid)."**
- Are you sure? Next.js 16 + React 19 is not broken.
- Counter: iterate V2 into V3 on the same stack. Ship in 2 weeks. Maybe.

**A2. "V3 needs Cloudflare."**
- Are you sure? Supabase is working. You have 0 users.
- Counter: stay on Supabase. Save 2 weeks. Migrate when you have users complaining about latency.

**A3. "V3 needs an infinite canvas."**
- Are you sure? The iMessage friend asked for multi-agent chat, not a whiteboard.
- Counter: ship column-based v3 with a faster canvas mode toggle in v4.

**A4. "V3 needs multi-session Claude Code orchestration."**
- Are you sure? Multi-session adds coordination overhead.
- Counter: one session, smaller scope. The multi-session pattern is itself a premature optimization if v3 is narrow.

**A5. "V3 needs a full redesign."**
- Are you sure? V2's design is already solid (Claude-inspired dark theme, clean typography).
- Counter: keep the V2 design. Only redesign what's user-facing for new features (canvas).

**A6. "V3 needs the LLC's branding."**
- Are you sure? Users don't care about the LLC. They care about the product.
- Counter: defer branding until there's a reason to brand.

**A7. "V3 needs to be built to last."**
- Are you sure? V1 was built to last and got thrown out. V2 was built fast and still works.
- Counter: build v3 to be thrown out. Bias toward velocity, not durability.

**A8. "Now is the right time to build v3."**
- Are you sure? V2 is 1 month old. You haven't tried to get users yet.
- Counter: spend 2 weeks trying to get 5 users on V2 before building V3. Learn before rebuilding.

## 10.10 The Meta-Question

**M1. What do you want this session to produce?**
- A design doc? A working prototype? A decision about whether to build at all?
- State the deliverable up front. Scope the conversation to that deliverable.

**M2. What signal would tell you to stop?**
- "If I can't answer Section 10.3 clearly, I'll stop and go talk to users first."
- "If the Cloudflare migration takes more than 2 days, I'll revert to Supabase."
- Pre-commit to the kill criteria before you start.

**M3. Who reviews the work?**
- Ani solo?
- Ani + a technical friend?
- Ani + Claude Design Labs?
- Knowing the reviewer shapes the output.

## 10.11 How to Conduct This Session

Recommended flow for the new agent:

1. **Read the HANDOFF** (don't skip).
2. **Open a conversation with Ani.** Tell them: "Before I write any code, I need answers to Section 10.3 and 10.4. Here they are."
3. **Ask 3-5 questions at a time.** Don't dump all 50. Pace.
4. **Document answers in `/home/user/chained-chat/docs/v3/decisions.md`.**
5. **Synthesize into a v3 scope doc** at `/home/user/chained-chat/docs/v3/scope.md`.
6. **Review the scope doc with Ani.** Get explicit sign-off.
7. **Only then** start writing code.
8. **Revisit 10.9 (Are You Sure?)** at every milestone. If the answers have changed, stop and re-scope.

## 10.12 Closing Note to the New Agent

You have been given an unusually rich context for a greenfield session. Two full versions of the product exist in this repo's history. Six months of decisions, mistakes, and lessons are documented above.

**Use that context.** Don't let Ani handwave past lessons that were paid for in calendar time. If Ani says "this time will be different" about an architectural choice that failed twice, your job is to ask: *what specifically is different this time?*

The best outcome of this session might not be v3. It might be:
- "Don't build v3. Spend 2 weeks getting users on V2 first."
- "V3 is a 2-week iteration on V2, not a rebuild."
- "Kill chained.chat. Build a different portfolio project."

Any of those outcomes is more valuable than shipping V3 and throwing it out in June.

Good luck. Push back. Ask the hard questions. Don't write code until the questions are answered.

— The previous Claude Code session, signing off.
