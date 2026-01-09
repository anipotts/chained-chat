# Agent 2: Frontend UI & Compare Mode

## Context

You are working in a Git worktree at `worktrees/agent-2-frontend` on branch `feature/frontend`. Two other agents are working in parallel on `feature/infrastructure` and `feature/api`. Your work must be completely isolated - do NOT modify files that other agents own.

**IMPORTANT:** Agent 1 (Infrastructure) must merge FIRST because you depend on `@chained/shared` types. Wait for confirmation that `feature/infrastructure` has been merged to `main` before running `git pull origin main` to get the shared types.

---

## Your Ownership

You OWN these directories (create and modify freely):
- `apps/web/src/components/` - All React components
- `apps/web/src/app/(routes)/` - App Router pages (except `/api/`)
- `apps/web/src/hooks/` - Custom React hooks
- `apps/web/src/stores/` - Zustand state stores
- `apps/web/src/styles/` - Global styles, Tailwind config
- `apps/web/src/lib/` - Frontend utilities (NOT backend lib)

You may READ but NOT MODIFY:
- `packages/shared/` (owned by Agent 1: Infrastructure)
- `packages/db/` (owned by Agent 1: Infrastructure)
- `apps/web/src/app/api/` (owned by Agent 3: API)

---

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **React:** React 19 with Server Components
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion (custom Hebbia-style)
- **State:** Zustand (for 240fps streaming performance)
- **Virtualization:** react-virtuoso (for long conversations)
- **Auth UI:** Clerk components
- **Icons:** Lucide React

---

## Tasks

### 1. Initialize Your Worktree

```bash
# Verify you're in the right place
pwd  # Should show: .../chained.chat/worktrees/agent-2-frontend
git branch  # Should show: * feature/frontend

# Pull latest from main (after Agent 1 merges)
git pull origin main

# Install dependencies
pnpm install

# Verify shared types are available
ls packages/shared/src/types/
```

---

### 2. Install Frontend Dependencies

```bash
cd apps/web

pnpm add framer-motion@^11.0.0 zustand@^5.0.0 react-virtuoso@^4.0.0 lucide-react@^0.300.0

# Dev dependencies
pnpm add -D @types/react @types/react-dom
```

Update `apps/web/package.json` to add workspace dependency:
```json
{
  "dependencies": {
    "@chained/shared": "workspace:*"
  }
}
```

Then run `pnpm install` from root.

---

### 3. Create Zustand Store for Compare Mode

Create `apps/web/src/stores/compare-store.ts`:

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Provider, ModelResponse } from '@chained/shared';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

export interface ModelStreamState {
  modelId: string;
  provider: Provider;
  displayName: string;
  status: StreamStatus;
  content: string;
  tokens: { input: number; output: number };
  cost: number;
  latencyMs: number;
  cached: boolean;
  error?: string;
}

export interface CompareState {
  // Request state
  prompt: string;
  selectedModels: string[];
  isComparing: boolean;

  // Stream states (one per model)
  streams: Map<string, ModelStreamState>;

  // Results
  comparison: {
    id?: string;
    totalCost: number;
    totalTokens: number;
    startedAt?: number;
    completedAt?: number;
  };

  // History
  history: Array<{
    id: string;
    prompt: string;
    responses: ModelResponse[];
    createdAt: string;
  }>;
}

export interface CompareActions {
  // Prompt management
  setPrompt: (prompt: string) => void;
  setSelectedModels: (models: string[]) => void;

  // Compare execution
  startCompare: () => void;
  cancelCompare: () => void;

  // Stream updates (called from SSE handler)
  initializeStream: (modelId: string, provider: Provider, displayName: string) => void;
  updateStreamStatus: (modelId: string, status: StreamStatus) => void;
  appendStreamContent: (modelId: string, chunk: string) => void;
  finalizeStream: (modelId: string, result: Partial<ModelStreamState>) => void;
  setStreamError: (modelId: string, error: string) => void;

  // Completion
  completeComparison: (id: string) => void;

  // History
  addToHistory: (comparison: CompareState['history'][0]) => void;
  clearHistory: () => void;

  // Reset
  reset: () => void;
}

const DEFAULT_MODELS = ['gpt-4o', 'claude-3-5-sonnet-20241022', 'gemini-2.5-flash', 'grok-2'];

