import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface LLMRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  images?: string[];
  enableWebSearch?: boolean;
}

export async function* streamAnthropic(
  req: LLMRequest
): AsyncGenerator<{ type: "text" | "thinking"; content: string }> {
  const system = req.messages.find((m) => m.role === "system")?.content;
  const userMessages = req.messages.filter((m) => m.role !== "system");

  const messages: Anthropic.MessageParam[] = userMessages.map((msg) => {
    if (msg.role === "user" && req.images?.length) {
      const content: Anthropic.ContentBlockParam[] = [
        ...req.images.map(
          (url): Anthropic.ContentBlockParam => ({
            type: "image",
            source: { type: "url", url },
          })
        ),
        { type: "text", text: msg.content },
      ];
      return { role: "user" as const, content };
    }
    return { role: msg.role as "user" | "assistant", content: msg.content };
  });

  // Enable extended thinking for supported models
  const supportsThinking =
    req.model.includes("claude-sonnet-4") ||
    req.model.includes("claude-opus-4") ||
    req.model.includes("claude-3-7");

  const params: Anthropic.MessageCreateParams = {
    model: req.model,
    max_tokens: supportsThinking ? 16000 : 4096,
    messages,
    stream: true,
    ...(system && { system }),
    ...(supportsThinking && {
      thinking: { type: "enabled", budget_tokens: 8000 },
    }),
  };

  const stream = getClient().messages.stream(params);

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      if (event.delta.type === "thinking_delta") {
        yield { type: "thinking", content: event.delta.thinking };
      } else if (event.delta.type === "text_delta") {
        yield { type: "text", content: event.delta.text };
      }
    }
  }
}

export async function callAnthropic(req: LLMRequest): Promise<string> {
  let result = "";
  for await (const chunk of streamAnthropic(req)) {
    if (chunk.type === "text") result += chunk.content;
  }
  return result;
}
