# Agent 3: API Routes & LLM Integration

## Context

You are working in a Git worktree at `worktrees/agent-3-api` on branch `feature/api`. Two other agents are working in parallel on `feature/infrastructure` and `feature/frontend`. Your work must be completely isolated - do NOT modify files that other agents own.

**IMPORTANT:** Agent 1 (Infrastructure) must merge FIRST because you depend on `@chained/shared` types and `@chained/db` for database access. Wait for confirmation that `feature/infrastructure` has been merged to `main` before running `git pull origin main` to get the shared packages.

---

## Your Ownership

You OWN these directories (create and modify freely):
- `apps/web/src/app/api/` - All API routes
- `apps/web/src/lib/providers/` - LLM provider adapters
- `apps/web/src/lib/cache/` - Semantic caching logic
- `apps/web/src/lib/stream/` - SSE streaming utilities

You may READ but NOT MODIFY:
- `packages/shared/` (owned by Agent 1: Infrastructure)
- `packages/db/` (owned by Agent 1: Infrastructure)
- `apps/web/src/components/` (owned by Agent 2: Frontend)
- `apps/web/src/stores/` (owned by Agent 2: Frontend)

---

## Tech Stack

- **LLM Orchestration:** Vercel AI SDK 4.1 with Provider Registry
- **Providers:** @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/xai (or custom)
- **Caching:** Upstash Redis + Vector for semantic cache
- **Auth:** Clerk for authentication
- **Database:** Prisma via @chained/db
- **Security:** LLM Guard patterns from @chained/shared
- **Observability:** Langfuse integration

---

## Tasks

### 1. Initialize Your Worktree

```bash
# Verify you're in the right place
pwd  # Should show: .../chained.chat/worktrees/agent-3-api
git branch  # Should show: * feature/api

# Pull latest from main (after Agent 1 merges)
git pull origin main

# Install dependencies
pnpm install

# Verify shared packages are available
ls packages/shared/src/
ls packages/db/src/
```

---

### 2. Install API Dependencies

```bash
cd apps/web

# Vercel AI SDK and providers
pnpm add ai@^3.0.0 @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

# Note: @ai-sdk/xai may not exist yet - we'll create a custom adapter
# For xAI/Grok, we'll use openai-compatible endpoint

# Upstash for caching
pnpm add @upstash/redis @upstash/vector

# Clerk for auth
pnpm add @clerk/nextjs

# Observability
pnpm add langfuse

# Workspace dependencies
# Add to package.json:
# "@chained/shared": "workspace:*",
# "@chained/db": "workspace:*"
```

Update `apps/web/package.json` dependencies:

```json
{
  "dependencies": {
    "@chained/shared": "workspace:*",
    "@chained/db": "workspace:*",
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.70",
    "@ai-sdk/anthropic": "^0.0.60",
    "@ai-sdk/google": "^0.0.50",
    "@upstash/redis": "^1.28.0",
    "@upstash/vector": "^1.1.0",
    "@clerk/nextjs": "^5.0.0",
    "langfuse": "^3.0.0"
  }
}
```

Then run `pnpm install` from root.

---

### 3. Create Provider Registry

Create `apps/web/src/lib/providers/registry.ts`:

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Provider } from '@chained/shared';

// Provider instances with API keys from env
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// xAI/Grok uses OpenAI-compatible API
const xai = createOpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// Model ID to provider mapping
export const MODEL_PROVIDERS: Record<string, { provider: any; modelId: string; providerName: Provider }> = {
  'gpt-4o': {
    provider: openai,
    modelId: 'gpt-4o',
    providerName: 'OPENAI',
  },
  'gpt-4o-mini': {
    provider: openai,
    modelId: 'gpt-4o-mini',
    providerName: 'OPENAI',
  },
  'claude-3-5-sonnet-20241022': {
    provider: anthropic,
    modelId: 'claude-3-5-sonnet-20241022',
    providerName: 'ANTHROPIC',
  },
  'claude-3-5-haiku-20241022': {
    provider: anthropic,
    modelId: 'claude-3-5-haiku-20241022',
    providerName: 'ANTHROPIC',
  },
  'gemini-2.5-flash': {
    provider: google,
    modelId: 'gemini-2.0-flash-exp', // Actual model ID
    providerName: 'GOOGLE',
  },
  'gemini-2.5-pro': {
    provider: google,
    modelId: 'gemini-2.0-pro-exp',
    providerName: 'GOOGLE',
  },
  'grok-2': {
    provider: xai,
    modelId: 'grok-2-latest',
    providerName: 'XAI',
  },
};