const initialState: CompareState = {
  prompt: '',
  selectedModels: DEFAULT_MODELS,
  isComparing: false,
  streams: new Map(),
  comparison: {
    totalCost: 0,
    totalTokens: 0,
  },
  history: [],
};

export const useCompareStore = create<CompareState & CompareActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setPrompt: (prompt) => set({ prompt }),

    setSelectedModels: (models) => set({ selectedModels: models }),

    startCompare: () => {
      const { selectedModels } = get();
      const streams = new Map<string, ModelStreamState>();

      // Initialize all streams as connecting
      selectedModels.forEach((modelId) => {
        streams.set(modelId, {
          modelId,
          provider: 'OPENAI', // Will be updated by initializeStream
          displayName: modelId,
          status: 'connecting',
          content: '',
          tokens: { input: 0, output: 0 },
          cost: 0,
          latencyMs: 0,
          cached: false,
        });
      });

      set({
        isComparing: true,
        streams,
        comparison: {
          totalCost: 0,
          totalTokens: 0,
          startedAt: Date.now(),
        },
      });
    },

    cancelCompare: () => {
      set({
        isComparing: false,
        comparison: {
          ...get().comparison,
          completedAt: Date.now(),
        },
      });
    },

    initializeStream: (modelId, provider, displayName) => {
      set((state) => {
        const streams = new Map(state.streams);
        streams.set(modelId, {
          ...streams.get(modelId)!,
          provider,
          displayName,
          status: 'streaming',
        });
        return { streams };
      });
    },

    updateStreamStatus: (modelId, status) => {
      set((state) => {
        const streams = new Map(state.streams);
        const current = streams.get(modelId);
        if (current) {
          streams.set(modelId, { ...current, status });
        }
        return { streams };
      });
    },

    appendStreamContent: (modelId, chunk) => {
      set((state) => {
        const streams = new Map(state.streams);
        const current = streams.get(modelId);
        if (current) {
          streams.set(modelId, {
            ...current,
            content: current.content + chunk,
          });
        }
        return { streams };
      });
    },

    finalizeStream: (modelId, result) => {
      set((state) => {
        const streams = new Map(state.streams);
        const current = streams.get(modelId);
        if (current) {
          streams.set(modelId, {
            ...current,
            ...result,
            status: 'complete',
          });
        }

        // Update totals
        const allStreams = Array.from(streams.values());
        const totalCost = allStreams.reduce((sum, s) => sum + s.cost, 0);
        const totalTokens = allStreams.reduce(
          (sum, s) => sum + s.tokens.input + s.tokens.output,
          0
        );

        return {
          streams,
          comparison: {
            ...state.comparison,
            totalCost,
            totalTokens,
          },
        };
      });
    },

    setStreamError: (modelId, error) => {
      set((state) => {
        const streams = new Map(state.streams);
        const current = streams.get(modelId);
        if (current) {
          streams.set(modelId, {
            ...current,
            status: 'error',
            error,
          });
        }
        return { streams };
      });
    },

    completeComparison: (id) => {
      const state = get();
      const responses = Array.from(state.streams.values()).map((s) => ({
        modelId: s.modelId,
        provider: s.provider,
        content: s.content,
        inputTokens: s.tokens.input,
        outputTokens: s.tokens.output,
        cost: s.cost,
        latencyMs: s.latencyMs,
        cached: s.cached,
        error: s.error,
      }));

      set({
        isComparing: false,
        comparison: {
          ...state.comparison,
          id,
          completedAt: Date.now(),
        },
        history: [
          {
            id,
            prompt: state.prompt,
            responses,
            createdAt: new Date().toISOString(),
          },
          ...state.history,
        ].slice(0, 50), // Keep last 50
      });
    },

    addToHistory: (comparison) => {
      set((state) => ({
        history: [comparison, ...state.history].slice(0, 50),
      }));
    },

    clearHistory: () => set({ history: [] }),

    reset: () => set(initialState),
  }))
);

// Selector hooks for optimized re-renders
export const usePrompt = () => useCompareStore((s) => s.prompt);
export const useIsComparing = () => useCompareStore((s) => s.isComparing);
export const useSelectedModels = () => useCompareStore((s) => s.selectedModels);
export const useStream = (modelId: string) =>
  useCompareStore((s) => s.streams.get(modelId));
