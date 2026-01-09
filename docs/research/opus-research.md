# Building production multi-LLM orchestration: Architecture guide for chained.chat

The multi-LLM platform landscape has transformed dramatically since late 2024 with three critical developments: Anthropic's Model Context Protocol (MCP) becoming an industry standard (November 2024), Vercel AI SDK 4.0+ introducing native multi-provider management (November 2024), and production-grade security patterns maturing through frameworks like LLM Guard and the Dual LLM architecture. For chained.chat, the optimal architecture combines these advances: MCP for standardized tool integration, AI SDK's provider registry for unified model access, the Dual LLM security pattern to isolate trusted orchestration from untrusted content processing, and prompt caching with intelligent routing to achieve **70-90% cost reduction** versus naive implementations.

---

## Anthropic's tool ecosystem has become the de facto standard for agent development

Anthropic released the **Model Context Protocol (MCP)** on November 25, 2024, establishing an open standard for connecting AI systems to external tools and data sources. MCP uses JSON-RPC 2.0 for all communication, with three transport options: STDIO for local integrations, HTTP+SSE for remote services, and Streamable HTTP for serverless deployments.

The protocol architecture separates concerns cleanly: **Hosts** (LLM applications) initiate connections, **Clients** act as connectors within hosts, and **Servers** provide capabilities. Server-side primitives include resources (context/data), prompts (templated workflows), and tools (executable functions). Client-side primitives enable sampling (server-initiated agentic behaviors) and elicitation (server-initiated user requests).

**MCP implementation pattern for tool definition:**
```python
from mcp.server import Server
from mcp.server.stdio import stdio_server

server = Server("chained-chat-server")

@server.tool()
async def search_documents(query: str, limit: int = 10) -> str:
    """Search internal document store"""
    results = await document_store.search(query, limit=limit)
    return json.dumps(results)
```

The **Claude Agent SDK** (released September 2025 but with patterns applicable now) introduces subagent support for parallel task execution, in-process MCP servers to eliminate subprocess overhead, and a hooks system providing deterministic checkpoints for orchestration control. The SDK's core pattern—Gather Context → Take Action → Verify Work → Repeat—maps directly to multi-LLM orchestration flows.

**Extended thinking** launched with Claude 3.7 Sonnet (February 2025) and represents a significant capability for complex reasoning tasks. Key parameters include `budget_tokens` (minimum 1,024) for controlling reasoning depth, and the response includes both thinking blocks with cryptographic signatures and final text output. For production use, start with minimum budget and increase incrementally—use 16k+ tokens only for complex tasks, and batch processing for budgets exceeding 32k to avoid timeouts.

---

## Security architecture must implement privilege separation at every model boundary

The **Dual LLM Pattern**, documented extensively by Simon Willison, provides the foundational security architecture for multi-model systems. The pattern separates a **Privileged LLM (P-LLM)** that only processes trusted input and has tool access from a **Quarantined LLM (Q-LLM)** that processes untrusted content with no tool access. The critical principle: unfiltered Q-LLM output should **never** reach P-LLM input directly.

Implementation uses symbolic variables for safe data passing:
```
User Query → P-LLM (orchestrates) → Q-LLM (processes untrusted content)
                                        ↓
                                   Returns: $email-summary-1, $doc-analysis-2
                                        ↓
P-LLM requests "Display $email-summary-1 to user" without exposure to tainted tokens
```

**Google DeepMind's CaMeL framework** (March 2025) extends this with provable security guarantees: the privileged LLM generates Python code in a restricted subset, a custom interpreter enforces capability-based security, and a data flow graph tracks origin and access rights for every value. CaMeL achieved **77% task completion with provable security** on the AgentDojo benchmark versus 84% undefended.

For production sanitization, **LLM Guard** (2.2k GitHub stars, MIT license) provides comprehensive input/output scanning:

```python
from llm_guard.input_scanners import PromptInjection, Anonymize, Secrets
from llm_guard.output_scanners import Sensitive, JSON

# Input pipeline at every model boundary
input_scanners = [PromptInjection(), Anonymize(), Secrets()]
sanitized_prompt, results, valid = scan_prompt(input_scanners, user_input)

# Output validation before passing to next model
output_scanners = [Sensitive(), JSON()]
sanitized_output, results, valid = scan_output(output_scanners, llm_response)
```

Input scanners detect PII, injection attempts, API key exposure, invisible unicode characters, and toxicity. Output scanners validate JSON schema compliance, check for sensitive data leakage, detect malicious URLs, and score factual consistency.

---

## Vercel AI SDK 4.0+ delivers production-ready multi-provider orchestration

**AI SDK 4.0** (November 18, 2024) and **AI SDK 4.1** (January 20, 2025) introduced the features most relevant for multi-LLM orchestration. The **Provider Registry** pattern enables centralized model management with seamless provider switching:

```typescript
import { createProviderRegistry, customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Custom provider with semantic model aliases
const myProvider = customProvider({
  languageModels: {
    'fast': openai('gpt-4o-mini'),
    'smart': anthropic('claude-3-5-sonnet-20241022'),
    'reasoning': openai('o1-preview')
  }
});

// Registry for multi-provider access
const registry = createProviderRegistry({ openai, anthropic });
const model = registry.languageModel('anthropic:claude-3-5-sonnet-20241022');
```

