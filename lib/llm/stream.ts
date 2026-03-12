import { getProvider, type Provider } from "@/lib/constants";
import { streamOpenAI, type LLMRequest } from "./openai";
import { streamAnthropic } from "./anthropic";
import { streamGemini } from "./gemini";

export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "thinking"; content: string }
  | { type: "error"; content: string }
  | { type: "done"; content: string };

export async function* streamLLM(
  req: LLMRequest
): AsyncGenerator<StreamEvent> {
  const provider = getProvider(req.model);

  try {
    switch (provider) {
      case "openai": {
        for await (const chunk of streamOpenAI(req)) {
          yield { type: "text", content: chunk };
        }
        break;
      }
      case "anthropic": {
        for await (const chunk of streamAnthropic(req)) {
          yield chunk;
        }
        break;
      }
      case "google": {
        for await (const chunk of streamGemini(req)) {
          yield chunk;
        }
        break;
      }
    }
    yield { type: "done", content: "" };
  } catch (err: any) {
    yield {
      type: "error",
      content: err?.message || "An unexpected error occurred",
    };
  }
}

// Run a full chain of agents sequentially, streaming each step
export interface AgentConfig {
  name: string;
  model: string;
  systemPrompt: string;
}

export interface ChainStreamEvent extends StreamEvent {
  agentIndex: number;
  agentName: string;
}

export async function* streamChain(
  agents: AgentConfig[],
  userInput: string,
  images?: string[]
): AsyncGenerator<ChainStreamEvent> {
  let previousOutput = "";

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const isFirst = i === 0;

    // Build input: first agent gets user input, subsequent get previous output
    const input = isFirst
      ? userInput
      : `Previous agent's output:\n\n${previousOutput}\n\nOriginal user request:\n${userInput}`;

    const messages: LLMRequest["messages"] = [];
    if (agent.systemPrompt) {
      messages.push({ role: "system", content: agent.systemPrompt });
    }
    messages.push({ role: "user", content: input });

    let agentOutput = "";
    for await (const event of streamLLM({
      model: agent.model,
      messages,
      images: isFirst ? images : undefined,
    })) {
      agentOutput += event.type === "text" ? event.content : "";
      yield { ...event, agentIndex: i, agentName: agent.name };
    }

    previousOutput = agentOutput;
  }
}