export const useComparison = () => useCompareStore((s) => s.comparison);
export const useHistory = () => useCompareStore((s) => s.history);
```

---

### 4. Create Framer Motion Animation Variants

Create `apps/web/src/components/compare/animation-variants.ts`:

```typescript
import { Variants } from 'framer-motion';

// Card container - staggered entrance
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// Individual card animations
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// Card glow states based on streaming status
export const glowVariants: Variants = {
  idle: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  connecting: {
    boxShadow: [
      '0 0 20px 0 rgba(251, 191, 36, 0.3)',
      '0 0 30px 0 rgba(251, 191, 36, 0.5)',
      '0 0 20px 0 rgba(251, 191, 36, 0.3)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  streaming: {
    boxShadow: [
      '0 0 20px 0 rgba(59, 130, 246, 0.3)',
      '0 0 35px 0 rgba(59, 130, 246, 0.5)',
      '0 0 20px 0 rgba(59, 130, 246, 0.3)',
    ],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  complete: {
    boxShadow: '0 0 25px 0 rgba(34, 197, 94, 0.4)',
    transition: {
      duration: 0.3,
    },
  },
  error: {
    boxShadow: '0 0 25px 0 rgba(239, 68, 68, 0.4)',
    transition: {
      duration: 0.3,
    },
  },
};

// Provider-specific accent colors
export const providerColors: Record<string, { primary: string; glow: string; bg: string }> = {
  OPENAI: {
    primary: 'rgb(16, 163, 127)', // OpenAI green
    glow: 'rgba(16, 163, 127, 0.4)',
    bg: 'rgba(16, 163, 127, 0.1)',
  },
  ANTHROPIC: {
    primary: 'rgb(217, 119, 87)', // Anthropic orange/coral
    glow: 'rgba(217, 119, 87, 0.4)',
    bg: 'rgba(217, 119, 87, 0.1)',
  },
  GOOGLE: {
    primary: 'rgb(66, 133, 244)', // Google blue
    glow: 'rgba(66, 133, 244, 0.4)',
    bg: 'rgba(66, 133, 244, 0.1)',
  },
  XAI: {
    primary: 'rgb(139, 92, 246)', // Purple for xAI/Grok
    glow: 'rgba(139, 92, 246, 0.4)',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
};

// Text streaming animation
export const streamingTextVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.01,
    },
  },
};

export const characterVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.1,
    },
  },
};

