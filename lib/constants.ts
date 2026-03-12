// Provider types
export type Provider = "openai" | "anthropic" | "google";

export interface ModelConfig {
  id: string;
  label: string;
  provider: Provider;
  capabilities: string[];
  isDefault?: boolean;
}

export interface ProviderConfig {
  name: string;
  color: string;
  models: ModelConfig[];
}

// Model configurations - latest models as of March 2026
export const PROVIDERS: Record<Provider, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    color: "#10a37f",
    models: [
      {
        id: "gpt-4o",
        label: "GPT-4o",
        provider: "openai",
        capabilities: ["text", "vision", "web-search", "code"],
        isDefault: true,
      },
      {
        id: "gpt-4o-mini",
        label: "GPT-4o Mini",
        provider: "openai",
        capabilities: ["text", "vision", "fast"],
      },
      {
        id: "gpt-4.1",
        label: "GPT-4.1",
        provider: "openai",
        capabilities: ["text", "vision", "code"],
      },
      {
        id: "o4-mini",
        label: "o4 Mini",
        provider: "openai",
        capabilities: ["text", "reasoning"],
      },
    ],
  },
  anthropic: {
    name: "Anthropic",
    color: "#d4a574",
    models: [
      {
        id: "claude-sonnet-4-20250514",
        label: "Claude Sonnet 4",
        provider: "anthropic",
        capabilities: ["text", "vision", "code", "thinking"],
        isDefault: true,
      },
      {
        id: "claude-opus-4-20250514",
        label: "Claude Opus 4",
        provider: "anthropic",
        capabilities: ["text", "vision", "code", "thinking"],
      },
      {
        id: "claude-3-7-sonnet-20250219",
        label: "Claude 3.7 Sonnet",
        provider: "anthropic",
        capabilities: ["text", "vision", "code", "thinking"],
      },
      {
        id: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        provider: "anthropic",
        capabilities: ["text", "vision", "fast"],
      },
    ],
  },
  google: {
    name: "Google",
    color: "#4285f4",
    models: [
      {
        id: "gemini-2.5-pro-preview-05-06",
        label: "Gemini 2.5 Pro",
        provider: "google",
        capabilities: ["text", "vision", "code", "thinking"],
        isDefault: true,
      },
      {
        id: "gemini-2.5-flash-preview-05-20",
        label: "Gemini 2.5 Flash",
        provider: "google",
        capabilities: ["text", "vision", "code", "fast"],
      },
      {
        id: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        provider: "google",
        capabilities: ["text", "vision", "fast"],
      },
    ],
  },
};

export const ALL_MODELS: ModelConfig[] = Object.values(PROVIDERS).flatMap(
  (p) => p.models
);

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.5-pro-preview-05-06",
};

export function getProvider(modelId: string): Provider {
  if (modelId.includes("gpt") || modelId.includes("o4") || modelId.includes("o3") || modelId.includes("o1")) return "openai";
  if (modelId.includes("claude")) return "anthropic";
  if (modelId.includes("gemini")) return "google";
  return "openai";
}

export function getProviderConfig(modelId: string): ProviderConfig {
  return PROVIDERS[getProvider(modelId)];
}

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return ALL_MODELS.find((m) => m.id === modelId);
}

export const MAX_AGENTS = 4;

// Agent chain preset templates
export interface ChainPreset {
  id: string;
  name: string;
  description: string;
  agents: Array<{
    name: string;
    model: string;
    systemPrompt: string;
  }>;
}

export const DEFAULT_PRESETS: ChainPreset[] = [
  {
    id: "draft-review",
    name: "Draft & Review",
    description: "Write content with one model, refine with another",
    agents: [
      {
        name: "Writer",
        model: "gpt-4o",
        systemPrompt: "Write clear, engaging content based on the user's request.",
      },
      {
        name: "Reviewer",
        model: "claude-sonnet-4-20250514",
        systemPrompt: "Review and improve the previous content. Fix issues, enhance clarity, and polish the writing.",
      },
    ],
  },
  {
    id: "multi-perspective",
    name: "Multi-Perspective",
    description: "Get analysis from three different AI perspectives",
    agents: [
      {
        name: "Analyst A",
        model: "gpt-4o",
        systemPrompt: "Analyze the topic from a practical, implementation-focused perspective.",
      },
      {
        name: "Analyst B",
        model: "claude-sonnet-4-20250514",
        systemPrompt: "Analyze from a critical, devil's advocate perspective. Challenge assumptions in the previous analysis.",
      },
      {
        name: "Synthesizer",
        model: "gemini-2.5-pro-preview-05-06",
        systemPrompt: "Synthesize the previous analyses into a balanced, actionable summary with clear recommendations.",
      },
    ],
  },
  {
    id: "code-pipeline",
    name: "Code Pipeline",
    description: "Generate code, then review and test it",
    agents: [
      {
        name: "Coder",
        model: "claude-sonnet-4-20250514",
        systemPrompt: "Write clean, well-structured code based on the requirements.",
      },
      {
        name: "Reviewer",
        model: "gpt-4o",
        systemPrompt: "Review the code for bugs, security issues, and improvements. Provide the corrected version.",
      },
    ],
  },
];