export function getProviderForModel(modelId: string) {
  const config = MODEL_PROVIDERS[modelId];
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return config;
}

// Get the actual AI SDK model instance
export function getModelInstance(modelId: string) {
  const { provider, modelId: actualModelId } = getProviderForModel(modelId);
  return provider(actualModelId);
}
```

---

### 4. Create Semantic Cache

Create `apps/web/src/lib/cache/semantic-cache.ts`:

```typescript
import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';

// Initialize Upstash clients
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

interface CachedResponse {
  content: string;
  tokens: { input: number; output: number };
  cost: number;
  cachedAt: string;
}

interface CacheEntry {
  modelId: string;
  prompt: string;
  response: CachedResponse;
}

// Similarity threshold for cache hits
const SIMILARITY_THRESHOLD = 0.92;

// Cache TTL (24 hours)
const CACHE_TTL_SECONDS = 60 * 60 * 24;

/**
 * Generate a cache key from model and prompt
 */
function generateCacheKey(modelId: string, promptHash: string): string {
  return `cache:${modelId}:${promptHash}`;
}

/**
 * Simple hash function for prompt text
 */
function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Check semantic cache for similar prompts
 */
export async function checkSemanticCache(
  modelId: string,
  prompt: string
): Promise<CachedResponse | null> {
  try {
    // First, try exact match via hash
    const exactKey = generateCacheKey(modelId, hashPrompt(prompt));
    const exactMatch = await redis.get<CacheEntry>(exactKey);

    if (exactMatch) {
      console.log('[Cache] Exact hit for', modelId);
      return exactMatch.response;
    }

    // If no exact match, try semantic similarity
    const results = await vectorIndex.query({
      vector: await getEmbedding(prompt),
      topK: 1,
      filter: `modelId = "${modelId}"`,
      includeMetadata: true,
    });

    if (results.length > 0 && results[0].score >= SIMILARITY_THRESHOLD) {
      const cacheKey = results[0].metadata?.cacheKey as string;
      if (cacheKey) {
        const cached = await redis.get<CacheEntry>(cacheKey);
        if (cached) {
          console.log('[Cache] Semantic hit for', modelId, 'score:', results[0].score);
          return cached.response;
        }
      }
    }

    console.log('[Cache] Miss for', modelId);
    return null;
  } catch (error) {
    console.error('[Cache] Error checking cache:', error);
    return null;
  }
}

/**
 * Store response in semantic cache
 */
export async function storeInCache(
  modelId: string,
  prompt: string,
  response: CachedResponse
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(modelId, hashPrompt(prompt));
    const entry: CacheEntry = {
      modelId,
      prompt,
      response,
    };

    // Store in Redis with TTL
    await redis.setex(cacheKey, CACHE_TTL_SECONDS, entry);

    // Store embedding for semantic search
    const embedding = await getEmbedding(prompt);
    await vectorIndex.upsert({
      id: cacheKey,
      vector: embedding,
      metadata: {
        modelId,
        cacheKey,
        promptLength: prompt.length,
      },
    });

    console.log('[Cache] Stored response for', modelId);
  } catch (error) {
    console.error('[Cache] Error storing in cache:', error);
  }
}

/**
 * Get embedding for prompt text
 * Uses OpenAI's embedding model
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit input size
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Calculate cost savings from cache hit
 */