// Pulse animation for status indicators
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Metrics reveal animation
export const metricsVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Winner badge animation
export const badgeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      delay: 0.2,
    },
  },
};
```

---

### 5. Create Compare Card Component

Create `apps/web/src/components/compare/CompareCard.tsx`:

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Zap, DollarSign, Clock } from 'lucide-react';
import { useStream, type StreamStatus } from '@/stores/compare-store';
import {
  cardVariants,
  glowVariants,
  metricsVariants,
  providerColors,
} from './animation-variants';
import { StreamingText } from './StreamingText';
import type { Provider } from '@chained/shared';

interface CompareCardProps {
  modelId: string;
  isWinner?: {
    fastest?: boolean;
    cheapest?: boolean;
    bestQuality?: boolean;
  };
}

const StatusIndicator = memo(function StatusIndicator({
  status,
}: {
  status: StreamStatus;
}) {
  switch (status) {
    case 'connecting':
      return (
        <motion.div
          className="flex items-center gap-2 text-amber-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Connecting...</span>
        </motion.div>
      );
    case 'streaming':
      return (
        <motion.div
          className="flex items-center gap-2 text-blue-400"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium">Streaming...</span>
        </motion.div>
      );
    case 'complete':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-green-400"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Complete</span>
        </motion.div>
      );
    case 'error':
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-red-400"
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Error</span>
        </motion.div>
      );
    default:
      return null;
  }
});

const MetricBadge = memo(function MetricBadge({
  icon: Icon,
  label,
  value,
  color = 'text-gray-400',
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-3 w-3" />
      <span className="text-xs">
        {label}: <span className="font-medium">{value}</span>
      </span>
    </div>
  );
});

export const CompareCard = memo(function CompareCard({
  modelId,
  isWinner,
}: CompareCardProps) {
  const stream = useStream(modelId);

  const colors = useMemo(() => {
    return providerColors[stream?.provider || 'OPENAI'];
  }, [stream?.provider]);

  if (!stream) {
    return null;
  }

  const { status, displayName, provider, content, tokens, cost, latencyMs, cached, error } =
    stream;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col h-full"
    >
      {/* Glow effect based on status */}
      <motion.div
        className="absolute inset-0 rounded-xl -z-10"
        variants={glowVariants}
        animate={status}
      />

      {/* Card content */}
      <div
        className="flex flex-col h-full rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm overflow-hidden"
        style={{
          borderColor: status === 'streaming' ? colors.primary : undefined,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-gray-800"
          style={{ backgroundColor: colors.bg }}
        >
          <div className="flex items-center gap-3">
            {/* Provider logo placeholder */}
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: colors.primary }}
            >
              {provider.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-white">{displayName}</h3>
              <p className="text-xs text-gray-500">{provider}</p>
            </div>
          </div>

          <StatusIndicator status={status} />
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[200px] max-h-[400px]">
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm"
            >
              {error}
            </motion.div>
          ) : content ? (
            <StreamingText content={content} isStreaming={status === 'streaming'} />
          ) : status === 'connecting' || status === 'streaming' ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                className="h-8 w-8 border-2 border-gray-700 border-t-blue-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : null}
        </div>

        {/* Metrics footer */}
        <AnimatePresence>
          {status === 'complete' && (
            <motion.div
              variants={metricsVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="px-4 py-3 border-t border-gray-800 bg-gray-900/50"
            >
              <div className="flex flex-wrap gap-3">
                <MetricBadge
                  icon={Zap}
                  label="Tokens"
                  value={`${tokens.input + tokens.output}`}
                />
                <MetricBadge
                  icon={DollarSign}
                  label="Cost"
                  value={`$${cost.toFixed(4)}`}
                  color={isWinner?.cheapest ? 'text-green-400' : 'text-gray-400'}
                />
                <MetricBadge
                  icon={Clock}
                  label="Time"
                  value={`${(latencyMs / 1000).toFixed(1)}s`}
                  color={isWinner?.fastest ? 'text-yellow-400' : 'text-gray-400'}
                />
                {cached && (
                  <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded">
                    Cached
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner badges */}
        <AnimatePresence>
          {isWinner && (status === 'complete') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-2 right-2 flex gap-1"
            >
              {isWinner.fastest && (
                <span className="text-xs bg-yellow-900/80 text-yellow-400 px-2 py-1 rounded-full">
                  ⚡ Fastest
                </span>
              )}
              {isWinner.cheapest && (
                <span className="text-xs bg-green-900/80 text-green-400 px-2 py-1 rounded-full">
                  💰 Cheapest
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
```

---

### 6. Create Streaming Text Component

Create `apps/web/src/components/compare/StreamingText.tsx`:

```typescript
'use client';

import { memo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

/**
 * High-performance streaming text display
 * Uses CSS for animations to maintain 60fps during rapid updates
 */
export const StreamingText = memo(function StreamingText({
  content,
  isStreaming,
}: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  // Track new content for animation
  const newContentStart = prevLengthRef.current;
  useEffect(() => {
    prevLengthRef.current = content.length;
  }, [content]);

  return (
    <div ref={containerRef} className="overflow-y-auto">
      <div className="prose prose-invert prose-sm max-w-none">
        {/* Already rendered content */}
        <span className="text-gray-200">{content.slice(0, newContentStart)}</span>

        {/* New content with fade-in */}
        {newContentStart < content.length && (
          <motion.span
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="text-gray-200"
          >
            {content.slice(newContentStart)}
          </motion.span>
        )}

        {/* Cursor */}
        {isStreaming && (
          <motion.span
            className="inline-block w-2 h-4 ml-0.5 bg-blue-400"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
});
```

---

### 7. Create Compare Grid Component