**Non-blocking data streaming** via `createDataStreamResponse` allows streaming metadata (sources, citations, intermediate results) before and alongside LLM responses—critical for orchestration platforms showing progress:

```typescript
return createDataStreamResponse({
  execute: async (dataStream) => {
    // Stream sources BEFORE LLM response
    const sources = await getRelevantSources(messages);
    for (const source of sources) {
      dataStream.writeData({ type: 'source', url: source.url });
    }
    
    const result = streamText({ model, messages });
    result.mergeIntoDataStream(dataStream);
  }
});
```

**Dynamic agent control** through `prepareStep` enables runtime model selection based on task complexity:

```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  tools: { search, analyze, summarize },
  stopWhen: stepCountIs(10),
  prepareStep: async ({ previousSteps }) => {
    const complexity = assessComplexity(previousSteps);
    return {
      model: complexity > 0.8 ? openai('gpt-4o') : openai('gpt-4o-mini'),
      tools: selectRelevantTools(previousSteps)
    };
  }
});
```

For structured inter-model communication, use the **Output API** with Zod schemas for type-safe data exchange between chained models:

```typescript
const { output } = await generateText({
  model: anthropic('claude-3-5-sonnet'),
  output: Output.object({
    schema: z.object({
      action: z.enum(['search', 'analyze', 'respond']),
      target: z.string(),
      confidence: z.number().min(0).max(1)
    })
  }),
  prompt: 'Determine next action for query: ...'
});
```

---

## Cost optimization combines prompt caching with intelligent model routing

**Anthropic's prompt caching** (GA December 2024) delivers up to **90% cost reduction** on cached content. Cache reads cost 0.1x base input price versus 1.25x for cache writes. The key optimization is content ordering: place static content (tool definitions, system prompts, context) at the beginning, dynamic content (user input) at the end.

```python
# Optimal caching structure
{
  "system": "You are an assistant...",  # Cacheable
  "tools": [...],                        # Cacheable  
  "cache_control": {"type": "ephemeral"}, # Mark cache breakpoint
  "messages": [
    # Previous messages (cacheable for multi-turn)
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."},
    # Current turn (dynamic, not cached)
    {"role": "user", "content": current_input}
  ]
}
```

Performance impact: 100K-token prompts see latency drop from **11.5s to 2.4s** with warm cache.

**Model routing** through frameworks like **RouteLLM** (LMSYS/Berkeley) achieves 30-85% cost reduction while maintaining 95% of GPT-4 quality. The router classifies query complexity and routes simple queries to cheaper models (Mixtral, Haiku at ~$0.25/M tokens) while reserving premium models (GPT-4o, Claude Sonnet at $3-15/M) for complex tasks:

```python
from routellm.controller import Controller
client = Controller(
    routers=["mf"],  # Matrix factorization router
    strong_model="gpt-4o",
    weak_model="mixtral-8x7b"
)
# Automatically routes based on query complexity
response = client.chat.completions.create(...)
```

For observability, the tool comparison reveals distinct strengths:

| Capability | Helicone | Portkey | LangFuse |
|------------|----------|---------|----------|
| **Best for** | Fast setup, cost tracking | Enterprise routing/guardrails | Detailed tracing, open-source |
| **Integration** | 1-line URL change | Gateway API | SDK-based |
| **Caching** | Built-in (20-30% savings) | Semantic (up to 50%) | No |
| **Self-hosting** | Free (Docker) | Enterprise only | Free (MIT) |
| **Free tier** | 10K req/mo | 10K req/mo | 50K units/mo |

---

## The recommended architecture stack for chained.chat

The optimal production architecture combines these elements:

**Layer 1 - Gateway (Portkey or Helicone):** Handle rate limiting, fallbacks across providers, cost tracking, and semantic caching. Portkey offers superior routing with 250+ models via single API and 50+ built-in guardrails.

**Layer 2 - Security (LLM Guard + Dual LLM pattern):** Deploy input/output scanning at every model boundary. Implement privilege separation between orchestration logic (P-LLM) and content processing (Q-LLM).

**Layer 3 - Orchestration (AI SDK Provider Registry + MCP):** Use AI SDK's provider registry for unified model access with `prepareStep` for dynamic model selection. Integrate tools via MCP servers for standardized capability exposure.

**Layer 4 - Cost Optimization (Prompt caching + RouteLLM):** Structure prompts for maximum cache hits on Anthropic models. Deploy complexity-based routing to minimize expensive model usage.

**Estimated combined cost savings:** 70-90% versus naive GPT-4/Claude Opus usage for typical workloads, through the combination of prompt caching (85-90% on repeated context), model routing (30-85%), and semantic caching (15-50% on similar queries).

---

## Conclusion

Building chained.chat in early 2025 benefits from a rapidly maturing ecosystem. MCP provides the standardized tool integration layer that was previously fragmented across providers. The Vercel AI SDK's provider registry eliminates custom code for multi-model management. Security patterns have evolved from theoretical concerns to production libraries like LLM Guard with battle-tested implementations. Most significantly, the combination of Anthropic's prompt caching and intelligent routing makes previously cost-prohibitive multi-model architectures economically viable—enabling complex agent workflows that route between models based on task complexity while caching common context across interactions.

The key architectural decision is implementing the Dual LLM pattern from day one: separate trusted orchestration from untrusted content processing, never passing raw outputs between privilege levels. This provides defense-in-depth that scales with system complexity and prevents the prompt injection vulnerabilities that have compromised simpler architectures.