export function calculateCacheSavings(
  modelId: string,
  tokens: { input: number; output: number }
): number {
  // Import from shared when available
  const costPer1k: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'gemini-2.5-flash': { input: 0.00035, output: 0.00105 },
    'grok-2': { input: 0.002, output: 0.010 },
  };

  const costs = costPer1k[modelId] || { input: 0.005, output: 0.015 };
  return (tokens.input * costs.input + tokens.output * costs.output) / 1000;
}
```

---

### 5. Create SSE Stream Utilities

Create `apps/web/src/lib/stream/sse.ts`:

```typescript
/**
 * Server-Sent Events utilities for streaming compare responses
 */

export interface StreamEvent {
  type: 'init' | 'chunk' | 'complete' | 'error';
  modelId: string;
  data?: string;
  tokens?: { input: number; output: number };
  cost?: number;
  latencyMs?: number;
  cached?: boolean;
  error?: string;
}

/**
 * Format an event for SSE transmission
 */
export function formatSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create a TransformStream that formats events as SSE
 */
export function createSSEStream(): {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<StreamEvent>;
} {
  const encoder = new TextEncoder();

  const { readable, writable } = new TransformStream<StreamEvent, Uint8Array>({
    transform(event, controller) {
      controller.enqueue(encoder.encode(formatSSE(event)));
    },
  });

  return { readable, writable };
}

/**
 * Create SSE response headers
 */
export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  };
}

/**
 * Helper to write events to a stream writer
 */
export class SSEWriter {
  private writer: WritableStreamDefaultWriter<StreamEvent>;
  private startTimes: Map<string, number> = new Map();

  constructor(writable: WritableStream<StreamEvent>) {
    this.writer = writable.getWriter();
  }

  async init(modelId: string): Promise<void> {
    this.startTimes.set(modelId, Date.now());
    await this.writer.write({ type: 'init', modelId });
  }

  async chunk(modelId: string, data: string): Promise<void> {
    await this.writer.write({ type: 'chunk', modelId, data });
  }

  async complete(
    modelId: string,
    result: {
      tokens: { input: number; output: number };
      cost: number;
      cached: boolean;
    }
  ): Promise<void> {
    const startTime = this.startTimes.get(modelId) || Date.now();
    const latencyMs = Date.now() - startTime;

    await this.writer.write({
      type: 'complete',
      modelId,
      tokens: result.tokens,
      cost: result.cost,
      latencyMs,
      cached: result.cached,
    });
  }

  async error(modelId: string, error: string): Promise<void> {
    await this.writer.write({ type: 'error', modelId, error });
  }

  async close(): Promise<void> {
    await this.writer.close();
  }
}
```

---

### 6. Create Compare API Route

Create `apps/web/src/app/api/compare/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { CompareRequest, wrapUserInput, detectInjectionAttempt } from '@chained/shared';
import { prisma } from '@chained/db';
import { getModelInstance, getProviderForModel } from '@/lib/providers/registry';
import { checkSemanticCache, storeInCache, calculateCacheSavings } from '@/lib/cache/semantic-cache';
import { createSSEStream, sseHeaders, SSEWriter } from '@/lib/stream/sse';