Create `apps/web/src/components/compare/CompareGrid.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { CompareCard } from './CompareCard';
import { containerVariants } from './animation-variants';
import { useCompareStore } from '@/stores/compare-store';

export function CompareGrid() {
  const selectedModels = useCompareStore((s) => s.selectedModels);
  const streams = useCompareStore((s) => s.streams);
  const isComparing = useCompareStore((s) => s.isComparing);

  // Calculate winners when all complete
  const winners = useMemo(() => {
    const streamArray = Array.from(streams.values());
    const completed = streamArray.filter((s) => s.status === 'complete');

    if (completed.length !== selectedModels.length) {
      return {};
    }

    const fastest = completed.reduce((prev, curr) =>
      curr.latencyMs < prev.latencyMs ? curr : prev
    );
    const cheapest = completed.reduce((prev, curr) =>
      curr.cost < prev.cost ? curr : prev
    );

    return {
      [fastest.modelId]: { fastest: true },
      [cheapest.modelId]: { ...winners[cheapest.modelId], cheapest: true },
    };
  }, [streams, selectedModels]);

  // Determine grid columns based on model count
  const gridCols = useMemo(() => {
    switch (selectedModels.length) {
      case 1:
        return 'grid-cols-1 max-w-2xl mx-auto';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
  }, [selectedModels.length]);

  if (selectedModels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select at least one model to compare
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`grid gap-4 ${gridCols}`}
    >
      {selectedModels.map((modelId) => (
        <CompareCard
          key={modelId}
          modelId={modelId}
          isWinner={winners[modelId]}
        />
      ))}
    </motion.div>
  );
}
```

---

### 8. Create Prompt Input Component

Create `apps/web/src/components/compare/PromptInput.tsx`:

```typescript
'use client';

import { useCallback, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Square, Sparkles } from 'lucide-react';
import { useCompareStore, useIsComparing, usePrompt } from '@/stores/compare-store';

interface PromptInputProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export function PromptInput({ onSubmit, onCancel }: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prompt = usePrompt();
  const isComparing = useIsComparing();
  const setPrompt = useCompareStore((s) => s.setPrompt);

  const handleSubmit = useCallback(() => {
    if (prompt.trim() && !isComparing) {
      onSubmit();
    }
  }, [prompt, isComparing, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Auto-resize textarea
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setPrompt(textarea.value);

    // Reset height to auto to get proper scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight, max 200px
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [setPrompt]);

  return (
    <div className="relative">
      {/* Gradient border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-50 blur-sm" />

      <div className="relative bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex items-end gap-3">
          {/* Sparkle icon */}
          <motion.div
            className="pb-2"
            animate={isComparing ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: isComparing ? Infinity : 0, ease: 'linear' }}
          >
            <Sparkles className="h-5 w-5 text-purple-400" />
          </motion.div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt to compare across all models..."
            disabled={isComparing}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-base min-h-[24px] max-h-[200px] disabled:opacity-50"
            style={{ height: 'auto' }}
          />

          {/* Action button */}
          <AnimatePresence mode="wait">
            {isComparing ? (
              <motion.button
                key="cancel"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={onCancel}
                className="p-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900/80 transition-colors"
              >
                <Square className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button
                key="submit"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Character count */}
        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-600">
            {prompt.length} / 100,000
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

### 9. Create Model Selector Component

Create `apps/web/src/components/compare/ModelSelector.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useCompareStore, useSelectedModels, useIsComparing } from '@/stores/compare-store';
import { MODELS } from '@chained/shared';
import { providerColors } from './animation-variants';