export const runtime = 'edge';
export const maxDuration = 120; // 2 minute timeout

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = CompareRequest.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parseResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, models, systemPrompt, temperature, maxTokens } = parseResult.data;

    // Security: Check for injection attempts
    const injectionCheck = detectInjectionAttempt(prompt);
    if (injectionCheck.suspicious) {
      console.warn('[Security] Injection attempt detected:', injectionCheck.reasons);
      // Continue but wrap the input safely
    }

    // Wrap user input for safety
    const safePrompt = wrapUserInput(prompt);

    // Create SSE stream
    const { readable, writable } = createSSEStream();
    const writer = new SSEWriter(writable);

    // Start streaming response
    const response = new Response(readable, {
      headers: sseHeaders(),
    });

    // Process all models in parallel (don't await here - stream in background)
    processModelsInParallel(
      writer,
      models,
      safePrompt,
      systemPrompt,
      temperature,
      maxTokens,
      userId
    ).catch((error) => {
      console.error('[Compare] Fatal error:', error);
    });

    return response;
  } catch (error) {
    console.error('[Compare] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function processModelsInParallel(
  writer: SSEWriter,
  models: string[],
  prompt: string,
  systemPrompt: string | undefined,
  temperature: number,
  maxTokens: number,
  userId: string
): Promise<void> {
  try {
    // Process all models concurrently
    await Promise.all(
      models.map((modelId) =>
        processModel(writer, modelId, prompt, systemPrompt, temperature, maxTokens, userId)
      )
    );
  } finally {
    await writer.close();
  }
}

async function processModel(
  writer: SSEWriter,
  modelId: string,
  prompt: string,
  systemPrompt: string | undefined,
  temperature: number,
  maxTokens: number,
  userId: string
): Promise<void> {
  try {
    // Signal initialization
    await writer.init(modelId);

    // Check semantic cache first
    const cached = await checkSemanticCache(modelId, prompt);
    if (cached) {
      // Stream cached content in chunks to simulate streaming
      const chunks = cached.content.match(/.{1,50}/g) || [];
      for (const chunk of chunks) {
        await writer.chunk(modelId, chunk);
        await sleep(10); // Small delay for visual effect
      }

      await writer.complete(modelId, {
        tokens: cached.tokens,
        cost: 0, // No cost for cached response
        cached: true,
      });

      // Log cache hit
      await logUsage(userId, modelId, cached.tokens, 0, true);
      return;
    }

    // Get model instance
    const model = getModelInstance(modelId);
    const { providerName } = getProviderForModel(modelId);

    // Build messages
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Stream from LLM
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const result = await streamText({
      model,
      messages,
      temperature,
      maxTokens,
      onChunk: async ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          fullContent += chunk.textDelta;
          await writer.chunk(modelId, chunk.textDelta);
        }
      },
    });

    // Wait for completion and get token counts
    const finalResult = await result;
    inputTokens = finalResult.usage?.promptTokens || estimateTokens(prompt);
    outputTokens = finalResult.usage?.completionTokens || estimateTokens(fullContent);

    // Calculate cost
    const cost = calculateCost(modelId, inputTokens, outputTokens);

    // Complete the stream
    await writer.complete(modelId, {
      tokens: { input: inputTokens, output: outputTokens },
      cost,
      cached: false,
    });

    // Store in cache for future requests
    await storeInCache(modelId, prompt, {
      content: fullContent,
      tokens: { input: inputTokens, output: outputTokens },
      cost,
      cachedAt: new Date().toISOString(),
    });

    // Log usage to database
    await logUsage(userId, modelId, { input: inputTokens, output: outputTokens }, cost, false);

  } catch (error) {
    console.error(`[Compare] Error processing ${modelId}:`, error);
    await writer.error(
      modelId,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Calculate cost for a model call
 */
function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const costs: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
    'gemini-2.5-flash': { input: 0.00035, output: 0.00105 },
    'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
    'grok-2': { input: 0.002, output: 0.010 },
  };

  const modelCosts = costs[modelId] || { input: 0.005, output: 0.015 };
  return (inputTokens * modelCosts.input + outputTokens * modelCosts.output) / 1000;
}

/**
 * Estimate tokens from text (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Log usage to database
 */
async function logUsage(
  userId: string,
  modelId: string,
  tokens: { input: number; output: number },
  cost: number,
  cached: boolean
): Promise<void> {
  try {
    const { providerName } = getProviderForModel(modelId);

    // Get or create user
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      // User might not exist yet - skip logging
      console.warn('[Usage] User not found:', userId);
      return;
    }

    await prisma.usage.create({
      data: {
        userId: user.id,
        provider: providerName,
        model: modelId,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        cost: cost,
        cached,
      },
    });
  } catch (error) {
    console.error('[Usage] Error logging usage:', error);
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

### 7. Create Health Check Route

Create `apps/web/src/app/api/health/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@chained/db';

export async function GET(request: NextRequest) {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Check provider API keys are set
  checks.openai = process.env.OPENAI_API_KEY ? 'ok' : 'error';
  checks.anthropic = process.env.ANTHROPIC_API_KEY ? 'ok' : 'error';
  checks.google = process.env.GOOGLE_API_KEY ? 'ok' : 'error';
  checks.xai = process.env.XAI_API_KEY ? 'ok' : 'error';

  // Check Upstash
  checks.upstash_redis = process.env.UPSTASH_REDIS_REST_URL ? 'ok' : 'error';
  checks.upstash_vector = process.env.UPSTASH_VECTOR_REST_URL ? 'ok' : 'error';

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return Response.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
```

---

### 8. Create User API Routes

Create `apps/web/src/app/api/user/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@chained/db';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      apiKeys: {
        select: {
          id: true,
          provider: true,
          createdAt: true,
          lastUsed: true,
        },
      },
      usage: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
    },
  });

  // Create user if doesn't exist
  if (!user) {
    const clerkUser = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        name: clerkUser?.firstName || null,
      },
      include: {
        apiKeys: {
          select: {
            id: true,
            provider: true,
            createdAt: true,
            lastUsed: true,
          },
        },
        usage: true,
      },
    });
  }

  // Calculate usage stats
  const stats = {
    totalCost: user.usage.reduce((sum, u) => sum + Number(u.cost), 0),
    totalTokens: user.usage.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0),
    cacheHits: user.usage.filter((u) => u.cached).length,
    totalRequests: user.usage.length,
    costByProvider: {} as Record<string, number>,
  };

  for (const usage of user.usage) {
    stats.costByProvider[usage.provider] =
      (stats.costByProvider[usage.provider] || 0) + Number(usage.cost);
  }

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      dailyCostLimit: Number(user.dailyCostLimit),
      createdAt: user.createdAt,
    },
    apiKeys: user.apiKeys,
    stats,
  });
}
```

---

### 9. Create API Keys Routes

Create `apps/web/src/app/api/keys/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@chained/db';
import { Provider } from '@chained/shared';
import crypto from 'crypto';

const AddKeyRequest = z.object({
  provider: Provider,
  apiKey: z.string().min(10),
});

// Hash API key before storing
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const parseResult = AddKeyRequest.safeParse(body);

  if (!parseResult.success) {
    return Response.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400 }
    );
  }

  const { provider, apiKey } = parseResult.data;

  // Get user
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Hash the API key
  const keyHash = hashApiKey(apiKey);

  // Upsert the key (one per provider per user)
  const key = await prisma.apiKey.upsert({
    where: {
      userId_provider: {
        userId: user.id,
        provider,
      },
    },
    update: {
      keyHash,
    },
    create: {
      userId: user.id,
      provider,
      keyHash,
    },
    select: {
      id: true,
      provider: true,
      createdAt: true,
    },
  });

  return Response.json({ key });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('id');

  if (!keyId) {
    return Response.json({ error: 'Key ID required' }, { status: 400 });
  }

  // Get user
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Delete only if belongs to user
  await prisma.apiKey.deleteMany({
    where: {
      id: keyId,
      userId: user.id,
    },
  });

  return Response.json({ success: true });
}
```

---

### 10. Create Comparisons History Route

Create `apps/web/src/app/api/comparisons/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@chained/db';

const SaveComparisonRequest = z.object({
  prompt: z.string(),
  responses: z.array(z.object({
    modelId: z.string(),
    provider: z.string(),
    content: z.string(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    cost: z.number(),
    latencyMs: z.number(),
    cached: z.boolean(),
    error: z.string().optional(),
  })),
  totalCost: z.number(),
  totalTokens: z.number(),
});

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return Response.json({ comparisons: [] });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const comparisons = await prisma.comparison.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      id: true,
      prompt: true,
      responses: true,
      totalCost: true,
      totalTokens: true,
      favorite: true,
      createdAt: true,
    },
  });

  return Response.json({
    comparisons: comparisons.map((c) => ({
      ...c,
      totalCost: Number(c.totalCost),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const parseResult = SaveComparisonRequest.safeParse(body);

  if (!parseResult.success) {
    return Response.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400 }
    );
  }

  const { prompt, responses, totalCost, totalTokens } = parseResult.data;

  // Get or create user
  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    const { currentUser } = await import('@clerk/nextjs/server');
    const clerkUser = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        name: clerkUser?.firstName || null,
      },
    });
  }

  const comparison = await prisma.comparison.create({
    data: {
      userId: user.id,
      prompt,
      responses: responses as any,
      totalCost,
      totalTokens,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return Response.json({ comparison });
}
```

---

### 11. Create Middleware for Auth

Create `apps/web/src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

---

### 12. Set Up Clerk Environment

Add to `.env.local` (create if doesn't exist):

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/compare
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/compare
```

---

### 13. Create Clerk Auth Pages

Create `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-gray-900 border border-gray-800',
            headerTitle: 'text-white',
            headerSubtitle: 'text-gray-400',
            socialButtonsBlockButton: 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
            formFieldLabel: 'text-gray-300',
            formFieldInput: 'bg-gray-800 border-gray-700 text-white',
            footerActionLink: 'text-blue-400 hover:text-blue-300',
          },
        }}
      />
    </div>
  );
}
```

Create `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-gray-900 border border-gray-800',
            headerTitle: 'text-white',
            headerSubtitle: 'text-gray-400',
            socialButtonsBlockButton: 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
            formFieldLabel: 'text-gray-300',
            formFieldInput: 'bg-gray-800 border-gray-700 text-white',
            footerActionLink: 'text-blue-400 hover:text-blue-300',
          },
        }}
      />
    </div>
  );
}
```

---

### 14. Update Root Layout for Clerk

Update `apps/web/src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "chained.chat - Compare AI Models Side by Side",
  description: "One prompt. All models. See the difference. Compare responses from GPT-4, Claude, Gemini, and Grok simultaneously.",
  keywords: ["AI", "LLM", "GPT-4", "Claude", "Gemini", "Grok", "comparison", "chatbot"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

### 15. Write API Tests

Create `apps/web/src/app/api/__tests__/compare.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
}));