export function ModelSelector() {
  const selectedModels = useSelectedModels();
  const isComparing = useIsComparing();
  const setSelectedModels = useCompareStore((s) => s.setSelectedModels);

  const toggleModel = (modelId: string) => {
    if (isComparing) return;

    if (selectedModels.includes(modelId)) {
      // Don't allow deselecting all
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter((m) => m !== modelId));
      }
    } else {
      // Max 4 models
      if (selectedModels.length < 4) {
        setSelectedModels([...selectedModels, modelId]);
      }
    }
  };

  const models = Object.values(MODELS);

  return (
    <div className="flex flex-wrap gap-2">
      {models.map((model) => {
        const isSelected = selectedModels.includes(model.id);
        const colors = providerColors[model.provider];

        return (
          <motion.button
            key={model.id}
            onClick={() => toggleModel(model.id)}
            disabled={isComparing}
            whileHover={{ scale: isComparing ? 1 : 1.02 }}
            whileTap={{ scale: isComparing ? 1 : 0.98 }}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
              transition-colors disabled:cursor-not-allowed
              ${
                isSelected
                  ? 'border-transparent text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }
            `}
            style={{
              backgroundColor: isSelected ? colors.bg : 'transparent',
              borderColor: isSelected ? colors.primary : undefined,
            }}
          >
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            )}

            {/* Provider indicator dot */}
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />

            {/* Model name */}
            <span>{model.displayName}</span>

            {/* Cost indicator */}
            <span className="text-xs text-gray-500">
              ${((model.inputCostPer1k + model.outputCostPer1k) / 2 * 1000).toFixed(2)}/1k
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
```

---

### 10. Create SSE Hook for Streaming

Create `apps/web/src/hooks/use-compare-stream.ts`:

```typescript
'use client';

import { useCallback, useRef } from 'react';
import { useCompareStore } from '@/stores/compare-store';
import { MODELS } from '@chained/shared';

interface StreamEvent {
  type: 'init' | 'chunk' | 'complete' | 'error';
  modelId: string;
  data?: string;
  tokens?: { input: number; output: number };
  cost?: number;
  latencyMs?: number;
  cached?: boolean;
  error?: string;
}

export function useCompareStream() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    prompt,
    selectedModels,
    startCompare,
    cancelCompare,
    initializeStream,
    appendStreamContent,
    finalizeStream,
    setStreamError,
    completeComparison,
  } = useCompareStore();

  const startStreaming = useCallback(async () => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Initialize store
    startCompare();

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          models: selectedModels,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete events (SSE format: data: {...}\n\n)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const eventStr of events) {
          if (!eventStr.startsWith('data: ')) continue;

          try {
            const event: StreamEvent = JSON.parse(eventStr.slice(6));

            switch (event.type) {
              case 'init': {
                const model = MODELS[event.modelId];
                initializeStream(
                  event.modelId,
                  model?.provider || 'OPENAI',
                  model?.displayName || event.modelId
                );
                break;
              }
              case 'chunk': {
                if (event.data) {
                  appendStreamContent(event.modelId, event.data);
                }
                break;
              }
              case 'complete': {
                finalizeStream(event.modelId, {
                  tokens: event.tokens,
                  cost: event.cost,
                  latencyMs: event.latencyMs,
                  cached: event.cached,
                });
                break;
              }
              case 'error': {
                setStreamError(event.modelId, event.error || 'Unknown error');
                break;
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }

      // All streams complete - finalize comparison
      completeComparison(crypto.randomUUID());

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled
        return;
      }

      console.error('Compare stream error:', error);
      // Set error on all models
      selectedModels.forEach((modelId) => {
        setStreamError(modelId, error instanceof Error ? error.message : 'Unknown error');
      });
    }
  }, [
    prompt,
    selectedModels,
    startCompare,
    initializeStream,
    appendStreamContent,
    finalizeStream,
    setStreamError,
    completeComparison,
  ]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelCompare();
  }, [cancelCompare]);

  return {
    startStreaming,
    stopStreaming,
  };
}
```

---

### 11. Create Compare Page

Create `apps/web/src/app/(routes)/compare/page.tsx`:

```typescript
import { ComparePageClient } from './ComparePageClient';

export const metadata = {
  title: 'Compare - chained.chat',
  description: 'Compare responses from GPT-4, Claude, Gemini, and Grok side by side.',
};

export default function ComparePage() {
  return <ComparePageClient />;
}
```

Create `apps/web/src/app/(routes)/compare/ComparePageClient.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { CompareGrid } from '@/components/compare/CompareGrid';
import { PromptInput } from '@/components/compare/PromptInput';
import { ModelSelector } from '@/components/compare/ModelSelector';
import { useCompareStream } from '@/hooks/use-compare-stream';
import { useComparison } from '@/stores/compare-store';

export function ComparePageClient() {
  const { startStreaming, stopStreaming } = useCompareStream();
  const comparison = useComparison();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            chained.chat
          </motion.h1>

          {/* Cost display */}
          {comparison.totalCost > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-gray-400"
            >
              Session cost:{' '}
              <span className="text-green-400 font-medium">
                ${comparison.totalCost.toFixed(4)}
              </span>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Model selector */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            Select models to compare
          </h2>
          <ModelSelector />
        </section>

        {/* Prompt input */}
        <section>
          <PromptInput onSubmit={startStreaming} onCancel={stopStreaming} />
        </section>

        {/* Compare grid */}
        <section>
          <CompareGrid />
        </section>
      </main>
    </div>
  );
}
```

---

### 12. Create Route Layout

Create `apps/web/src/app/(routes)/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}
```

---

### 13. Update Tailwind Config for Dark Theme

Update `apps/web/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Provider colors
        provider: {
          openai: '#10a37f',
          anthropic: '#d97757',
          google: '#4285f4',
          xai: '#8b5cf6',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body': 'rgb(209 213 219)',
            '--tw-prose-headings': 'rgb(255 255 255)',
            '--tw-prose-links': 'rgb(96 165 250)',
            '--tw-prose-code': 'rgb(167 139 250)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
```

---

### 14. Add Typography Plugin

```bash
cd apps/web
pnpm add @tailwindcss/typography
```

---

### 15. Update globals.css

Update `apps/web/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    color-scheme: dark;
  }

  body {
    @apply bg-black text-white antialiased;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-900;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-700 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-600;
  }
}

@layer components {
  /* Gradient text utility */
  .gradient-text {
    @apply bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent;
  }

  /* Card glow effect */
  .card-glow {
    @apply relative;
  }

  .card-glow::before {
    content: '';
    @apply absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300;
    background: radial-gradient(circle at center, rgba(139, 92, 246, 0.15), transparent 70%);
  }

  .card-glow:hover::before {
    @apply opacity-100;
  }
}

@layer utilities {
  /* Content visibility for performance */
  .content-auto {
    content-visibility: auto;
    contain-intrinsic-size: 0 500px;
  }

  /* GPU acceleration hint */
  .gpu-accelerated {
    transform: translateZ(0);
    will-change: transform;
  }
}
```

---

### 16. Create Component Index Files

Create `apps/web/src/components/compare/index.ts`:

```typescript
export { CompareCard } from './CompareCard';
export { CompareGrid } from './CompareGrid';
export { PromptInput } from './PromptInput';
export { ModelSelector } from './ModelSelector';
export { StreamingText } from './StreamingText';
export * from './animation-variants';
```

Create `apps/web/src/stores/index.ts`:

```typescript
export * from './compare-store';
```

Create `apps/web/src/hooks/index.ts`:

```typescript
export { useCompareStream } from './use-compare-stream';
```

---

### 17. Write Unit Tests

Create `apps/web/src/stores/__tests__/compare-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useCompareStore } from '../compare-store';

describe('CompareStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCompareStore.getState().reset();
  });

  it('should initialize with default models', () => {
    const { selectedModels } = useCompareStore.getState();
    expect(selectedModels).toHaveLength(4);
    expect(selectedModels).toContain('gpt-4o');
    expect(selectedModels).toContain('claude-3-5-sonnet-20241022');
  });

  it('should update prompt', () => {
    useCompareStore.getState().setPrompt('test prompt');
    expect(useCompareStore.getState().prompt).toBe('test prompt');
  });

  it('should start comparison and initialize streams', () => {
    const { startCompare } = useCompareStore.getState();
    startCompare();

    const state = useCompareStore.getState();
    expect(state.isComparing).toBe(true);
    expect(state.streams.size).toBe(4);
    expect(state.comparison.startedAt).toBeDefined();
  });

  it('should append stream content', () => {
    useCompareStore.getState().startCompare();
    useCompareStore.getState().appendStreamContent('gpt-4o', 'Hello');
    useCompareStore.getState().appendStreamContent('gpt-4o', ' World');

    const stream = useCompareStore.getState().streams.get('gpt-4o');
    expect(stream?.content).toBe('Hello World');
  });

  it('should finalize stream with metrics', () => {
    useCompareStore.getState().startCompare();
    useCompareStore.getState().finalizeStream('gpt-4o', {
      tokens: { input: 10, output: 20 },
      cost: 0.001,
      latencyMs: 500,
      cached: false,
    });

    const stream = useCompareStore.getState().streams.get('gpt-4o');
    expect(stream?.status).toBe('complete');
    expect(stream?.tokens).toEqual({ input: 10, output: 20 });
    expect(stream?.cost).toBe(0.001);
  });

  it('should calculate totals when streams complete', () => {
    useCompareStore.getState().startCompare();

    useCompareStore.getState().finalizeStream('gpt-4o', {
      tokens: { input: 10, output: 20 },
      cost: 0.001,
    });
    useCompareStore.getState().finalizeStream('claude-3-5-sonnet-20241022', {
      tokens: { input: 15, output: 25 },
      cost: 0.002,
    });

    const { comparison } = useCompareStore.getState();
    expect(comparison.totalCost).toBe(0.003);
    expect(comparison.totalTokens).toBe(70);
  });

  it('should add to history on completion', () => {
    useCompareStore.getState().setPrompt('test prompt');
    useCompareStore.getState().startCompare();
    useCompareStore.getState().appendStreamContent('gpt-4o', 'Response 1');
    useCompareStore.getState().finalizeStream('gpt-4o', { cost: 0.001 });
    useCompareStore.getState().completeComparison('test-id');

    const { history } = useCompareStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].prompt).toBe('test prompt');
    expect(history[0].id).toBe('test-id');
  });

  it('should limit history to 50 items', () => {
    for (let i = 0; i < 60; i++) {
      useCompareStore.getState().addToHistory({
        id: `id-${i}`,
        prompt: `prompt-${i}`,
        responses: [],
        createdAt: new Date().toISOString(),
      });
    }

    expect(useCompareStore.getState().history).toHaveLength(50);
    expect(useCompareStore.getState().history[0].id).toBe('id-59');
  });
});
```

---

### 18. Configure Vitest

Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@chained/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
```

Create `apps/web/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Add to `apps/web/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^24.0.0"
  }
}
```

---

### 19. Commit Your Work

```bash
git add .
git commit -m "feat(frontend): Add Compare Mode UI with Hebbia-style animations

- Zustand store for high-performance streaming state (240fps pattern)
- Framer Motion animations with provider-specific colors and glows
- CompareCard with status indicators and metrics display
- StreamingText component with cursor animation
- CompareGrid with responsive 1-4 column layout
- PromptInput with gradient border and auto-resize
- ModelSelector with visual selection states
- SSE hook for streaming compare responses
- Compare page with full layout
- Dark theme with custom scrollbars
- Vitest unit tests for store

Components:
- CompareCard: Per-model streaming display with glow states
- CompareGrid: Responsive grid with winner badges
- PromptInput: Textarea with submit/cancel
- ModelSelector: Toggle buttons with cost display
- StreamingText: High-perf text rendering

Hooks:
- useCompareStream: SSE handling for /api/compare

Stores:
- compare-store: Zustand with selectors for optimized re-renders

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push -u origin feature/frontend
```

---

## Verification

- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` succeeds in apps/web
- [ ] `pnpm test` passes all unit tests
- [ ] TypeScript compiles without errors
- [ ] Can import from `@chained/shared`
- [ ] Components render in dev mode (after API is ready)

---

## Coordination Notes

- **Depends on:** Agent 1 (Infrastructure) for `@chained/shared` types
- **Agent 3 (API)** will create the `/api/compare` endpoint that this UI consumes
- Your branch will be merged SECOND (after Infrastructure)
- The SSE stream format expected by `use-compare-stream.ts` must match what Agent 3 implements

### Expected SSE Event Format

```typescript
// Agent 3 must emit events in this format:
{ type: 'init', modelId: 'gpt-4o' }
{ type: 'chunk', modelId: 'gpt-4o', data: 'Hello' }
{ type: 'chunk', modelId: 'gpt-4o', data: ' World' }
{ type: 'complete', modelId: 'gpt-4o', tokens: { input: 10, output: 5 }, cost: 0.001, latencyMs: 500, cached: false }
{ type: 'error', modelId: 'gpt-4o', error: 'Rate limit exceeded' }
```

---

## Files Created

```
apps/web/
├── src/
│   ├── stores/
│   │   ├── compare-store.ts
│   │   ├── index.ts
│   │   └── __tests__/
│   │       └── compare-store.test.ts
│   ├── hooks/
│   │   ├── use-compare-stream.ts
│   │   └── index.ts
│   ├── components/
│   │   └── compare/
│   │       ├── animation-variants.ts
│   │       ├── CompareCard.tsx
│   │       ├── CompareGrid.tsx
│   │       ├── PromptInput.tsx
│   │       ├── ModelSelector.tsx
│   │       ├── StreamingText.tsx
│   │       └── index.ts
│   ├── app/
│   │   ├── globals.css (updated)
│   │   └── (routes)/
│   │       ├── layout.tsx
│   │       └── compare/
│   │           ├── page.tsx
│   │           └── ComparePageClient.tsx
│   └── test/
│       └── setup.ts
├── tailwind.config.ts (updated)
└── vitest.config.ts
```