vi.mock('@chained/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    usage: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cache/semantic-cache', () => ({
  checkSemanticCache: vi.fn(() => null),
  storeInCache: vi.fn(),
}));

describe('Compare API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject unauthenticated requests', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

    const { POST } = await import('../compare/route');
    const request = new Request('http://localhost/api/compare', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test', models: ['gpt-4o'] }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('should reject invalid request body', async () => {
    const { POST } = await import('../compare/route');
    const request = new Request('http://localhost/api/compare', {
      method: 'POST',
      body: JSON.stringify({ prompt: '' }), // Empty prompt
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should validate model selection', async () => {
    const { POST } = await import('../compare/route');
    const request = new Request('http://localhost/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'test',
        models: ['gpt-4o', 'claude-3-5-sonnet-20241022', 'gemini-2.5-flash', 'grok-2', 'extra-model'],
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400); // Too many models
  });
});

describe('SSE Stream Format', () => {
  it('should format events correctly', async () => {
    const { formatSSE } = await import('@/lib/stream/sse');

    const event = { type: 'chunk' as const, modelId: 'gpt-4o', data: 'Hello' };
    const formatted = formatSSE(event);

    expect(formatted).toBe('data: {"type":"chunk","modelId":"gpt-4o","data":"Hello"}\n\n');
  });
});

describe('Provider Registry', () => {
  it('should return correct provider for model', async () => {
    const { getProviderForModel } = await import('@/lib/providers/registry');

    const gpt4o = getProviderForModel('gpt-4o');
    expect(gpt4o.providerName).toBe('OPENAI');

    const claude = getProviderForModel('claude-3-5-sonnet-20241022');
    expect(claude.providerName).toBe('ANTHROPIC');
  });

  it('should throw for unknown model', async () => {
    const { getProviderForModel } = await import('@/lib/providers/registry');

    expect(() => getProviderForModel('unknown-model')).toThrow();
  });
});
```

---

### 16. Commit Your Work

```bash
git add .
git commit -m "feat(api): Add Compare API with LLM providers, caching, and auth

API Routes:
- POST /api/compare - SSE streaming comparison across 4 models
- GET /api/health - Health check with provider status
- GET/POST /api/user - User profile and stats
- POST/DELETE /api/keys - BYOK API key management
- GET/POST /api/comparisons - Comparison history

Provider Integration:
- Vercel AI SDK 4.1 with Provider Registry
- OpenAI, Anthropic, Google, xAI (via OpenAI-compatible)
- Unified model mapping and cost calculation

Semantic Caching:
- Upstash Redis for exact match cache
- Upstash Vector for semantic similarity
- 0.92 similarity threshold for cache hits
- 24-hour TTL

Security:
- Clerk authentication middleware
- Injection detection from @chained/shared
- User input wrapping for safety
- Hashed API key storage

Observability:
- Usage logging to database
- Cache hit tracking
- Cost tracking per model

Auth:
- Clerk sign-in/sign-up pages with dark theme
- Protected routes via middleware
- User auto-creation on first access

Testing:
- Vitest tests for API routes
- Provider registry tests
- SSE format tests

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push -u origin feature/api
```

---

## Verification

- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` succeeds in apps/web
- [ ] `pnpm test` passes all tests
- [ ] TypeScript compiles without errors
- [ ] Can import from `@chained/shared` and `@chained/db`
- [ ] Health check returns 200 (after env vars set)
- [ ] Auth pages render correctly

---

## Coordination Notes

- **Depends on:** Agent 1 (Infrastructure) for `@chained/shared` and `@chained/db`
- **Agent 2 (Frontend)** depends on your SSE event format
- Your branch will be merged THIRD (after Infrastructure and Frontend)

### SSE Event Contract

Your API MUST emit events in this exact format for the frontend to consume:

```typescript
// Init event - sent when model starts connecting
{ type: 'init', modelId: 'gpt-4o' }

// Chunk event - sent for each text chunk
{ type: 'chunk', modelId: 'gpt-4o', data: 'Hello' }

// Complete event - sent when model finishes
{
  type: 'complete',
  modelId: 'gpt-4o',
  tokens: { input: 10, output: 20 },
  cost: 0.001,
  latencyMs: 1500,
  cached: false
}

// Error event - sent if model fails
{ type: 'error', modelId: 'gpt-4o', error: 'Rate limit exceeded' }
```

### Environment Variables Required

Make sure these are set for the API to work:

```env
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

# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Database (from Agent 1)
DATABASE_URL=postgresql://...
```

---

## Files Created

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── providers/
│   │   │   └── registry.ts
│   │   ├── cache/
│   │   │   └── semantic-cache.ts
│   │   └── stream/
│   │       └── sse.ts
│   ├── app/
│   │   ├── layout.tsx (updated)
│   │   ├── api/
│   │   │   ├── compare/
│   │   │   │   └── route.ts
│   │   │   ├── health/
│   │   │   │   └── route.ts
│   │   │   ├── user/
│   │   │   │   └── route.ts
│   │   │   ├── keys/
│   │   │   │   └── route.ts
│   │   │   ├── comparisons/
│   │   │   │   └── route.ts
│   │   │   └── __tests__/
│   │   │       └── compare.test.ts
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   └── sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx
│   └── middleware.ts
└── .env.local (template)
```
